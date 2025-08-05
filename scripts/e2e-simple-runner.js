#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');

console.log(`
╔═══════════════════════════════════════════════════╗
║     AeroSuite Simple E2E Test Runner              ║
╚═══════════════════════════════════════════════════╝
`);

// Simple configuration - uses default ports
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;
const BACKEND_PORT = process.env.BACKEND_PORT || 5000;

let backendProcess = null;
let frontendProcess = null;
let testProcess = null;

// Helper to run command
function runCommand(name, command, env = {}) {
  console.log(`\n🚀 Starting ${name}...`);
  console.log(`   Command: ${command}`);
  
  const [cmd, ...args] = command.split(' ');
  const proc = spawn(cmd, args, {
    env: { ...process.env, ...env },
    stdio: 'inherit',
    shell: true
  });
  
  proc.on('error', (err) => {
    console.error(`❌ Failed to start ${name}: ${err.message}`);
  });
  
  return proc;
}

// Cleanup function
async function cleanup() {
  console.log('\n🧹 Cleaning up...');
  
  const processes = [
    { name: 'tests', proc: testProcess },
    { name: 'frontend', proc: frontendProcess },
    { name: 'backend', proc: backendProcess }
  ];
  
  for (const { name, proc } of processes) {
    if (proc && !proc.killed) {
      console.log(`   Stopping ${name}...`);
      proc.kill('SIGTERM');
    }
  }
  
  // Give processes time to shut down gracefully
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Force kill if needed
  for (const { proc } of processes) {
    if (proc && !proc.killed) {
      proc.kill('SIGKILL');
    }
  }
  
  console.log('✅ Cleanup complete\n');
}

// Main function
async function main() {
  try {
    // Create temporary env file
    const envContent = `
PORT=${FRONTEND_PORT}
REACT_APP_API_URL=http://localhost:${BACKEND_PORT}
SERVER_PORT=${BACKEND_PORT}
NODE_ENV=test
BROWSER=none
`;
    fs.writeFileSync('.env.test', envContent.trim());
    
    // Start backend
    backendProcess = runCommand('Backend Server', 'npm run server:dev', {
      PORT: BACKEND_PORT,
      NODE_ENV: 'test'
    });
    
    // Wait a bit for backend to start
    console.log('⏳ Waiting for backend to initialize...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Start frontend
    frontendProcess = runCommand('Frontend Server', 'npm start', {
      PORT: FRONTEND_PORT,
      REACT_APP_API_URL: `http://localhost:${BACKEND_PORT}`,
      BROWSER: 'none',
      NODE_ENV: 'test'
    });
    
    // Wait for frontend to start
    console.log('⏳ Waiting for frontend to compile...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Run tests
    console.log('\n🧪 Running E2E tests...\n');
    
    testProcess = spawn('npx', [
      'cypress', 'run',
      '--e2e',
      '--headless',
      '--config',
      `baseUrl=http://localhost:${FRONTEND_PORT}`,
      '--env',
      `apiUrl=http://localhost:${BACKEND_PORT}`
    ], {
      stdio: 'inherit',
      shell: true
    });
    
    // Wait for tests to complete
    await new Promise((resolve, reject) => {
      testProcess.on('exit', (code) => {
        if (code === 0) {
          console.log('\n✅ All tests passed!');
          resolve();
        } else {
          console.log(`\n❌ Tests failed with exit code ${code}`);
          reject(new Error('Tests failed'));
        }
      });
      
      testProcess.on('error', (err) => {
        console.error(`\n❌ Test error: ${err.message}`);
        reject(err);
      });
    });
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await cleanup();
    
    // Remove temp env file
    if (fs.existsSync('.env.test')) {
      fs.unlinkSync('.env.test');
    }
  }
}

// Handle interrupts
process.on('SIGINT', async () => {
  console.log('\n⚠️  Interrupted by user');
  await cleanup();
  process.exit(1);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Terminated');
  await cleanup();
  process.exit(1);
});

// Run
main().catch(console.error);