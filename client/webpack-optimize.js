/**
 * Webpack optimization script to help reduce memory usage
 * Run this with: NODE_ENV=production node webpack-optimize.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);
const packageJsonPath = resolveApp('package.json');

// Check if we need to install dependencies
const installDependenciesIfNeeded = () => {
  const dependencies = [
    'webpack-bundle-analyzer',
    'compression-webpack-plugin',
    'terser-webpack-plugin',
  ];
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const devDependencies = packageJson.devDependencies || {};
  
  const missingDependencies = dependencies.filter(
    dep => !devDependencies[dep]
  );
  
  if (missingDependencies.length > 0) {
    console.log(`Installing missing dependencies: ${missingDependencies.join(', ')}`);
    execSync(`npm install --save-dev ${missingDependencies.join(' ')}`, { stdio: 'inherit' });
  }
};

// Create webpack config override
const createWebpackConfigOverride = () => {
  const configPath = resolveApp('config-overrides.js');
  
  // Check if config-overrides.js already exists
  if (fs.existsSync(configPath)) {
    console.log('config-overrides.js already exists. Updating...');
    const existingConfig = fs.readFileSync(configPath, 'utf8');
    
    if (existingConfig.includes('webpack-bundle-analyzer')) {
      console.log('Bundle analyzer already configured in config-overrides.js');
      return;
    }
  }
  
  const configContent = `const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CompressionPlugin = require('compression-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = function override(config, env) {
  // Only enable analyzer in production with explicit env var
  if (process.env.ANALYZE) {
    config.plugins.push(
      new BundleAnalyzerPlugin({
        analyzerMode: 'server',
        reportFilename: 'report.html',
      })
    );
  }
  
  // Add compression plugin
  config.plugins.push(
    new CompressionPlugin({
      filename: '[path][base].gz',
      algorithm: 'gzip',
      test: /\\.(js|css|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8,
    })
  );
  
  // Split chunks optimization
  config.optimization = {
    ...config.optimization,
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 20000,
      cacheGroups: {
        vendor: {
          test: /[\\\\/]node_modules[\\\\/]/,
          name(module) {
            // Get the name. E.g. node_modules/packageName/not/this/part.js
            // or node_modules/packageName
            const packageName = module.context.match(/[\\\\/]node_modules[\\\\/](.*?)([\\\\/]|$)/)[1];
            
            // Create separate chunks for larger packages
            return packageName.replace('@', '');
          },
        },
      },
    },
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          parse: {
            // We want terser to parse ecma 8 code. However, we don't want it
            // to apply any minification steps that turns valid ecma 5 code
            // into invalid ecma 5 code. This is why the 'compress' and 'output'
            // sections only apply transformations that are ecma 5 safe
            ecma: 8,
          },
          compress: {
            ecma: 5,
            warnings: false,
            comparisons: false,
            inline: 2,
            drop_console: true,
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
        // Use multi-process parallel running to improve the build speed
        parallel: true,
      }),
    ],
  };
  
  // Memory optimization for large projects
  config.performance = {
    hints: false, // 'warning' or 'error' to enable
    maxAssetSize: 500000, // in bytes
    maxEntrypointSize: 500000, // in bytes
  };
  
  return config;
};
`;
  
  fs.writeFileSync(configPath, configContent);
  console.log('Created/updated config-overrides.js with optimizations');
};

// Update package.json scripts
const updatePackageJsonScripts = () => {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add/update scripts
  const scripts = packageJson.scripts || {};
  
  scripts['analyze'] = 'ANALYZE=true npm run build';
  scripts['build:optimized'] = 'node --max-old-space-size=8192 node_modules/.bin/react-app-rewired build';
  scripts['start:optimized'] = 'node --max-old-space-size=8192 node_modules/.bin/react-app-rewired start';
  
  // Backup original scripts if they exist
  if (scripts.start && !scripts['start:original']) {
    scripts['start:original'] = scripts.start;
  }
  
  if (scripts.build && !scripts['build:original']) {
    scripts['build:original'] = scripts.build;
  }
  
  // Replace standard scripts with optimized versions
  scripts.start = scripts['start:optimized'];
  scripts.build = scripts['build:optimized'];
  
  packageJson.scripts = scripts;
  
  // Add react-app-rewired as a dev dependency if not present
  packageJson.devDependencies = packageJson.devDependencies || {};
  if (!packageJson.devDependencies['react-app-rewired']) {
    packageJson.devDependencies['react-app-rewired'] = '^2.2.1';
  }
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('Updated package.json with optimized scripts');
};

// Create .env.production file
const createEnvProductionFile = () => {
  const envPath = resolveApp('.env.production');
  const envContent = `# Disable source maps in production to reduce bundle size
GENERATE_SOURCEMAP=false

# Enable React production mode
REACT_APP_ENV=production

# Disable console logs in production
REACT_APP_LOG_LEVEL=error
`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('Created .env.production with optimizations');
};

// Create a README for optimization
const createOptimizationReadme = () => {
  const readmePath = resolveApp('OPTIMIZATION.md');
  const readmeContent = `# Performance Optimization Guide

## Memory Issues

If you're experiencing memory issues during development or build, try these approaches:

### Development Mode

1. Start the app with increased memory:
   \`\`\`
   npm run start:optimized
   \`\`\`

2. If you still experience issues, try building and serving:
   \`\`\`
   npm run build:optimized
   npx serve -s build
   \`\`\`

### Production Build

Use the optimized build script:
\`\`\`
npm run build:optimized
\`\`\`

### Analyze Bundle Size

Run the analyzer to see what's taking up space:
\`\`\`
npm run analyze
\`\`\`

## Performance Recommendations

1. **Code Splitting**: Use dynamic imports and React.lazy for route-based code splitting
2. **Virtualization**: Use virtualized lists for large data sets (react-window, react-virtualized)
3. **Memoization**: Use React.memo, useMemo, and useCallback to prevent unnecessary renders
4. **Image Optimization**: Compress images and use WebP format where possible
5. **Tree Shaking**: Import only what you need from libraries
6. **Dependencies**: Regularly audit dependencies and remove unused ones

## Memory Leak Debugging

To find memory leaks:

1. Open Chrome DevTools
2. Go to the Memory tab
3. Take a heap snapshot
4. Perform the action that might cause a leak
5. Take another snapshot
6. Compare snapshots to identify retained memory

Common memory leak sources:
- Forgotten event listeners
- Timers/intervals not cleared
- Closures holding references to large objects
- Detached DOM elements

`;
  
  fs.writeFileSync(readmePath, readmeContent);
  console.log('Created OPTIMIZATION.md with performance recommendations');
};

// Install dependencies
installDependenciesIfNeeded();

// Create configuration files
createWebpackConfigOverride();
updatePackageJsonScripts();
createEnvProductionFile();
createOptimizationReadme();

console.log('\nOptimization setup complete!');
console.log('Run these commands:');
console.log('1. npm install (to install required dependencies)');
console.log('2. npm run start:optimized (for development)');
console.log('3. npm run build:optimized (for production)');
console.log('4. npm run analyze (to analyze bundle size)');
console.log('\nSee OPTIMIZATION.md for more details on performance improvements.'); 