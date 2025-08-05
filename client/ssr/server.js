#!/usr/bin/env node

/**
 * AeroSuite SSR Server
 * Task: TS112 - Server-side rendering for SEO
 */

const path = require('path');
const express = require('express');
const fs = require('fs');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { StaticRouter } = require('react-router-dom/server');
const { ChunkExtractor } = require('@loadable/server');
const compression = require('compression');
const helmet = require('helmet');
const { createStore } = require('redux');
const { Provider } = require('react-redux');
const { ServerStyleSheets } = require('@mui/styles');

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

// SEO-critical routes that should be server-rendered
const SEO_ROUTES = [
  '/',
  '/dashboard',
  '/suppliers',
  '/customers',
  '/inspections'
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

// Serve static assets
app.use(express.static(BUILD_DIR, {
  index: false, // Don't serve index.html automatically
  maxAge: '30d' // Cache static assets for 30 days
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
    twitterCard: 'summary_large_image'
  };
  
  // Route-specific meta tags
  if (url === '/') {
    metaTags.title = 'AeroSuite - Home';
    metaTags.description = 'AeroSuite - Aerospace Supply Chain Management Platform';
  } else if (url.startsWith('/suppliers')) {
    metaTags.title = 'AeroSuite - Supplier Management';
    metaTags.description = 'Manage aerospace suppliers with comprehensive tools for qualification, performance tracking, and risk assessment.';
  } else if (url.startsWith('/customers')) {
    metaTags.title = 'AeroSuite - Customer Management';
    metaTags.description = 'Streamline customer relationships with AeroSuite\'s customer management tools.';
  } else if (url.startsWith('/inspections')) {
    metaTags.title = 'AeroSuite - Inspection Management';
    metaTags.description = 'Plan, execute, and analyze inspections with AeroSuite\'s comprehensive inspection tools.';
  } else if (url.startsWith('/dashboard')) {
    metaTags.title = 'AeroSuite - Dashboard';
    metaTags.description = 'Get a comprehensive overview of your aerospace supply chain with AeroSuite\'s interactive dashboard.';
  }
  
  return metaTags;
}

// SSR handler for all routes
app.get('*', (req, res) => {
  const location = req.url;
  
  // Create a Redux store for server-side rendering
  const store = createStore(rootReducer);
  
  // Create Material-UI server-side sheets
  const sheets = new ServerStyleSheets();
  
  // Generate meta tags based on the route
  const metaTags = generateMetaTags(location);
  
  // Create a context for StaticRouter
  const context = {};
  
  // Render the app to string
  const appHtml = ReactDOMServer.renderToString(
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
  
  // Get the CSS from the sheets
  const css = sheets.toString();
  
  // If there's a redirect from the StaticRouter context, handle it
  if (context.url) {
    return res.redirect(301, context.url);
  }
  
  // Read the HTML template
  const indexFile = path.join(BUILD_DIR, 'index.html');
  fs.readFile(indexFile, 'utf8', (err, htmlData) => {
    if (err) {
      console.error('Error reading index.html:', err);
      return res.status(500).send('Error loading index.html');
    }
    
    // Get the initial state from the store
    const preloadedState = store.getState();
    
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
      </head>`)
      // Add preloaded Redux state
      .replace(
        '<script',
        `<script>window.__PRELOADED_STATE__ = ${JSON.stringify(preloadedState).replace(/</g, '\\u003c')}</script><script`
      );
    
    // Set status code based on the context
    const status = context.statusCode || 200;
    
    // Send the rendered HTML
    res.status(status).send(html);
  });
});

app.listen(PORT, () => {
  console.log(`AeroSuite SSR server running on http://localhost:${PORT}`);
}); 