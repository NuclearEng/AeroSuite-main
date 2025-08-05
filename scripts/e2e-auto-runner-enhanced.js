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
  startTime: Date.now(),
  currentOperation: '',
  operationStart: Date.now()
};

// Progress animation
const progress = {
  frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  current: 0,
  interval: null
};

// Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Utility functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Time formatting
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}

function getElapsedTime() {
  return formatDuration(Date.now() - state.startTime);
}

function getOperationTime() {
  return formatDuration(Date.now() - state.operationStart);
}

// Progress display
function startProgress(operation) {
  state.currentOperation = operation;
  state.operationStart = Date.now();
  
  progress.interval = setInterval(() => {
    const frame = progress.frames[progress.current];
    progress.current = (progress.current + 1) % progress.frames.length;
    
    const elapsed = getElapsedTime();
    const opTime = getOperationTime();
    
    process.stdout.write(`\r${colors.cyan}${frame}${colors.reset} ${operation} ${colors.dim}[${opTime} | Total: ${elapsed}]${colors.reset}  `);
  }, 80);
}

function stopProgress(message = null) {
  if (progress.interval) {
    clearInterval(progress.interval);
    progress.interval = null;
    process.stdout.write('\r\x1b[K'); // Clear line
    
    if (message) {
      const opTime = getOperationTime();
      console.log(`${message} ${colors.dim}(${opTime})${colors.reset}`);
    }
  }
}

// Enhanced logging
const log = {
  info: (msg) => {
    stopProgress();
    console.log(`${colors.blue}[${new Date().toISOString()}]${colors.reset} ℹ️  ${msg}`);
  },
  success: (msg) => {
    stopProgress();
    const elapsed = getElapsedTime();
    console.log(`${colors.green}[${new Date().toISOString()}]${colors.reset} ✅ ${msg} ${colors.dim}[Total: ${elapsed}]${colors.reset}`);
  },
  error: (msg) => {
    stopProgress();
    console.error(`${colors.red}[${new Date().toISOString()}]${colors.reset} ❌ ${msg}`);
  },
  warning: (msg) => {
    stopProgress();
    console.warn(`${colors.yellow}[${new Date().toISOString()}]${colors.reset} ⚠️  ${msg}`);
  },
  step: (msg) => {
    stopProgress();
    console.log(`\n${colors.bright}${colors.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}🚀 ${msg}${colors.reset} ${colors.dim}[${getElapsedTime()}]${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  },
  detail: (msg) => {
    stopProgress();
    console.log(`   ${colors.dim}→ ${msg}${colors.reset}`);
  }
};

// Port management with progress
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
  startProgress(`Checking port ${preferred}...`);
  
  if (await checkPort(preferred)) {
    stopProgress(`${colors.green}✅ Port ${preferred} is available${colors.reset}`);
    return preferred;
  }
  
  stopProgress(`${colors.yellow}⚠️  Port ${preferred} is in use${colors.reset}`);
  
  for (let port = range[0]; port <= range[1]; port++) {
    startProgress(`Scanning port ${port}...`);
    if (await checkPort(port)) {
      stopProgress(`${colors.green}✅ Found available port: ${port}${colors.reset}`);
      return port;
    }
  }
  
  stopProgress();
  throw new Error(`No available ports in range ${range[0]}-${range[1]}`);
}

async function killProcessOnPort(port) {
  try {
    const { exec } = require('child_process');
    await new Promise((resolve) => {
      exec(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, resolve);
    });
    await sleep(1000);
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
    log.detail(`Backed up ${path.basename(filePath)} → ${path.basename(backup)}`);
    return backup;
  }
  return null;
}

function restoreBackups() {
  startProgress('Restoring configuration files...');
  
  for (const [original, backup] of state.backups.entries()) {
    if (fs.existsSync(backup)) {
      fs.copyFileSync(backup, original);
      fs.unlinkSync(backup);
    }
  }
  state.backups.clear();
  
  stopProgress(`${colors.green}✅ Configuration files restored${colors.reset}`);
}

function updateCypressConfig(frontendPort, backendPort) {
  const configPath = config.paths.cypressConfig;
  backupFile(configPath);
  
  let content = fs.readFileSync(configPath, 'utf8');
  
  content = content.replace(
    /(baseUrl\s*:\s*['"`])https?:\/\/localhost:\d+(['"`])/,
    `$1http://localhost:${frontendPort}$2`
  );
  
  content = content.replace(
    /(apiUrl\s*:\s*['"`])https?:\/\/localhost:\d+(['"`])/,
    `$1http://localhost:${backendPort}$2`
  );
  
  fs.writeFileSync(configPath, content);
  log.detail(`Updated Cypress config - Frontend: ${frontendPort}, Backend: ${backendPort}`);
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
  
  log.detail(`Updated client API config to use port ${backendPort}`);
}

// Process management with enhanced feedback
function startProcess(name, command, env = {}) {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' ');
    
    log.info(`Starting ${name}: ${colors.dim}${command}${colors.reset}`);
    startProgress(`Waiting for ${name} to start...`);
    
    const proc = spawn(cmd, args, {
      env: { ...process.env, ...env },
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    state.processes.set(name, proc);
    
    let started = false;
    let output = '';
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
    
    const checkOutput = (data) => {
      const text = data.toString();
      output += text;
      const lowerText = text.toLowerCase();
      
      // Check for server start
      if (!started && startPatterns.some(pattern => lowerText.includes(pattern))) {
        started = true;
        stopProgress(`${colors.green}✅ ${name} started successfully${colors.reset}`);
        
        // Show some relevant output
        const lines = output.split('\n').filter(line => 
          line.trim() && !line.includes('node_modules') && !line.includes('webpack')
        ).slice(-3);
        
        lines.forEach(line => log.detail(line.trim()));
        resolve(proc);
      }
      
      // Check for errors
      if (errorPatterns.some(pattern => lowerText.includes(pattern))) {
        const errorLines = text.split('\n').filter(line => line.trim());
        errorLines.forEach(line => {
          if (line.includes('Warning:')) {
            log.warning(`${name}: ${line.trim()}`);
          } else {
            log.error(`${name}: ${line.trim()}`);
          }
        });
      }
    };
    
    proc.stdout.on('data', checkOutput);
    proc.stderr.on('data', checkOutput);
    
    proc.on('error', (err) => {
      stopProgress();
      reject(err);
    });
    
    proc.on('exit', (code) => {
      if (!started && code !== null && code !== 0) {
        stopProgress();
        reject(new Error(`${name} exited with code ${code}`));
      }
      state.processes.delete(name);
    });
    
    // Timeout with better messaging
    const timeoutId = setTimeout(() => {
      if (!started) {
        started = true;
        stopProgress(`${colors.yellow}⚠️  ${name} start timeout reached, proceeding anyway${colors.reset}`);
        log.detail('Server may still be starting in the background');
        resolve(proc);
      }
    }, config.timeouts.serverStart);
    
    // Clear timeout if started
    proc.on('exit', () => clearTimeout(timeoutId));
  });
}

async function waitForServer(url, name) {
  const maxAttempts = Math.floor(config.timeouts.serverStart / config.timeouts.healthCheck);
  let attempt = 0;
  
  startProgress(`Waiting for ${name} to be ready at ${url}...`);
  
  while (attempt < maxAttempts) {
    attempt++;
    
    try {
      await new Promise((resolve, reject) => {
        const urlParts = new URL(url);
        const options = {
          hostname: urlParts.hostname,
          port: urlParts.port,
          path: urlParts.pathname,
          method: 'GET',
          timeout: 5000
        };
        
        const req = http.request(options, (res) => {
          if (res.statusCode >= 200 && res.statusCode < 400) {
            resolve();
          } else {
            reject(new Error(`Status ${res.statusCode}`));
          }
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
        
        req.end();
      });
      
      stopProgress(`${colors.green}✅ ${name} is ready${colors.reset}`);
      return true;
    } catch (err) {
      if (attempt % 5 === 0) {
        stopProgress();
        log.detail(`Still waiting for ${name}... (attempt ${attempt}/${maxAttempts})`);
        startProgress(`Waiting for ${name} to be ready...`);
      }
      
      if (attempt < maxAttempts) {
        await sleep(config.timeouts.healthCheck);
      }
    }
  }
  
  stopProgress();
  throw new Error(`${name} failed to become ready at ${url} after ${maxAttempts} attempts`);
}

// Cleanup with progress
async function cleanup() {
  log.step('Cleaning up');
  
  // Kill all processes
  startProgress('Stopping servers...');
  let count = 0;
  
  for (const [name, proc] of state.processes.entries()) {
    log.detail(`Stopping ${name}...`);
    proc.kill('SIGTERM');
    count++;
  }
  
  if (count > 0) {
    await sleep(config.timeouts.gracefulShutdown);
    
    // Force kill if needed
    for (const [name, proc] of state.processes.entries()) {
      if (!proc.killed) {
        log.warning(`Force killing ${name}...`);
        proc.kill('SIGKILL');
      }
    }
  }
  
  stopProgress(`${colors.green}✅ All processes stopped${colors.reset}`);
  
  // Clean up ports
  if (state.ports.frontend || state.ports.backend) {
    startProgress('Cleaning up ports...');
    if (state.ports.frontend) await killProcessOnPort(state.ports.frontend);
    if (state.ports.backend) await killProcessOnPort(state.ports.backend);
    stopProgress(`${colors.green}✅ Ports cleaned${colors.reset}`);
  }
  
  // Restore backups
  restoreBackups();
  
  // Remove temp files
  startProgress('Removing temporary files...');
  const tempFiles = ['.env.e2e', '.env.e2e.test'];
  for (const file of tempFiles) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  }
  stopProgress(`${colors.green}✅ Cleanup completed${colors.reset}`);
}

// Main test runner with progress
async function runTests() {
  log.step('Running Cypress E2E tests');
  
  const testStart = Date.now();
  let testStats = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  };
  
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
    
    log.detail(`Running: npx ${cypressArgs.join(' ')}`);
    
    const cypress = spawn('npx', cypressArgs, {
      shell: true
    });
    
    state.processes.set('cypress', cypress);
    startProgress('Initializing Cypress...');
    
    let currentTest = '';
    cypress.stdout.on('data', (data) => {
      const output = data.toString();
      
      // Parse test progress
      if (output.includes('Running:')) {
        const match = output.match(/Running:\s+(.+)/);
        if (match) {
          currentTest = match[1];
          stopProgress();
          log.info(`Testing: ${colors.cyan}${currentTest}${colors.reset}`);
          startProgress('Running tests...');
        }
      }
      
      // Parse test results
      if (output.includes('✓')) {
        testStats.passed++;
        testStats.total++;
      }
      
      if (output.includes('Tests:')) {
        stopProgress();
        process.stdout.write(output);
      } else if (output.includes('✓') || output.includes('failing')) {
        // Show test output
        stopProgress();
        process.stdout.write(output);
        startProgress(`Running tests in ${currentTest}...`);
      }
    });
    
    cypress.stderr.on('data', (data) => {
      stopProgress();
      process.stderr.write(data);
    });
    
    cypress.on('exit', (code) => {
      stopProgress();
      state.processes.delete('cypress');
      
      const testDuration = formatDuration(Date.now() - testStart);
      
      if (code === 0) {
        log.success(`All tests passed! (${testDuration})`);
        resolve();
      } else {
        log.error(`Tests failed with exit code ${code} (${testDuration})`);
        reject(new Error(`Cypress exited with code ${code}`));
      }
    });
    
    cypress.on('error', (err) => {
      stopProgress();
      reject(err);
    });
  });
}

// Main execution
async function main() {
  console.log(`
${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════╗
║        AeroSuite Automated E2E Testing            ║
║                                                   ║
║  This will:                                       ║
║  • Find available ports                           ║
║  • Start backend and frontend servers             ║
║  • Run all E2E tests                              ║
║  • Clean up automatically                         ║
╚═══════════════════════════════════════════════════╝${colors.reset}

Starting at: ${new Date().toLocaleTimeString()}
`);
  
  try {
    // Find available ports
    log.step('Finding available ports');
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
    log.step('Updating configurations');
    startProgress('Updating configuration files...');
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
    stopProgress(`${colors.green}✅ Configurations updated${colors.reset}`);
    
    // Start backend
    log.step('Starting backend server');
    await startProcess('backend', 'npm run server:dev', {
      PORT: state.ports.backend,
      NODE_ENV: 'test'
    });
    await waitForServer(
      `http://localhost:${state.ports.backend}/api/health`,
      'Backend API'
    );
    
    // Start frontend
    log.step('Starting frontend server');
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
    const totalDuration = formatDuration(Date.now() - state.startTime);
    
    console.log(`
${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════╗
║                  TEST RESULTS                     ║
╠═══════════════════════════════════════════════════╣${colors.reset}
${colors.bright}║  Status: ${colors.green}✅ PASSED${colors.bright}                               ║
║  Duration: ${totalDuration}                                   ║
║  Frontend Port: ${state.ports.frontend}                          ║
║  Backend Port: ${state.ports.backend}                           ║
${colors.cyan}╚═══════════════════════════════════════════════════╝${colors.reset}
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
  stopProgress();
  log.warning('Interrupted, cleaning up...');
  await cleanup();
  process.exit(1);
});

process.on('SIGTERM', async () => {
  stopProgress();
  log.warning('Terminated, cleaning up...');
  await cleanup();
  process.exit(1);
});

process.on('uncaughtException', async (err) => {
  stopProgress();
  log.error(`Uncaught exception: ${err.message}`);
  console.error(err.stack);
  await cleanup();
  process.exit(1);
});

// Run
main().catch(console.error);