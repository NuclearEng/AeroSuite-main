#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuration for Docker setup
const config = {
  services: {
    mongo: { port: 27017, healthCheck: 'mongo --eval "db.adminCommand(\'ping\')"' },
    redis: { port: 6379, healthCheck: 'redis-cli ping' },
    backend: { port: 9999, healthCheck: 'http://localhost:9999/api/health' },
    frontend: { port: 3000, healthCheck: 'http://localhost:3000' }
  },
  timeouts: {
    dockerStart: 180000, // 3 minutes for all services
    serviceCheck: 5000,
    testExecution: 600000 // 10 minutes for tests
  }
};

// Progress tracking
const progress = {
  startTime: Date.now(),
  currentOperation: '',
  spinner: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  spinnerIndex: 0
};

// Colors and formatting
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

// Get elapsed time
function getElapsedTime() {
  const elapsed = Date.now() - progress.startTime;
  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

// Update progress display
function updateProgress(message) {
  progress.currentOperation = message;
  displayProgress();
}

// Display progress with spinner
function displayProgress() {
  process.stdout.write('\r\x1b[K'); // Clear line
  const spinner = progress.spinner[progress.spinnerIndex];
  progress.spinnerIndex = (progress.spinnerIndex + 1) % progress.spinner.length;
  
  const elapsed = getElapsedTime();
  const status = `${colors.cyan}${spinner}${colors.reset} ${progress.currentOperation} ${colors.dim}[${elapsed}]${colors.reset}`;
  process.stdout.write(status);
}

// Start progress interval
let progressInterval;
function startProgress(message) {
  updateProgress(message);
  progressInterval = setInterval(() => displayProgress(), 100);
}

// Stop progress interval
function stopProgress() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
    process.stdout.write('\r\x1b[K'); // Clear line
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
    console.log(`${colors.green}[${new Date().toISOString()}]${colors.reset} ✅ ${msg} ${colors.dim}[${getElapsedTime()}]${colors.reset}`);
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
    console.log(`${colors.bright}${colors.cyan}🚀 ${msg}${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  },
  detail: (msg) => {
    stopProgress();
    console.log(`   ${colors.dim}→ ${msg}${colors.reset}`);
  }
};

// Execute command with progress
async function execCommand(command, options = {}) {
  const shortCommand = command.split(' ').slice(0, 3).join(' ') + '...';
  if (!options.silent) {
    log.detail(`Executing: ${shortCommand}`);
  }
  
  try {
    const { stdout, stderr } = await execPromise(command, options);
    if (stderr && !options.ignoreStderr) {
      log.warning(`Command stderr: ${stderr}`);
    }
    return { success: true, stdout, stderr };
  } catch (error) {
    return { success: false, error: error.message, stdout: error.stdout, stderr: error.stderr };
  }
}

// Check if Docker is running
async function checkDocker() {
  log.step('Checking Docker installation');
  
  startProgress('Checking Docker version...');
  const dockerCheck = await execCommand('docker --version');
  stopProgress();
  
  if (!dockerCheck.success) {
    throw new Error('Docker is not installed or not running');
  }
  log.success(`Docker is installed: ${dockerCheck.stdout.trim()}`);
  
  startProgress('Checking Docker Compose version...');
  const composeCheck = await execCommand('docker compose version || docker-compose --version');
  stopProgress();
  
  if (!composeCheck.success) {
    throw new Error('Docker Compose is not installed');
  }
  log.success(`Docker Compose is installed: ${composeCheck.stdout.trim()}`);
}

// Check if services are already running
async function checkExistingServices() {
  log.info('Checking for existing services...');
  
  startProgress('Querying Docker services...');
  const result = await execCommand('docker compose ps --format json || docker-compose ps --format json', {
    ignoreStderr: true
  });
  stopProgress();
  
  if (result.success && result.stdout) {
    try {
      const services = result.stdout.split('\n').filter(line => line.trim()).map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean);
      
      const runningServices = services.filter(s => s.State === 'running');
      if (runningServices.length > 0) {
        log.warning(`Found ${runningServices.length} running services`);
        runningServices.forEach(s => {
          log.detail(`${s.Service}: ${s.State}`);
        });
        return true;
      }
    } catch (err) {
      // Fallback to simple check
      const psResult = await execCommand('docker compose ps || docker-compose ps');
      return psResult.stdout && psResult.stdout.includes('Up');
    }
  }
  
  log.info('No existing services found');
  return false;
}

// Build Docker images with progress
async function buildImages(rebuild = false) {
  const startTime = Date.now();
  
  if (rebuild) {
    log.step('Rebuilding Docker images (this may take several minutes)');
    
    // List images to build
    const services = ['aerosuite-server', 'aerosuite-client'];
    
    for (const service of services) {
      const serviceStartTime = Date.now();
      startProgress(`Building ${service} (no cache)...`);
      
      const buildResult = await execCommand(
        `docker compose build --no-cache ${service} || docker-compose build --no-cache ${service}`,
        { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer for build output
      );
      
      stopProgress();
      
      if (!buildResult.success) {
        log.error(`Failed to build ${service}`);
        throw new Error(`Failed to rebuild ${service}`);
      }
      
      const buildTime = Math.round((Date.now() - serviceStartTime) / 1000);
      log.success(`Built ${service} in ${buildTime}s`);
    }
  } else {
    log.step('Building Docker images (using cache if available)');
    
    startProgress('Building all services...');
    const buildResult = await execCommand('docker compose build || docker-compose build', {
      maxBuffer: 10 * 1024 * 1024
    });
    stopProgress();
    
    if (!buildResult.success) {
      throw new Error('Failed to build Docker images');
    }
  }
  
  const totalBuildTime = Math.round((Date.now() - startTime) / 1000);
  log.success(`All images ready (total build time: ${totalBuildTime}s)`);
}

// Start Docker services with detailed progress
async function startServices() {
  log.step('Starting Docker services');
  
  // First, ensure any existing services are stopped
  startProgress('Stopping any existing services...');
  await execCommand('docker compose down || docker-compose down', { ignoreStderr: true });
  stopProgress();
  log.info('Previous services stopped');
  
  // Start services
  startProgress('Starting all services (MongoDB, Redis, Backend, Frontend)...');
  const startResult = await execCommand('docker compose up -d || docker-compose up -d');
  stopProgress();
  
  if (!startResult.success) {
    throw new Error('Failed to start Docker services');
  }
  
  log.success('Docker services started');
  
  // Show running containers
  const psResult = await execCommand('docker compose ps || docker-compose ps');
  if (psResult.success) {
    console.log('\nRunning containers:');
    console.log(psResult.stdout);
  }
  
  // Wait for services to be ready
  await waitForServices();
}

// Wait for all services with detailed progress
async function waitForServices() {
  log.step('Waiting for services to be healthy');
  
  const startTime = Date.now();
  const services = [
    { name: 'MongoDB', port: config.services.mongo.port, check: checkMongoDB },
    { name: 'Redis', port: config.services.redis.port, check: checkRedis },
    { name: 'Backend API', port: config.services.backend.port, check: checkBackendAPI },
    { name: 'Frontend', port: config.services.frontend.port, check: checkFrontend }
  ];
  
  for (const service of services) {
    let isReady = false;
    const serviceStartTime = Date.now();
    let attempts = 0;
    const maxAttempts = Math.floor(config.timeouts.dockerStart / config.timeouts.serviceCheck);
    
    while (!isReady && (Date.now() - startTime) < config.timeouts.dockerStart) {
      attempts++;
      startProgress(`Checking ${service.name} (attempt ${attempts}/${maxAttempts})...`);
      
      try {
        isReady = await service.check();
        if (isReady) {
          stopProgress();
          const checkTime = Math.round((Date.now() - serviceStartTime) / 1000);
          log.success(`${service.name} is ready (took ${checkTime}s)`);
        }
      } catch (err) {
        // Service not ready yet
      }
      
      if (!isReady) {
        await new Promise(resolve => setTimeout(resolve, config.timeouts.serviceCheck));
      }
    }
    
    stopProgress();
    
    if (!isReady) {
      // Try to get logs for debugging
      log.error(`${service.name} failed to become ready`);
      if (service.name === 'Backend API') {
        log.info('Fetching backend logs for debugging...');
        const logsResult = await execCommand('docker compose logs --tail=20 aerosuite-server || docker-compose logs --tail=20 aerosuite-server');
        if (logsResult.success) {
          console.log(logsResult.stdout);
        }
      }
      throw new Error(`${service.name} failed to become ready after ${attempts} attempts`);
    }
  }
  
  const totalTime = Math.round((Date.now() - startTime) / 1000);
  log.success(`All services are healthy! (total time: ${totalTime}s)`);
}

// Service health checks
async function checkMongoDB() {
  const result = await execCommand('docker compose exec -T mongo mongo --eval "db.adminCommand(\'ping\')" || docker-compose exec -T mongo mongo --eval "db.adminCommand(\'ping\')"', { silent: true });
  return result.success;
}

async function checkRedis() {
  const result = await execCommand('docker compose exec -T redis redis-cli ping || docker-compose exec -T redis redis-cli ping', { silent: true });
  return result.success && result.stdout.includes('PONG');
}

async function checkBackendAPI() {
  const result = await execCommand('curl -f -s http://localhost:9999/health || curl -f -s http://localhost:9999/api/health', { silent: true });
  return result.success;
}

async function checkFrontend() {
  const result = await execCommand('curl -f -s -o /dev/null -w "%{http_code}" http://localhost:3000', { silent: true });
  return result.success && result.stdout.trim() === '200';
}

// Update Cypress configuration
async function updateCypressConfig() {
  log.step('Updating Cypress configuration');
  
  startProgress('Backing up and updating Cypress config...');
  
  const configPath = 'cypress.config.js';
  const backupPath = `${configPath}.docker-backup`;
  
  // Backup original config
  if (fs.existsSync(configPath)) {
    fs.copyFileSync(configPath, backupPath);
  }
  
  // Update config with Docker ports
  let content = fs.readFileSync(configPath, 'utf8');
  content = content.replace(
    /(baseUrl\s*:\s*['"`])https?:\/\/localhost:\d+(['"`])/,
    `$1http://localhost:${config.services.frontend.port}$2`
  );
  content = content.replace(
    /(apiUrl\s*:\s*['"`])https?:\/\/localhost:\d+(['"`])/,
    `$1http://localhost:${config.services.backend.port}$2`
  );
  
  fs.writeFileSync(configPath, content);
  stopProgress();
  
  log.success('Updated Cypress configuration for Docker environment');
}

// Run Cypress tests with progress
async function runTests() {
  log.step('Running E2E tests');
  
  const testStartTime = Date.now();
  let testCount = 0;
  let passedTests = 0;
  let failedTests = 0;
  
  return new Promise((resolve, reject) => {
    const cypressProcess = spawn('npx', [
      'cypress', 'run',
      '--e2e',
      '--headless',
      '--config',
      `baseUrl=http://localhost:${config.services.frontend.port}`,
      '--env',
      `apiUrl=http://localhost:${config.services.backend.port}`
    ], {
      shell: true
    });
    
    startProgress('Running Cypress tests...');
    
    // Capture and parse output
    cypressProcess.stdout.on('data', (data) => {
      const output = data.toString();
      
      // Update progress based on test output
      if (output.includes('Running:')) {
        const match = output.match(/Running:\s+(.+)/);
        if (match) {
          updateProgress(`Testing: ${match[1]}`);
        }
      }
      
      // Count tests
      if (output.includes('✓')) {
        passedTests++;
        testCount++;
      }
      if (output.includes('failing')) {
        const match = output.match(/(\d+)\s+failing/);
        if (match) {
          failedTests = parseInt(match[1]);
          testCount += failedTests;
        }
      }
      
      // Show important output
      if (output.includes('✓') || output.includes('failing') || output.includes('Tests:')) {
        stopProgress();
        process.stdout.write(output);
        if (!output.includes('Tests:')) {
          startProgress('Running Cypress tests...');
        }
      }
    });
    
    cypressProcess.stderr.on('data', (data) => {
      stopProgress();
      process.stderr.write(data);
    });
    
    cypressProcess.on('exit', (code) => {
      stopProgress();
      const testTime = Math.round((Date.now() - testStartTime) / 1000);
      
      if (code === 0) {
        log.success(`All ${testCount} tests passed in ${testTime}s!`);
        resolve();
      } else {
        log.error(`Tests completed with failures: ${passedTests} passed, ${failedTests} failed (${testTime}s)`);
        reject(new Error(`Cypress tests failed with exit code ${code}`));
      }
    });
    
    cypressProcess.on('error', (err) => {
      stopProgress();
      reject(err);
    });
  });
}

// View Docker logs
async function showLogs(service) {
  log.info(`Showing recent logs for ${service}...`);
  await execCommand(`docker compose logs --tail=50 ${service} || docker-compose logs --tail=50 ${service}`, {
    stdio: 'inherit'
  });
}

// Cleanup
async function cleanup(keepRunning = false) {
  log.step('Cleaning up');
  
  // Restore Cypress config
  startProgress('Restoring configuration files...');
  const backupPath = 'cypress.config.js.docker-backup';
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, 'cypress.config.js');
    fs.unlinkSync(backupPath);
  }
  stopProgress();
  log.success('Restored Cypress configuration');
  
  if (!keepRunning) {
    startProgress('Stopping Docker services...');
    await execCommand('docker compose down || docker-compose down', { ignoreStderr: true });
    stopProgress();
    log.success('Docker services stopped');
  } else {
    log.info('Keeping Docker services running (use "docker compose down" to stop)');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const rebuild = args.includes('--rebuild');
  const keepRunning = args.includes('--keep-running');
  const showDockerLogs = args.includes('--logs');
  
  console.log(`
${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════╗
║      AeroSuite Docker E2E Test Runner             ║
║                                                   ║
║  This will:                                       ║
║  • Check Docker installation                      ║
║  • Build/rebuild Docker images                    ║
║  • Start all services (MongoDB, Redis, etc.)      ║
║  • Wait for services to be healthy                ║
║  • Run E2E tests against Docker environment       ║
║  • Clean up when finished                         ║
╚═══════════════════════════════════════════════════╝${colors.reset}

Options:
  ${rebuild ? colors.green : colors.dim}--rebuild       Force rebuild all Docker images${colors.reset}
  ${keepRunning ? colors.green : colors.dim}--keep-running  Keep services running after tests${colors.reset}
  ${showDockerLogs ? colors.green : colors.dim}--logs          Show Docker logs on failure${colors.reset}

Starting time: ${new Date().toLocaleTimeString()}
`);
  
  try {
    // Check Docker
    await checkDocker();
    
    // Check for existing services
    const hasExisting = await checkExistingServices();
    if (hasExisting && !rebuild) {
      log.warning('Services may already be running. Use --rebuild to force rebuild.');
    }
    
    // Build images
    await buildImages(rebuild);
    
    // Start services
    await startServices();
    
    // Update Cypress config
    await updateCypressConfig();
    
    // Run tests
    await runTests();
    
    log.success('All E2E tests passed! 🎉');
    
  } catch (error) {
    log.error(`Test execution failed: ${error.message}`);
    
    if (showDockerLogs) {
      console.log('\n--- Docker Service Logs ---');
      await showLogs('aerosuite-server');
      await showLogs('aerosuite-client');
    }
    
    process.exitCode = 1;
  } finally {
    await cleanup(keepRunning);
  }
  
  const totalTime = Math.round((Date.now() - progress.startTime) / 1000);
  const minutes = Math.floor(totalTime / 60);
  const seconds = totalTime % 60;
  
  console.log(`
${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════╗
║                  TEST SUMMARY                     ║
╠═══════════════════════════════════════════════════╣${colors.reset}
${colors.bright}║  Status: ${process.exitCode === 0 ? colors.green + '✅ PASSED' : colors.red + '❌ FAILED'}                               ${colors.bright}║
║  Total Duration: ${minutes}m ${seconds}s                            ║
║  Frontend: http://localhost:3000                  ║
║  Backend: http://localhost:9999                   ║
║  MongoDB: localhost:27017                         ║
║  Redis: localhost:6379                            ║
${colors.cyan}╚═══════════════════════════════════════════════════╝${colors.reset}
`);
}

// Error handlers
process.on('SIGINT', async () => {
  stopProgress();
  log.warning('Interrupted, cleaning up...');
  await cleanup(false);
  process.exit(1);
});

// Run
main().catch(console.error);