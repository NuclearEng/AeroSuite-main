#!/usr/bin/env node

/**
 * Test Coverage Reporting Setup
 * 
 * @task TS355 - Test coverage reporting setup
 * 
 * This script provides comprehensive test coverage reporting for the AeroSuite project.
 * It configures and runs tests with coverage, generates reports, and enforces coverage thresholds.
 * 
 * Features:
 * - Comprehensive coverage collection for client and server code
 * - HTML, JSON, and console report formats
 * - Configurable coverage thresholds
 * - Integration with CI/CD pipelines
 * - Badge generation for README
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
// Fix for chalk v5+ which is ESM only
const chalkFn = chalk.default || chalk;
const yargs = require('yargs/helpers');

// Configuration with defaults
const DEFAULT_CONFIG = {
  coverageThresholds: {
    global: {
      statements: 75,
      branches: 70,
      functions: 75,
      lines: 75
    },
    client: {
      statements: 70,
      branches: 65,
      functions: 70,
      lines: 70
    },
    server: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    }
  },
  outputFormats: ['html', 'json', 'lcov', 'text'],
  badgeEnabled: true,
  badgeOutputPath: './coverage/badge.svg',
  summaryOutputPath: './coverage/summary.json',
  dashboardOutputPath: './coverage/dashboard.html',
  coverageDirectory: './coverage',
  jestConfigPath: './jest.config.js'
};

// Parse command line arguments
const argv = yargs.hideBin(process.argv);
const args = require('yargs/yargs')(argv).argv;

/**
 * Load configuration from file and merge with defaults
 */
function loadConfig() {
  const configPath = path.resolve(process.cwd(), '.coverage-config.json');
  let config = DEFAULT_CONFIG;

  if (fs.existsSync(configPath)) {
    try {
      const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      config = { ...config, ...fileConfig };
    } catch (error) {
      console.error(chalkFn.red(`Error loading config file: ${error.message}`));
    }
  }

  // Override with command line arguments
  if (args.threshold) {
    const threshold = parseInt(args.threshold, 10);
    config.coverageThresholds.global.statements = threshold;
    config.coverageThresholds.global.branches = threshold;
    config.coverageThresholds.global.functions = threshold;
    config.coverageThresholds.global.lines = threshold;
  }

  return config;
}

/**
 * Save configuration to file
 */
function saveConfig(config) {
  const configPath = path.resolve(process.cwd(), '.coverage-config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(chalkFn.green(`Configuration saved to ${configPath}`));
}

/**
 * Create Jest config with coverage settings
 */
function createJestConfig(config) {
  // Read the base jest config
  const jestConfigPath = path.resolve(process.cwd(), config.jestConfigPath);
  
  if (!fs.existsSync(jestConfigPath)) {
    console.error(chalkFn.red(`Jest config not found at ${jestConfigPath}`));
    process.exit(1);
  }
  
  let jestConfig = require(jestConfigPath);
  
  // Add coverage configuration
  jestConfig = {
    ...jestConfig,
    coverageDirectory: config.coverageDirectory,
    coverageReporters: config.outputFormats,
    coverageThreshold: {
      global: config.coverageThresholds.global,
      './client/src/': config.coverageThresholds.client,
      './server/src/': config.coverageThresholds.server
    }
  };
  
  // Create a temporary Jest config file with coverage settings
  const tempJestConfigPath = path.resolve(process.cwd(), 'jest.coverage.config.js');
  fs.writeFileSync(
    tempJestConfigPath,
    `module.exports = ${JSON.stringify(jestConfig, null, 2)};`
  );
  
  return tempJestConfigPath;
}

/**
 * Run tests with coverage
 */
function runTestsWithCoverage(jestConfigPath) {
  console.log(chalkFn.blue('Running tests with coverage...'));
  
  try {
    execSync(`jest --config ${jestConfigPath} --coverage --colors`, {
      stdio: 'inherit'
    });
    console.log(chalkFn.green('✓ Tests completed successfully'));
    return true;
  } catch (error) {
    console.error(chalkFn.red('✗ Tests failed'));
    return false;
  }
}

/**
 * Generate a coverage badge
 */
function generateCoverageBadge(config) {
  console.log(chalkFn.blue('Generating coverage badge...'));
  
  // Read the coverage summary
  const coverageSummaryPath = path.resolve(process.cwd(), 'coverage/coverage-summary.json');
  
  if (!fs.existsSync(coverageSummaryPath)) {
    console.error(chalkFn.yellow('Coverage summary not found, skipping badge generation'));
    return;
  }
  
  try {
    const coverageSummary = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
    const totalCoverage = coverageSummary.total.lines.pct;
    
    // Determine badge color based on coverage percentage
    let color = 'red';
    if (totalCoverage >= 90) {
      color = 'brightgreen';
    } else if (totalCoverage >= 80) {
      color = 'green';
    } else if (totalCoverage >= 70) {
      color = 'yellowgreen';
    } else if (totalCoverage >= 60) {
      color = 'yellow';
    } else if (totalCoverage >= 50) {
      color = 'orange';
    }
    
    // Generate badge SVG
    const badgeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="106" height="20">
      <linearGradient id="b" x2="0" y2="100%">
        <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
        <stop offset="1" stop-opacity=".1"/>
      </linearGradient>
      <mask id="a">
        <rect width="106" height="20" rx="3" fill="#fff"/>
      </mask>
      <g mask="url(#a)">
        <path fill="#555" d="M0 0h63v20H0z"/>
        <path fill="#${color}" d="M63 0h43v20H63z"/>
        <path fill="url(#b)" d="M0 0h106v20H0z"/>
      </g>
      <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
        <text x="31.5" y="15" fill="#010101" fill-opacity=".3">coverage</text>
        <text x="31.5" y="14">coverage</text>
        <text x="83.5" y="15" fill="#010101" fill-opacity=".3">${totalCoverage}%</text>
        <text x="83.5" y="14">${totalCoverage}%</text>
      </g>
    </svg>`;
    
    // Save badge
    const badgeOutputPath = path.resolve(process.cwd(), config.badgeOutputPath);
    const badgeDir = path.dirname(badgeOutputPath);
    
    if (!fs.existsSync(badgeDir)) {
      fs.mkdirSync(badgeDir, { recursive: true });
    }
    
    fs.writeFileSync(badgeOutputPath, badgeSvg);
    console.log(chalkFn.green(`Coverage badge saved to ${config.badgeOutputPath}`));
    
    // Save summary for the dashboard
    const summaryOutputPath = path.resolve(process.cwd(), config.summaryOutputPath);
    fs.writeFileSync(summaryOutputPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      total: totalCoverage,
      client: coverageSummary.client ? coverageSummary.client.lines.pct : 'N/A',
      server: coverageSummary.server ? coverageSummary.server.lines.pct : 'N/A',
      thresholds: config.coverageThresholds
    }, null, 2));
    
  } catch (error) {
    console.error(chalkFn.red(`Error generating badge: ${error.message}`));
  }
}

/**
 * Generate HTML dashboard for coverage reports
 */
function generateCoverageDashboard(config) {
  console.log(chalkFn.blue('Generating coverage dashboard...'));
  
  // Read coverage summary
  const summaryPath = path.resolve(process.cwd(), config.summaryOutputPath);
  
  if (!fs.existsSync(summaryPath)) {
    console.error(chalkFn.yellow('Coverage summary not found, skipping dashboard generation'));
    return;
  }
  
  try {
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    
    // Get history data if available
    const historyPath = path.resolve(process.cwd(), './coverage/history.json');
    let history = [];
    
    if (fs.existsSync(historyPath)) {
      try {
        history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      } catch (error) {
        console.error(chalkFn.yellow(`Error reading history file: ${error.message}`));
      }
    }
    
    // Add current summary to history
    history.push({
      timestamp: summary.timestamp,
      total: summary.total,
      client: summary.client,
      server: summary.server
    });
    
    // Keep only the last 30 entries
    if (history.length > 30) {
      history = history.slice(history.length - 30);
    }
    
    // Save updated history
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    
    // Generate HTML dashboard
    const dashboardHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AeroSuite Test Coverage Dashboard</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f5f7fa;
          color: #333;
        }
        .dashboard {
          max-width: 1200px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
        }
        .timestamp {
          color: #666;
        }
        .summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .card {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .card-title {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #555;
        }
        .coverage-value {
          font-size: 36px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .threshold {
          font-size: 14px;
          color: #666;
        }
        .good {
          color: #4caf50;
        }
        .warning {
          color: #ff9800;
        }
        .bad {
          color: #f44336;
        }
        .chart-container {
          height: 300px;
          margin-bottom: 30px;
        }
        .reports {
          margin-bottom: 30px;
        }
        .report-link {
          display: block;
          padding: 10px 15px;
          background-color: white;
          border-radius: 4px;
          margin-bottom: 10px;
          text-decoration: none;
          color: #333;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: transform 0.2s;
        }
        .report-link:hover {
          transform: translateY(-2px);
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
      </style>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    </head>
    <body>
      <div class="dashboard">
        <div class="header">
          <div class="title">AeroSuite Test Coverage Dashboard</div>
          <div class="timestamp">Last updated: ${new Date(summary.timestamp).toLocaleString()}</div>
        </div>
        
        <div class="summary">
          <div class="card">
            <div class="card-title">Total Coverage</div>
            <div class="coverage-value ${getCoverageClass(summary.total, summary.thresholds.global.lines)}">${summary.total}%</div>
            <div class="threshold">Threshold: ${summary.thresholds.global.lines}%</div>
          </div>
          
          <div class="card">
            <div class="card-title">Client Coverage</div>
            <div class="coverage-value ${getCoverageClass(summary.client, summary.thresholds.client.lines)}">${summary.client}%</div>
            <div class="threshold">Threshold: ${summary.thresholds.client.lines}%</div>
          </div>
          
          <div class="card">
            <div class="card-title">Server Coverage</div>
            <div class="coverage-value ${getCoverageClass(summary.server, summary.thresholds.server.lines)}">${summary.server}%</div>
            <div class="threshold">Threshold: ${summary.thresholds.server.lines}%</div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-title">Coverage History</div>
          <div class="chart-container">
            <canvas id="coverageChart"></canvas>
          </div>
        </div>
        
        <div class="reports">
          <h2>Coverage Reports</h2>
          <a href="../lcov-report/index.html" class="report-link">Detailed HTML Coverage Report</a>
          <a href="../coverage-summary.json" class="report-link">JSON Coverage Summary</a>
        </div>
        
        <div class="footer">
          Generated by AeroSuite Test Coverage Reporter<br>
          Task TS355 - Test coverage reporting setup
        </div>
      </div>
      
      <script>
        // Load history data
        const historyData = ${JSON.stringify(history)};
        
        // Prepare data for chart
        const dates = historyData.map(entry => new Date(entry.timestamp).toLocaleDateString());
        const totalValues = historyData.map(entry => entry.total);
        const clientValues = historyData.map(entry => entry.client);
        const serverValues = historyData.map(entry => entry.server);
        
        // Create chart
        const ctx = document.getElementById('coverageChart').getContext('2d');
        const coverageChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: dates,
            datasets: [
              {
                label: 'Total',
                data: totalValues,
                borderColor: '#4caf50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.3,
                fill: true
              },
              {
                label: 'Client',
                data: clientValues,
                borderColor: '#2196f3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                tension: 0.3,
                fill: true
              },
              {
                label: 'Server',
                data: serverValues,
                borderColor: '#ff9800',
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                tension: 0.3,
                fill: true
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                min: 0,
                max: 100,
                ticks: {
                  callback: function(value) {
                    return value + '%';
                  }
                }
              }
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return context.dataset.label + ': ' + context.raw + '%';
                  }
                }
              }
            }
          }
        });
        
        function getCoverageClass(coverage, threshold) {
          if (coverage >= threshold) return 'good';
          if (coverage >= threshold - 10) return 'warning';
          return 'bad';
        }
      </script>
    </body>
    </html>
    `;
    
    // Save dashboard
    const dashboardOutputPath = path.resolve(process.cwd(), config.dashboardOutputPath);
    const dashboardDir = path.dirname(dashboardOutputPath);
    
    if (!fs.existsSync(dashboardDir)) {
      fs.mkdirSync(dashboardDir, { recursive: true });
    }
    
    fs.writeFileSync(dashboardOutputPath, dashboardHtml);
    console.log(chalkFn.green(`Coverage dashboard saved to ${config.dashboardOutputPath}`));
    
  } catch (error) {
    console.error(chalkFn.red(`Error generating dashboard: ${error.message}`));
  }
}

/**
 * Get coverage class based on threshold
 */
function getCoverageClass(coverage, threshold) {
  if (coverage >= threshold) return 'good';
  if (coverage >= threshold - 10) return 'warning';
  return 'bad';
}

/**
 * Main function
 */
async function main() {
  console.log(chalkFn.blue('🧪 AeroSuite Test Coverage Setup'));
  console.log(chalkFn.blue('================================'));
  
  // Load configuration
  const config = loadConfig();
  
  // Check if this is an initialization call
  if (args.init) {
    console.log(chalkFn.blue('Initializing test coverage configuration...'));
    saveConfig(config);
    console.log(chalkFn.green('✓ Configuration initialized'));
    return;
  }
  
  // Create Jest configuration
  const jestConfigPath = createJestConfig(config);
  console.log(chalkFn.green(`✓ Created temporary Jest config at ${jestConfigPath}`));
  
  // Run tests with coverage
  const success = runTestsWithCoverage(jestConfigPath);
  
  // Generate coverage badge if enabled
  if (config.badgeEnabled) {
    generateCoverageBadge(config);
  }
  
  // Generate coverage dashboard
  generateCoverageDashboard(config);
  
  // Clean up temporary Jest config
  fs.unlinkSync(jestConfigPath);
  console.log(chalkFn.green('✓ Cleaned up temporary Jest config'));
  
  console.log(chalkFn.blue('================================'));
  if (success) {
    console.log(chalkFn.green('✓ Test coverage reporting completed successfully'));
  } else {
    console.log(chalkFn.yellow('⚠ Tests completed with issues'));
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error(chalkFn.red(`Fatal error: ${error.message}`));
  process.exit(1);
}); 