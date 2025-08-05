/**
 * Webpack Chunk Optimization Configuration
 * 
 * This file provides advanced chunk optimization strategies for the AeroSuite application.
 * It's designed to be used with react-app-rewired by importing it into config-overrides.js.
 */

const path = require('path');

/**
 * Configure optimal chunk sizes for the application
 * @param {Object} config - Webpack configuration object
 * @param {boolean} isProd - Whether we're in production mode
 * @returns {Object} - Modified webpack configuration
 */
function optimizeChunks(config, isProd) {
  // Define chunk size limits
  const CHUNK_SIZE_LIMITS = {
    // Target sizes
    optimalSize: 170000, // ~170KB is optimal for HTTP/2
    minSize: 20000,      // Don't create chunks smaller than 20KB
    maxSize: 244000,     // Try to keep chunks under ~244KB
    
    // Specific chunk types
    vendorMaxSize: 300000,  // Vendor chunks can be slightly larger
    asyncMinSize: 10000,    // Async chunks can be smaller
  };

  // Enhanced splitChunks configuration
  config.optimization = {
    ...config.optimization,
    runtimeChunk: 'single',
    moduleIds: 'deterministic', // Better long-term caching
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: 25,     // Allow more initial chunks for HTTP/2
      maxAsyncRequests: 30,       // Allow more async chunks for HTTP/2
      minSize: CHUNK_SIZE_LIMITS.minSize,
      maxSize: CHUNK_SIZE_LIMITS.maxSize,
      cacheGroups: {
        // Framework and runtime dependencies
        framework: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom|history|scheduler)[\\/]/,
          name: 'framework',
          chunks: 'all',
          priority: 40,
          enforce: true,
        },
        
        // UI libraries
        mui: {
          test: /[\\/]node_modules[\\/](@mui|@emotion)[\\/]/,
          name: 'vendor.mui',
          chunks: 'all',
          priority: 30,
          maxSize: CHUNK_SIZE_LIMITS.vendorMaxSize,
        },
        
        // State management
        redux: {
          test: /[\\/]node_modules[\\/](redux|react-redux|@reduxjs)[\\/]/,
          name: 'vendor.redux',
          chunks: 'all',
          priority: 25,
        },
        
        // Data fetching
        dataFetching: {
          test: /[\\/]node_modules[\\/](@tanstack|axios|swr)[\\/]/,
          name: 'vendor.data-fetching',
          chunks: 'all',
          priority: 20,
        },
        
        // Charting libraries
        charts: {
          test: /[\\/]node_modules[\\/](chart\.js|recharts|d3|react-chartjs-2)[\\/]/,
          name: 'vendor.charts',
          chunks: 'all',
          priority: 15,
          maxSize: CHUNK_SIZE_LIMITS.vendorMaxSize,
        },
        
        // Date handling
        dates: {
          test: /[\\/]node_modules[\\/](date-fns|moment|dayjs)[\\/]/,
          name: 'vendor.dates',
          chunks: 'all',
          priority: 15,
        },
        
        // Form libraries
        forms: {
          test: /[\\/]node_modules[\\/](formik|yup|react-hook-form)[\\/]/,
          name: 'vendor.forms',
          chunks: 'all',
          priority: 15,
        },
        
        // Utilities
        utils: {
          test: /[\\/]node_modules[\\/](lodash|uuid|joi)[\\/]/,
          name: 'vendor.utils',
          chunks: 'all',
          priority: 10,
        },
        
        // Other vendor modules
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            // Get package name
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
            
            // npm package names are URL-safe, but some servers don't like @ symbols
            return `vendor.${packageName.replace('@', '')}`;
          },
          chunks: 'all',
          priority: 5,
          minSize: CHUNK_SIZE_LIMITS.minSize,
          maxSize: CHUNK_SIZE_LIMITS.vendorMaxSize,
        },
        
        // Feature-based chunks for application code
        features: {
          test: /[\\/]src[\\/](pages|features)[\\/]([^\/]+)[\\/]/,
          name(module) {
            // Extract feature name from path
            const featurePath = module.context.match(/[\\/]src[\\/](pages|features)[\\/]([^\/]+)[\\/]/);
            return `feature.${featurePath[2].toLowerCase()}`;
          },
          chunks: 'all',
          priority: 5,
          minSize: CHUNK_SIZE_LIMITS.minSize,
          maxSize: CHUNK_SIZE_LIMITS.maxSize,
          reuseExistingChunk: true,
        },
        
        // Common application code
        common: {
          name: 'common',
          minChunks: 2,
          priority: 0,
          reuseExistingChunk: true,
        },
        
        // Async chunks (dynamically imported)
        async: {
          chunks: 'async',
          minSize: CHUNK_SIZE_LIMITS.asyncMinSize,
          maxSize: CHUNK_SIZE_LIMITS.maxSize,
          priority: -5,
        },
      },
    },
  };

  return config;
}

module.exports = optimizeChunks; 