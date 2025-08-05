/* config-overrides.js */
const { override, addWebpackPlugin, addBabelPlugin, addBundleVisualizer } = require('customize-cra');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const DuplicatePackageCheckerPlugin = require('duplicate-package-checker-webpack-plugin');

// Import our custom webpack optimizations
const {
  advancedSplitChunksConfig,
  advancedTerserConfig,
  advancedCssMinimizerConfig,
  compressionPluginConfig,
  htmlPluginConfig,
  moduleReplacements,
  babelPlugins,
  bundleAnalyzerConfig,
} = require('./client/src/utils/webpackOptimizations');

module.exports = override(
  // Add Babel plugins for optimization
  ...babelPlugins.map(plugin => addBabelPlugin(plugin)),
  
  // Optimize webpack configuration
  (config) => {
    // Customize the webpack optimization
    if (process.env.NODE_ENV === 'production') {
      // Use our advanced splitChunks configuration
      config.optimization.splitChunks = advancedSplitChunksConfig;
      
      // Use Terser for minification with optimized settings
      config.optimization.minimizer = [
        new TerserPlugin(advancedTerserConfig),
        // Add CSS Minimizer for better CSS optimization
        new CssMinimizerPlugin(advancedCssMinimizerConfig),
      ];
      
      // Add compression plugin for gzipped assets
      config.plugins.push(
        new CompressionPlugin(compressionPluginConfig.gzip)
      );
      
      // Add brotli compression for even better compression
      config.plugins.push(
        new CompressionPlugin(compressionPluginConfig.brotli)
      );
      
      // Replace the default HtmlWebpackPlugin with an optimized version
      const htmlPluginIndex = config.plugins.findIndex(
        plugin => plugin instanceof HtmlWebpackPlugin
      );
      
      if (htmlPluginIndex !== -1) {
        const oldHtmlPlugin = config.plugins[htmlPluginIndex];
        config.plugins.splice(htmlPluginIndex, 1, new HtmlWebpackPlugin({
          ...oldHtmlPlugin.options,
          ...htmlPluginConfig,
        }));
      }
      
      // Ensure we use MiniCssExtractPlugin in production
      const cssLoaders = config.module.rules.find(
        rule => rule.oneOf
      ).oneOf.filter(
        rule => rule.test && rule.test.toString().includes('css')
      );
      
      cssLoaders.forEach(loader => {
        const use = loader.use;
        if (use && use.length > 0) {
          for (let i = 0; i < use.length; i++) {
            if (use[i] && use[i].loader && use[i].loader.includes('style-loader')) {
              use[i] = MiniCssExtractPlugin.loader;
            }
          }
        }
      });
      
      // Add MiniCssExtractPlugin
      config.plugins.push(
        new MiniCssExtractPlugin({
          filename: 'static/css/[name].[contenthash:8].css',
          chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
        })
      );
      
      // Add service worker for offline capabilities and improved loading
      config.plugins.push(
        new InjectManifest({
          swSrc: './src/service-worker.ts',
          swDest: 'service-worker.js',
          exclude: [/\.map$/, /asset-manifest\.json$/, /LICENSE/],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        })
      );
      
      // Add circular dependency detection
      config.plugins.push(
        new CircularDependencyPlugin({
          exclude: /node_modules/,
          failOnError: false,
          allowAsyncCycles: true,
          cwd: process.cwd(),
        })
      );
      
      // Add duplicate package checker
      config.plugins.push(
        new DuplicatePackageCheckerPlugin({
          verbose: true,
          emitError: false,
          showHelp: true,
        })
      );
      
      // Only add bundle analyzer when specifically requested
      if (process.env.ANALYZE) {
        config.plugins.push(
          new BundleAnalyzerPlugin(bundleAnalyzerConfig)
        );
      }
    }
    
    // Add path aliases for easier imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@components': path.resolve(__dirname, 'src/components'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      
      // Add module replacements for smaller alternatives
      ...Object.entries(moduleReplacements).reduce((acc, [key, value]) => {
        acc[key] = path.resolve(__dirname, `node_modules/${value}`);
        return acc;
      }, {})
    };
    
    // Add module rules to enforce using smaller alternatives
    if (!config.module.rules.some(rule => rule.enforce === 'pre' && rule.use && rule.use.includes('optimize-imports-loader'))) {
      config.module.rules.unshift({
        test: /\.(js|jsx|ts|tsx)$/,
        enforce: 'pre',
        use: [
          {
            loader: require.resolve('babel-loader'),
            options: {
              plugins: [
                ['transform-imports', {
                  '@mui/material': {
                    transform: '@mui/material/${member}',
                    preventFullImport: true
                  },
                  '@mui/icons-material': {
                    transform: '@mui/icons-material/${member}',
                    preventFullImport: true
                  }
                }]
              ]
            }
          }
        ],
        include: path.resolve(__dirname, 'src')
      });
    }
    
    return config;
  }
); 