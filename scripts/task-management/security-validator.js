#!/usr/bin/env node

/**
 * Security Task Validator for AeroSuite
 * 
 * This script analyzes the task.md file for:
 * 1. Missing security controls
 * 2. Compliance readiness
 * 3. Security verification coverage
 */

const fs = require('fs');
const path = require('path');

// Configuration
const TASK_FILE_PATH = path.join(process.cwd(), 'task.md');
const OUTPUT_FILE_PATH = path.join(process.cwd(), 'security-compliance-report.md');

// Required security controls by category
const REQUIRED_SECURITY_CONTROLS = {
  ACCESS_CONTROL: [
    'Zero Trust Security Architecture',
    'Authorization',
    'Authentication',
    'Role-based Access Control',
    'Multi-factor Authentication',
    'Session Management',
    'API Authentication'
  ],
  DATA_PROTECTION: [
    'Data Encryption at Rest',
    'End-to-End Encryption',
    'Encryption in Transit',
    'Key Management',
    'Data Classification',
    'Data Backup & Recovery',
    'Secure Data Deletion'
  ],
  MONITORING: [
    'Security Information Event Management',
    'Threat Detection',
    'Intrusion Detection',
    'Alerting',
    'Audit Logging',
    'User Activity Monitoring'
  ],
  VULNERABILITY_MGMT: [
    'Automated Vulnerability Scanning',
    'Third-party Dependency Security Audit',
    'Penetration Testing',
    'Security Headers',
    'Code Security Analysis',
    'Patch Management',
    'Incident Response'
  ],
  COMPLIANCE: [
    'SOC 2 Compliance Framework',
    'GDPR Compliance Framework',
    'ISO 27001 Compliance',
    'Security Policy Documentation',
    'User Security Training'
  ]
};

// Compliance standards and their required controls
const COMPLIANCE_REQUIREMENTS = {
  'SOC 2': [
    'Security Information Event Management',
    'Audit Logging',
    'Access Control',
    'Data Encryption',
    'Incident Response',
    'Vulnerability Management'
  ],
  'GDPR': [
    'Data Classification',
    'Data Encryption',
    'Right to be Forgotten',
    'User Consent Management',
    'Data Breach Notification'
  ],
  'ISO 27001': [
    'Risk Assessment',
    'Security Policy',
    'Asset Management',
    'Access Control',
    'Cryptography',
    'Physical Security',
    'Operations Security'
  ]
};

// Main function
async function validateSecurityTasks() {
  try {
    console.log('Reading task file...');
    const content = fs.readFileSync(TASK_FILE_PATH, 'utf8');
    
    // Extract tasks
    const tasks = extractTasks(content);
    
    // Filter security-related tasks
    const securityTasks = filterSecurityTasks(tasks);
    
    // Analyze security controls
    const securityAnalysis = analyzeSecurityControls(securityTasks);
    
    // Check compliance readiness
    const complianceAnalysis = analyzeComplianceReadiness(securityTasks);
    
    // Check verification coverage
    const verificationAnalysis = analyzeVerificationCoverage(securityTasks);
    
    // Generate analysis report
    const report = generateReport(securityTasks, securityAnalysis, complianceAnalysis, verificationAnalysis);
    
    // Write report to file
    fs.writeFileSync(OUTPUT_FILE_PATH, report, 'utf8');
    
    // Log summary
    console.log(`
Security analysis complete! Results written to ${OUTPUT_FILE_PATH}

Summary:
- ${securityTasks.length} security-related tasks found
- ${securityAnalysis.missingControls.length} missing security controls
- ${complianceAnalysis.readinessPercentage}% overall compliance readiness
- ${verificationAnalysis.missingVerification.length} security tasks lack verification
`);
    
  } catch (error) {
    console.error('Error validating security tasks:', error);
    process.exit(1);
  }
}

// Extract tasks from content
function extractTasks(content) {
  const tasks = [];
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Only process table rows
    if (line.startsWith('|') && line.includes('|')) {
      // Skip table headers and dividers
      if (line.includes('ID') || line.includes('------')) continue;
      
      const task = parseTaskRow(line);
      if (task) {
        tasks.push(task);
      }
    }
  }
  
  return tasks;
}

// Parse a task row from the table
function parseTaskRow(line) {
  const parts = line.split('|').map(part => part.trim());
  
  if (parts.length < 7) return null;
  
  // Skip header rows and divider rows
  if (parts[1] === 'ID' || parts[1].includes('-----')) return null;
  
  return {
    id: parts[1],
    title: parts[2],
    status: parts[3],
    priority: parts[4],
    dependencies: parseDependencies(parts[5]),
    loc: parts[6],
    verification: parts.length > 7 ? parts[7] : null
  };
}

// Parse dependencies field
function parseDependencies(dependenciesStr) {
  if (dependenciesStr === '-' || !dependenciesStr) return [];
  
  // Handle comma-separated dependencies
  return dependenciesStr.split(',').map(dep => dep.trim()).filter(Boolean);
}

// Filter security-related tasks
function filterSecurityTasks(tasks) {
  return tasks.filter(task => {
    // Check ID prefix
    if (task.id.startsWith('SEC')) return true;
    
    // Check for security-related keywords in title
    const securityKeywords = [
      'security', 'authentication', 'authorization', 'encrypt', 'compliance', 
      'vulnerability', 'threat', 'intrusion', 'audit', 'access control'
    ];
    
    return securityKeywords.some(keyword => 
      task.title.toLowerCase().includes(keyword)
    );
  });
}

// Analyze security controls
function analyzeSecurityControls(securityTasks) {
  const implementedControls = new Set();
  
  // Find implemented controls
  for (const task of securityTasks) {
    for (const category in REQUIRED_SECURITY_CONTROLS) {
      for (const control of REQUIRED_SECURITY_CONTROLS[category]) {
        if (task.title.includes(control)) {
          implementedControls.add(control);
        }
      }
    }
  }
  
  // Find missing controls
  const missingControls = [];
  for (const category in REQUIRED_SECURITY_CONTROLS) {
    for (const control of REQUIRED_SECURITY_CONTROLS[category]) {
      if (!implementedControls.has(control)) {
        missingControls.push({ category, control });
      }
    }
  }
  
  // Calculate coverage percentage
  const totalControls = Object.values(REQUIRED_SECURITY_CONTROLS)
    .reduce((sum, controls) => sum + controls.length, 0);
  
  const coveragePercentage = Math.round((implementedControls.size / totalControls) * 100);
  
  return { 
    implementedControls: Array.from(implementedControls),
    missingControls,
    coveragePercentage
  };
}

// Analyze compliance readiness
function analyzeComplianceReadiness(securityTasks) {
  const results = {};
  
  // Analyze each compliance standard
  for (const standard in COMPLIANCE_REQUIREMENTS) {
    const requiredControls = COMPLIANCE_REQUIREMENTS[standard];
    const implementedControls = [];
    
    for (const control of requiredControls) {
      const isImplemented = securityTasks.some(task => 
        task.title.includes(control) && task.status.includes('Completed')
      );
      
      if (isImplemented) {
        implementedControls.push(control);
      }
    }
    
    const readinessPercentage = Math.round((implementedControls.length / requiredControls.length) * 100);
    
    results[standard] = {
      requiredControls,
      implementedControls,
      readinessPercentage
    };
  }
  
  // Calculate overall readiness
  const totalRequired = Object.values(COMPLIANCE_REQUIREMENTS)
    .reduce((sum, controls) => sum + controls.length, 0);
  
  const totalImplemented = Object.values(results)
    .reduce((sum, { implementedControls }) => sum + implementedControls.length, 0);
  
  const readinessPercentage = Math.round((totalImplemented / totalRequired) * 100);
  
  return { standards: results, readinessPercentage };
}

// Analyze verification coverage
function analyzeVerificationCoverage(securityTasks) {
  const tasksWithVerification = [];
  const missingVerification = [];
  
  for (const task of securityTasks) {
    if (task.verification) {
      tasksWithVerification.push(task);
    } else {
      missingVerification.push(task);
    }
  }
  
  const coveragePercentage = Math.round((tasksWithVerification.length / securityTasks.length) * 100);
  
  return { tasksWithVerification, missingVerification, coveragePercentage };
}

// Generate analysis report
function generateReport(securityTasks, securityAnalysis, complianceAnalysis, verificationAnalysis) {
  let report = `# Security & Compliance Analysis Report

## Summary

- **Security Tasks**: ${securityTasks.length}
- **Security Control Coverage**: ${securityAnalysis.coveragePercentage}%
- **Compliance Readiness**: ${complianceAnalysis.readinessPercentage}%
- **Verification Coverage**: ${verificationAnalysis.coveragePercentage}%

## Security Controls Analysis

`;

  // Add security controls by category
  for (const category in REQUIRED_SECURITY_CONTROLS) {
    const displayCategory = category.replace('_', ' ');
    report += `### ${displayCategory}\n\n`;
    
    const controls = REQUIRED_SECURITY_CONTROLS[category];
    const implemented = controls.filter(c => securityAnalysis.implementedControls.includes(c));
    const missing = controls.filter(c => !securityAnalysis.implementedControls.includes(c));
    
    const categoryPercentage = Math.round((implemented.length / controls.length) * 100);
    report += `Coverage: ${categoryPercentage}%\n\n`;
    
    report += "Implemented Requirements:\n";
    if (implemented.length === 0) {
      report += "- None\n";
    } else {
      for (const control of implemented) {
        report += `- ✅ ${control}\n`;
      }
    }
    
    report += "\nMissing Requirements:\n";
    if (missing.length === 0) {
      report += "- None\n";
    } else {
      for (const control of missing) {
        report += `- ❌ ${control}\n`;
      }
    }
    
    report += "\n";
  }
  
  report += `## Compliance Readiness

`;

  // Add compliance readiness by standard
  for (const standard in complianceAnalysis.standards) {
    const standardData = complianceAnalysis.standards[standard];
    report += `### ${standard}\n\n`;
    report += `Readiness: ${standardData.readinessPercentage}%\n\n`;
    
    report += "Implemented Controls:\n";
    if (standardData.implementedControls.length === 0) {
      report += "- None\n";
    } else {
      for (const control of standardData.implementedControls) {
        report += `- ✅ ${control}\n`;
      }
    }
    
    report += "\nMissing Controls:\n";
    const missingControls = standardData.requiredControls.filter(
      c => !standardData.implementedControls.includes(c)
    );
    
    if (missingControls.length === 0) {
      report += "- None\n";
    } else {
      for (const control of missingControls) {
        report += `- ❌ ${control}\n`;
      }
    }
    
    report += "\n";
  }
  
  report += `## Security Tasks

| ID | Title | Status | Verification Method |
|----|-------|--------|---------------------|
`;

  // Add security tasks
  for (const task of securityTasks) {
    const verification = task.verification || 'N/A';
    report += `| ${task.id} | ${task.title} | ${task.status} | ${verification} |\n`;
  }
  
  report += `\n## Recommendations

### Missing Security Controls

The following security controls should be added to the task list:

`;

  for (const { category, control } of securityAnalysis.missingControls) {
    report += `- Add task for "${control}" (${category})\n`;
  }
  
  report += `
### Verification Methods

The following security tasks need verification methods:

`;

  for (const task of verificationAnalysis.missingVerification) {
    report += `- Add verification method for ${task.id}: ${task.title}\n`;
  }
  
  report += `
### Compliance Readiness Plan

To improve compliance readiness:

1. Prioritize implementing missing controls for SOC 2 compliance
2. Document security policies and procedures
3. Implement regular security testing and validation
4. Set up ongoing compliance monitoring

## Next Steps

1. Run \`node scripts/task-management/task-creator.js\` to create tasks for missing security controls
2. Update existing security tasks with verification methods
3. Schedule regular compliance reviews
`;

  return report;
}

// Run the main function
validateSecurityTasks(); 