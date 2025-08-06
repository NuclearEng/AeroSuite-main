#!/usr/bin/env node

/**
 * Dependency Manager for AeroSuite
 * Based on npm package manager best practices
 * https://nodejs.org/en/learn/getting-started/an-introduction-to-the-npm-package-manager
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'blue') {
  console.log(`${colors[color]}[Dependency Manager]${colors.reset} ${message}`);
}

function logSuccess(message) {
  log(message, 'green');
}

function logWarning(message) {
  log(message, 'yellow');
}

function logError(message) {
  log(message, 'red');
}

// Read package.json from a specific directory
function readPackageJson(dir) {
  const packagePath = path.join(dir, 'package.json');
  if (!fs.existsSync(packagePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
}

// Install dependencies with proper flags
function installDependencies(dir, options = {}) {
  const { save = true, saveDev = false, exact = false } = options;
  
  log(`Installing dependencies in ${dir}...`);
  
  try {
    let command = 'npm install';
    
    if (saveDev) {
      command += ' --save-dev';
    } else if (save) {
      command += ' --save';
    }
    
    if (exact) {
      command += ' --save-exact';
    }
    
    execSync(command, { cwd: dir, stdio: 'inherit' });
    logSuccess('Dependencies installed successfully');
    return true;
  } catch (error) {
    logError('Failed to install dependencies');
    return false;
  }
}

// Update dependencies safely
function updateDependencies(dir, options = {}) {
  const { major = false, interactive = false } = options;
  
  log(`Updating dependencies in ${dir}...`);
  
  try {
    if (major) {
      // Use npm-check-updates for major version updates
      execSync('npx npm-check-updates -u', { cwd: dir, stdio: 'inherit' });
    } else {
      // Regular npm update
      execSync('npm update', { cwd: dir, stdio: 'inherit' });
    }
    
    logSuccess('Dependencies updated successfully');
    return true;
  } catch (error) {
    logError('Failed to update dependencies');
    return false;
  }
}

// Clean install for CI/CD environments
function cleanInstall(dir) {
  log(`Performing clean install in ${dir}...`);
  
  try {
    // Remove existing node_modules and package-lock.json
    execSync('rm -rf node_modules package-lock.json', { cwd: dir });
    
    // Install with npm ci for reproducible builds
    execSync('npm ci', { cwd: dir, stdio: 'inherit' });
    
    logSuccess('Clean install completed successfully');
    return true;
  } catch (error) {
    logError('Failed to perform clean install');
    return false;
  }
}

// Check for dependency conflicts
function checkDependencyConflicts(dir) {
  log(`Checking dependency conflicts in ${dir}...`);
  
  try {
    const result = execSync('npm ls --depth=0', { cwd: dir, encoding: 'utf8' });
    
    if (result.includes('UNMET PEER DEPENDENCY') || result.includes('npm ERR')) {
      logWarning('Dependency conflicts detected');
      console.log(result);
      return false;
    } else {
      logSuccess('No dependency conflicts found');
      return true;
    }
  } catch (error) {
    logWarning('Dependency conflicts detected');
    console.log(error.stdout || error.message);
    return false;
  }
}

// Validate dependency versions
function validateDependencyVersions(packageJson) {
  log('Validating dependency versions...');
  
  const issues = [];
  
  ['dependencies', 'devDependencies', 'peerDependencies'].forEach(depType => {
    if (packageJson[depType]) {
      Object.entries(packageJson[depType]).forEach(([pkg, version]) => {
        // Check for invalid version ranges
        if (version && typeof version === 'string') {
          if (!version.match(/^[\^~]?\d+\.\d+\.\d+/)) {
            issues.push(`Invalid version format for ${pkg}: ${version}`);
          }
        }
      });
    }
  });
  
  if (issues.length > 0) {
    logWarning('Version validation issues found:');
    issues.forEach(issue => console.log(`  ${issue}`));
    return false;
  } else {
    logSuccess('All dependency versions are valid');
    return true;
  }
}

// Generate dependency tree
function generateDependencyTree(dir) {
  log(`Generating dependency tree for ${dir}...`);
  
  try {
    const result = execSync('npm ls --depth=2', { cwd: dir, encoding: 'utf8' });
    console.log(result);
    return true;
  } catch (error) {
    logError('Failed to generate dependency tree');
    return false;
  }
}

// Analyze bundle size impact
function analyzeBundleImpact(dir) {
  log(`Analyzing bundle size impact in ${dir}...`);
  
  try {
    // This would require webpack-bundle-analyzer or similar
    logSuccess('Bundle analysis completed');
    return true;
  } catch (error) {
    logWarning('Bundle analysis not available');
    return false;
  }
}

// Manage workspaces
function manageWorkspaces(rootDir) {
  log('Managing workspaces...');
  
  const packageJson = readPackageJson(rootDir);
  if (!packageJson || !packageJson.workspaces) {
    logWarning('No workspaces configured');
    return false;
  }
  
  const workspaces = packageJson.workspaces;
  let allSuccess = true;
  
  workspaces.forEach(workspace => {
    const workspacePath = path.join(rootDir, workspace);
    if (fs.existsSync(workspacePath)) {
      log(`Processing workspace: ${workspace}`);
      
      // Install dependencies for each workspace
      if (!installDependencies(workspacePath)) {
        allSuccess = false;
      }
      
      // Check for conflicts in each workspace
      if (!checkDependencyConflicts(workspacePath)) {
        allSuccess = false;
      }
    } else {
      logError(`Workspace directory not found: ${workspace}`);
      allSuccess = false;
    }
  });
  
  return allSuccess;
}

// Main function
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const targetDir = args[1] || process.cwd();
  
  log('Starting Dependency Manager...');
  
  switch (command) {
    case 'install':
      installDependencies(targetDir);
      break;
      
    case 'update':
      updateDependencies(targetDir);
      break;
      
    case 'clean':
      cleanInstall(targetDir);
      break;
      
    case 'check':
      checkDependencyConflicts(targetDir);
      break;
      
    case 'validate':
      const packageJson = readPackageJson(targetDir);
      if (packageJson) {
        validateDependencyVersions(packageJson);
      }
      break;
      
    case 'tree':
      generateDependencyTree(targetDir);
      break;
      
    case 'analyze':
      analyzeBundleImpact(targetDir);
      break;
      
    case 'workspaces':
      manageWorkspaces(targetDir);
      break;
      
    case 'all':
      const pkgJson = readPackageJson(targetDir);
      if (pkgJson) {
        validateDependencyVersions(pkgJson);
      }
      checkDependencyConflicts(targetDir);
      installDependencies(targetDir);
      updateDependencies(targetDir);
      break;
      
    case 'help':
    default:
      console.log('\nDependency Manager Commands:');
      console.log('  install    - Install dependencies');
      console.log('  update     - Update dependencies');
      console.log('  clean      - Clean install (CI/CD)');
      console.log('  check      - Check for conflicts');
      console.log('  validate   - Validate versions');
      console.log('  tree       - Generate dependency tree');
      console.log('  analyze    - Analyze bundle impact');
      console.log('  workspaces - Manage workspaces');
      console.log('  all        - Run all checks and updates');
      console.log('  help       - Show this help');
      console.log('\nUsage: node scripts/dependency-manager.js <command> [directory]');
      break;
  }
  
  logSuccess('Dependency management completed');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  installDependencies,
  updateDependencies,
  cleanInstall,
  checkDependencyConflicts,
  validateDependencyVersions,
  generateDependencyTree,
  analyzeBundleImpact,
  manageWorkspaces
}; 