/**
 * Auto-Scaling Test Visualizer
 * 
 * This script generates visual charts from auto-scaling test results.
 * It converts JSON test reports into HTML charts for easier analysis.
 * 
 * Implements RF040 - Test scaling under load
 * 
 * Usage:
 *  - Basic: node auto-scaling-visualizer.js --file=auto-scaling-test-report.json
 */

const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('file', {
    alias: 'f',
    description: 'Input report file path',
    type: 'string',
    demandOption: true
  })
  .option('output', {
    alias: 'o',
    description: 'Output HTML file path',
    type: 'string',
    default: ''
  })
  .option('title', {
    alias: 't',
    description: 'Report title',
    type: 'string',
    default: 'Auto-Scaling Test Results'
  })
  .help()
  .alias('help', 'h')
  .argv;

/**
 * Generate HTML report with charts
 * @param {string} inputFile - Path to input JSON file
 * @param {string} outputFile - Path to output HTML file
 * @param {string} title - Report title
 */
function generateReport(inputFile, outputFile, title) {
  try {
    // Read input file
    const reportData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    
    // Generate default output filename if not provided
    if (!outputFile) {
      const inputBasename = path.basename(inputFile, '.json');
      outputFile = path.join(path.dirname(inputFile), `${inputBasename}.html`);
    }
    
    // Generate HTML
    const html = generateHtml(reportData, title);
    
    // Write HTML file
    fs.writeFileSync(outputFile, html);
    console.log(`Report generated: ${outputFile}`);
  } catch (error) {
    console.error(`Error generating report: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Generate HTML content with charts
 * @param {Object} data - Report data
 * @param {string} title - Report title
 * @returns {string} HTML content
 */
function generateHtml(data, title) {
  // Format dates
  const testDate = new Date(data.metrics.instanceCounts[0]?.timestamp || data.summary.testDuration).toLocaleString();
  
  // Prepare chart data
  const timestamps = data.metrics.cpuUtilization.map(m => new Date(m.timestamp).toISOString());
  const cpuData = data.metrics.cpuUtilization.map(m => (m.value * 100).toFixed(1));
  const memoryData = data.metrics.memoryUtilization.map(m => (m.value * 100).toFixed(1));
  const requestsData = data.metrics.requestsPerSecond.map(m => m.value.toFixed(1));
  
  // Prepare instance count data
  const instanceTimestamps = data.metrics.instanceCounts
    .filter(i => i.value !== null)
    .map(m => new Date(m.timestamp).toISOString());
  const instanceCounts = data.metrics.instanceCounts
    .filter(i => i.value !== null)
    .map(m => m.value);
  
  // Prepare scaling events markers
  const scalingEvents = data.metrics.scalingEvents.map(event => ({
    timestamp: new Date(event.timestamp).toISOString(),
    direction: event.direction,
    label: `${event.previousCount} → ${event.currentCount}`
  }));
  
  // Generate HTML template
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 20px;
      color: #333;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    h1, h2 {
      color: #2c3e50;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }
    .metric-card {
      background-color: #f8f9fa;
      border-radius: 6px;
      padding: 15px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }
    .metric-title {
      font-size: 14px;
      color: #6c757d;
      margin-bottom: 5px;
    }
    .metric-value {
      font-size: 24px;
      font-weight: bold;
      color: #343a40;
    }
    .chart-container {
      margin-bottom: 30px;
      height: 300px;
    }
    .config-section {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 30px;
    }
    .config-title {
      font-weight: bold;
      margin-bottom: 10px;
    }
    .config-item {
      display: grid;
      grid-template-columns: 200px 1fr;
      margin-bottom: 5px;
    }
    .config-label {
      font-weight: 500;
    }
    .scaling-events {
      margin-bottom: 30px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid #dee2e6;
    }
    th {
      background-color: #f8f9fa;
    }
    tr:nth-child(even) {
      background-color: #f8f9fa;
    }
    .up {
      color: #28a745;
    }
    .down {
      color: #dc3545;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <p>Test conducted on ${testDate} with pattern: <strong>${data.config.pattern}</strong></p>
    
    <div class="summary">
      <div class="metric-card">
        <div class="metric-title">Test Duration</div>
        <div class="metric-value">${(data.summary.testDuration / 1000).toFixed(1)}s</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Total Requests</div>
        <div class="metric-value">${data.summary.totalRequests.toLocaleString()}</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Success Rate</div>
        <div class="metric-value">${data.summary.successRate.toFixed(1)}%</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Avg Response Time</div>
        <div class="metric-value">${data.summary.avgResponseTime.toFixed(1)}ms</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Requests/Second</div>
        <div class="metric-value">${data.summary.requestsPerSecond.toFixed(1)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Scaling Events</div>
        <div class="metric-value">${data.summary.scalingEvents}</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Instance Range</div>
        <div class="metric-value">${data.summary.minInstances} - ${data.summary.maxInstances}</div>
      </div>
    </div>
    
    <h2>Resource Utilization</h2>
    <div class="chart-container">
      <canvas id="resourceChart"></canvas>
    </div>
    
    <h2>Instance Count</h2>
    <div class="chart-container">
      <canvas id="instanceChart"></canvas>
    </div>
    
    <h2>Requests per Second</h2>
    <div class="chart-container">
      <canvas id="requestsChart"></canvas>
    </div>
    
    <h2>Scaling Events</h2>
    <div class="scaling-events">
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Direction</th>
            <th>Change</th>
          </tr>
        </thead>
        <tbody>
          ${data.metrics.scalingEvents.map(event => `
            <tr>
              <td>${new Date(event.timestamp).toLocaleString()}</td>
              <td class="${event.direction}">${event.direction.toUpperCase()}</td>
              <td>${event.previousCount} → ${event.currentCount}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <h2>Test Configuration</h2>
    <div class="config-section">
      <div class="config-item">
        <div class="config-label">Pattern:</div>
        <div>${data.config.pattern}</div>
      </div>
      <div class="config-item">
        <div class="config-label">Duration:</div>
        <div>${data.config.testDurationSec} seconds</div>
      </div>
      <div class="config-item">
        <div class="config-label">Target URL:</div>
        <div>${data.config.targetUrl}</div>
      </div>
      <div class="config-item">
        <div class="config-label">Max Users:</div>
        <div>${data.config.maxUsers}</div>
      </div>
      <div class="config-item">
        <div class="config-label">Workers:</div>
        <div>${data.config.workers}</div>
      </div>
      <div class="config-item">
        <div class="config-label">Monitor Interval:</div>
        <div>${data.config.monitorIntervalSec} seconds</div>
      </div>
    </div>
  </div>

  <script>
    // Format timestamps for charts
    function formatTimestamps(timestamps) {
      return timestamps.map(ts => new Date(ts));
    }
    
    // Resource utilization chart
    const resourceCtx = document.getElementById('resourceChart').getContext('2d');
    new Chart(resourceCtx, {
      type: 'line',
      data: {
        labels: formatTimestamps(${JSON.stringify(timestamps)}),
        datasets: [
          {
            label: 'CPU Usage (%)',
            data: ${JSON.stringify(cpuData)},
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.2
          },
          {
            label: 'Memory Usage (%)',
            data: ${JSON.stringify(memoryData)},
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'minute',
              displayFormats: {
                minute: 'HH:mm:ss'
              }
            },
            title: {
              display: true,
              text: 'Time'
            }
          },
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Percentage (%)'
            }
          }
        }
      }
    });
    
    // Instance count chart
    const instanceCtx = document.getElementById('instanceChart').getContext('2d');
    const instanceChart = new Chart(instanceCtx, {
      type: 'line',
      data: {
        labels: formatTimestamps(${JSON.stringify(instanceTimestamps)}),
        datasets: [
          {
            label: 'Instance Count',
            data: ${JSON.stringify(instanceCounts)},
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            borderWidth: 2,
            fill: true,
            stepped: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'minute',
              displayFormats: {
                minute: 'HH:mm:ss'
              }
            },
            title: {
              display: true,
              text: 'Time'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Instance Count'
            },
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
    
    // Requests per second chart
    const requestsCtx = document.getElementById('requestsChart').getContext('2d');
    new Chart(requestsCtx, {
      type: 'line',
      data: {
        labels: formatTimestamps(${JSON.stringify(timestamps)}),
        datasets: [
          {
            label: 'Requests/Second',
            data: ${JSON.stringify(requestsData)},
            borderColor: 'rgba(153, 102, 255, 1)',
            backgroundColor: 'rgba(153, 102, 255, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'minute',
              displayFormats: {
                minute: 'HH:mm:ss'
              }
            },
            title: {
              display: true,
              text: 'Time'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Requests/Second'
            }
          }
        }
      }
    });
    
    // Add scaling events as annotations to instance chart
    const scalingEvents = ${JSON.stringify(scalingEvents)};
    if (scalingEvents.length > 0) {
      instanceChart.options.plugins = instanceChart.options.plugins || {};
      instanceChart.options.plugins.annotation = {
        annotations: scalingEvents.map((event, index) => ({
          type: 'line',
          mode: 'vertical',
          scaleID: 'x',
          value: new Date(event.timestamp),
          borderColor: event.direction === 'up' ? 'rgba(40, 167, 69, 0.7)' : 'rgba(220, 53, 69, 0.7)',
          borderWidth: 2,
          label: {
            content: event.label,
            enabled: true,
            position: 'top'
          }
        }))
      };
      instanceChart.update();
    }
  </script>
</body>
</html>`;
}

// Run the script
generateReport(argv.file, argv.output, argv.title); 