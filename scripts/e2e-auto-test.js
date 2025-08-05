#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuration
const DEFAULT_FRONTEND_PORT = 3000;
const DEFAULT_BACKEND_PORT = 5000;
const PORT_RANGE_START = 3000;
const PORT_RANGE_END = 9000;
const MAX_WAIT_TIME = 60000; // 60 seconds
const HEALTH_CHECK_INTERVAL = 2000; // 2 seconds

// Process tracking
let frontendProcess = null;
let backendProcess = null;
let cypressProcess = null;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Logging functions
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  step: (msg) => console.log(`\n${colors.cyan}${colors.bright}▶ ${msg}${colors.reset}`)
};

// Check if a port is available
const isPortAvailable = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, '127.0.0.1');
    server.on('listening', () => {
      server.close();
      resolve(true);
    });
    server.on('error', () => {
      resolve(false);
    });
  });
};

// Find available port
const findAvailablePort = async (preferredPort, startRange = PORT_RANGE_START, endRange = PORT_RANGE_END) => {
  // First try the preferred port
  if (await isPortAvailable(preferredPort)) {
    return preferredPort;
  }
  
  log.warning(`Port ${preferredPort} is not available, searching for alternative...`);
  
  // Search for available port in range
  for (let port = startRange; port <= endRange; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  
  throw new Error(`No available ports found in range ${startRange}-${endRange}`);
};

// Update configuration files with new ports
const updateConfigurations = async (frontendPort, backendPort) => {
  log.step('Updating configuration files...');
  
  // Update Cypress config
  const cypressConfigPath = path.join(process.cwd(), 'cypress.config.js');
  let cypressConfig = fs.readFileSync(cypressConfigPath, 'utf8');
  cypressConfig = cypressConfig.replace(
    /baseUrl:\s*['"`]https?:\/\/localhost:\d+['"`]/,
    `baseUrl: 'http://localhost:${frontendPort}'`
  );
  cypressConfig = cypressConfig.replace(
    /apiUrl:\s*['"`]https?:\/\/localhost:\d+['"`]/,
    `apiUrl: 'http://localhost:${backendPort}'`
  );
  fs.writeFileSync(cypressConfigPath, cypressConfig);
  log.success(`Updated Cypress config with ports: Frontend=${frontendPort}, Backend=${backendPort}`);
  
  // Create temporary environment file for servers
  const envContent = `
# Temporary E2E Test Configuration
REACT_APP_API_URL=http://localhost:${backendPort}
PORT=${frontendPort}
SERVER_PORT=${backendPort}
NODE_ENV=test
`;
  fs.writeFileSync('.env.e2e.test', envContent.trim());
  log.success('Created temporary environment configuration');
  
  // Update client API configuration if exists
  const clientApiPath = path.join(process.cwd(), 'client/src/services/api.ts');
  if (fs.existsSync(clientApiPath)) {
    const backupPath = `${clientApiPath}.e2e.backup`;
    fs.copyFileSync(clientApiPath, backupPath);
    
    let apiContent = fs.readFileSync(clientApiPath, 'utf8');
    apiContent = apiContent.replace(
      /localhost:5000/g,
      `localhost:${backendPort}`
    );
    fs.writeFileSync(clientApiPath, apiContent);
    log.success('Updated client API configuration');
  }
};

// Start server process with logging
const startServer = (name, command, env = {}) => {
  return new Promise((resolve, reject) => {
    log.info(`Starting ${name}...`);
    
    const [cmd, ...args] = command.split(' ');
    const serverProcess = spawn(cmd, args, {
      env: { ...process.env, ...env },
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let started = false;
    
    // Capture output
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (!started && (
        output.includes('Compiled successfully') ||
        output.includes('Server running') ||
        output.includes('Listening on') ||
        output.includes('ready on')
      )) {
        started = true;
        log.success(`${name} started successfully`);
        resolve(serverProcess);
      }
      // Log important messages
      if (output.includes('error') || output.includes('Error')) {
        log.error(`${name}: ${output.trim()}`);
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      const error = data.toString();
      if (!error.includes('DeprecationWarning') && !error.includes('ExperimentalWarning')) {
        log.error(`${name} error: ${error.trim()}`);
      }
    });
    
    serverProcess.on('error', (err) => {
      reject(new Error(`Failed to start ${name}: ${err.message}`));
    });
    
    serverProcess.on('exit', (code) => {
      if (!started && code !== 0) {
        reject(new Error(`${name} exited with code ${code}`));
      }
    });
    
    // Timeout fallback
    setTimeout(() => {
      if (!started) {
        started = true;
        log.warning(`${name} start timeout reached, proceeding anyway`);
        resolve(serverProcess);
      }
    }, 30000);
  });
};

// Wait for server to be ready
const waitForServer = async (url, name, maxWait = MAX_WAIT_TIME) => {
  log.info(`Waiting for ${name} to be ready at ${url}...`);
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    try {
      await execPromise(`curl -s -o /dev/null -w "%{http_code}" ${url} | grep -E "^[23]"`);
      log.success(`${name} is ready!`);
      return true;
    } catch (err) {
      // Server not ready yet
      await new Promise(resolve => setTimeout(resolve, HEALTH_CHECK_INTERVAL));
    }
  }
  
  throw new Error(`${name} failed to start within ${maxWait / 1000} seconds`);
};

// Run Cypress tests
const runCypressTests = async (frontendPort, backendPort) => {
  log.step('Running E2E tests...');
  
  return new Promise((resolve, reject) => {
    const cypressEnv = {
      CYPRESS_BASE_URL: `http://localhost:${frontendPort}`,
      CYPRESS_API_URL: `http://localhost:${backendPort}`
    };
    
    cypressProcess = spawn('npx', ['cypress', 'run', '--e2e', '--headless'], {
      env: { ...process.env, ...cypressEnv },
      stdio: 'inherit',
      shell: true
    });
    
    cypressProcess.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Cypress tests failed with exit code ${code}`));
      }
    });
    
    cypressProcess.on('error', (err) => {
      reject(new Error(`Failed to run Cypress: ${err.message}`));
    });
  });
};

// Cleanup function
const cleanup = async () => {
  log.step('Cleaning up...');
  
  // Kill server processes
  if (frontendProcess) {
    log.info('Stopping frontend server...');
    frontendProcess.kill('SIGTERM');
  }
  
  if (backendProcess) {
    log.info('Stopping backend server...');
    backendProcess.kill('SIGTERM');
  }
  
  if (cypressProcess) {
    log.info('Stopping Cypress...');
    cypressProcess.kill('SIGTERM');
  }
  
  // Wait a bit for processes to terminate
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Force kill if still running
  if (frontendProcess && !frontendProcess.killed) {
    frontendProcess.kill('SIGKILL');
  }
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill('SIGKILL');
  }
  
  // Restore configurations
  const clientApiPath = path.join(process.cwd(), 'client/src/services/api.ts');
  const backupPath = `${clientApiPath}.e2e.backup`;
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, clientApiPath);
    fs.unlinkSync(backupPath);
    log.success('Restored client API configuration');
  }
  
  // Remove temporary env file
  if (fs.existsSync('.env.e2e.test')) {
    fs.unlinkSync('.env.e2e.test');
    log.success('Removed temporary environment file');
  }
  
  // Kill any remaining node processes on our ports (cleanup safeguard)
  try {
    await execPromise(`lsof -ti:${frontendPort} | xargs kill -9 2>/dev/null || true`);
    await execPromise(`lsof -ti:${backendPort} | xargs kill -9 2>/dev/null || true`);
  } catch (err) {
    // Ignore errors - processes might already be dead
  }
  
  log.success('Cleanup completed');
};

// Main execution
const main = async () => {
  console.log(`
${colors.bright}${colors.cyan}╔═══════════════════════════════════════════╗
║     AeroSuite Automated E2E Testing       ║
╚═══════════════════════════════════════════╝${colors.reset}
`);
  
  let frontendPort, backendPort;
  let success = false;
  
  try {
    // Step 1: Find available ports
    log.step('Scanning for available ports...');
    frontendPort = await findAvailablePort(DEFAULT_FRONTEND_PORT);
    backendPort = await findAvailablePort(DEFAULT_BACKEND_PORT, frontendPort + 1);
    log.success(`Selected ports - Frontend: ${frontendPort}, Backend: ${backendPort}`);
    
    // Step 2: Update configurations
    await updateConfigurations(frontendPort, backendPort);
    
    // Step 3: Install dependencies if needed
    log.step('Checking dependencies...');
    try {
      await execPromise('npm ls cypress --depth=0');
      log.success('Dependencies are installed');
    } catch (err) {
      log.warning('Installing missing dependencies...');
      await execPromise('npm install --save-dev cypress@14.4.1 start-server-and-test --legacy-peer-deps');
      log.success('Dependencies installed');
    }
    
    // Step 4: Start backend server
    log.step('Starting backend server...');
    const backendEnv = {
      PORT: backendPort,
      NODE_ENV: 'test'
    };
    backendProcess = await startServer(
      'Backend Server',
      'npm run server:dev',
      backendEnv
    );
    
    // Step 5: Start frontend server
    log.step('Starting frontend server...');
    const frontendEnv = {
      PORT: frontendPort,
      REACT_APP_API_URL: `http://localhost:${backendPort}`,
      NODE_ENV: 'test',
      BROWSER: 'none' // Don't open browser
    };
    frontendProcess = await startServer(
      'Frontend Server',
      'npm start',
      frontendEnv
    );
    
    // Step 6: Wait for servers to be ready
    await waitForServer(`http://localhost:${backendPort}/api/health`, 'Backend API');
    await waitForServer(`http://localhost:${frontendPort}`, 'Frontend');
    
    // Step 7: Run E2E tests
    await runCypressTests(frontendPort, backendPort);
    
    success = true;
    log.success('All E2E tests passed successfully! 🎉');
    
  } catch (error) {
    log.error(`Test execution failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    // Cleanup
    await cleanup();
  }
  
  // Summary
  console.log(`
${colors.bright}${colors.cyan}╔═══════════════════════════════════════════╗
║              Test Summary                 ║
╚═══════════════════════════════════════════╝${colors.reset}

${success ? colors.green + '✅ Status: PASSED' : colors.red + '❌ Status: FAILED'}${colors.reset}
Frontend Port: ${frontendPort}
Backend Port: ${backendPort}
Duration: ${Math.round((Date.now() - startTime) / 1000)}s
`);
  
  process.exit(process.exitCode || 0);
};

// Global error handlers
process.on('SIGINT', async () => {
  log.warning('\nReceived interrupt signal, cleaning up...');
  await cleanup();
  process.exit(1);
});

process.on('uncaughtException', async (err) => {
  log.error(`Uncaught exception: ${err.message}`);
  await cleanup();
  process.exit(1);
});

// Track start time
const startTime = Date.now();

// Run the automation
main();