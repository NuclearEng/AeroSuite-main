const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Docker health check task
function checkDockerHealth() {
  try {
    // Check if Docker is running
    execSync('docker info', { stdio: 'pipe' });
    
    // Check if docker-compose is available
    execSync('docker-compose --version', { stdio: 'pipe' });
    
    return true;
  } catch (error) {
    console.error('Docker health check failed:', error.message);
    return false;
  }
}

// Get container status
function getContainerStatus() {
  try {
    const output = execSync('docker ps --format "table {{.Names}}\t{{.Status}}\t{{.HealthStatus}}"', { encoding: 'utf8' });
    const lines = output.trim().split('\n').slice(1); // Skip header
    
    const containers = {};
    lines.forEach(line => {
      const [name, status, health] = line.split('\t');
      containers[name] = {
        state: status.includes('Up') ? 'running' : 'stopped',
        health: health && health !== 'none' ? { status: health } : null
      };
    });
    
    return containers;
  } catch (error) {
    console.error('Failed to get container status:', error.message);
    return {};
  }
}

// Get container resource usage
function getContainerResources() {
  try {
    const output = execSync('docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"', { encoding: 'utf8' });
    const lines = output.trim().split('\n').slice(1);
    
    const resources = {};
    lines.forEach(line => {
      const [name, cpu, memory] = line.split('\t');
      const cpuPercent = parseFloat(cpu.replace('%', ''));
      const memoryMB = parseFloat(memory.split('/')[0].replace('MiB', '').trim());
      
      resources[name] = {
        cpu: cpuPercent,
        memory: memoryMB
      };
    });
    
    return resources;
  } catch (error) {
    console.error('Failed to get container resources:', error.message);
    return {};
  }
}

// Get container ports
function getContainerPorts() {
  try {
    const output = execSync('docker ps --format "table {{.Names}}\t{{.Ports}}"', { encoding: 'utf8' });
    const lines = output.trim().split('\n').slice(1);
    
    const ports = {};
    lines.forEach(line => {
      const [name, portMapping] = line.split('\t');
      if (portMapping && portMapping !== '') {
        const portList = portMapping.split(',').map(p => {
          const match = p.match(/:(\d+)->/);
          return match ? parseInt(match[1]) : null;
        }).filter(p => p !== null);
        ports[name] = portList;
      }
    });
    
    return ports;
  } catch (error) {
    console.error('Failed to get container ports:', error.message);
    return {};
  }
}

// Get container users
function getContainerUsers() {
  try {
    const containers = ['aerosuite-client', 'aerosuite-server', 'mongo', 'redis'];
    const users = {};
    
    containers.forEach(container => {
      try {
        const output = execSync(`docker exec ${container} whoami`, { encoding: 'utf8' });
        users[container] = output.trim();
      } catch (error) {
        users[container] = 'unknown';
      }
    });
    
    return users;
  } catch (error) {
    console.error('Failed to get container users:', error.message);
    return {};
  }
}

// Get image versions
function getImageVersions() {
  try {
    const output = execSync('docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}"', { encoding: 'utf8' });
    const lines = output.trim().split('\n').slice(1);
    
    const images = {};
    lines.forEach(line => {
      const [repository, tag, createdAt] = line.split('\t');
      const name = `${repository}:${tag}`;
      images[name] = {
        tag,
        created: new Date(createdAt).getTime()
      };
    });
    
    return images;
  } catch (error) {
    console.error('Failed to get image versions:', error.message);
    return {};
  }
}

// Get container capabilities
function getContainerCapabilities() {
  try {
    const containers = ['aerosuite-client', 'aerosuite-server'];
    const capabilities = {};
    
    containers.forEach(container => {
      try {
        const output = execSync(`docker inspect ${container} --format='{{.HostConfig.CapAdd}}'`, { encoding: 'utf8' });
        const caps = output.trim() === '<no value>' ? [] : output.trim().split(',');
        capabilities[container] = caps;
      } catch (error) {
        capabilities[container] = [];
      }
    });
    
    return capabilities;
  } catch (error) {
    console.error('Failed to get container capabilities:', error.message);
    return {};
  }
}

// Get container startup times
function getContainerStartupTimes() {
  try {
    const output = execSync('docker ps --format "table {{.Names}}\t{{.CreatedAt}}"', { encoding: 'utf8' });
    const lines = output.trim().split('\n').slice(1);
    
    const startupTimes = {};
    lines.forEach(line => {
      const [name, createdAt] = line.split('\t');
      const startTime = new Date(createdAt).getTime();
      const currentTime = Date.now();
      startupTimes[name] = currentTime - startTime;
    });
    
    return startupTimes;
  } catch (error) {
    console.error('Failed to get container startup times:', error.message);
    return {};
  }
}

// Get build times
function getBuildTimes() {
  try {
    // This would need to be implemented with build history tracking
    // For now, return estimated times based on image complexity
    return {
      'aerosuite-client': 120000, // 2 minutes
      'aerosuite-server': 180000  // 3 minutes
    };
  } catch (error) {
    console.error('Failed to get build times:', error.message);
    return {};
  }
}

// Get image sizes
function getImageSizes() {
  try {
    const output = execSync('docker images --format "table {{.Repository}}\t{{.Size}}"', { encoding: 'utf8' });
    const lines = output.trim().split('\n').slice(1);
    
    const sizes = {};
    lines.forEach(line => {
      const [repository, size] = line.split('\t');
      const sizeMB = parseFloat(size.replace('MB', '').replace('GB', '000'));
      sizes[repository] = sizeMB;
    });
    
    return sizes;
  } catch (error) {
    console.error('Failed to get image sizes:', error.message);
    return {};
  }
}

// Get container logs
function getContainerLogs() {
  try {
    const containers = ['aerosuite-client', 'aerosuite-server', 'mongo', 'redis'];
    const logs = {};
    
    containers.forEach(container => {
      try {
        const output = execSync(`docker logs ${container} --tail 10`, { encoding: 'utf8' });
        logs[container] = output.trim();
      } catch (error) {
        logs[container] = 'No logs available';
      }
    });
    
    return logs;
  } catch (error) {
    console.error('Failed to get container logs:', error.message);
    return {};
  }
}

// Get restart policies
function getRestartPolicies() {
  try {
    const containers = ['aerosuite-client', 'aerosuite-server', 'mongo', 'redis'];
    const policies = {};
    
    containers.forEach(container => {
      try {
        const output = execSync(`docker inspect ${container} --format='{{.HostConfig.RestartPolicy.Name}}'`, { encoding: 'utf8' });
        policies[container] = output.trim();
      } catch (error) {
        policies[container] = 'unknown';
      }
    });
    
    return policies;
  } catch (error) {
    console.error('Failed to get restart policies:', error.message);
    return {};
  }
}

// Get health check status
function getHealthCheckStatus() {
  try {
    const output = execSync('docker ps --format "table {{.Names}}\t{{.Status}}"', { encoding: 'utf8' });
    const lines = output.trim().split('\n').slice(1);
    
    const healthChecks = {};
    lines.forEach(line => {
      const [name, status] = line.split('\t');
      if (status.includes('healthy')) {
        healthChecks[name] = 'healthy';
      } else if (status.includes('unhealthy')) {
        healthChecks[name] = 'unhealthy';
      } else {
        healthChecks[name] = 'no-health-check';
      }
    });
    
    return healthChecks;
  } catch (error) {
    console.error('Failed to get health check status:', error.message);
    return {};
  }
}

// Check Docker Desktop features
function checkDockerDesktopFeatures() {
  try {
    // Check if Docker Desktop is running
    const isRunning = execSync('docker info', { stdio: 'pipe' }).toString().includes('Docker Desktop');
    
    return {
      dashboard: isRunning,
      terminal: isRunning,
      scout: isRunning
    };
  } catch (error) {
    return {
      dashboard: false,
      terminal: false,
      scout: false
    };
  }
}

// Run Docker Scout scan
function runDockerScoutScan() {
  try {
    // This would require Docker Scout to be installed and configured
    // For now, return mock data
    return {
      vulnerabilities: 2,
      critical: 0,
      high: 1,
      medium: 1,
      low: 0
    };
  } catch (error) {
    console.error('Failed to run Docker Scout scan:', error.message);
    return {
      vulnerabilities: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
  }
}

// Get resource metrics
function getResourceMetrics() {
  try {
    const output = execSync('docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.BlockIO}}"', { encoding: 'utf8' });
    const lines = output.trim().split('\n').slice(1);
    
    const metrics = {};
    lines.forEach(line => {
      const [name, cpu, memory, disk] = line.split('\t');
      const cpuPercent = parseFloat(cpu.replace('%', ''));
      const memoryMB = parseFloat(memory.split('/')[0].replace('MiB', '').trim());
      const diskMB = parseFloat(disk.split('/')[0].replace('MB', '').trim());
      
      metrics[name] = {
        cpu: cpuPercent,
        memory: memoryMB,
        disk: diskMB
      };
    });
    
    return metrics;
  } catch (error) {
    console.error('Failed to get resource metrics:', error.message);
    return {};
  }
}

module.exports = {
  checkDockerHealth,
  getContainerStatus,
  getContainerResources,
  getContainerPorts,
  getContainerUsers,
  getImageVersions,
  getContainerCapabilities,
  getContainerStartupTimes,
  getBuildTimes,
  getImageSizes,
  getContainerLogs,
  getRestartPolicies,
  getHealthCheckStatus,
  checkDockerDesktopFeatures,
  runDockerScoutScan,
  getResourceMetrics
}; 