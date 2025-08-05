/**
 * Webpack Bundle Optimization Configuration
 * 
 * This file provides enhanced webpack configuration for optimizing bundle size.
 * It is designed to be used with config-overrides.js for Create React App.
 * 
 * Implementation of RF035 - Optimize bundle size
 */

// Advanced splitChunks configuration for better code splitting
const advancedSplitChunksConfig = {
  chunks: 'all',
  maxInitialRequests: Infinity,
  minSize: 15000, // Reduced from 20000 for more granular chunks
  maxSize: 200000, // Reduced from 240000 for better loading
  automaticNameDelimiter: '.',
  cacheGroups: {
    // Vendor chunks
    vendor: {
      test: /[\\/]node_modules[\\/]/,
      name(module) {
        // Get the name of the npm package
        const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
        
        // Format package name for better readability
        return `vendor.${packageName.replace('@', '')}`;
      },
      priority: -10,
    },
    
    // Framework chunks
    framework: {
      test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|history)[\\/]/,
      name: 'framework',
      priority: 40,
      enforce: true,
    },
    
    // MUI components
    mui: {
      test: /[\\/]node_modules[\\/]@mui[\\/]/,
      name: 'mui',
      priority: 30,
      enforce: true,
    },
    
    // MUI icons (separate from components)
    muiIcons: {
      test: /[\\/]node_modules[\\/]@mui[\\/]icons-material[\\/]/,
      name: 'mui.icons',
      priority: 35,
      enforce: true,
    },
    
    // Redux and related packages
    redux: {
      test: /[\\/]node_modules[\\/](redux|@reduxjs|react-redux)[\\/]/,
      name: 'redux',
      priority: 25,
      enforce: true,
    },
    
    // Utility libraries
    utils: {
      test: /[\\/]node_modules[\\/](lodash|date-fns|uuid|axios)[\\/]/,
      name: 'utils',
      priority: 20,
      enforce: true,
    },
    
    // Charting libraries
    charts: {
      test: /[\\/]node_modules[\\/](chart\.js|recharts|d3)[\\/]/,
      name: 'charts',
      priority: 15,
      enforce: true,
    },
    
    // Form libraries
    forms: {
      test: /[\\/]node_modules[\\/](formik|yup|joi)[\\/]/,
      name: 'forms',
      priority: 15,
      enforce: true,
    },
    
    // Styles
    styles: {
      name: 'styles',
      test: /\.(css|scss|sass)$/,
      chunks: 'all',
      enforce: true,
      priority: 50,
    },
    
    // Common code between chunks
    common: {
      name: 'common',
      minChunks: 2,
      priority: -20,
      reuseExistingChunk: true,
    },
  },
};

// Advanced Terser configuration for better minification
const advancedTerserConfig = {
  terserOptions: {
    parse: {
      ecma: 8,
    },
    compress: {
      ecma: 5,
      warnings: false,
      comparisons: false,
      inline: 2,
      drop_console: true,
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.debug', 'console.info'],
      pure_getters: true,
      keep_infinity: true,
      passes: 3, // Multiple compression passes
    },
    mangle: {
      safari10: true,
    },
    output: {
      ecma: 5,
      comments: false,
      ascii_only: true,
    },
  },
  parallel: true,
  extractComments: false,
};

// Advanced CSS Minimizer configuration
const advancedCssMinimizerConfig = {
  minimizerOptions: {
    preset: [
      'default',
      {
        discardComments: { removeAll: true },
        normalizeWhitespace: true,
        minifyFontValues: true,
        minifySelectors: true,
        calc: { precision: 2 },
        convertValues: { length: true },
        discardEmpty: true,
        discardOverridden: true,
        mergeLonghand: true,
        mergeRules: true,
        minifyParams: true,
        minifySelectors: true,
        normalizeCharset: true,
        normalizeString: true,
        normalizeUnicode: true,
        normalizeUrl: true,
        optimizeBackground: true,
        optimizeBorderRadius: true,
        optimizeFilter: true,
        optimizeFont: true,
        optimizeFontWeight: true,
        reduceIdents: true,
        reduceInitial: true,
        reduceTransforms: true,
        svgo: true,
        uniqueSelectors: true,
      },
    ],
  },
};

// Compression plugin configurations
const compressionPluginConfig = {
  gzip: {
    filename: '[path][base].gz',
    algorithm: 'gzip',
    test: /\.(js|css|html|svg)$/,
    threshold: 8192, // Only assets bigger than this size are processed (in bytes)
    minRatio: 0.8, // Only assets that compress better than this ratio are processed
    deleteOriginalAssets: false, // Keep original assets
  },
  brotli: {
    filename: '[path][base].br',
    algorithm: 'brotliCompress',
    test: /\.(js|css|html|svg)$/,
    compressionOptions: { level: 11 },
    threshold: 8192,
    minRatio: 0.8,
    deleteOriginalAssets: false,
  },
};

// HTML Webpack Plugin configuration
const htmlPluginConfig = {
  minify: {
    removeComments: true,
    collapseWhitespace: true,
    removeRedundantAttributes: true,
    useShortDoctype: true,
    removeEmptyAttributes: true,
    removeStyleLinkTypeAttributes: true,
    keepClosingSlash: true,
    minifyJS: true,
    minifyCSS: true,
    minifyURLs: true,
  },
  inject: true,
  // Add preload directives for critical assets
  preload: ['framework', 'mui'],
  // Add prefetch directives for likely-needed assets
  prefetch: ['charts', 'forms'],
};

// Module replacement rules for smaller alternatives
const moduleReplacements = {
  moment: 'date-fns', // Replace moment with date-fns
  'lodash': 'lodash-es', // Use ES modules version of lodash
};

// Babel plugin configurations for optimized imports
const babelPlugins = [
  // Transform imports for tree shaking
  [
    'babel-plugin-transform-imports',
    {
      '@mui/material': {
        transform: '@mui/material/${member}',
        preventFullImport: true
      },
      '@mui/icons-material': {
        transform: '@mui/icons-material/${member}',
        preventFullImport: true
      },
      '@mui/styles': {
        transform: '@mui/styles/${member}',
        preventFullImport: true
      },
      'lodash': {
        transform: 'lodash/${member}',
        preventFullImport: true
      },
      'date-fns': {
        transform: 'date-fns/${member}',
        preventFullImport: true
      },
      'recharts': {
        transform: 'recharts/es6/component/${member}',
        preventFullImport: true
      }
    }
  ],
  // Remove prop-types in production
  process.env.NODE_ENV === 'production' && [
    'transform-react-remove-prop-types',
    {
      removeImport: true,
      additionalLibraries: ['react-immutable-proptypes']
    }
  ],
  // Optimize styled-components
  [
    'babel-plugin-styled-components',
    {
      displayName: process.env.NODE_ENV !== 'production',
      fileName: process.env.NODE_ENV !== 'production',
      pure: true,
      ssr: true
    }
  ]
].filter(Boolean);

// Bundle analyzer configuration
const bundleAnalyzerConfig = {
  analyzerMode: 'static',
  reportFilename: 'bundle-report.html',
  openAnalyzer: false,
  generateStatsFile: true,
  statsFilename: 'bundle-stats.json',
};

// Module exports
module.exports = {
  advancedSplitChunksConfig,
  advancedTerserConfig,
  advancedCssMinimizerConfig,
  compressionPluginConfig,
  htmlPluginConfig,
  moduleReplacements,
  babelPlugins,
  bundleAnalyzerConfig,
}; 