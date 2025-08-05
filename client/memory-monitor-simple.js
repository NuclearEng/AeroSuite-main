/**
 * Simple Memory Monitor Script
 * This script provides basic memory monitoring for Node.js processes
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const MEMORY_LOG_FILE = './memory-usage.log';
const MEMORY_CHECK_INTERVAL = 10000; // 10 seconds
const MEMORY_WARNING_THRESHOLD_MB = 1024; // 1GB
const MEMORY_CRITICAL_THRESHOLD_MB = 1536; // 1.5GB

// Ensure log file directory exists
const logDir = path.dirname(MEMORY_LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Clear previous log
fs.writeFileSync(MEMORY_LOG_FILE, `Memory Monitoring Started: ${new Date().toISOString()}\n`);

// Format memory size to human-readable format
function formatMemorySize(bytes) {
  return `${Math.round(bytes / 1024 / 1024)} MB`;
}

// Log memory usage
function logMemoryUsage() {
  const memoryUsage = process.memoryUsage();
  
  // Calculate total memory being used
  const totalMemoryMB = Math.round(memoryUsage.rss / 1024 / 1024);
  const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
  const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  const externalMB = Math.round((memoryUsage.external || 0) / 1024 / 1024);
  
  // Create log message
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] Memory Usage:\n` +
    `  RSS: ${formatMemorySize(memoryUsage.rss)} (Total process memory)\n` +
    `  Heap Total: ${formatMemorySize(memoryUsage.heapTotal)} (V8 heap allocated)\n` +
    `  Heap Used: ${formatMemorySize(memoryUsage.heapUsed)} (V8 heap used)\n` +
    `  External: ${formatMemorySize(memoryUsage.external || 0)} (C++ objects bound to JS)\n` +
    `  Array Buffers: ${formatMemorySize(memoryUsage.arrayBuffers || 0)}\n`;
  
  // Log to file
  fs.appendFileSync(MEMORY_LOG_FILE, logMessage);
  
  // Check for warning thresholds
  if (heapUsedMB > MEMORY_WARNING_THRESHOLD_MB) {
    console.warn(`\n⚠️ WARNING: Heap memory usage high: ${heapUsedMB} MB`);
    
    if (heapUsedMB > MEMORY_CRITICAL_THRESHOLD_MB) {
      console.error(`\n🔥 CRITICAL: Heap memory usage critical: ${heapUsedMB} MB`);
      console.error('Consider running with DISABLE_TYPECHECKING=true or increasing NODE_OPTIONS');
    }
  }
  
  // Output to console
  console.log(`Memory: RSS=${formatMemorySize(memoryUsage.rss)}, Heap=${formatMemorySize(memoryUsage.heapUsed)}/${formatMemorySize(memoryUsage.heapTotal)}`);
}

// Monitor memory usage at regular intervals
const memoryMonitorInterval = setInterval(logMemoryUsage, MEMORY_CHECK_INTERVAL);

// Start React app
console.log('Starting React application with memory monitoring...');
const reactApp = spawn('npm', ['run', 'start:optimized'], { 
  stdio: 'inherit',
  shell: true
});

// Handle process exit
reactApp.on('close', (code) => {
  clearInterval(memoryMonitorInterval);
  console.log(`React app process exited with code ${code}`);
  process.exit(code);
});

// Handle process errors
reactApp.on('error', (err) => {
  clearInterval(memoryMonitorInterval);
  console.error('Failed to start React app:', err);
  process.exit(1);
});

// Log initial memory usage
logMemoryUsage();

// Handle termination signals
process.on('SIGINT', () => {
  clearInterval(memoryMonitorInterval);
  console.log('Memory monitoring stopped');
  process.exit(0);
});

console.log(`Memory monitoring active. Logs saved to ${MEMORY_LOG_FILE}`);

// Export for use in other scripts
module.exports = {
  formatMemorySize
}; 