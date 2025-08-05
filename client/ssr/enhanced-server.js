#!/usr/bin/env node

/**
 * AeroSuite Enhanced SSR Server
 * Task: TS365 - Server-side rendering implementation
 * 
 * This is an enhanced version of the SSR server with:
 * - Performance optimizations
 * - Route-based code splitting
 * - Improved SEO features
 * - Caching
 * - Critical CSS extraction
 * - Preloading of assets
 */

const path = require('path');
const express = require('express');
const fs = require('fs');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { StaticRouter } = require('react-router-dom/server');
const { ChunkExtractor, ChunkExtractorManager } = require('@loadable/server');
const compression = require('compression');
const helmet = require('helmet');
const { createStore } = require('redux');
const { Provider } = require('react-redux');
const { ServerStyleSheets } = require('@mui/styles');
const LRUCache = require('lru-cache');
const zlib = require('zlib');
const crypto = require('crypto');

// Register Babel to transpile JSX/TSX on the fly
require('@babel/register')({
  presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
  plugins: ['@babel/plugin-transform-runtime', '@loadable/babel-plugin']
});

// Import the main App component and root reducer
const App = require('../src/App').default;
const rootReducer = require('../src/redux/rootReducer').default;

const app = express();
const PORT = process.env.SSR_PORT || 4000;
const BUILD_DIR = path.resolve(__dirname, '../build');

// Set up caching
const ssrCache = new LRUCache({
  max: 100, // Maximum number of entries in the cache
  ttl: 1000 * 60 * 5, // 5 minutes TTL
});

// SEO-critical routes that should be server-rendered
const SEO_ROUTES = [
  '/',
  '/dashboard',
  '/suppliers',
  '/customers',
  '/inspections',
  '/components',
  '/reports',
  '/monitoring',
  '/settings',
  '/ai-analysis',
];

// Middleware
app.use(compression()); // Compress responses
app.use(
  helmet({
    contentSecurityPolicy: false, // We'll configure this manually
    crossOriginEmbedderPolicy: false // Allow embedding of resources
  })
);

// Set security headers for SEO and security
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Set CSP for better security while allowing necessary resources
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;"
  );
  
  next();
});

// Serve static assets with aggressive caching
app.use(express.static(BUILD_DIR, {
  index: false, // Don't serve index.html automatically
  maxAge: '30d', // Cache static assets for 30 days
  immutable: true, // Assets with hashed filenames are immutable
  setHeaders: (res, path) => {
    // Set cache headers based on file type
    if (path.endsWith('.html')) {
      // HTML files should be revalidated
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    } else if (
      path.endsWith('.js') || 
      path.endsWith('.css') || 
      path.endsWith('.woff2') || 
      path.endsWith('.jpg') || 
      path.endsWith('.png') || 
      path.endsWith('.svg')
    ) {
      // Static assets with hash in filename can be cached indefinitely
      if (path.includes('.chunk.') || path.includes('static/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }
}));

// Function to generate meta tags based on the route
function generateMetaTags(url) {
  const baseTitle = 'AeroSuite';
  const baseDescription = 'AeroSuite - Aerospace Supply Chain Management Platform';
  
  // Default meta tags
  let metaTags = {
    title: baseTitle,
    description: baseDescription,
    ogTitle: baseTitle,
    ogDescription: baseDescription,
    ogImage: '/logo512.png',
    ogUrl: `https://aerosuite.example.com${url}`,
    twitterCard: 'summary_large_image',
    canonicalUrl: `https://aerosuite.example.com${url}`,
    structuredData: null,
  };
  
  // Route-specific meta tags
  if (url === '/') {
    metaTags.title = 'AeroSuite - Home';
    metaTags.description = 'AeroSuite - Aerospace Supply Chain Management Platform';
    metaTags.structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'AeroSuite',
      url: 'https://aerosuite.example.com',
    };
  } else if (url.startsWith('/suppliers')) {
    metaTags.title = 'AeroSuite - Supplier Management';
    metaTags.description = 'Manage aerospace suppliers with comprehensive tools for qualification, performance tracking, and risk assessment.';
    metaTags.structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Supplier Management',
      description: 'Manage aerospace suppliers with comprehensive tools for qualification, performance tracking, and risk assessment.',
    };
  } else if (url.startsWith('/customers')) {
    metaTags.title = 'AeroSuite - Customer Management';
    metaTags.description = 'Streamline customer relationships with AeroSuite\'s customer management tools.';
    metaTags.structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Customer Management',
      description: 'Streamline customer relationships with AeroSuite\'s customer management tools.',
    };
  } else if (url.startsWith('/inspections')) {
    metaTags.title = 'AeroSuite - Inspection Management';
    metaTags.description = 'Plan, execute, and analyze inspections with AeroSuite\'s comprehensive inspection tools.';
    metaTags.structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Inspection Management',
      description: 'Plan, execute, and analyze inspections with AeroSuite\'s comprehensive inspection tools.',
    };
  } else if (url.startsWith('/dashboard')) {
    metaTags.title = 'AeroSuite - Dashboard';
    metaTags.description = 'Get a comprehensive overview of your aerospace supply chain with AeroSuite\'s interactive dashboard.';
    metaTags.structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Dashboard',
      description: 'Get a comprehensive overview of your aerospace supply chain with AeroSuite\'s interactive dashboard.',
    };
  }
  
  return metaTags;
}

// Function to extract critical CSS
function extractCriticalCSS(html, route) {
  // In a real implementation, this would use a library like critical or critters
  // For now, we'll just include all CSS
  return html;
}

// Function to generate cache key
function getCacheKey(req) {
  const url = req.url;
  // Generate a hash of the URL to use as a cache key
  return crypto.createHash('md5').update(url).digest('hex');
}

// SSR handler for all routes
app.get('*', async (req, res) => {
  const location = req.url;
  const cacheKey = getCacheKey(req);
  
  // Check if we have a cached response
  const cachedResponse = ssrCache.get(cacheKey);
  if (cachedResponse && process.env.NODE_ENV === 'production') {
    console.log(`Cache hit for ${location}`);
    res.setHeader('X-Cache', 'HIT');
    res.setHeader('Content-Type', 'text/html');
    return res.send(cachedResponse);
  }
  
  res.setHeader('X-Cache', 'MISS');
  
  try {
    // Create a Redux store for server-side rendering
    const store = createStore(rootReducer);
    
    // Create Material-UI server-side sheets
    const sheets = new ServerStyleSheets();
    
    // Set up loadable-components stats file
    const statsFile = path.resolve(BUILD_DIR, 'loadable-stats.json');
    const extractor = fs.existsSync(statsFile) 
      ? new ChunkExtractor({ statsFile })
      : null;
    
    // Generate meta tags based on the route
    const metaTags = generateMetaTags(location);
    
    // Create a context for StaticRouter
    const context = {};
    
    // Render the app to string
    let appHtml;
    
    if (extractor) {
      // Use loadable components for code splitting
      appHtml = ReactDOMServer.renderToString(
        sheets.collect(
          React.createElement(
            ChunkExtractorManager,
            { extractor },
            React.createElement(
              Provider,
              { store },
              React.createElement(
                StaticRouter,
                { location, context },
                React.createElement(App)
              )
            )
          )
        )
      );
    } else {
      // Fallback if no stats file is found
      appHtml = ReactDOMServer.renderToString(
        sheets.collect(
          React.createElement(
            Provider,
            { store },
            React.createElement(
              StaticRouter,
              { location, context },
              React.createElement(App)
            )
          )
        )
      );
    }
    
    // Get the CSS from the sheets
    const css = sheets.toString();
    
    // If there's a redirect from the StaticRouter context, handle it
    if (context.url) {
      return res.redirect(301, context.url);
    }
    
    // Read the HTML template
    const indexFile = path.join(BUILD_DIR, 'index.html');
    const htmlData = fs.readFileSync(indexFile, 'utf8');
    
    // Get the initial state from the store
    const preloadedState = store.getState();
    
    // Extract scripts and links
    let scriptTags = '';
    let linkTags = '';
    let preloadTags = '';
    
    if (extractor) {
      scriptTags = extractor.getScriptTags();
      linkTags = extractor.getLinkTags();
      preloadTags = extractor.getPreloadTags();
    }
    
    // Generate structured data JSON-LD
    const structuredDataScript = metaTags.structuredData 
      ? `<script type="application/ld+json">${JSON.stringify(metaTags.structuredData)}</script>` 
      : '';
    
    // Inject the rendered app HTML, CSS, meta tags, and preloaded state
    let html = htmlData
      // Replace the root div with our rendered app
      .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
      // Add Material-UI styles
      .replace('</head>', `<style id="jss-server-side">${css}</style></head>`)
      // Add meta tags for SEO
      .replace('<title>AeroSuite</title>', `
        <title>${metaTags.title}</title>
        <meta name="description" content="${metaTags.description}" />
        <meta property="og:title" content="${metaTags.ogTitle}" />
        <meta property="og:description" content="${metaTags.ogDescription}" />
        <meta property="og:image" content="${metaTags.ogImage}" />
        <meta property="og:url" content="${metaTags.ogUrl}" />
        <meta name="twitter:card" content="${metaTags.twitterCard}" />
        <link rel="canonical" href="${metaTags.canonicalUrl}" />
        ${structuredDataScript}
        ${preloadTags}
      </head>`)
      // Add preloaded Redux state
      .replace(
        '<script',
        `<script>window.__PRELOADED_STATE__ = ${JSON.stringify(preloadedState).replace(/</g, '\\u003c')}</script><script`
      );
    
    // Add loadable components script tags if available
    if (extractor) {
      html = html.replace('</body>', `${scriptTags}</body>`);
    }
    
    // Extract critical CSS for faster rendering
    html = extractCriticalCSS(html, location);
    
    // Set status code based on the context
    const status = context.statusCode || 200;
    
    // Cache the response if it's a successful render
    if (status === 200) {
      ssrCache.set(cacheKey, html);
    }
    
    // Send the rendered HTML
    res.status(status).send(html);
  } catch (error) {
    console.error('Error during SSR:', error);
    
    // Fallback to client-side rendering
    const indexFile = path.join(BUILD_DIR, 'index.html');
    fs.readFile(indexFile, 'utf8', (err, htmlData) => {
      if (err) {
        return res.status(500).send('Error loading index.html');
      }
      
      // Add a comment to indicate this is a fallback
      const html = htmlData.replace(
        '<head>',
        '<!-- Fallback to client-side rendering due to SSR error -->\n<head>'
      );
      
      res.status(200).send(html);
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start the server
app.listen(PORT, () => {
  console.log(`AeroSuite Enhanced SSR server running on http://localhost:${PORT}`);
}); 