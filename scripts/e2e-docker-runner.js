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

const log = {
  info: (msg) => console.log(`[${new Date().toISOString()}] ℹ️  ${msg}`),
  success: (msg) => console.log(`[${new Date().toISOString()}] ✅ ${msg}`),
  error: (msg) => console.error(`[${new Date().toISOString()}] ❌ ${msg}`),
  warning: (msg) => console.warn(`[${new Date().toISOString()}] ⚠️  ${msg}`),
  step: (msg) => console.log(`\n[${new Date().toISOString()}] 🚀 ${msg}\n`)
};

// Execute command and return output
async function execCommand(command, options = {}) {
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
  log.step('Checking Docker installation...');
  
  const dockerCheck = await execCommand('docker --version');
  if (!dockerCheck.success) {
    throw new Error('Docker is not installed or not running');
  }
  log.success(`Docker is installed: ${dockerCheck.stdout.trim()}`);
  
  const composeCheck = await execCommand('docker compose version || docker-compose --version');
  if (!composeCheck.success) {
    throw new Error('Docker Compose is not installed');
  }
  log.success(`Docker Compose is installed: ${composeCheck.stdout.trim()}`);
}

// Check if services are already running
async function checkExistingServices() {
  log.info('Checking for existing services...');
  
  const result = await execCommand('docker compose ps --format json || docker-compose ps --format json', {
    ignoreStderr: true
  });
  
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
        return true;
      }
    } catch (err) {
      // Fallback to simple check
      const psResult = await execCommand('docker compose ps || docker-compose ps');
      return psResult.stdout && psResult.stdout.includes('Up');
    }
  }
  
  return false;
}

// Build Docker images
async function buildImages(rebuild = false) {
  if (rebuild) {
    log.step('Rebuilding Docker images...');
    
    const buildResult = await execCommand('docker compose build --no-cache || docker-compose build --no-cache', {
      stdio: 'inherit'
    });
    
    if (!buildResult.success) {
      throw new Error('Failed to rebuild Docker images');
    }
    log.success('Docker images rebuilt successfully');
  } else {
    log.step('Building Docker images (if needed)...');
    
    const buildResult = await execCommand('docker compose build || docker-compose build');
    
    if (!buildResult.success) {
      throw new Error('Failed to build Docker images');
    }
    log.success('Docker images are ready');
  }
}

// Start Docker services
async function startServices() {
  log.step('Starting Docker services...');
  
  // First, ensure any existing services are stopped
  await execCommand('docker compose down || docker-compose down', { ignoreStderr: true });
  
  // Start services
  const startResult = await execCommand('docker compose up -d || docker-compose up -d');
  
  if (!startResult.success) {
    throw new Error('Failed to start Docker services');
  }
  
  log.success('Docker services started');
  
  // Wait for services to be ready
  await waitForServices();
}

// Wait for all services to be healthy
async function waitForServices() {
  log.step('Waiting for services to be healthy...');
  
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
    
    while (!isReady && (Date.now() - startTime) < config.timeouts.dockerStart) {
      try {
        isReady = await service.check();
        if (isReady) {
          log.success(`${service.name} is ready (took ${Math.round((Date.now() - serviceStartTime) / 1000)}s)`);
        }
      } catch (err) {
        // Service not ready yet
      }
      
      if (!isReady) {
        await new Promise(resolve => setTimeout(resolve, config.timeouts.serviceCheck));
      }
    }
    
    if (!isReady) {
      throw new Error(`${service.name} failed to become ready`);
    }
  }
  
  log.success('All services are healthy!');
}

// Service health checks
async function checkMongoDB() {
  const result = await execCommand('docker compose exec -T mongo mongo --eval "db.adminCommand(\'ping\')" || docker-compose exec -T mongo mongo --eval "db.adminCommand(\'ping\')"');
  return result.success;
}

async function checkRedis() {
  const result = await execCommand('docker compose exec -T redis redis-cli ping || docker-compose exec -T redis redis-cli ping');
  return result.success && result.stdout.includes('PONG');
}

async function checkBackendAPI() {
  const result = await execCommand('curl -f -s http://localhost:9999/health || curl -f -s http://localhost:9999/api/health');
  return result.success;
}

async function checkFrontend() {
  const result = await execCommand('curl -f -s -o /dev/null -w "%{http_code}" http://localhost:3000');
  return result.success && result.stdout.trim() === '200';
}

// Update Cypress configuration for Docker
async function updateCypressConfig() {
  log.step('Updating Cypress configuration for Docker...');
  
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
  log.success('Updated Cypress configuration for Docker environment');
}

// Run Cypress tests
async function runTests() {
  log.step('Running E2E tests against Docker environment...');
  
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
    
    cypressProcess.on('error', reject);
  });
}

// View Docker logs
async function showLogs(service) {
  log.info(`Showing logs for ${service}...`);
  await execCommand(`docker compose logs --tail=50 ${service} || docker-compose logs --tail=50 ${service}`, {
    stdio: 'inherit'
  });
}

// Cleanup
async function cleanup(keepRunning = false) {
  log.step('Cleaning up...');
  
  // Restore Cypress config
  const backupPath = 'cypress.config.js.docker-backup';
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, 'cypress.config.js');
    fs.unlinkSync(backupPath);
    log.success('Restored Cypress configuration');
  }
  
  if (!keepRunning) {
    log.info('Stopping Docker services...');
    await execCommand('docker compose down || docker-compose down', { ignoreStderr: true });
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
╔═══════════════════════════════════════════════════╗
║      AeroSuite Docker E2E Test Runner             ║
║                                                   ║
║  This will:                                       ║
║  • Check Docker installation                      ║
║  • Build/rebuild Docker images                    ║
║  • Start all services (MongoDB, Redis, etc.)      ║
║  • Wait for services to be healthy                ║
║  • Run E2E tests against Docker environment       ║
║  • Clean up when finished                         ║
╚═══════════════════════════════════════════════════╝

Options:
  --rebuild       Force rebuild all Docker images
  --keep-running  Keep services running after tests
  --logs          Show Docker logs on failure
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
  
  const duration = Math.round((Date.now() - startTime) / 1000);
  console.log(`
╔═══════════════════════════════════════════════════╗
║                  TEST SUMMARY                     ║
╠═══════════════════════════════════════════════════╣
║  Status: ${process.exitCode === 0 ? '✅ PASSED' : '❌ FAILED'}                               ║
║  Duration: ${duration}s                                    ║
║  Frontend: http://localhost:3000                  ║
║  Backend: http://localhost:9999                   ║
║  MongoDB: localhost:27017                         ║
║  Redis: localhost:6379                            ║
╚═══════════════════════════════════════════════════╝
`);
}

// Error handlers
process.on('SIGINT', async () => {
  log.warning('Interrupted, cleaning up...');
  await cleanup(false);
  process.exit(1);
});

// Track start time
const startTime = Date.now();

// Run
main().catch(console.error);