#!/usr/bin/env node

/**
 * Backend Debug Script for AeroSuite
 * This script helps identify and fix common backend server issues
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');
const util = require('util');
const execPromise = util.promisify(exec);

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Log functions
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  step: (msg) => console.log(`\n${colors.cyan}${colors.bright}▶ ${msg}${colors.reset}`)
};

// Check if port is in use
async function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.on('error', () => resolve(false));
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
  });
}

// Check environment variables
function checkEnvironment() {
  log.step('Checking Environment Variables');
  
  const required = [
    { name: 'MONGODB_URI', default: 'mongodb://localhost:27017/aerosuite' },
    { name: 'PORT', default: '5000' },
    { name: 'JWT_SECRET', default: 'dev-secret-key' },
    { name: 'NODE_ENV', default: 'development' }
  ];
  
  const missing = [];
  const configured = [];
  
  required.forEach(({ name, default: defaultValue }) => {
    if (process.env[name]) {
      configured.push(`${name}: ${name.includes('SECRET') ? '***' : process.env[name]}`);
    } else {
      missing.push({ name, default: defaultValue });
      process.env[name] = defaultValue;
    }
  });
  
  if (configured.length > 0) {
    log.success('Configured environment variables:');
    configured.forEach(c => log.info(`  ${c}`));
  }
  
  if (missing.length > 0) {
    log.warning('Missing environment variables (using defaults):');
    missing.forEach(m => log.warning(`  ${m.name} = ${m.default}`));
  }
}

// Check MongoDB connection
async function checkMongoDB() {
  log.step('Checking MongoDB Connection');
  
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aerosuite';
  
  try {
    // Check if MongoDB is running locally
    await execPromise('pgrep mongod');
    log.success('MongoDB process is running');
  } catch (err) {
    log.warning('MongoDB process not found locally');
    log.info('Checking Docker containers...');
    
    try {
      const { stdout } = await execPromise('docker ps | grep mongo');
      if (stdout) {
        log.success('MongoDB is running in Docker');
      }
    } catch (dockerErr) {
      log.error('MongoDB is not running. Please start MongoDB:');
      log.info('  - Local: mongod --dbpath /data/db');
      log.info('  - Docker: docker run -d -p 27017:27017 mongo');
      return false;
    }
  }
  
  // Test connection
  const mongoose = require('mongoose');
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    log.success('Successfully connected to MongoDB');
    await mongoose.connection.close();
    return true;
  } catch (err) {
    log.error(`Failed to connect to MongoDB: ${err.message}`);
    return false;
  }
}

// Check Redis connection (if used)
async function checkRedis() {
  log.step('Checking Redis Connection');
  
  try {
    const { stdout } = await execPromise('redis-cli ping');
    if (stdout.trim() === 'PONG') {
      log.success('Redis is running and responding');
      return true;
    }
  } catch (err) {
    log.warning('Redis not running or not installed');
    log.info('Redis is optional but recommended for session management');
  }
  return false;
}

// Check Node.js version
async function checkNodeVersion() {
  log.step('Checking Node.js Version');
  
  const { stdout } = await execPromise('node --version');
  const version = stdout.trim();
  const major = parseInt(version.split('.')[0].substring(1));
  
  if (major >= 18) {
    log.success(`Node.js version ${version} is compatible`);
  } else {
    log.error(`Node.js version ${version} is too old. Required: v18 or higher`);
    return false;
  }
  return true;
}

// Check npm dependencies
async function checkDependencies() {
  log.step('Checking NPM Dependencies');
  
  const serverPath = path.join(process.cwd(), 'server');
  
  if (!fs.existsSync(path.join(serverPath, 'node_modules'))) {
    log.warning('Dependencies not installed');
    log.info('Installing dependencies...');
    
    try {
      await execPromise('npm install', { cwd: serverPath });
      log.success('Dependencies installed successfully');
    } catch (err) {
      log.error('Failed to install dependencies');
      return false;
    }
  } else {
    log.success('Dependencies are installed');
  }
  
  // Check for missing dependencies
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(serverPath, 'package.json'), 'utf8'));
    const dependencies = Object.keys(packageJson.dependencies || {});
    
    const critical = ['express', 'mongoose', 'cors', 'dotenv'];
    const missing = critical.filter(dep => !dependencies.includes(dep));
    
    if (missing.length > 0) {
      log.error(`Missing critical dependencies: ${missing.join(', ')}`);
      return false;
    }
    
    log.success('All critical dependencies are present');
  } catch (err) {
    log.error('Failed to check package.json');
    return false;
  }
  
  return true;
}

// Fix common issues
async function fixCommonIssues() {
  log.step('Fixing Common Issues');
  
  // 1. Create .env file if missing
  const envPath = path.join(process.cwd(), 'server', '.env');
  if (!fs.existsSync(envPath)) {
    log.warning('.env file missing, creating default...');
    const envContent = `# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/aerosuite

# Authentication
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Email (optional)
EMAIL_SERVICE=smtp
EMAIL_USER=
EMAIL_PASSWORD=

# Client URL
CLIENT_URL=http://localhost:3000

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Worker Configuration
WORKER_COUNT=1
`;
    fs.writeFileSync(envPath, envContent);
    log.success('Created default .env file');
  }
  
  // 2. Kill processes on port 5000 if occupied
  const port = process.env.PORT || 5000;
  if (!(await checkPort(port))) {
    log.warning(`Port ${port} is in use, attempting to free it...`);
    try {
      await execPromise(`lsof -ti:${port} | xargs kill -9`);
      log.success(`Port ${port} is now free`);
    } catch (err) {
      log.error(`Failed to free port ${port}`);
    }
  }
  
  // 3. Create required directories
  const dirs = ['logs', 'uploads', 'temp'];
  const serverPath = path.join(process.cwd(), 'server');
  
  dirs.forEach(dir => {
    const dirPath = path.join(serverPath, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      log.success(`Created directory: ${dir}`);
    }
  });
}

// Start backend with debugging
async function startBackendDebug() {
  log.step('Starting Backend Server with Debug Output');
  
  const serverPath = path.join(process.cwd(), 'server');
  const entryFile = fs.existsSync(path.join(serverPath, 'src', 'cluster.js')) 
    ? 'src/cluster.js' 
    : 'src/index.js';
  
  log.info(`Using entry file: ${entryFile}`);
  
  const env = {
    ...process.env,
    DEBUG: '*',
    NODE_ENV: 'development',
    LOG_LEVEL: 'debug'
  };
  
  const server = spawn('node', [entryFile], {
    cwd: serverPath,
    env,
    stdio: 'inherit'
  });
  
  server.on('error', (err) => {
    log.error(`Failed to start server: ${err.message}`);
  });
  
  server.on('exit', (code) => {
    if (code !== 0) {
      log.error(`Server exited with code ${code}`);
    }
  });
  
  // Give server time to start
  setTimeout(() => {
    testHealthEndpoint();
  }, 5000);
}

// Test health endpoint
async function testHealthEndpoint() {
  log.step('Testing Health Endpoint');
  
  const port = process.env.PORT || 5000;
  const healthUrl = `http://localhost:${port}/api/health`;
  
  try {
    const http = require('http');
    
    const test = () => {
      http.get(healthUrl, (res) => {
        if (res.statusCode === 200) {
          log.success(`Health endpoint responding at ${healthUrl}`);
          log.success('Backend server is running successfully!');
        } else {
          log.error(`Health endpoint returned status ${res.statusCode}`);
        }
      }).on('error', (err) => {
        log.error(`Health endpoint not accessible: ${err.message}`);
        log.info('Server may still be starting, retrying in 3 seconds...');
        setTimeout(test, 3000);
      });
    };
    
    test();
  } catch (err) {
    log.error(`Failed to test health endpoint: ${err.message}`);
  }
}

// Generate diagnostic report
async function generateReport() {
  log.step('Generating Diagnostic Report');
  
  const report = {
    timestamp: new Date().toISOString(),
    system: {
      platform: process.platform,
      node: process.version,
      memory: process.memoryUsage()
    },
    checks: {
      environment: checkEnvironment(),
      mongodb: await checkMongoDB(),
      redis: await checkRedis(),
      nodeVersion: await checkNodeVersion(),
      dependencies: await checkDependencies()
    }
  };
  
  const reportPath = path.join(process.cwd(), 'backend-diagnostic-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log.success(`Diagnostic report saved to: ${reportPath}`);
}

// Main execution
async function main() {
  console.log(`
${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════╗
║         AeroSuite Backend Debug Tool              ║
╚═══════════════════════════════════════════════════╝${colors.reset}
`);
  
  try {
    // Run checks
    checkEnvironment();
    const nodeOk = await checkNodeVersion();
    if (!nodeOk) process.exit(1);
    
    const depsOk = await checkDependencies();
    if (!depsOk) process.exit(1);
    
    const mongoOk = await checkMongoDB();
    if (!mongoOk) {
      log.error('MongoDB is required for the backend to function');
      process.exit(1);
    }
    
    await checkRedis();
    
    // Fix issues
    await fixCommonIssues();
    
    // Generate report
    await generateReport();
    
    // Start server
    log.info('\nStarting backend server with debugging enabled...');
    log.info('Press Ctrl+C to stop\n');
    
    await startBackendDebug();
    
  } catch (err) {
    log.error(`Debug script failed: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  }
}

// Handle exit
process.on('SIGINT', () => {
  log.warning('\nShutting down debug server...');
  process.exit(0);
});

// Run
main().catch(console.error);