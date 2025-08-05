#!/usr/bin/env node

/**
 * Security scan script for dependency vulnerability monitoring
 * 
 * This script:
 * 1. Runs npm audit in client and server directories
 * 2. Parses the output to extract vulnerability information
 * 3. Generates a report with vulnerability details
 * 4. Can be integrated into CI/CD pipeline for automated checks
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const DIRECTORIES = ['client', 'server'];
const REPORT_PATH = path.join(__dirname, '..', 'security-reports');
const SEVERITY_LEVELS = ['info', 'low', 'moderate', 'high', 'critical'];
const MAX_ALLOWED_SEVERITY = process.env.MAX_ALLOWED_SEVERITY || 'moderate';
const IGNORE_DEV_DEPENDENCIES = process.env.IGNORE_DEV_DEPENDENCIES === 'true';

// Ensure report directory exists
if (!fs.existsSync(REPORT_PATH)) {
  fs.mkdirSync(REPORT_PATH, { recursive: true });
}

// Get current timestamp for report filename
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const reportFile = path.join(REPORT_PATH, `vulnerability-report-${timestamp}.json`);
const summaryFile = path.join(REPORT_PATH, `vulnerability-summary-${timestamp}.txt`);

console.log('🔍 Starting dependency vulnerability scan...');

const vulnerabilityResults = {};
let exitCode = 0;

/**
 * Run npm audit in a directory and return parsed results
 */
function scanDirectory(directory) {
  const fullPath = path.join(__dirname, '..', directory);
  
  // Check if directory exists and has package.json
  if (!fs.existsSync(path.join(fullPath, 'package.json'))) {
    console.log(`⚠️ Skipping ${directory}: No package.json found`);
    return { error: 'No package.json found' };
  }
  
  try {
    console.log(`\n📦 Scanning dependencies in ${directory}...`);
    
    // Build the audit command with appropriate flags
    let auditCommand = 'npm audit --json';
    if (IGNORE_DEV_DEPENDENCIES) {
      auditCommand += ' --production';
    }
    
    // Run npm audit and capture JSON output
    const auditOutput = execSync(auditCommand, { 
      cwd: fullPath,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    const auditResult = JSON.parse(auditOutput);
    
    // Process the results
    const vulnerabilities = {};
    let totalVulnerabilities = 0;
    let criticalVulnerabilities = 0;
    
    // Extract vulnerabilities by severity
    SEVERITY_LEVELS.forEach(severity => {
      if (auditResult.metadata && auditResult.metadata.vulnerabilities) {
        const count = auditResult.metadata.vulnerabilities[severity] || 0;
        vulnerabilities[severity] = count;
        totalVulnerabilities += count;
        
        if (SEVERITY_LEVELS.indexOf(severity) >= SEVERITY_LEVELS.indexOf(MAX_ALLOWED_SEVERITY)) {
          criticalVulnerabilities += count;
        }
      }
    });
    
    // Extract advisories details
    const advisories = auditResult.advisories || {};
    const advisoryDetails = Object.values(advisories).map(advisory => ({
      id: advisory.id,
      title: advisory.title,
      severity: advisory.severity,
      url: advisory.url,
      vulnerable_versions: advisory.vulnerable_versions,
      recommendation: advisory.recommendation
    }));
    
    return {
      vulnerabilities,
      totalVulnerabilities,
      criticalVulnerabilities,
      advisoryDetails,
      auditResult
    };
  } catch (error) {
    // Check if the error output is JSON (npm audit still returns JSON on vulnerabilities)
    try {
      const errorOutput = error.stdout.toString();
      const auditResult = JSON.parse(errorOutput);
      
      // Process the results similar to the success case
      const vulnerabilities = {};
      let totalVulnerabilities = 0;
      let criticalVulnerabilities = 0;
      
      SEVERITY_LEVELS.forEach(severity => {
        if (auditResult.metadata && auditResult.metadata.vulnerabilities) {
          const count = auditResult.metadata.vulnerabilities[severity] || 0;
          vulnerabilities[severity] = count;
          totalVulnerabilities += count;
          
          if (SEVERITY_LEVELS.indexOf(severity) >= SEVERITY_LEVELS.indexOf(MAX_ALLOWED_SEVERITY)) {
            criticalVulnerabilities += count;
          }
        }
      });
      
      const advisories = auditResult.advisories || {};
      const advisoryDetails = Object.values(advisories).map(advisory => ({
        id: advisory.id,
        title: advisory.title,
        severity: advisory.severity,
        url: advisory.url,
        vulnerable_versions: advisory.vulnerable_versions,
        recommendation: advisory.recommendation
      }));
      
      return {
        vulnerabilities,
        totalVulnerabilities,
        criticalVulnerabilities,
        advisoryDetails,
        auditResult
      };
    } catch (parseError) {
      console.error(`❌ Error scanning ${directory}:`, error.message);
      return { error: error.message };
    }
  }
}

// Scan each directory
DIRECTORIES.forEach(directory => {
  vulnerabilityResults[directory] = scanDirectory(directory);
  
  // Update exit code if critical vulnerabilities found
  if (vulnerabilityResults[directory].criticalVulnerabilities > 0) {
    exitCode = 1;
  }
});

// Generate summary report
let summary = '# Dependency Vulnerability Scan Summary\n\n';
summary += `Date: ${new Date().toISOString()}\n\n`;

let totalCriticalVulnerabilities = 0;
let totalAllVulnerabilities = 0;

Object.keys(vulnerabilityResults).forEach(directory => {
  const result = vulnerabilityResults[directory];
  
  summary += `## ${directory}\n\n`;
  
  if (result.error) {
    summary += `Error: ${result.error}\n\n`;
    return;
  }
  
  // Add vulnerability counts
  summary += 'Vulnerabilities by severity:\n\n';
  SEVERITY_LEVELS.forEach(severity => {
    const count = result.vulnerabilities[severity] || 0;
    summary += `- ${severity}: ${count}\n`;
  });
  
  summary += `\nTotal vulnerabilities: ${result.totalVulnerabilities}\n`;
  summary += `Critical vulnerabilities (${MAX_ALLOWED_SEVERITY} or higher): ${result.criticalVulnerabilities}\n\n`;
  
  totalCriticalVulnerabilities += result.criticalVulnerabilities;
  totalAllVulnerabilities += result.totalVulnerabilities;
  
  // Add advisories for critical vulnerabilities
  if (result.advisoryDetails && result.advisoryDetails.length > 0) {
    summary += 'Advisory details:\n\n';
    
    result.advisoryDetails
      .filter(advisory => SEVERITY_LEVELS.indexOf(advisory.severity) >= SEVERITY_LEVELS.indexOf(MAX_ALLOWED_SEVERITY))
      .forEach(advisory => {
        summary += `### ${advisory.title} (${advisory.severity})\n\n`;
        summary += `- ID: ${advisory.id}\n`;
        summary += `- Vulnerable Versions: ${advisory.vulnerable_versions}\n`;
        summary += `- Recommendation: ${advisory.recommendation}\n`;
        summary += `- More info: ${advisory.url}\n\n`;
      });
  }
});

// Add overall summary
summary += '## Overall Summary\n\n';
summary += `Total vulnerabilities across all projects: ${totalAllVulnerabilities}\n`;
summary += `Total critical vulnerabilities (${MAX_ALLOWED_SEVERITY} or higher): ${totalCriticalVulnerabilities}\n\n`;

if (totalCriticalVulnerabilities > 0) {
  summary += `⚠️ ALERT: ${totalCriticalVulnerabilities} critical vulnerabilities found. Action required!\n`;
} else if (totalAllVulnerabilities > 0) {
  summary += `⚠️ NOTICE: ${totalAllVulnerabilities} non-critical vulnerabilities found. Consider addressing them in future updates.\n`;
} else {
  summary += '✅ SUCCESS: No vulnerabilities found!\n';
}

// Save the reports
fs.writeFileSync(reportFile, JSON.stringify(vulnerabilityResults, null, 2));
fs.writeFileSync(summaryFile, summary);

console.log(`\n📝 Full report saved to: ${reportFile}`);
console.log(`📝 Summary report saved to: ${summaryFile}`);

if (totalCriticalVulnerabilities > 0) {
  console.log(`\n❌ FAILED: ${totalCriticalVulnerabilities} critical vulnerabilities found.`);
} else {
  console.log(`\n✅ PASSED: No critical vulnerabilities found.`);
}

// Exit with appropriate code for CI/CD pipeline integration
process.exit(exitCode); 