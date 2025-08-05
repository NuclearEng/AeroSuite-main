/**
 * Node.js Memory Monitor Script
 * 
 * This script monitors memory usage of the Node.js process during development
 * and can be used to identify memory leaks and performance issues.
 * 
 * Usage:
 * 1. Run alongside your development server:
 *    `node memory-monitor.js`
 * 
 * 2. Or run with a specific process ID:
 *    `node memory-monitor.js --pid=1234`
 * 
 * 3. To monitor a process with a specific command:
 *    `node memory-monitor.js --command="npm run start"`
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const MONITOR_INTERVAL_MS = 5000; // Check every 5 seconds
const LOG_FILE = path.join(__dirname, 'memory-usage.log');
const HEAP_DUMP_DIR = path.join(__dirname, 'heap-dumps');
const HEAP_USAGE_THRESHOLD = 80; // Percentage

// Parse command line arguments
const args = process.argv.slice(2);
let targetPid = null;
let command = null;

args.forEach(arg => {
  if (arg.startsWith('--pid=')) {
    targetPid = parseInt(arg.split('=')[1], 10);
  } else if (arg.startsWith('--command=')) {
    command = arg.split('=')[1];
  }
});

// Ensure heap dump directory exists
if (!fs.existsSync(HEAP_DUMP_DIR)) {
  fs.mkdirSync(HEAP_DUMP_DIR, { recursive: true });
}

// Clear previous log
fs.writeFileSync(LOG_FILE, '=== Memory Monitor Started ===\n');

// Log function with timestamp
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

// Format bytes to human-readable format
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Get process info by PID
function getProcessInfo(pid) {
  try {
    // Different commands based on platform
    let cmd;
    if (process.platform === 'win32') {
      cmd = `powershell "Get-Process -Id ${pid} | Select-Object NPM,PM,WS,CPU,Id,ProcessName | ConvertTo-Csv -NoTypeInformation"`;
    } else {
      cmd = `ps -p ${pid} -o pid,ppid,rss,vsz,pcpu,pmem,command`;
    }
    
    const output = execSync(cmd, { encoding: 'utf-8' });
    return { output, error: null };
  } catch (error) {
    return { output: null, error: error.message };
  }
}

// Get Node.js specific memory info
function getNodeMemoryInfo(pid) {
  try {
    const content = fs.readFileSync(`/proc/${pid}/status`, 'utf-8');
    const memoryInfo = {};
    
    content.split('\n').forEach(line => {
      if (line.includes('VmRSS') || line.includes('VmSize') || line.includes('VmPeak')) {
        const [key, value] = line.split(':').map(part => part.trim());
        memoryInfo[key] = value;
      }
    });
    
    return { info: memoryInfo, error: null };
  } catch (error) {
    // Not available on all platforms
    return { info: null, error: error.message };
  }
}

// Take heap snapshot (requires heapdump module)
function takeHeapSnapshot(pid) {
  try {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const heapDumpPath = path.join(HEAP_DUMP_DIR, `heapdump-${pid}-${timestamp}.heapsnapshot`);
    
    // This requires the heapdump module to be installed in the target process
    // You would need to add require('heapdump'); to your main app file
    log(`Attempting to take heap snapshot: ${heapDumpPath}`);
    
    // For external trigger (won't work for all setups)
    try {
      execSync(`kill -USR2 ${pid}`);
      log(`Sent SIGUSR2 signal to process ${pid} for heap dump`);
    } catch (error) {
      log(`Failed to trigger heap dump via signal: ${error.message}`);
    }
    
    return heapDumpPath;
  } catch (error) {
    log(`Error taking heap snapshot: ${error.message}`);
    return null;
  }
}

// Get system memory info
function getSystemMemoryInfo() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = (usedMem / totalMem) * 100;
  
  return {
    total: formatBytes(totalMem),
    free: formatBytes(freeMem),
    used: formatBytes(usedMem),
    usagePercent: memUsagePercent.toFixed(2) + '%'
  };
}

// Start command if provided
let childProcess = null;
if (command) {
  log(`Starting command: ${command}`);
  
  // Split command into program and arguments
  const parts = command.split(' ');
  const program = parts[0];
  const args = parts.slice(1);
  
  childProcess = spawn(program, args, {
    stdio: 'inherit',
    shell: true
  });
  
  targetPid = childProcess.pid;
  
  log(`Started process with PID: ${targetPid}`);
  
  childProcess.on('error', (error) => {
    log(`Error starting process: ${error.message}`);
    process.exit(1);
  });
  
  childProcess.on('exit', (code, signal) => {
    log(`Process exited with code ${code} and signal ${signal}`);
    process.exit(0);
  });
}

// Main monitoring function
function monitorMemory() {
  if (!targetPid) {
    log('No target PID specified. Use --pid=<pid> or --command="<command>"');
    process.exit(1);
  }
  
  // Check if process exists
  const { output, error } = getProcessInfo(targetPid);
  if (error) {
    log(`Error: Process with PID ${targetPid} not found or not accessible`);
    process.exit(1);
  }
  
  // Log system memory
  const systemMemory = getSystemMemoryInfo();
  log(`System Memory: Total: ${systemMemory.total}, Used: ${systemMemory.used} (${systemMemory.usagePercent})`);
  
  // Log process info
  log(`Process Info (PID ${targetPid}):`);
  log(output);
  
  // Try to get Node.js specific memory info
  const { info: nodeMemoryInfo } = getNodeMemoryInfo(targetPid);
  if (nodeMemoryInfo) {
    log('Node.js Memory Info:');
    Object.entries(nodeMemoryInfo).forEach(([key, value]) => {
      log(`  ${key}: ${value}`);
    });
  }
  
  // Check for high memory usage
  const memoryLines = output.split('\n');
  const memoryLine = memoryLines.length > 1 ? memoryLines[1] : memoryLines[0];
  const memoryParts = memoryLine.trim().split(/\s+/);
  
  // Try to extract RSS (resident set size) - format depends on platform
  let rss = 0;
  if (process.platform === 'win32') {
    // Windows (PowerShell) format - needs parsing from CSV
    if (memoryParts.length > 2) {
      rss = parseInt(memoryParts[1], 10) * 1024; // Convert KB to Bytes
    }
  } else {
    // Unix format - 3rd column is typically RSS in KB
    if (memoryParts.length > 2) {
      rss = parseInt(memoryParts[2], 10) * 1024; // Convert KB to Bytes
    }
  }
  
  // Calculate memory usage percentage based on system total
  const memUsagePercent = (rss / os.totalmem()) * 100;
  log(`Process Memory Usage: ${formatBytes(rss)} (${memUsagePercent.toFixed(2)}% of system total)`);
  
  // Take heap snapshot if memory usage is high
  if (memUsagePercent > HEAP_USAGE_THRESHOLD) {
    log(`WARNING: High memory usage detected (${memUsagePercent.toFixed(2)}%)!`);
    takeHeapSnapshot(targetPid);
  }
  
  // Log separator for readability
  log('----------------------------------------');
}

// Start monitoring
log(`Starting memory monitor for process ${targetPid || 'to be started'}`);
log(`Monitoring interval: ${MONITOR_INTERVAL_MS}ms`);
log(`Log file: ${LOG_FILE}`);
log(`Heap dump directory: ${HEAP_DUMP_DIR}`);

// Initial check
monitorMemory();

// Set up interval for continuous monitoring
const monitorInterval = setInterval(monitorMemory, MONITOR_INTERVAL_MS);

// Handle exit
process.on('SIGINT', () => {
  log('Memory monitor stopped by user');
  clearInterval(monitorInterval);
  
  if (childProcess) {
    childProcess.kill();
    log(`Terminated monitored process ${targetPid}`);
  }
  
  process.exit(0);
});

// Log startup success
log('Memory monitor running. Press Ctrl+C to stop.'); 