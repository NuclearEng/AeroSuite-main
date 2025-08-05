/**
 * Performance Comparison Utility
 * 
 * This utility compares results from multiple load tests to evaluate 
 * the effectiveness of horizontal scaling and other performance optimizations.
 * 
 * Task: TS354 - Load testing implementation
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

/**
 * Compare performance between multiple test results
 * @param {Array<string>} filePaths - Paths to result JSON files
 * @param {Object} options - Comparison options
 * @returns {Object} Comparison results
 */
function comparePerformance(filePaths, options = {}) {
  // Validate inputs
  if (!Array.isArray(filePaths) || filePaths.length < 2) {
    throw new Error('At least two result files are required for comparison');
  }
  
  // Process each file
  const results = filePaths.map(filePath => {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      const result = JSON.parse(data);
      return {
        filePath,
        fileName: path.basename(filePath),
        data: result
      };
    } catch (error) {
      throw new Error(`Error reading file ${filePath}: ${error.message}`);
    }
  });
  
  // Extract key metrics for comparison
  const comparisonData = results.map(result => {
    const metadata = result.data.metadata || {};
    const summary = result.data.results?.summary || {};
    const responseTime = result.data.results?.responseTime || {};
    const systemMetrics = result.data.results?.system || {};
    
    return {
      fileName: result.fileName,
      testName: metadata.name || 'Unknown Test',
      timestamp: metadata.timestamp || 'Unknown',
      config: {
        profile: metadata.config?.scenario || 'default',
        users: metadata.config?.users || 0,
        duration: metadata.config?.duration || 0,
        workers: metadata.config?.workers || 1
      },
      metrics: {
        totalRequests: summary.totalRequests || 0,
        successfulRequests: summary.successfulRequests || 0,
        failedRequests: summary.failedRequests || 0,
        successRate: summary.successRate || 0,
        requestsPerSecond: summary.requestsPerSecond || 0,
        responseTime: {
          min: responseTime.min || 0,
          max: responseTime.max || 0,
          avg: responseTime.avg || 0,
          median: responseTime.median || 0,
          p95: responseTime.p95 || 0,
          p99: responseTime.p99 || 0
        },
        system: {
          cpuUsage: systemMetrics.cpu?.processMemoryMB || 0,
          memoryUsage: systemMetrics.memory?.usedPercent || 0,
          loadAverage: systemMetrics.loadAvg?.value || 0
        }
      }
    };
  });
  
  // Calculate scaling efficiency
  const scalingEfficiency = calculateScalingEfficiency(comparisonData);
  
  // Generate comparison report
  return generateComparisonReport(comparisonData, scalingEfficiency, options);
}

/**
 * Calculate scaling efficiency metrics
 * @param {Array<Object>} data - Processed test data
 * @returns {Object} Scaling efficiency metrics
 */
function calculateScalingEfficiency(data) {
  // Sort by worker count
  const sortedData = [...data].sort((a, b) => a.config.workers - b.config.workers);
  
  // If we don't have at least two results, we can't calculate scaling efficiency
  if (sortedData.length < 2) {
    return {
      scalingFactor: 1,
      efficiency: 100,
      idealRps: sortedData[0].metrics.requestsPerSecond,
      actualRps: sortedData[0].metrics.requestsPerSecond
    };
  }
  
  // Use the first result as baseline
  const baseline = sortedData[0];
  const highest = sortedData[sortedData.length - 1];
  
  // Calculate scaling factor (how many times more workers)
  const scalingFactor = highest.config.workers / baseline.config.workers;
  
  // Ideal RPS would scale linearly with worker count
  const idealRps = baseline.metrics.requestsPerSecond * scalingFactor;
  const actualRps = highest.metrics.requestsPerSecond;
  
  // Calculate efficiency as a percentage of ideal scaling
  const efficiency = (actualRps / idealRps) * 100;
  
  // Calculate response time degradation
  const baselineAvgResponseTime = baseline.metrics.responseTime.avg;
  const highestAvgResponseTime = highest.metrics.responseTime.avg;
  const responseTimeDegradation = ((highestAvgResponseTime - baselineAvgResponseTime) / baselineAvgResponseTime) * 100;
  
  return {
    scalingFactor,
    efficiency: Math.round(efficiency * 100) / 100,
    idealRps: Math.round(idealRps * 100) / 100,
    actualRps: Math.round(actualRps * 100) / 100,
    responseTimeDegradation: Math.round(responseTimeDegradation * 100) / 100
  };
}

/**
 * Generate a comparison report
 * @param {Array<Object>} data - Processed test data
 * @param {Object} scalingEfficiency - Scaling efficiency metrics
 * @param {Object} options - Report options
 * @returns {Object} Comparison report
 */
function generateComparisonReport(data, scalingEfficiency, options) {
  // Basic comparison data
  const comparison = {
    tests: data,
    scalingEfficiency,
    timestamp: new Date().toISOString(),
    recommendations: []
  };
  
  // Add recommendations based on the comparison
  if (scalingEfficiency.efficiency < 70) {
    comparison.recommendations.push(
      'Scaling efficiency is below 70%. Review horizontal scaling implementation for bottlenecks.'
    );
  }
  
  if (scalingEfficiency.responseTimeDegradation > 50) {
    comparison.recommendations.push(
      'Response time degradation is significant. Consider optimizing database queries and implementing caching.'
    );
  }
  
  // Check for failures
  const highFailureRate = data.some(test => test.metrics.successRate < 95);
  if (highFailureRate) {
    comparison.recommendations.push(
      'One or more tests show a success rate below 95%. Investigate error handling and resource limitations.'
    );
  }
  
  // Add more specific recommendations based on data patterns
  const highResourceTest = data.find(test => 
    test.metrics.system.cpuUsage > 80 || test.metrics.system.memoryUsage > 80
  );
  
  if (highResourceTest) {
    comparison.recommendations.push(
      `Test "${highResourceTest.fileName}" shows high resource usage. Consider optimizing resource consumption or increasing server capacity.`
    );
  }
  
  return comparison;
}

/**
 * Print a comparison report to the console
 * @param {Object} report - Comparison report
 */
function printComparisonReport(report) {
  console.log(chalk.bold.blue('\n=== Performance Comparison Report ==='));
  console.log(chalk.blue(`Generated at: ${new Date().toLocaleString()}`));
  
  // Print tests summary
  console.log(chalk.bold.blue('\nTests Compared:'));
  report.tests.forEach((test, index) => {
    console.log(chalk.yellow(`\nTest ${index + 1}: ${test.fileName}`));
    console.log(chalk.blue(`Profile: ${test.config.profile}`));
    console.log(chalk.blue(`Workers: ${test.config.workers}`));
    console.log(chalk.blue(`Concurrent Users: ${test.config.users}`));
    console.log(chalk.blue(`Requests/sec: ${test.metrics.requestsPerSecond}`));
    console.log(chalk.blue(`Avg Response Time: ${test.metrics.responseTime.avg} ms`));
    console.log(chalk.blue(`Success Rate: ${test.metrics.successRate}%`));
  });
  
  // Print scaling efficiency
  console.log(chalk.bold.blue('\nScaling Efficiency:'));
  console.log(chalk.blue(`Scaling Factor: ${report.scalingEfficiency.scalingFactor}x`));
  
  const efficiencyColor = 
    report.scalingEfficiency.efficiency >= 80 ? chalk.green :
    report.scalingEfficiency.efficiency >= 60 ? chalk.yellow :
    chalk.red;
  
  console.log(efficiencyColor(`Efficiency: ${report.scalingEfficiency.efficiency}%`));
  console.log(chalk.blue(`Ideal Requests/sec: ${report.scalingEfficiency.idealRps}`));
  console.log(chalk.blue(`Actual Requests/sec: ${report.scalingEfficiency.actualRps}`));
  
  const rtDegradationColor = 
    report.scalingEfficiency.responseTimeDegradation <= 20 ? chalk.green :
    report.scalingEfficiency.responseTimeDegradation <= 50 ? chalk.yellow :
    chalk.red;
  
  console.log(rtDegradationColor(`Response Time Degradation: ${report.scalingEfficiency.responseTimeDegradation}%`));
  
  // Print recommendations
  if (report.recommendations.length > 0) {
    console.log(chalk.bold.blue('\nRecommendations:'));
    report.recommendations.forEach((recommendation, index) => {
      console.log(chalk.yellow(`${index + 1}. ${recommendation}`));
    });
  }
  
  console.log(chalk.bold.blue('\n=== End of Report ===\n'));
}

/**
 * Save comparison report to a file
 * @param {Object} report - Comparison report
 * @param {string} outputPath - Path to save the report
 */
function saveComparisonReport(report, outputPath) {
  const reportJson = JSON.stringify(report, null, 2);
  
  try {
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, reportJson);
    console.log(chalk.green(`Report saved to: ${outputPath}`));
  } catch (error) {
    console.error(chalk.red(`Error saving report: ${error.message}`));
  }
}

/**
 * Generate HTML report from comparison data
 * @param {Object} report - Comparison report
 * @param {string} outputPath - Path to save the HTML report
 */
function generateHtmlReport(report, outputPath) {
  // Create HTML content
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Load Test Comparison Report</title>
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
    .tests-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .test-card {
      background-color: #f9f9f9;
      padding: 15px;
      border-radius: 5px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .test-title {
      font-weight: bold;
      margin-bottom: 10px;
      font-size: 18px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    .metric-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    .metric-label {
      font-weight: bold;
      color: #666;
    }
    .metric-value {
      font-family: monospace;
    }
    .efficiency {
      margin: 20px 0;
      padding: 20px;
      background-color: #f0f7ff;
      border-radius: 5px;
      border-left: 4px solid #0066cc;
    }
    .good {
      color: #4CAF50;
    }
    .warning {
      color: #FF9800;
    }
    .poor {
      color: #F44336;
    }
    .recommendations {
      margin: 20px 0;
      padding: 20px;
      background-color: #fff9e6;
      border-radius: 5px;
      border-left: 4px solid #FF9800;
    }
    .recommendations ul {
      margin: 10px 0 0 0;
      padding-left: 20px;
    }
    .recommendations li {
      margin-bottom: 10px;
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
    <h1>Load Test Comparison Report</h1>
    <p>Generated at: ${new Date(report.timestamp).toLocaleString()}</p>
    
    <h2>Tests Compared</h2>
    <div class="tests-grid">
      ${report.tests.map((test, index) => `
        <div class="test-card">
          <div class="test-title">Test ${index + 1}: ${test.fileName}</div>
          <div class="metric-row">
            <span class="metric-label">Profile:</span>
            <span class="metric-value">${test.config.profile}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Workers:</span>
            <span class="metric-value">${test.config.workers}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Concurrent Users:</span>
            <span class="metric-value">${test.config.users}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Requests/sec:</span>
            <span class="metric-value">${test.metrics.requestsPerSecond}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Avg Response Time:</span>
            <span class="metric-value">${test.metrics.responseTime.avg} ms</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Success Rate:</span>
            <span class="metric-value">${test.metrics.successRate}%</span>
          </div>
        </div>
      `).join('')}
    </div>
    
    <h2>Scaling Efficiency</h2>
    <div class="efficiency">
      <div class="metric-row">
        <span class="metric-label">Scaling Factor:</span>
        <span class="metric-value">${report.scalingEfficiency.scalingFactor}x</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Efficiency:</span>
        <span class="metric-value ${
          report.scalingEfficiency.efficiency >= 80 ? 'good' : 
          report.scalingEfficiency.efficiency >= 60 ? 'warning' : 'poor'
        }">${report.scalingEfficiency.efficiency}%</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Ideal Requests/sec:</span>
        <span class="metric-value">${report.scalingEfficiency.idealRps}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Actual Requests/sec:</span>
        <span class="metric-value">${report.scalingEfficiency.actualRps}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Response Time Degradation:</span>
        <span class="metric-value ${
          report.scalingEfficiency.responseTimeDegradation <= 20 ? 'good' : 
          report.scalingEfficiency.responseTimeDegradation <= 50 ? 'warning' : 'poor'
        }">${report.scalingEfficiency.responseTimeDegradation}%</span>
      </div>
    </div>
    
    ${report.recommendations.length > 0 ? `
      <h2>Recommendations</h2>
      <div class="recommendations">
        <ul>
          ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
    
    <footer>
      <p>Generated by AeroSuite Load Testing Framework</p>
    </footer>
  </div>
</body>
</html>
  `;
  
  try {
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, html);
    console.log(chalk.green(`HTML report saved to: ${outputPath}`));
  } catch (error) {
    console.error(chalk.red(`Error saving HTML report: ${error.message}`));
  }
}

module.exports = {
  comparePerformance,
  printComparisonReport,
  saveComparisonReport,
  generateHtmlReport
}; 