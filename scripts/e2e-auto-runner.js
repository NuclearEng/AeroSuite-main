#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');
const http = require('http');

// Configuration
const config = {
  ports: {
    frontend: { default: 3000, range: [3000, 3999] },
    backend: { default: 5000, range: [5000, 5999] }
  },
  timeouts: {
    serverStart: 120000, // 2 minutes for backend to start
    healthCheck: 3000,
    gracefulShutdown: 5000
  },
  paths: {
    cypressConfig: 'cypress.config.js',
    clientApi: 'client/src/services/api.ts'
  }
};

// State management
const state = {
  processes: new Map(),
  ports: {},
  backups: new Map(),
  startTime: Date.now()
};

// Utility functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const log = {
  info: (msg) => console.log(`[${new Date().toISOString()}] ℹ️  ${msg}`),
  success: (msg) => console.log(`[${new Date().toISOString()}] ✅ ${msg}`),
  error: (msg) => console.error(`[${new Date().toISOString()}] ❌ ${msg}`),
  warning: (msg) => console.warn(`[${new Date().toISOString()}] ⚠️  ${msg}`),
  step: (msg) => console.log(`\n[${new Date().toISOString()}] 🚀 ${msg}\n`)
};

// Port management
async function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => resolve(false));
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
  });
}

async function findPort(preferred, range) {
  if (await checkPort(preferred)) {
    return preferred;
  }
  
  for (let port = range[0]; port <= range[1]; port++) {
    if (await checkPort(port)) {
      return port;
    }
  }
  
  throw new Error(`No available ports in range ${range[0]}-${range[1]}`);
}

async function killProcessOnPort(port) {
  try {
    // Try to find and kill process on port (works on macOS/Linux)
    const { exec } = require('child_process');
    await new Promise((resolve) => {
      exec(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, resolve);
    });
    await sleep(1000); // Wait for process to die
  } catch (err) {
    // Ignore errors
  }
}

// Configuration management
function backupFile(filePath) {
  if (fs.existsSync(filePath)) {
    const backup = `${filePath}.e2e-backup-${Date.now()}`;
    fs.copyFileSync(filePath, backup);
    state.backups.set(filePath, backup);
    return backup;
  }
  return null;
}

function restoreBackups() {
  for (const [original, backup] of state.backups.entries()) {
    if (fs.existsSync(backup)) {
      fs.copyFileSync(backup, original);
      fs.unlinkSync(backup);
    }
  }
  state.backups.clear();
}

function updateCypressConfig(frontendPort, backendPort) {
  const configPath = config.paths.cypressConfig;
  backupFile(configPath);
  
  let content = fs.readFileSync(configPath, 'utf8');
  
  // Update baseUrl
  content = content.replace(
    /(baseUrl\s*:\s*['"`])https?:\/\/localhost:\d+(['"`])/,
    `$1http://localhost:${frontendPort}$2`
  );
  
  // Update apiUrl
  content = content.replace(
    /(apiUrl\s*:\s*['"`])https?:\/\/localhost:\d+(['"`])/,
    `$1http://localhost:${backendPort}$2`
  );
  
  fs.writeFileSync(configPath, content);
  log.success(`Updated Cypress config - Frontend: ${frontendPort}, Backend: ${backendPort}`);
}

function updateClientApiConfig(backendPort) {
  const apiPath = config.paths.clientApi;
  if (!fs.existsSync(apiPath)) {
    log.warning('Client API config not found, skipping update');
    return;
  }
  
  backupFile(apiPath);
  
  let content = fs.readFileSync(apiPath, 'utf8');
  content = content.replace(/localhost:\d+/g, `localhost:${backendPort}`);
  fs.writeFileSync(apiPath, content);
  
  log.success(`Updated client API config to use port ${backendPort}`);
}

// Process management
function startProcess(name, command, env = {}) {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' ');
    
    log.info(`Starting ${name}: ${command}`);
    
    const proc = spawn(cmd, args, {
      env: { ...process.env, ...env },
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    state.processes.set(name, proc);
    
    let started = false;
    const startPatterns = [
      'compiled successfully',
      'server running',
      'listening on',
      'ready',
      'started',
      'webpack compiled',
      'nodemon',
      'starting `node',
      'server is running',
      'express server'
    ];
    
    const errorPatterns = [
      'error:',
      'failed to compile',
      'module not found',
      'cannot find module'
    ];
    
    proc.stdout.on('data', (data) => {
      const output = data.toString().toLowerCase();
      
      if (!started && startPatterns.some(pattern => output.includes(pattern))) {
        started = true;
        log.success(`${name} started successfully`);
        resolve(proc);
      }
      
      // Log errors
      if (errorPatterns.some(pattern => output.includes(pattern))) {
        log.error(`${name}: ${data.toString().trim()}`);
      }
    });
    
    proc.stderr.on('data', (data) => {
      const error = data.toString();
      if (!error.includes('DeprecationWarning') && !error.includes('ExperimentalWarning')) {
        log.error(`${name} error: ${error.trim()}`);
      }
    });
    
    proc.on('error', reject);
    
    proc.on('exit', (code) => {
      if (!started && code !== null && code !== 0) {
        reject(new Error(`${name} exited with code ${code}`));
      }
      state.processes.delete(name);
    });
    
    // Timeout
    setTimeout(() => {
      if (!started) {
        started = true;
        log.warning(`${name} start timeout, proceeding anyway`);
        resolve(proc);
      }
    }, config.timeouts.serverStart);
  });
}

async function waitForServer(url, name) {
  const maxAttempts = Math.floor(config.timeouts.serverStart / config.timeouts.healthCheck);
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise((resolve, reject) => {
        http.get(url, (res) => {
          if (res.statusCode >= 200 && res.statusCode < 400) {
            resolve();
          } else {
            reject(new Error(`Status ${res.statusCode}`));
          }
        }).on('error', reject);
      });
      
      log.success(`${name} is ready at ${url}`);
      return true;
    } catch (err) {
      if (i < maxAttempts - 1) {
        await sleep(config.timeouts.healthCheck);
      }
    }
  }
  
  throw new Error(`${name} failed to become ready at ${url}`);
}

// Cleanup
async function cleanup() {
  log.step('Cleaning up...');
  
  // Kill all processes
  for (const [name, proc] of state.processes.entries()) {
    log.info(`Stopping ${name}...`);
    proc.kill('SIGTERM');
  }
  
  // Wait for graceful shutdown
  await sleep(config.timeouts.gracefulShutdown);
  
  // Force kill if needed
  for (const [name, proc] of state.processes.entries()) {
    if (!proc.killed) {
      log.warning(`Force killing ${name}...`);
      proc.kill('SIGKILL');
    }
  }
  
  // Clean up ports
  if (state.ports.frontend) {
    await killProcessOnPort(state.ports.frontend);
  }
  if (state.ports.backend) {
    await killProcessOnPort(state.ports.backend);
  }
  
  // Restore backups
  restoreBackups();
  
  // Remove temp files
  const tempFiles = ['.env.e2e', '.env.e2e.test'];
  for (const file of tempFiles) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  }
  
  log.success('Cleanup completed');
}

// Main test runner
async function runTests() {
  log.step('Running Cypress E2E tests...');
  
  return new Promise((resolve, reject) => {
    const cypressArgs = [
      'cypress', 'run',
      '--e2e',
      '--headless',
      '--config',
      `baseUrl=http://localhost:${state.ports.frontend}`,
      '--env',
      `apiUrl=http://localhost:${state.ports.backend}`
    ];
    
    const cypress = spawn('npx', cypressArgs, {
      stdio: 'inherit',
      shell: true
    });
    
    state.processes.set('cypress', cypress);
    
    cypress.on('exit', (code) => {
      state.processes.delete('cypress');
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Cypress exited with code ${code}`));
      }
    });
    
    cypress.on('error', reject);
  });
}

// Main execution
async function main() {
  console.log(`
╔═══════════════════════════════════════════════════╗
║        AeroSuite Automated E2E Testing            ║
║                                                   ║
║  This will:                                       ║
║  • Find available ports                           ║
║  • Start backend and frontend servers             ║
║  • Run all E2E tests                              ║
║  • Clean up automatically                         ║
╚═══════════════════════════════════════════════════╝
`);
  
  try {
    // Find available ports
    log.step('Finding available ports...');
    state.ports.frontend = await findPort(
      config.ports.frontend.default,
      config.ports.frontend.range
    );
    state.ports.backend = await findPort(
      config.ports.backend.default,
      config.ports.backend.range
    );
    log.success(`Ports selected - Frontend: ${state.ports.frontend}, Backend: ${state.ports.backend}`);
    
    // Update configurations
    log.step('Updating configurations...');
    updateCypressConfig(state.ports.frontend, state.ports.backend);
    updateClientApiConfig(state.ports.backend);
    
    // Create temporary env file
    const envContent = `
PORT=${state.ports.frontend}
REACT_APP_API_URL=http://localhost:${state.ports.backend}
SERVER_PORT=${state.ports.backend}
NODE_ENV=test
BROWSER=none
`;
    fs.writeFileSync('.env.e2e', envContent.trim());
    
    // Start backend
    log.step('Starting backend server...');
    await startProcess('backend', 'npm run server:dev', {
      PORT: state.ports.backend,
      NODE_ENV: 'test'
    });
    await waitForServer(
      `http://localhost:${state.ports.backend}/api/health`,
      'Backend API'
    );
    
    // Start frontend
    log.step('Starting frontend server...');
    await startProcess('frontend', 'npm start', {
      PORT: state.ports.frontend,
      REACT_APP_API_URL: `http://localhost:${state.ports.backend}`,
      BROWSER: 'none',
      NODE_ENV: 'test'
    });
    await waitForServer(
      `http://localhost:${state.ports.frontend}`,
      'Frontend'
    );
    
    // Run tests
    await runTests();
    
    // Success!
    const duration = Math.round((Date.now() - state.startTime) / 1000);
    console.log(`
╔═══════════════════════════════════════════════════╗
║                  TEST RESULTS                     ║
╠═══════════════════════════════════════════════════╣
║  Status: ✅ PASSED                                ║
║  Duration: ${duration}s                           ║
║  Frontend Port: ${state.ports.frontend}           ║
║  Backend Port: ${state.ports.backend}             ║
╚═══════════════════════════════════════════════════╝
`);
    
  } catch (error) {
    log.error(`Test execution failed: ${error.message}`);
    console.error(error.stack);
    process.exitCode = 1;
  } finally {
    await cleanup();
  }
}

// Error handlers
process.on('SIGINT', async () => {
  log.warning('Interrupted, cleaning up...');
  await cleanup();
  process.exit(1);
});

process.on('SIGTERM', async () => {
  log.warning('Terminated, cleaning up...');
  await cleanup();
  process.exit(1);
});

process.on('uncaughtException', async (err) => {
  log.error(`Uncaught exception: ${err.message}`);
  console.error(err.stack);
  await cleanup();
  process.exit(1);
});

// Run
main().catch(console.error);