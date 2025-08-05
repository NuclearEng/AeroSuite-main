/**
 * Performance Report Generator
 * 
 * This module generates HTML and JSON reports from performance test results.
 */

const fs = require('fs');
const path = require('path');
const Chart = require('chart.js/auto');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { createSpinner } = require('nanospinner');

/**
 * Generate a performance report from test results
 */
async function generateReport(results, config) {
  // Determine report type based on config
  const format = config.reportFormat || 'console';
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(config.reportDir)) {
    fs.mkdirSync(config.reportDir, { recursive: true });
  }
  
  // Define output paths
  const jsonPath = path.join(config.reportDir, `performance-report-${config.timestamp}.json`);
  const htmlPath = path.join(config.reportDir, `performance-report-${config.timestamp}.html`);
  
  // Save JSON report
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  
  // Generate appropriate report format
  let outputPath = jsonPath;
  
  if (format === 'html') {
    // Generate HTML report with charts
    await generateHtmlReport(results, htmlPath, config);
    outputPath = htmlPath;
  }
  
  return outputPath;
}

/**
 * Generate an HTML report with charts
 */
async function generateHtmlReport(results, outputPath, config) {
  // Create chart images
  const chartImagesDir = path.join(config.reportDir, 'charts');
  if (!fs.existsSync(chartImagesDir)) {
    fs.mkdirSync(chartImagesDir, { recursive: true });
  }
  
  const chartImages = await generateChartImages(results, chartImagesDir, config);
  
  // Build HTML content
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AeroSuite Performance Report - ${new Date(config.timestamp.replace(/-/g, ':')).toLocaleString()}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #2c3e50;
    }
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    .report-header h1 {
      margin: 0;
    }
    .report-meta {
      color: #7f8c8d;
      font-size: 0.9em;
    }
    .card {
      background: white;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      padding: 20px;
      margin-bottom: 20px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .metric-card {
      background: white;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      padding: 15px;
      text-align: center;
    }
    .metric-value {
      font-size: 2em;
      font-weight: bold;
      margin: 10px 0;
    }
    .metric-label {
      font-size: 0.9em;
      color: #7f8c8d;
      text-transform: uppercase;
    }
    .charts-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .chart-card {
      background: white;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      padding: 20px;
    }
    .chart-image {
      width: 100%;
      height: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f8f9fa;
      font-weight: 600;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
    .recommendations {
      background: #f1f9ff;
      border-left: 4px solid #3498db;
      padding: 15px 20px;
      margin-bottom: 30px;
    }
    .recommendations h3 {
      margin-top: 0;
      color: #3498db;
    }
    .recommendations ul {
      margin-bottom: 0;
    }
    .good {
      color: #27ae60;
    }
    .warning {
      color: #f39c12;
    }
    .critical {
      color: #e74c3c;
    }
    footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      color: #7f8c8d;
      font-size: 0.9em;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="report-header">
    <div>
      <h1>AeroSuite Performance Report</h1>
      <div class="report-meta">
        Generated on ${new Date(config.timestamp.replace(/-/g, ':')).toLocaleString()}
      </div>
    </div>
    <div class="report-meta">
      <div>Duration: ${config.duration} seconds</div>
      <div>Concurrent Users: ${config.users}</div>
      <div>Ramp-up Period: ${config.rampUp} seconds</div>
    </div>
  </div>

  <h2>Summary</h2>

  <div class="metrics-grid">
    ${generateMetricCards(results)}
  </div>

  <div class="recommendations">
    <h3>Recommendations</h3>
    <ul>
      ${generateRecommendationsList(results)}
    </ul>
  </div>

  <h2>Charts</h2>
  
  <div class="charts-container">
    ${generateChartHtml(chartImages)}
  </div>

  <h2>Detailed Results</h2>
  
  ${generateDetailedTables(results)}

  <footer>
    Generated by AeroSuite Performance Testing System
  </footer>
</body>
</html>
  `;
  
  // Write HTML file
  fs.writeFileSync(outputPath, htmlContent);
  
  return outputPath;
}

/**
 * Generate metric cards HTML
 */
function generateMetricCards(results) {
  let html = '';
  
  // API metrics
  if (results.api && results.api.summary) {
    const { avgResponseTime, requestsPerSecond, errorRate } = results.api.summary;
    
    html += `
      <div class="metric-card">
        <div class="metric-label">API Avg Response Time</div>
        <div class="metric-value ${getMetricClass(avgResponseTime, 200, 500)}">${avgResponseTime.toFixed(2)} ms</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">API Requests Per Second</div>
        <div class="metric-value">${requestsPerSecond.toFixed(2)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">API Error Rate</div>
        <div class="metric-value ${getMetricClass(errorRate, 1, 5, true)}">${errorRate.toFixed(2)}%</div>
      </div>
    `;
  }
  
  // Frontend metrics
  if (results.frontend && results.frontend.summary) {
    const { avgLoadTime, avgRenderTime } = results.frontend.summary;
    
    html += `
      <div class="metric-card">
        <div class="metric-label">Frontend Avg Load Time</div>
        <div class="metric-value ${getMetricClass(avgLoadTime, 1000, 3000)}">${avgLoadTime.toFixed(2)} ms</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Frontend Avg Render Time</div>
        <div class="metric-value ${getMetricClass(avgRenderTime, 50, 150)}">${avgRenderTime.toFixed(2)} ms</div>
      </div>
    `;
  }
  
  // Database metrics
  if (results.database && results.database.summary) {
    const { avgQueryTime, slowestQueryTime } = results.database.summary;
    
    html += `
      <div class="metric-card">
        <div class="metric-label">DB Avg Query Time</div>
        <div class="metric-value ${getMetricClass(avgQueryTime, 50, 200)}">${avgQueryTime.toFixed(2)} ms</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">DB Slowest Query Time</div>
        <div class="metric-value ${getMetricClass(slowestQueryTime, 200, 500)}">${slowestQueryTime.toFixed(2)} ms</div>
      </div>
    `;
  }
  
  // System metrics
  if (results.system && results.system.summary) {
    const { sustainableRPS, cpuUtilization, memoryUtilization } = results.system.summary;
    
    html += `
      <div class="metric-card">
        <div class="metric-label">Sustainable RPS</div>
        <div class="metric-value">${sustainableRPS.toFixed(2)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">CPU Utilization</div>
        <div class="metric-value ${getMetricClass(cpuUtilization, 60, 80, true)}">${cpuUtilization.toFixed(2)}%</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Memory Utilization</div>
        <div class="metric-value">${memoryUtilization.toFixed(2)} MB</div>
      </div>
    `;
  }
  
  return html;
}

/**
 * Generate recommendations list HTML
 */
function generateRecommendationsList(results) {
  let recommendations = [];
  
  // Collect all recommendations
  if (results.api && results.api.recommendations) {
    recommendations = recommendations.concat(results.api.recommendations);
  }
  if (results.frontend && results.frontend.recommendations) {
    recommendations = recommendations.concat(results.frontend.recommendations);
  }
  if (results.database && results.database.recommendations) {
    recommendations = recommendations.concat(results.database.recommendations);
  }
  if (results.system && results.system.recommendations) {
    recommendations = recommendations.concat(results.system.recommendations);
  }
  
  if (recommendations.length === 0) {
    return '<li>No recommendations at this time.</li>';
  }
  
  return recommendations.map(rec => `<li>${rec}</li>`).join('\n');
}

/**
 * Generate chart HTML
 */
function generateChartHtml(chartImages) {
  return Object.entries(chartImages)
    .map(([name, path]) => {
      // Convert file path to relative path
      const relativePath = path.split('/').slice(-2).join('/');
      return `
        <div class="chart-card">
          <h3>${formatChartName(name)}</h3>
          <img class="chart-image" src="${relativePath}" alt="${formatChartName(name)}">
        </div>
      `;
    })
    .join('\n');
}

/**
 * Generate detailed tables HTML
 */
function generateDetailedTables(results) {
  let html = '';
  
  // API results table
  if (results.api && results.api.results && results.api.results.length > 0) {
    html += `
      <h3>API Performance Details</h3>
      <table>
        <thead>
          <tr>
            <th>Endpoint</th>
            <th>Method</th>
            <th>Avg Response Time (ms)</th>
            <th>P95 Latency (ms)</th>
            <th>Requests/Sec</th>
            <th>Success</th>
          </tr>
        </thead>
        <tbody>
          ${results.api.results.map(r => `
            <tr>
              <td>${r.endpoint || '-'}</td>
              <td>${r.method || '-'}</td>
              <td class="${getMetricClass(r.latencyAvg, 200, 500)}">${r.latencyAvg?.toFixed(2) || '-'}</td>
              <td class="${getMetricClass(r.latencyP95, 500, 1000)}">${r.latencyP95?.toFixed(2) || '-'}</td>
              <td>${r.requestsPerSecond?.toFixed(2) || '-'}</td>
              <td>${r.success ? '✅' : '❌'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
  
  // Frontend results table
  if (results.frontend && results.frontend.results && results.frontend.results.length > 0) {
    html += `
      <h3>Frontend Performance Details</h3>
      <table>
        <thead>
          <tr>
            <th>Page</th>
            <th>First Paint (ms)</th>
            <th>First Contentful Paint (ms)</th>
            <th>Load Time (ms)</th>
            <th>JS Heap (MB)</th>
            <th>Success</th>
          </tr>
        </thead>
        <tbody>
          ${results.frontend.results.map(r => `
            <tr>
              <td>${r.page || '-'}</td>
              <td>${r.firstPaint?.toFixed(2) || '-'}</td>
              <td>${r.firstContentfulPaint?.toFixed(2) || '-'}</td>
              <td class="${getMetricClass(r.load, 1000, 3000)}">${r.load?.toFixed(2) || '-'}</td>
              <td>${r.jsHeapUsed?.toFixed(2) || '-'}</td>
              <td>${r.success ? '✅' : '❌'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
  
  // Database results table
  if (results.database && results.database.results && results.database.results.length > 0) {
    html += `
      <h3>Database Performance Details</h3>
      <table>
        <thead>
          <tr>
            <th>Query</th>
            <th>Collection</th>
            <th>Operation</th>
            <th>Avg Duration (ms)</th>
            <th>Avg Result Count</th>
            <th>Success</th>
          </tr>
        </thead>
        <tbody>
          ${results.database.results.map(r => `
            <tr>
              <td>${r.query || '-'}</td>
              <td>${r.collection || '-'}</td>
              <td>${r.operation || '-'}</td>
              <td class="${getMetricClass(r.avgDuration, 50, 200)}">${r.avgDuration?.toFixed(2) || '-'}</td>
              <td>${r.avgResultCount || '-'}</td>
              <td>${r.success ? '✅' : '❌'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
  
  // System load test results table
  if (results.system && results.system.results && results.system.results.length > 0) {
    html += `
      <h3>System Load Test Details</h3>
      <table>
        <thead>
          <tr>
            <th>Scenario</th>
            <th>Avg Latency (ms)</th>
            <th>P95 Latency (ms)</th>
            <th>Requests/Sec</th>
            <th>Avg CPU (%)</th>
            <th>Avg Memory (MB)</th>
            <th>Success</th>
          </tr>
        </thead>
        <tbody>
          ${results.system.results.map(r => `
            <tr>
              <td>${r.scenario || '-'}</td>
              <td class="${getMetricClass(r.latencyAvg, 200, 500)}">${r.latencyAvg?.toFixed(2) || '-'}</td>
              <td class="${getMetricClass(r.latencyP95, 500, 1000)}">${r.latencyP95?.toFixed(2) || '-'}</td>
              <td>${r.requestsPerSecond?.toFixed(2) || '-'}</td>
              <td class="${getMetricClass(r.resourceStats?.avgCpu, 60, 80, true)}">${r.resourceStats?.avgCpu?.toFixed(2) || '-'}</td>
              <td>${r.resourceStats?.avgMemory?.toFixed(2) || '-'}</td>
              <td>${r.success ? '✅' : '❌'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
  
  return html;
}

/**
 * Generate chart images
 */
async function generateChartImages(results, outputDir, config) {
  const chartImages = {};
  const width = 600;
  const height = 400;
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });
  
  // API response time chart
  if (results.api && results.api.results && results.api.results.length > 0) {
    try {
      const apiResults = results.api.results.filter(r => r.success);
      
      if (apiResults.length > 0) {
        const configuration = {
          type: 'bar',
          data: {
            labels: apiResults.map(r => `${r.method} ${r.endpoint}`),
            datasets: [
              {
                label: 'Avg Response Time (ms)',
                data: apiResults.map(r => r.latencyAvg),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 1
              },
              {
                label: 'P95 Response Time (ms)',
                data: apiResults.map(r => r.latencyP95),
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgb(255, 99, 132)',
                borderWidth: 1
              }
            ]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'API Response Times'
              },
              legend: {
                position: 'top',
              }
            }
          }
        };
        
        const image = await chartJSNodeCanvas.renderToBuffer(configuration);
        const outputPath = path.join(outputDir, `api-response-times-${config.timestamp}.png`);
        fs.writeFileSync(outputPath, image);
        chartImages['api-response-times'] = outputPath;
      }
    } catch (error) {
      console.error('Error generating API response time chart:', error);
    }
  }
  
  // Frontend load time chart
  if (results.frontend && results.frontend.results && results.frontend.results.length > 0) {
    try {
      const frontendResults = results.frontend.results.filter(r => r.success);
      
      if (frontendResults.length > 0) {
        const configuration = {
          type: 'bar',
          data: {
            labels: frontendResults.map(r => r.page),
            datasets: [
              {
                label: 'First Paint (ms)',
                data: frontendResults.map(r => r.firstPaint),
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgb(75, 192, 192)',
                borderWidth: 1
              },
              {
                label: 'First Contentful Paint (ms)',
                data: frontendResults.map(r => r.firstContentfulPaint),
                backgroundColor: 'rgba(255, 159, 64, 0.5)',
                borderColor: 'rgb(255, 159, 64)',
                borderWidth: 1
              },
              {
                label: 'Load Time (ms)',
                data: frontendResults.map(r => r.load),
                backgroundColor: 'rgba(153, 102, 255, 0.5)',
                borderColor: 'rgb(153, 102, 255)',
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Frontend Load Times'
              },
              legend: {
                position: 'top',
              }
            }
          }
        };
        
        const image = await chartJSNodeCanvas.renderToBuffer(configuration);
        const outputPath = path.join(outputDir, `frontend-load-times-${config.timestamp}.png`);
        fs.writeFileSync(outputPath, image);
        chartImages['frontend-load-times'] = outputPath;
      }
    } catch (error) {
      console.error('Error generating frontend load time chart:', error);
    }
  }
  
  // Database query time chart
  if (results.database && results.database.results && results.database.results.length > 0) {
    try {
      const dbResults = results.database.results.filter(r => r.success);
      
      if (dbResults.length > 0) {
        const configuration = {
          type: 'bar',
          data: {
            labels: dbResults.map(r => r.query),
            datasets: [
              {
                label: 'Avg Query Time (ms)',
                data: dbResults.map(r => r.avgDuration),
                backgroundColor: 'rgba(255, 206, 86, 0.5)',
                borderColor: 'rgb(255, 206, 86)',
                borderWidth: 1
              }
            ]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Database Query Times'
              },
              legend: {
                position: 'top',
              }
            }
          }
        };
        
        const image = await chartJSNodeCanvas.renderToBuffer(configuration);
        const outputPath = path.join(outputDir, `database-query-times-${config.timestamp}.png`);
        fs.writeFileSync(outputPath, image);
        chartImages['database-query-times'] = outputPath;
      }
    } catch (error) {
      console.error('Error generating database query time chart:', error);
    }
  }
  
  // System load test chart
  if (results.system && results.system.results && results.system.results.length > 0) {
    try {
      const systemResults = results.system.results.filter(r => r.success);
      
      if (systemResults.length > 0) {
        const configuration = {
          type: 'bar',
          data: {
            labels: systemResults.map(r => r.scenario),
            datasets: [
              {
                label: 'Avg Response Time (ms)',
                data: systemResults.map(r => r.latencyAvg),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 1,
                yAxisID: 'y'
              },
              {
                label: 'Requests/Sec',
                data: systemResults.map(r => r.requestsPerSecond),
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgb(255, 99, 132)',
                borderWidth: 1,
                yAxisID: 'y1'
              }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'System Load Test Results'
              },
              legend: {
                position: 'top',
              }
            },
            scales: {
              y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                  display: true,
                  text: 'Response Time (ms)'
                }
              },
              y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                  display: true,
                  text: 'Requests/Sec'
                },
                grid: {
                  drawOnChartArea: false
                }
              }
            }
          }
        };
        
        const image = await chartJSNodeCanvas.renderToBuffer(configuration);
        const outputPath = path.join(outputDir, `system-load-test-${config.timestamp}.png`);
        fs.writeFileSync(outputPath, image);
        chartImages['system-load-test'] = outputPath;
      }
    } catch (error) {
      console.error('Error generating system load test chart:', error);
    }
  }
  
  // System resource usage chart
  if (results.system && results.system.results && results.system.results.length > 0) {
    try {
      const systemResults = results.system.results.filter(r => r.success && r.resourceStats);
      
      if (systemResults.length > 0) {
        const configuration = {
          type: 'bar',
          data: {
            labels: systemResults.map(r => r.scenario),
            datasets: [
              {
                label: 'CPU Utilization (%)',
                data: systemResults.map(r => r.resourceStats.avgCpu),
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgb(75, 192, 192)',
                borderWidth: 1,
                yAxisID: 'y'
              },
              {
                label: 'Memory Usage (MB)',
                data: systemResults.map(r => r.resourceStats.avgMemory),
                backgroundColor: 'rgba(153, 102, 255, 0.5)',
                borderColor: 'rgb(153, 102, 255)',
                borderWidth: 1,
                yAxisID: 'y1'
              }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'System Resource Usage'
              },
              legend: {
                position: 'top',
              }
            },
            scales: {
              y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                  display: true,
                  text: 'CPU (%)'
                },
                min: 0,
                max: 100
              },
              y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                  display: true,
                  text: 'Memory (MB)'
                },
                grid: {
                  drawOnChartArea: false
                }
              }
            }
          }
        };
        
        const image = await chartJSNodeCanvas.renderToBuffer(configuration);
        const outputPath = path.join(outputDir, `system-resource-usage-${config.timestamp}.png`);
        fs.writeFileSync(outputPath, image);
        chartImages['system-resource-usage'] = outputPath;
      }
    } catch (error) {
      console.error('Error generating system resource usage chart:', error);
    }
  }
  
  return chartImages;
}

/**
 * Get CSS class for a metric based on thresholds
 */
function getMetricClass(value, warningThreshold, criticalThreshold, higherIsBad = false) {
  if (value === undefined || value === null) {
    return '';
  }
  
  if (higherIsBad) {
    if (value >= criticalThreshold) return 'critical';
    if (value >= warningThreshold) return 'warning';
    return 'good';
  } else {
    if (value >= criticalThreshold) return 'critical';
    if (value >= warningThreshold) return 'warning';
    return 'good';
  }
}

/**
 * Format chart name for display
 */
function formatChartName(name) {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

module.exports = {
  generateReport
}; 