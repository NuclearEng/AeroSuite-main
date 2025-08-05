/**
 * Technical Debt Tracking & Management System
 * Task: TS453 - Technical Debt Tracking & Management
 * 
 * This script provides tools for tracking, measuring, and managing technical debt
 * throughout the codebase. It analyzes code quality, identifies debt items,
 * prioritizes them, and generates reports for debt management.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  // Directory where technical debt reports are stored
  reportsDir: path.join(__dirname, '../../reports/technical-debt'),
  
  // File patterns to analyze
  includePatterns: [
    '**/*.js',
    '**/*.jsx',
    '**/*.ts',
    '**/*.tsx',
    '**/*.java',
    '**/*.py'
  ],
  
  // Directories/files to exclude
  excludePatterns: [
    '**/node_modules/**',
    '**/build/**',
    '**/dist/**',
    '**/coverage/**',
    '**/.git/**'
  ],
  
  // Technical debt markers in code comments
  debtMarkers: [
    'TODO',
    'FIXME',
    'HACK',
    'XXX',
    'DEBT',
    'REFACTOR',
    'OPTIMIZE',
    'BUG',
    'TECH-DEBT'
  ],
  
  // Maximum allowed technical debt score
  maxAllowedDebtScore: 500,
  
  // Severity levels for debt items
  severityLevels: {
    CRITICAL: 100,
    HIGH: 50,
    MEDIUM: 20,
    LOW: 5
  }
};

// Ensure the reports directory exists
if (!fs.existsSync(CONFIG.reportsDir)) {
  fs.mkdirSync(CONFIG.reportsDir, { recursive: true });
}

/**
 * Technical Debt Item class
 */
class DebtItem {
  constructor(file, line, marker, description, severity, author, date) {
    this.file = file;
    this.line = line;
    this.marker = marker;
    this.description = description;
    this.severity = severity || 'MEDIUM';
    this.author = author;
    this.date = date || new Date().toISOString();
    this.score = this.calculateScore();
  }
  
  calculateScore() {
    const baseSeverityScore = CONFIG.severityLevels[this.severity] || CONFIG.severityLevels.MEDIUM;
    
    // Adjust score based on markers (some markers indicate higher priority)
    let markerMultiplier = 1;
    if (this.marker === 'FIXME' || this.marker === 'BUG') {
      markerMultiplier = 1.5;
    } else if (this.marker === 'HACK') {
      markerMultiplier = 1.3;
    }
    
    return Math.round(baseSeverityScore * markerMultiplier);
  }
  
  toJSON() {
    return {
      file: this.file,
      line: this.line,
      marker: this.marker,
      description: this.description,
      severity: this.severity,
      author: this.author,
      date: this.date,
      score: this.score
    };
  }
}

/**
 * Find debt markers in source code
 * @param {string} sourceDir - Directory to scan
 * @returns {Array<DebtItem>} List of debt items
 */
function findDebtMarkers(sourceDir) {
  const debtItems = [];
  
  console.log(`Scanning for technical debt in ${sourceDir}...`);
  
  try {
    // Build grep patterns for debt markers
    const markerPattern = CONFIG.debtMarkers.join('|');
    
    // Build find command to locate relevant files
    const includeArgs = CONFIG.includePatterns.map(pattern => `-name "${pattern}"`).join(' -o ');
    const excludeArgs = CONFIG.excludePatterns.map(pattern => `-not -path "${pattern}"`).join(' ');
    
    const findCommand = `find ${sourceDir} \\( ${includeArgs} \\) ${excludeArgs}`;
    
    // Execute find command to get list of files
    const files = execSync(findCommand, { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean);
    
    console.log(`Found ${files.length} files to scan for technical debt.`);
    
    // Scan each file for debt markers
    files.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, lineIndex) => {
          // Check for debt markers
          CONFIG.debtMarkers.forEach(marker => {
            const markerPattern = new RegExp(`(?://|#|<!--|/\\*|\\*) *${marker}:? *(.*?)(?:\\*/|-->)?$`);
            const match = line.match(markerPattern);
            
            if (match) {
              const description = match[1].trim();
              
              // Extract severity if specified in format [SEVERITY]
              let severity = 'MEDIUM';
              const severityMatch = description.match(/^\[(CRITICAL|HIGH|MEDIUM|LOW)\] (.*)/);
              let cleanDescription = description;
              
              if (severityMatch) {
                severity = severityMatch[1];
                cleanDescription = severityMatch[2].trim();
              }
              
              // Extract author if using format (@author)
              let author = 'Unknown';
              const authorMatch = cleanDescription.match(/@([a-zA-Z0-9._-]+)/);
              
              if (authorMatch) {
                author = authorMatch[1];
                cleanDescription = cleanDescription.replace(authorMatch[0], '').trim();
              }
              
              // Create debt item
              const relativeFilePath = path.relative(sourceDir, file);
              const debtItem = new DebtItem(
                relativeFilePath,
                lineIndex + 1,
                marker,
                cleanDescription,
                severity,
                author
              );
              
              debtItems.push(debtItem);
            }
          });
        });
      } catch (err) {
        console.error(`Error scanning file ${file}: ${err.message}`);
      }
    });
    
    console.log(`Found ${debtItems.length} technical debt items.`);
    return debtItems;
  } catch (err) {
    console.error(`Error scanning for technical debt: ${err.message}`);
    return [];
  }
}

/**
 * Generate a technical debt report
 * @param {Array<DebtItem>} debtItems - List of debt items
 * @returns {Object} Report object
 */
function generateDebtReport(debtItems) {
  // Calculate overall metrics
  const totalItems = debtItems.length;
  const totalScore = debtItems.reduce((sum, item) => sum + item.score, 0);
  
  // Group by severity
  const bySeverity = {
    CRITICAL: debtItems.filter(item => item.severity === 'CRITICAL'),
    HIGH: debtItems.filter(item => item.severity === 'HIGH'),
    MEDIUM: debtItems.filter(item => item.severity === 'MEDIUM'),
    LOW: debtItems.filter(item => item.severity === 'LOW')
  };
  
  // Group by marker type
  const byMarker = {};
  CONFIG.debtMarkers.forEach(marker => {
    byMarker[marker] = debtItems.filter(item => item.marker === marker);
  });
  
  // Group by file
  const byFile = {};
  debtItems.forEach(item => {
    if (!byFile[item.file]) {
      byFile[item.file] = [];
    }
    byFile[item.file].push(item);
  });
  
  // Sort files by debt score
  const fileRanking = Object.entries(byFile)
    .map(([file, items]) => ({
      file,
      items: items.length,
      score: items.reduce((sum, item) => sum + item.score, 0)
    }))
    .sort((a, b) => b.score - a.score);
  
  // Calculate health status
  let healthStatus = 'GOOD';
  if (totalScore > CONFIG.maxAllowedDebtScore * 0.8) {
    healthStatus = 'CRITICAL';
  } else if (totalScore > CONFIG.maxAllowedDebtScore * 0.5) {
    healthStatus = 'WARNING';
  } else if (totalScore > CONFIG.maxAllowedDebtScore * 0.2) {
    healthStatus = 'MODERATE';
  }
  
  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalItems,
      totalScore,
      healthStatus,
      bySeverity: {
        CRITICAL: bySeverity.CRITICAL.length,
        HIGH: bySeverity.HIGH.length,
        MEDIUM: bySeverity.MEDIUM.length,
        LOW: bySeverity.LOW.length
      }
    },
    topIssues: debtItems
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(item => item.toJSON()),
    fileRanking: fileRanking.slice(0, 20),
    allItems: debtItems.map(item => item.toJSON())
  };
}

/**
 * Save debt report to file
 * @param {Object} report - Debt report
 * @param {string} filename - Output filename
 */
function saveDebtReport(report, filename) {
  const reportPath = path.join(CONFIG.reportsDir, filename);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Technical debt report saved to ${reportPath}`);
  
  // Also generate a markdown summary
  const markdownPath = path.join(CONFIG.reportsDir, filename.replace('.json', '.md'));
  const markdown = generateMarkdownReport(report);
  fs.writeFileSync(markdownPath, markdown);
  console.log(`Markdown summary saved to ${markdownPath}`);
}

/**
 * Generate a markdown version of the debt report
 * @param {Object} report - Debt report
 * @returns {string} Markdown content
 */
function generateMarkdownReport(report) {
  const { summary, topIssues, fileRanking } = report;
  
  let markdown = `# Technical Debt Report\n\n`;
  markdown += `*Generated on ${new Date().toLocaleString()}*\n\n`;
  
  markdown += `## Summary\n\n`;
  markdown += `- **Total Debt Items**: ${summary.totalItems}\n`;
  markdown += `- **Total Debt Score**: ${summary.totalScore}\n`;
  markdown += `- **Health Status**: ${summary.healthStatus}\n\n`;
  
  markdown += `### Severity Breakdown\n\n`;
  markdown += `| Severity | Count |\n`;
  markdown += `|----------|-------|\n`;
  markdown += `| CRITICAL | ${summary.bySeverity.CRITICAL} |\n`;
  markdown += `| HIGH     | ${summary.bySeverity.HIGH} |\n`;
  markdown += `| MEDIUM   | ${summary.bySeverity.MEDIUM} |\n`;
  markdown += `| LOW      | ${summary.bySeverity.LOW} |\n\n`;
  
  markdown += `## Top Issues\n\n`;
  markdown += `| File | Line | Marker | Severity | Description |\n`;
  markdown += `|------|------|--------|----------|-------------|\n`;
  topIssues.forEach(item => {
    markdown += `| ${item.file} | ${item.line} | ${item.marker} | ${item.severity} | ${item.description} |\n`;
  });
  markdown += `\n`;
  
  markdown += `## Files with Most Debt\n\n`;
  markdown += `| File | Debt Items | Debt Score |\n`;
  markdown += `|------|------------|------------|\n`;
  fileRanking.forEach(file => {
    markdown += `| ${file.file} | ${file.items} | ${file.score} |\n`;
  });
  markdown += `\n`;
  
  markdown += `## Recommendations\n\n`;
  
  // Add recommendations based on the report
  if (summary.bySeverity.CRITICAL > 0) {
    markdown += `1. **Address Critical Issues**: There are ${summary.bySeverity.CRITICAL} critical debt items that should be addressed immediately.\n`;
  }
  
  if (fileRanking.length > 0 && fileRanking[0].score > 100) {
    markdown += `2. **Refactor High-Debt Files**: Focus on refactoring ${fileRanking[0].file} which has a debt score of ${fileRanking[0].score}.\n`;
  }
  
  if (summary.healthStatus === 'CRITICAL' || summary.healthStatus === 'WARNING') {
    markdown += `3. **Schedule Debt Reduction**: Allocate time in upcoming sprints specifically for technical debt reduction.\n`;
  }
  
  return markdown;
}

/**
 * Main function to analyze technical debt in a directory
 * @param {string} sourceDir - Directory to analyze
 */
function analyzeDebt(sourceDir) {
  // Use current directory if not specified
  const rootDir = sourceDir || process.cwd();
  
  console.log(`Starting technical debt analysis for ${rootDir}`);
  
  // Find debt markers in the code
  const debtItems = findDebtMarkers(rootDir);
  
  // Generate report
  const report = generateDebtReport(debtItems);
  
  // Save report
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  saveDebtReport(report, `debt-report-${timestamp}.json`);
  
  // Return report for potential further processing
  return report;
}

// Check if script is being run directly
if (require.main === module) {
  // Get source directory from command line argument, or use current directory
  const sourceDir = process.argv[2] || process.cwd();
  analyzeDebt(sourceDir);
}

module.exports = {
  analyzeDebt,
  findDebtMarkers,
  generateDebtReport,
  saveDebtReport,
  CONFIG
}; 