#!/usr/bin/env node

/**
 * Auto-Scaling Analysis Script
 * 
 * This script analyzes and visualizes auto-scaling behavior in the AeroSuite system.
 * It generates a report showing how effectively the system scales under different loads.
 * 
 * Task: PERF009 - Auto-scaling Optimization
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { parse } = require('csv-parse/sync');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

// Configuration
const config = {
  outputDir: path.join(__dirname, '../..', 'reports', 'performance'),
  dataFile: process.env.DATA_FILE,
  targetUrl: process.env.TARGET_URL || 'http://localhost:5000',
  refreshInterval: parseInt(process.env.REFRESH_INTERVAL || 5000), // 5 seconds
  fetchMetrics: process.env.FETCH_METRICS !== 'false',
  reportName: process.env.REPORT_NAME || `scaling-report-${new Date().toISOString().split('T')[0]}`
};

// Ensure output directory exists
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

// Initialize chart renderer
const chartRenderer = new ChartJSNodeCanvas({
  width: 800,
  height: 400,
  backgroundColour: 'white'
});

/**
 * Fetch current scaling metrics from the API
 * @returns {Promise<Object>} Scaling metrics
 */
async function fetchScalingMetrics() {
  try {
    const response = await axios.get(`${config.targetUrl}/api/internal/scaling-metrics`);
    return response.data;
  } catch (error) {
    console.error('Error fetching scaling metrics:', error.message);
    return null;
  }
}

/**
 * Load historical scaling data from CSV
 * @returns {Array} Historical scaling data
 */
function loadHistoricalData() {
  if (!config.dataFile || !fs.existsSync(config.dataFile)) {
    console.warn(`Data file not found: ${config.dataFile}`);
    return [];
  }
  
  try {
    const fileContent = fs.readFileSync(config.dataFile, 'utf8');
    return parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
  } catch (error) {
    console.error('Error loading historical data:', error);
    return [];
  }
}

/**
 * Generate line chart for response time vs load
 * @param {Array} data - Time series data
 * @returns {Promise<Buffer>} Chart image buffer
 */
async function generateResponseTimeChart(data) {
  const timestamps = data.map(d => new Date(d.timestamp).toLocaleTimeString());
  const responseTimesAvg = data.map(d => d.avgResponseTime);
  const nodeCounts = data.map(d => d.nodeCount);
  const requestCounts = data.map(d => d.requestsPerMinute);
  
  const chartConfig = {
    type: 'line',
    data: {
      labels: timestamps,
      datasets: [
        {
          label: 'Avg Response Time (ms)',
          data: responseTimesAvg,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
          yAxisID: 'y'
        },
        {
          label: 'Node Count',
          data: nodeCounts,
          borderColor: 'rgb(255, 99, 132)',
          tension: 0.1,
          yAxisID: 'y1'
        },
        {
          label: 'Requests per Minute',
          data: requestCounts,
          borderColor: 'rgb(54, 162, 235)',
          tension: 0.1,
          yAxisID: 'y2'
        }
      ]
    },
    options: {
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
            text: 'Node Count'
          },
          grid: {
            drawOnChartArea: false
          }
        },
        y2: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Requests per Minute'
          },
          grid: {
            drawOnChartArea: false
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Auto-Scaling Performance Analysis'
        }
      }
    }
  };
  
  return await chartRenderer.renderToBuffer(chartConfig);
}

/**
 * Generate efficiency chart
 * @param {Array} data - Time series data
 * @returns {Promise<Buffer>} Chart image buffer
 */
async function generateEfficiencyChart(data) {
  // Calculate efficiency metrics
  const efficiencyData = data.map((d, i) => {
    if (i === 0 || data[i-1].nodeCount === 0) return { timestamp: d.timestamp, efficiency: 0 };
    
    const prevNodeCount = data[i-1].nodeCount;
    const prevRequestRate = data[i-1].requestsPerMinute;
    const currentNodeCount = d.nodeCount;
    const currentRequestRate = d.requestsPerMinute;
    
    // Calculate scaling efficiency as ratio of throughput increase to node count increase
    const nodeRatio = currentNodeCount / prevNodeCount;
    const requestRatio = currentRequestRate / prevRequestRate;
    
    // If we're scaling down, or not scaling, set efficiency to 1
    if (nodeRatio <= 1 || nodeRatio === 1) return { timestamp: d.timestamp, efficiency: 1 };
    
    // Otherwise, calculate efficiency as ratio of throughput increase to node count increase
    const efficiency = requestRatio / nodeRatio;
    return {
      timestamp: d.timestamp,
      efficiency: Math.min(Math.max(efficiency, 0), 1) // Clamp between 0 and 1
    };
  });
  
  const timestamps = efficiencyData.map(d => new Date(d.timestamp).toLocaleTimeString());
  const efficiencies = efficiencyData.map(d => d.efficiency);
  
  const chartConfig = {
    type: 'line',
    data: {
      labels: timestamps,
      datasets: [
        {
          label: 'Scaling Efficiency',
          data: efficiencies,
          borderColor: 'rgb(255, 159, 64)',
          backgroundColor: 'rgba(255, 159, 64, 0.2)',
          fill: true,
          tension: 0.1
        }
      ]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: 1,
          title: {
            display: true,
            text: 'Efficiency (0-1)'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Auto-Scaling Efficiency'
        }
      }
    }
  };
  
  return await chartRenderer.renderToBuffer(chartConfig);
}

/**
 * Generate HTML report
 * @param {Array} data - Time series data
 * @param {Object} metrics - Current metrics
 * @param {Buffer} responseTimeChart - Response time chart image buffer
 * @param {Buffer} efficiencyChart - Efficiency chart image buffer
 * @returns {string} HTML report
 */
function generateHtmlReport(data, metrics, responseTimeChart, efficiencyChart) {
  // Calculate average metrics
  const avgResponseTime = data.reduce((sum, d) => sum + d.avgResponseTime, 0) / data.length;
  const avgNodeCount = data.reduce((sum, d) => sum + d.nodeCount, 0) / data.length;
  const avgRequestsPerMinute = data.reduce((sum, d) => sum + d.requestsPerMinute, 0) / data.length;
  
  // Calculate peak metrics
  const peakResponseTime = Math.max(...data.map(d => d.avgResponseTime));
  const peakNodeCount = Math.max(...data.map(d => d.nodeCount));
  const peakRequestsPerMinute = Math.max(...data.map(d => d.requestsPerMinute));
  
  // Calculate scaling efficiency
  let scalingEfficiency = 'N/A';
  if (metrics && metrics.scalingEfficiency) {
    scalingEfficiency = (metrics.scalingEfficiency.efficiency * 100).toFixed(1) + '%';
  }
  
  // Generate recommendations
  const recommendations = [];
  
  // Add recommendation based on response time
  if (avgResponseTime > 1000) {
    recommendations.push('Consider increasing minimum instance count to improve response times.');
  }
  
  // Add recommendation based on node count stability
  const nodeCountChanges = data.slice(1).filter((d, i) => d.nodeCount !== data[i].nodeCount).length;
  if (nodeCountChanges > data.length * 0.3) {
    recommendations.push('Increase stabilization window to reduce scaling oscillations.');
  }
  
  // Add recommendation based on efficiency
  if (scalingEfficiency !== 'N/A' && parseFloat(scalingEfficiency) < 70) {
    recommendations.push('Investigate application bottlenecks that limit scaling efficiency.');
  }
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Auto-Scaling Performance Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    h1, h2, h3 {
      color: #2c3e50;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .metrics {
      display: flex;
      flex-wrap: wrap;
      margin: 20px 0;
    }
    .metric-card {
      background-color: #f8f9fa;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin: 10px;
      padding: 15px;
      width: 200px;
    }
    .metric-title {
      color: #6c757d;
      font-size: 14px;
      margin-bottom: 5px;
    }
    .metric-value {
      color: #343a40;
      font-size: 24px;
      font-weight: bold;
    }
    .charts {
      margin: 30px 0;
    }
    .chart {
      margin-bottom: 30px;
    }
    .recommendations {
      background-color: #e9f7ef;
      border-left: 4px solid #27ae60;
      border-radius: 4px;
      margin: 20px 0;
      padding: 15px 20px;
    }
    .recommendation-item {
      margin: 10px 0;
    }
    .footer {
      border-top: 1px solid #ddd;
      color: #6c757d;
      font-size: 12px;
      margin-top: 40px;
      padding-top: 10px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Auto-Scaling Performance Report</h1>
    <p>Generated on ${new Date().toLocaleString()}</p>
    
    <h2>Summary</h2>
    <div class="metrics">
      <div class="metric-card">
        <div class="metric-title">Average Response Time</div>
        <div class="metric-value">${avgResponseTime.toFixed(1)} ms</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Average Node Count</div>
        <div class="metric-value">${avgNodeCount.toFixed(1)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Average Requests/min</div>
        <div class="metric-value">${avgRequestsPerMinute.toFixed(0)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Peak Response Time</div>
        <div class="metric-value">${peakResponseTime.toFixed(1)} ms</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Peak Node Count</div>
        <div class="metric-value">${peakNodeCount}</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Peak Requests/min</div>
        <div class="metric-value">${peakRequestsPerMinute.toFixed(0)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Scaling Efficiency</div>
        <div class="metric-value">${scalingEfficiency}</div>
      </div>
    </div>
    
    <div class="charts">
      <div class="chart">
        <h2>Response Time vs Node Count</h2>
        <img src="data:image/png;base64,${responseTimeChart.toString('base64')}" alt="Response Time Chart" style="max-width: 100%;">
      </div>
      
      <div class="chart">
        <h2>Scaling Efficiency</h2>
        <img src="data:image/png;base64,${efficiencyChart.toString('base64')}" alt="Efficiency Chart" style="max-width: 100%;">
      </div>
    </div>
    
    <h2>Recommendations</h2>
    <div class="recommendations">
      ${recommendations.length > 0 
        ? recommendations.map(rec => `<div class="recommendation-item">📊 ${rec}</div>`).join('') 
        : '<div class="recommendation-item">✅ No recommendations - Auto-scaling is functioning optimally.</div>'
      }
    </div>
    
    <div class="footer">
      <p>AeroSuite Auto-Scaling Performance Report | Task: PERF009 - Auto-scaling Optimization</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Analyzing auto-scaling performance...');
  
  // Load historical data or start with empty array
  let data = loadHistoricalData() || [];
  
  // If fetch metrics is enabled, fetch current metrics and add to data
  if (config.fetchMetrics) {
    console.log(`📊 Fetching metrics from ${config.targetUrl}`);
    
    let iterations = 0;
    const fetchInterval = setInterval(async () => {
      try {
        // Fetch metrics
        const metrics = await fetchScalingMetrics();
        
        if (metrics) {
          console.log(`✅ Fetched metrics: CPU ${(metrics.metrics.cpu * 100).toFixed(1)}%, Memory ${(metrics.metrics.memory * 100).toFixed(1)}%, Requests/min: ${metrics.metrics.requestsPerMinute}`);
          
          // Add to data
          data.push({
            timestamp: new Date().toISOString(),
            avgResponseTime: metrics.metrics.responseTime,
            nodeCount: metrics.metrics.nodeCount || 1, // Default to 1 if not provided
            requestsPerMinute: metrics.metrics.requestsPerMinute,
            cpu: metrics.metrics.cpu,
            memory: metrics.metrics.memory
          });
        }
        
        iterations++;
        
        // Stop after 30 iterations (2.5 minutes at 5 second intervals)
        if (iterations >= 30) {
          clearInterval(fetchInterval);
          await generateReport(data, metrics);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      }
    }, config.refreshInterval);
  } else {
    // Generate report with historical data
    const metrics = null;
    await generateReport(data, metrics);
  }
}

/**
 * Generate report
 * @param {Array} data - Time series data
 * @param {Object} metrics - Current metrics
 */
async function generateReport(data, metrics) {
  console.log(`📊 Generating report with ${data.length} data points`);
  
  try {
    // Generate charts
    const responseTimeChart = await generateResponseTimeChart(data);
    const efficiencyChart = await generateEfficiencyChart(data);
    
    // Generate HTML report
    const htmlReport = generateHtmlReport(data, metrics, responseTimeChart, efficiencyChart);
    
    // Write to file
    const reportPath = path.join(config.outputDir, `${config.reportName}.html`);
    fs.writeFileSync(reportPath, htmlReport);
    
    console.log(`✅ Report generated: ${reportPath}`);
    
    // Also save raw data as JSON
    const dataPath = path.join(config.outputDir, `${config.reportName}.json`);
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    
    console.log(`✅ Raw data saved: ${dataPath}`);
  } catch (error) {
    console.error('Error generating report:', error);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  main,
  generateReport
}; 