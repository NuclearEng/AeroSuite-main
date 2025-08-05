const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CompressionPlugin = require('compression-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const path = require('path');
const optimizeChunks = require('./webpack.chunk-optimization');

module.exports = function override(config, env) {
  const isProd = env === 'production';
  
  // Only enable analyzer in production with explicit env var
  if (process.env.ANALYZE) {
    config.plugins.push(
      new BundleAnalyzerPlugin({
        analyzerMode: 'server',
        reportFilename: 'report.html',
        openAnalyzer: true,
        generateStatsFile: true,
        statsFilename: 'stats.json',
      })
    );
  }
  
  // Add compression plugin
  config.plugins.push(
    new CompressionPlugin({
      filename: '[path][base].gz',
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8,
    })
  );
  
  // Add Brotli compression if in production
  if (isProd) {
    config.plugins.push(
      new CompressionPlugin({
        filename: '[path][base].br',
        algorithm: 'brotliCompress',
        test: /\.(js|css|html|svg)$/,
        compressionOptions: { level: 11 },
        threshold: 10240,
        minRatio: 0.8,
      })
    );
  }
  
  // Add manifest plugin for better caching
  config.plugins.push(
    new WebpackManifestPlugin({
      fileName: 'asset-manifest.json',
      publicPath: config.output.publicPath,
      generate: (seed, files, entrypoints) => {
        const manifestFiles = files.reduce((manifest, file) => {
          manifest[file.name] = file.path;
          return manifest;
        }, seed);
        
        const entrypointFiles = entrypoints.main.filter(
          fileName => !fileName.endsWith('.map')
        );
        
        return {
          files: manifestFiles,
          entrypoints: entrypointFiles,
        };
      },
    })
  );
  
  // Configure filesystem cache for faster rebuilds
  config.cache = {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename]
    },
    // Increase cache version when build configuration changes
    version: `${new Date().getTime()}`,
  };

  // Optimize fork-ts-checker-webpack-plugin if it exists
  config.plugins.forEach(plugin => {
    if (plugin.constructor.name === 'ForkTsCheckerWebpackPlugin') {
      plugin.options = {
        ...plugin.options,
        typescript: {
          ...plugin.options?.typescript,
          memoryLimit: 4096,
          mode: 'write-references'
        }
      };
    }
  });
  
  // Improved module resolution for better tree shaking
  config.resolve = {
    ...config.resolve,
    modules: [
      path.resolve('src'),
      'node_modules'
    ],
    // Prefer esm modules for better tree shaking
    mainFields: ['browser', 'module', 'main'],
    // Add support for additional file extensions
    extensions: [...config.resolve.extensions, '.mjs', '.json'],
  };
  
  // Apply advanced chunk optimization
  config = optimizeChunks(config, isProd);
  
  // Performance optimization
  config.performance = {
    hints: isProd ? 'warning' : false,
    maxAssetSize: 500000, // in bytes
    maxEntrypointSize: 500000, // in bytes
  };
  
  // Add bundle size budget warnings
  if (isProd) {
    config.performance.hints = 'warning';
    config.performance.maxAssetSize = 400000; // 400KB
    config.performance.maxEntrypointSize = 800000; // 800KB
  }
  
  // Add TerserPlugin with advanced configuration
  if (isProd) {
    config.optimization.minimizer = [
      new TerserPlugin({
        terserOptions: {
          parse: {
            ecma: 8,
          },
          compress: {
            ecma: 5,
            warnings: false,
            comparisons: false,
            inline: 2,
            drop_console: isProd,
            drop_debugger: isProd,
            pure_funcs: isProd ? ['console.log', 'console.debug', 'console.info'] : [],
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
        extractComments: false,
        parallel: true,
      }),
      // Keep any other minimizers that might be there
      ...(config.optimization.minimizer || []).filter(
        plugin => !(plugin instanceof TerserPlugin)
      ),
    ];
  }
  
  return config;
};
