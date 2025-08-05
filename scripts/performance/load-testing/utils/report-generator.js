/**
 * Report Generator
 * 
 * This module generates reports from load test results.
 * It supports multiple output formats and detail levels.
 * 
 * Task: TS354 - Load testing implementation
 */

const fs = require('fs');
const path = require('path');
const { processMetrics } = require('./metrics-collector');
const chalk = require('chalk');

/**
 * Generate a report from test results
 * @param {Object} metrics - Test metrics
 * @param {Object} config - Test configuration
 * @param {Object} options - Report options
 * @returns {Promise<void>}
 */
async function generateReport(metrics, config, options = {}) {
  // Process metrics into reportable format
  const processedMetrics = processMetrics(metrics, config);
  
  // Generate report based on format
  const format = options.format || 'console';
  
  switch (format.toLowerCase()) {
    case 'json':
      return generateJsonReport(processedMetrics, config, options);
    case 'html':
      return generateHtmlReport(processedMetrics, config, options);
    case 'console':
    default:
      return generateConsoleReport(processedMetrics, config, options);
  }
}

/**
 * Generate a console report
 * @param {Object} metrics - Processed metrics
 * @param {Object} config - Test configuration
 * @param {Object} options - Report options
 * @returns {Promise<void>}
 */
async function generateConsoleReport(metrics, config, options) {
  const summary = metrics.summary;
  const responseTime = metrics.responseTime;
  
  console.log(chalk.green('\n=== Load Test Results ==='));
  console.log(chalk.blue(`Target: ${summary.target}`));
  console.log(chalk.blue(`Scenario: ${summary.scenario}`));
  console.log(chalk.blue(`Concurrent Users: ${summary.concurrentUsers}`));
  console.log(chalk.blue(`Duration: ${summary.duration} seconds`));
  console.log(chalk.blue(`Total Requests: ${summary.totalRequests}`));
  console.log(chalk.blue(`Successful Requests: ${summary.successfulRequests}`));
  console.log(chalk.blue(`Failed Requests: ${summary.failedRequests}`));
  console.log(chalk.blue(`Success Rate: ${summary.successRate}%`));
  console.log(chalk.blue(`Requests Per Second: ${summary.requestsPerSecond}`));
  
  console.log(chalk.green('\n--- Response Time (ms) ---'));
  console.log(chalk.blue(`Min: ${responseTime.min}`));
  console.log(chalk.blue(`Max: ${responseTime.max}`));
  console.log(chalk.blue(`Average: ${responseTime.avg}`));
  console.log(chalk.blue(`Median: ${responseTime.median}`));
  console.log(chalk.blue(`95th Percentile: ${responseTime.p95}`));
  console.log(chalk.blue(`99th Percentile: ${responseTime.p99}`));
  
  // Show system metrics
  if (metrics.system && metrics.system.cpu) {
    console.log(chalk.green('\n--- System Metrics ---'));
    
    if (metrics.system.cpu) {
      console.log(chalk.blue(`CPU Cores: ${metrics.system.cpu.cpus || 'N/A'}`));
      console.log(chalk.blue(`Process Memory: ${metrics.system.cpu.processMemoryMB || 'N/A'} MB`));
    }
    
    if (metrics.system.memory) {
      console.log(chalk.blue(`Memory Usage: ${metrics.system.memory.usedPercent || 'N/A'}%`));
    }
    
    if (metrics.system.loadAvg) {
      console.log(chalk.blue(`Load Average: ${metrics.system.loadAvg.value || 'N/A'}`));
    }
  }
  
  // Show scenario details if detailed report requested
  if (options.detailed && metrics.scenarios) {
    console.log(chalk.green('\n--- Scenario Details ---'));
    
    Object.keys(metrics.scenarios).forEach(scenarioName => {
      const scenario = metrics.scenarios[scenarioName];
      
      console.log(chalk.yellow(`\nScenario: ${scenarioName}`));
      console.log(chalk.blue(`Requests: ${scenario.requests}`));
      console.log(chalk.blue(`Success: ${scenario.success}`));
      console.log(chalk.blue(`Failed: ${scenario.failed}`));
      console.log(chalk.blue(`Success Rate: ${scenario.successRate}%`));
      
      if (scenario.stats) {
        console.log(chalk.blue('Response Time (ms):'));
        console.log(chalk.blue(`  Min: ${scenario.stats.min}`));
        console.log(chalk.blue(`  Max: ${scenario.stats.max}`));
        console.log(chalk.blue(`  Average: ${scenario.stats.avg}`));
        console.log(chalk.blue(`  Median: ${scenario.stats.median}`));
        console.log(chalk.blue(`  95th Percentile: ${scenario.stats.p95}`));
        console.log(chalk.blue(`  99th Percentile: ${scenario.stats.p99}`));
      }
    });
  }
  
  // Show error details if any
  if (metrics.errors && metrics.errors.length > 0) {
    console.log(chalk.red('\n--- Error Details ---'));
    console.log(chalk.red(`Total Errors: ${metrics.errors.length}`));
    
    if (options.detailed) {
      metrics.errors.slice(0, 10).forEach((error, index) => {
        console.log(chalk.red(`\nError ${index + 1}:`));
        console.log(chalk.red(`Timestamp: ${error.timestamp}`));
        console.log(chalk.red(`Message: ${error.message}`));
        if (error.stack && options.debug) {
          console.log(chalk.red(`Stack: ${error.stack}`));
        }
      });
      
      if (metrics.errors.length > 10) {
        console.log(chalk.red(`\n... and ${metrics.errors.length - 10} more errors.`));
      }
    }
  }
  
  console.log(chalk.green('\n=========================\n'));
}

/**
 * Generate a JSON report
 * @param {Object} metrics - Processed metrics
 * @param {Object} config - Test configuration
 * @param {Object} options - Report options
 * @returns {Promise<void>}
 */
async function generateJsonReport(metrics, config, options) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = options.outputPath || path.join(__dirname, '..', 'reports');
  const fileName = options.fileName || `load-test-report-${timestamp}.json`;
  const filePath = path.join(outputPath, fileName);
  
  // Ensure output directory exists
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }
  
  // Filter out detailed data if not requested
  if (!options.detailed) {
    // Simplified metrics without details
    delete metrics.system;
    
    if (metrics.errors && metrics.errors.length > 0) {
      metrics.errors = {
        count: metrics.errors.length,
        sample: metrics.errors.slice(0, 5)
      };
    }
  }
  
  // Add metadata
  const report = {
    metadata: {
      timestamp: new Date().toISOString(),
      name: options.testName || 'Load Test',
      config: {
        target: config.targetUrl,
        users: config.concurrentUsers,
        duration: config.testDurationSec,
        workers: config.workers,
        scenario: config.scenario || 'default'
      }
    },
    results: metrics
  };
  
  // Write report to file
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
  
  console.log(chalk.green(`\nJSON report saved to: ${filePath}`));
  
  // Also show brief summary in console
  generateConsoleReport({
    summary: metrics.summary,
    responseTime: metrics.responseTime
  }, config, { detailed: false });
}

/**
 * Generate an HTML report
 * @param {Object} metrics - Processed metrics
 * @param {Object} config - Test configuration
 * @param {Object} options - Report options
 * @returns {Promise<void>}
 */
async function generateHtmlReport(metrics, config, options) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = options.outputPath || path.join(__dirname, '..', 'reports');
  const fileName = options.fileName || `load-test-report-${timestamp}.html`;
  const filePath = path.join(outputPath, fileName);
  
  // Ensure output directory exists
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }
  
  // Generate HTML content
  const html = generateHtmlContent(metrics, config, options);
  
  // Write report to file
  fs.writeFileSync(filePath, html);
  
  console.log(chalk.green(`\nHTML report saved to: ${filePath}`));
  
  // Also show brief summary in console
  generateConsoleReport({
    summary: metrics.summary,
    responseTime: metrics.responseTime
  }, config, { detailed: false });
}

/**
 * Generate HTML content for report
 * @param {Object} metrics - Processed metrics
 * @param {Object} config - Test configuration
 * @param {Object} options - Report options
 * @returns {string} HTML content
 */
function generateHtmlContent(metrics, config, options) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AeroSuite Load Test Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: #fff;
      padding: 20px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    h1, h2, h3 {
      color: #0066cc;
    }
    h1 {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 10px;
      border-bottom: 2px solid #eee;
    }
    .summary {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    .metrics {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
    }
    .metric-card {
      background-color: #f9f9f9;
      padding: 15px;
      border-radius: 5px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .metric-value {
      font-size: 24px;
      font-weight: bold;
      color: #0066cc;
      margin: 10px 0;
    }
    .metric-label {
      font-size: 14px;
      color: #666;
    }
    .section {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }
    .response-time {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
    .error {
      color: #cc0000;
    }
    .success-rate {
      height: 20px;
      background-color: #ddd;
      border-radius: 10px;
      overflow: hidden;
      margin-top: 5px;
    }
    .success-rate-bar {
      height: 100%;
      background-color: #4CAF50;
    }
    footer {
      text-align: center;
      margin-top: 30px;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>AeroSuite Load Test Report</h1>
    
    <div class="section">
      <h2>Test Summary</h2>
      <div class="summary">
        <div class="metric-card">
          <div class="metric-label">Target</div>
          <div class="metric-value">${metrics.summary.target}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Scenario</div>
          <div class="metric-value">${metrics.summary.scenario}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Concurrent Users</div>
          <div class="metric-value">${metrics.summary.concurrentUsers}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Duration</div>
          <div class="metric-value">${metrics.summary.duration} seconds</div>
        </div>
      </div>
      
      <h3>Request Metrics</h3>
      <div class="metrics">
        <div class="metric-card">
          <div class="metric-label">Total Requests</div>
          <div class="metric-value">${metrics.summary.totalRequests}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Successful Requests</div>
          <div class="metric-value">${metrics.summary.successfulRequests}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Failed Requests</div>
          <div class="metric-value">${metrics.summary.failedRequests}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Success Rate</div>
          <div class="metric-value">${metrics.summary.successRate}%</div>
          <div class="success-rate">
            <div class="success-rate-bar" style="width: ${metrics.summary.successRate}%"></div>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Requests Per Second</div>
          <div class="metric-value">${metrics.summary.requestsPerSecond}</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h2>Response Time (ms)</h2>
      <div class="response-time">
        <div class="metric-card">
          <div class="metric-label">Min</div>
          <div class="metric-value">${metrics.responseTime.min}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Max</div>
          <div class="metric-value">${metrics.responseTime.max}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Average</div>
          <div class="metric-value">${metrics.responseTime.avg}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Median</div>
          <div class="metric-value">${metrics.responseTime.median}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">95th Percentile</div>
          <div class="metric-value">${metrics.responseTime.p95}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">99th Percentile</div>
          <div class="metric-value">${metrics.responseTime.p99}</div>
        </div>
      </div>
    </div>
    
    ${generateScenarioHtml(metrics, options)}
    
    ${generateErrorsHtml(metrics, options)}
    
    ${generateSystemMetricsHtml(metrics, options)}
    
    <footer>
      <p>Generated by AeroSuite Load Testing Framework on ${new Date().toLocaleString()}</p>
    </footer>
  </div>
</body>
</html>
  `;
}

/**
 * Generate HTML for scenario details
 * @param {Object} metrics - Processed metrics
 * @param {Object} options - Report options
 * @returns {string} HTML content
 */
function generateScenarioHtml(metrics, options) {
  if (!metrics.scenarios || !options.detailed || Object.keys(metrics.scenarios).length === 0) {
    return '';
  }
  
  let html = `
  <div class="section">
    <h2>Scenario Details</h2>
    <table>
      <thead>
        <tr>
          <th>Scenario</th>
          <th>Requests</th>
          <th>Success</th>
          <th>Failed</th>
          <th>Success Rate</th>
          <th>Avg Response Time</th>
          <th>95th Percentile</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  Object.keys(metrics.scenarios).forEach(scenarioName => {
    const scenario = metrics.scenarios[scenarioName];
    html += `
      <tr>
        <td>${scenarioName}</td>
        <td>${scenario.requests}</td>
        <td>${scenario.success}</td>
        <td>${scenario.failed}</td>
        <td>${scenario.successRate}%</td>
        <td>${scenario.stats.avg} ms</td>
        <td>${scenario.stats.p95} ms</td>
      </tr>
    `;
  });
  
  html += `
      </tbody>
    </table>
  </div>
  `;
  
  return html;
}

/**
 * Generate HTML for error details
 * @param {Object} metrics - Processed metrics
 * @param {Object} options - Report options
 * @returns {string} HTML content
 */
function generateErrorsHtml(metrics, options) {
  if (!metrics.errors || metrics.errors.length === 0) {
    return '';
  }
  
  let html = `
  <div class="section">
    <h2>Error Details</h2>
    <p>Total Errors: ${metrics.errors.length}</p>
  `;
  
  if (options.detailed) {
    html += `
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Timestamp</th>
          <th>Message</th>
        </tr>
      </thead>
      <tbody>
    `;
    
    metrics.errors.slice(0, 20).forEach((error, index) => {
      html += `
        <tr>
          <td>${index + 1}</td>
          <td>${error.timestamp}</td>
          <td class="error">${error.message}</td>
        </tr>
      `;
    });
    
    html += `
      </tbody>
    </table>
    `;
    
    if (metrics.errors.length > 20) {
      html += `<p>Showing 20 of ${metrics.errors.length} errors.</p>`;
    }
  }
  
  html += `</div>`;
  
  return html;
}

/**
 * Generate HTML for system metrics
 * @param {Object} metrics - Processed metrics
 * @param {Object} options - Report options
 * @returns {string} HTML content
 */
function generateSystemMetricsHtml(metrics, options) {
  if (!metrics.system || !options.detailed) {
    return '';
  }
  
  let html = `
  <div class="section">
    <h2>System Metrics</h2>
    <div class="metrics">
  `;
  
  if (metrics.system.cpu) {
    html += `
      <div class="metric-card">
        <div class="metric-label">CPU Cores</div>
        <div class="metric-value">${metrics.system.cpu.cpus || 'N/A'}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Process Memory</div>
        <div class="metric-value">${metrics.system.cpu.processMemoryMB || 'N/A'} MB</div>
      </div>
    `;
  }
  
  if (metrics.system.memory) {
    html += `
      <div class="metric-card">
        <div class="metric-label">Memory Usage</div>
        <div class="metric-value">${metrics.system.memory.usedPercent || 'N/A'}%</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Total Memory</div>
        <div class="metric-value">${metrics.system.memory.totalMB || 'N/A'} MB</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Free Memory</div>
        <div class="metric-value">${metrics.system.memory.freeMB || 'N/A'} MB</div>
      </div>
    `;
  }
  
  if (metrics.system.loadAvg) {
    html += `
      <div class="metric-card">
        <div class="metric-label">Load Average</div>
        <div class="metric-value">${metrics.system.loadAvg.value || 'N/A'}</div>
      </div>
    `;
  }
  
  html += `
    </div>
  </div>
  `;
  
  return html;
}

module.exports = {
  generateReport
}; 