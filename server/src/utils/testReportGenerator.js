/**
 * Test Report Generator
 * 
 * @task TS357 - Test report generation implementation
 * 
 * This utility provides methods to generate comprehensive test reports
 * with various output formats and visualization options.
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('./logger');

class TestReportGenerator {
  /**
   * Create a new TestReportGenerator instance
   * @param {Object} options - Report generation options
   * @param {string} options.format - Output format (html, json, markdown, pdf)
   * @param {string} options.outputDir - Output directory
   * @param {string} options.title - Report title
   * @param {boolean} options.includeCoverage - Whether to include coverage data
   * @param {boolean} options.includeHistory - Whether to include historical data
   * @param {string} options.compareWith - Path to previous report for comparison
   * @param {number} options.threshold - Coverage threshold percentage
   * @param {boolean} options.includeScreenshots - Whether to include screenshots
   * @param {boolean} options.includeTimeline - Whether to include timeline visualization
   */
  constructor(options = {}) {
    this.options = {
      format: options.format || 'html',
      outputDir: options.outputDir || './test-reports',
      title: options.title || 'AeroSuite Test Report',
      includeCoverage: options.includeCoverage !== undefined ? options.includeCoverage : true,
      includeHistory: options.includeHistory !== undefined ? options.includeHistory : false,
      compareWith: options.compareWith || null,
      threshold: options.threshold || 70,
      includeScreenshots: options.includeScreenshots !== undefined ? options.includeScreenshots : false,
      includeTimeline: options.includeTimeline !== undefined ? options.includeTimeline : true
    };
    
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.reportDir = path.join(this.options.outputDir, this.timestamp);
    
    // Ensure output directory exists
    this.ensureDirectoryExists(this.reportDir);
  }
  
  /**
   * Ensure a directory exists
   * @param {string} dirPath - Directory path
   * @private
   */
  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
  
  /**
   * Generate a test report
   * @param {Object} testResults - Test results data
   * @param {Object} coverageData - Coverage data (optional)
   * @returns {string} - Path to the generated report
   */
  generateReport(testResults, coverageData = null) {
    logger.info(`Generating ${this.options.format} test report...`);
    
    let reportPath;
    
    // Generate report based on format
    switch (this.options.format.toLowerCase()) {
      case 'html':
        reportPath = this.generateHtmlReport(testResults, coverageData);
        break;
      case 'json':
        reportPath = this.generateJsonReport(testResults, coverageData);
        break;
      case 'markdown':
        reportPath = this.generateMarkdownReport(testResults, coverageData);
        break;
      case 'pdf':
        reportPath = this.generatePdfReport(testResults, coverageData);
        break;
      default:
        throw new Error(`Unsupported report format: ${this.options.format}`);
    }
    
    // Create a 'latest' symlink
    this.createLatestSymlink();
    
    logger.info(`Test report generated successfully: ${reportPath}`);
    return reportPath;
  }
  
  /**
   * Create a symlink to the latest report
   * @private
   */
  createLatestSymlink() {
    const latestDir = path.join(this.options.outputDir, 'latest');
    
    // Remove existing symlink if it exists
    if (fs.existsSync(latestDir)) {
      if (fs.lstatSync(latestDir).isSymbolicLink()) {
        fs.unlinkSync(latestDir);
      } else {
        logger.warn(`'latest' exists but is not a symlink: ${latestDir}`);
        return;
      }
    }
    
    // Create new symlink
    try {
      fs.symlinkSync(this.reportDir, latestDir, 'dir');
      logger.info(`Created 'latest' symlink: ${latestDir}`);
    } catch (error) {
      logger.error(`Failed to create 'latest' symlink: ${error.message}`);
    }
  }
  
  /**
   * Generate an HTML report
   * @param {Object} testResults - Test results data
   * @param {Object} coverageData - Coverage data
   * @returns {string} - Path to the generated report
   * @private
   */
  generateHtmlReport(testResults, coverageData) {
    // Process test data for visualization
    const processedData = this.processTestData(testResults);
    
    // Generate HTML content
    const html = this.generateHtmlContent(processedData, coverageData);
    
    // Write report to file
    const reportPath = path.join(this.reportDir, 'index.html');
    fs.writeFileSync(reportPath, html);
    
    return reportPath;
  }
  
  /**
   * Generate HTML content for the report
   * @param {Object} processedData - Processed test data
   * @param {Object} coverageData - Coverage data
   * @returns {string} - HTML content
   * @private
   */
  generateHtmlContent(processedData, coverageData) {
    const { summary, testSuites } = processedData;
    
    // Generate HTML with advanced visualization
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.options.title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.0.0/dist/chart.umd.min.js"></script>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .header { background-color: #f8f9fa; padding: 20px; margin-bottom: 30px; border-bottom: 1px solid #dee2e6; }
    .summary-cards { display: flex; justify-content: space-between; margin-bottom: 30px; flex-wrap: wrap; }
    .summary-card { flex: 1; min-width: 200px; margin: 10px; }
    .test-suite { margin-bottom: 30px; border: 1px solid #dee2e6; border-radius: 5px; overflow: hidden; }
    .test-suite-header { background-color: #f8f9fa; padding: 15px; border-bottom: 1px solid #dee2e6; }
    .test-case { padding: 15px; border-bottom: 1px solid #dee2e6; }
    .test-case:last-child { border-bottom: none; }
    .test-pass { color: #28a745; }
    .test-fail { color: #dc3545; }
    .test-skip { color: #6c757d; }
    .coverage-section { margin-top: 40px; }
    .chart-container { height: 300px; margin-bottom: 30px; }
    .progress-bar { height: 20px; margin-top: 5px; }
    .progress-fill-good { background-color: #28a745; }
    .progress-fill-warning { background-color: #ffc107; }
    .progress-fill-bad { background-color: #dc3545; }
    .timeline { margin-top: 40px; }
    .footer { margin-top: 50px; padding: 20px; background-color: #f8f9fa; border-top: 1px solid #dee2e6; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${this.options.title}</h1>
      <p>Generated on: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="summary-cards">
      <div class="card summary-card">
        <div class="card-body">
          <h5 class="card-title">Passing Tests</h5>
          <h2 class="card-text text-success">${summary.passed}</h2>
          <p class="card-text">${Math.round((summary.passed / summary.total) * 100)}% of total</p>
        </div>
      </div>
      <div class="card summary-card">
        <div class="card-body">
          <h5 class="card-title">Failing Tests</h5>
          <h2 class="card-text text-danger">${summary.failed}</h2>
          <p class="card-text">${Math.round((summary.failed / summary.total) * 100)}% of total</p>
        </div>
      </div>
      <div class="card summary-card">
        <div class="card-body">
          <h5 class="card-title">Skipped Tests</h5>
          <h2 class="card-text text-secondary">${summary.skipped}</h2>
          <p class="card-text">${Math.round((summary.skipped / summary.total) * 100)}% of total</p>
        </div>
      </div>
      <div class="card summary-card">
        <div class="card-body">
          <h5 class="card-title">Total Duration</h5>
          <h2 class="card-text text-primary">${summary.duration}ms</h2>
          <p class="card-text">Avg: ${Math.round(summary.duration / summary.total)}ms per test</p>
        </div>
      </div>
    </div>
    
    <div class="row">
      <div class="col-md-6">
        <div class="chart-container">
          <canvas id="testResultsChart"></canvas>
        </div>
      </div>
      ${coverageData ? `
      <div class="col-md-6">
        <div class="chart-container">
          <canvas id="coverageChart"></canvas>
        </div>
      </div>
      ` : ''}
    </div>
    
    <h2>Test Suites</h2>
    ${testSuites.map(suite => `
      <div class="test-suite">
        <div class="test-suite-header">
          <h3>${suite.name}</h3>
          <div class="d-flex justify-content-between">
            <div>Status: <span class="badge ${suite.status === 'passed' ? 'bg-success' : 'bg-danger'}">${suite.status}</span></div>
            <div>Duration: ${suite.duration}ms</div>
          </div>
        </div>
        ${suite.tests.map(test => `
          <div class="test-case">
            <div class="test-${test.status === 'passed' ? 'pass' : (test.status === 'failed' ? 'fail' : 'skip')}">
              <h5>${test.title}</h5>
              <div>Status: ${test.status}</div>
              ${test.duration ? `<div>Duration: ${test.duration}ms</div>` : ''}
            </div>
            ${test.failureMessages && test.failureMessages.length > 0 ? `
              <div class="alert alert-danger mt-3">
                <h6>Failure Details:</h6>
                <pre>${test.failureMessages.join('\n')}</pre>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `).join('')}
    
    ${coverageData ? `
      <div class="coverage-section">
        <h2>Code Coverage</h2>
        <table class="table table-striped">
          <thead>
            <tr>
              <th>File</th>
              <th>Statements</th>
              <th>Branches</th>
              <th>Functions</th>
              <th>Lines</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(coverageData).filter(([key]) => key !== 'total').map(([file, coverage]) => `
              <tr>
                <td>${file}</td>
                <td>
                  ${coverage.statements.pct}%
                  <div class="progress">
                    <div class="progress-bar ${coverage.statements.pct > 80 ? 'progress-fill-good' : (coverage.statements.pct > 50 ? 'progress-fill-warning' : 'progress-fill-bad')}" 
                         style="width: ${coverage.statements.pct}%;"></div>
                  </div>
                </td>
                <td>
                  ${coverage.branches.pct}%
                  <div class="progress">
                    <div class="progress-bar ${coverage.branches.pct > 80 ? 'progress-fill-good' : (coverage.branches.pct > 50 ? 'progress-fill-warning' : 'progress-fill-bad')}" 
                         style="width: ${coverage.branches.pct}%;"></div>
                  </div>
                </td>
                <td>
                  ${coverage.functions.pct}%
                  <div class="progress">
                    <div class="progress-bar ${coverage.functions.pct > 80 ? 'progress-fill-good' : (coverage.functions.pct > 50 ? 'progress-fill-warning' : 'progress-fill-bad')}" 
                         style="width: ${coverage.functions.pct}%;"></div>
                  </div>
                </td>
                <td>
                  ${coverage.lines.pct}%
                  <div class="progress">
                    <div class="progress-bar ${coverage.lines.pct > 80 ? 'progress-fill-good' : (coverage.lines.pct > 50 ? 'progress-fill-warning' : 'progress-fill-bad')}" 
                         style="width: ${coverage.lines.pct}%;"></div>
                  </div>
                </td>
              </tr>
            `).join('')}
            <tr class="table-active">
              <th>Total</th>
              <th>${coverageData.total.statements.pct}%</th>
              <th>${coverageData.total.branches.pct}%</th>
              <th>${coverageData.total.functions.pct}%</th>
              <th>${coverageData.total.lines.pct}%</th>
            </tr>
          </tbody>
        </table>
      </div>
    ` : ''}
    
    ${this.options.includeTimeline ? `
      <div class="timeline">
        <h2>Test Execution Timeline</h2>
        <div class="chart-container">
          <canvas id="timelineChart"></canvas>
        </div>
      </div>
    ` : ''}
    
    <div class="footer">
      <p>Generated by AeroSuite Test Report Generator (TS357)</p>
    </div>
  </div>
  
  <script>
    // Test Results Chart
    const testResultsCtx = document.getElementById('testResultsChart').getContext('2d');
    new Chart(testResultsCtx, {
      type: 'doughnut',
      data: {
        labels: ['Passed', 'Failed', 'Skipped'],
        datasets: [{
          data: [${summary.passed}, ${summary.failed}, ${summary.skipped}],
          backgroundColor: ['#28a745', '#dc3545', '#6c757d'],
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Test Results Summary'
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    });
    
    ${coverageData ? `
      // Coverage Chart
      const coverageCtx = document.getElementById('coverageChart').getContext('2d');
      new Chart(coverageCtx, {
        type: 'bar',
        data: {
          labels: ['Statements', 'Branches', 'Functions', 'Lines'],
          datasets: [{
            label: 'Coverage (%)',
            data: [
              ${coverageData.total.statements.pct},
              ${coverageData.total.branches.pct},
              ${coverageData.total.functions.pct},
              ${coverageData.total.lines.pct}
            ],
            backgroundColor: [
              ${coverageData.total.statements.pct > 80 ? "'#28a745'" : (coverageData.total.statements.pct > 50 ? "'#ffc107'" : "'#dc3545'")},
              ${coverageData.total.branches.pct > 80 ? "'#28a745'" : (coverageData.total.branches.pct > 50 ? "'#ffc107'" : "'#dc3545'")},
              ${coverageData.total.functions.pct > 80 ? "'#28a745'" : (coverageData.total.functions.pct > 50 ? "'#ffc107'" : "'#dc3545'")},
              ${coverageData.total.lines.pct > 80 ? "'#28a745'" : (coverageData.total.lines.pct > 50 ? "'#ffc107'" : "'#dc3545'")}
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Code Coverage Summary'
            },
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: {
                callback: function(value) {
                  return value + '%';
                }
              }
            }
          }
        }
      });
    ` : ''}
    
    ${this.options.includeTimeline ? `
      // Timeline Chart
      const timelineCtx = document.getElementById('timelineChart').getContext('2d');
      new Chart(timelineCtx, {
        type: 'bar',
        data: {
          labels: [${testSuites.map(suite => `'${suite.name.split('/').pop()}'`).join(', ')}],
          datasets: [{
            label: 'Duration (ms)',
            data: [${testSuites.map(suite => suite.duration).join(', ')}],
            backgroundColor: [${testSuites.map(suite => suite.status === 'passed' ? "'rgba(40, 167, 69, 0.7)'" : "'rgba(220, 53, 69, 0.7)'").join(', ')}],
            borderColor: [${testSuites.map(suite => suite.status === 'passed' ? "'rgb(40, 167, 69)'" : "'rgb(220, 53, 69)'").join(', ')}],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Test Suite Execution Duration'
            },
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    ` : ''}
  </script>
</body>
</html>
    `;
  }
  
  /**
   * Generate a JSON report
   * @param {Object} testResults - Test results data
   * @param {Object} coverageData - Coverage data
   * @returns {string} - Path to the generated report
   * @private
   */
  generateJsonReport(testResults, coverageData) {
    // Process test data
    const processedData = this.processTestData(testResults);
    
    // Create report object
    const report = {
      metadata: {
        title: this.options.title,
        timestamp: new Date().toISOString(),
        generator: 'AeroSuite Test Report Generator (TS357)'
      },
      summary: processedData.summary,
      testSuites: processedData.testSuites,
      coverage: coverageData
    };
    
    // Write report to file
    const reportPath = path.join(this.reportDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    return reportPath;
  }
  
  /**
   * Generate a Markdown report
   * @param {Object} testResults - Test results data
   * @param {Object} coverageData - Coverage data
   * @returns {string} - Path to the generated report
   * @private
   */
  generateMarkdownReport(testResults, coverageData) {
    // Process test data
    const processedData = this.processTestData(testResults);
    const { summary, testSuites } = processedData;
    
    // Create markdown content
    let markdown = `# ${this.options.title}\n\n`;
    markdown += `Generated on: ${new Date().toLocaleString()}\n\n`;
    
    // Summary
    markdown += `## Summary\n\n`;
    markdown += `- **Total Tests:** ${summary.total}\n`;
    markdown += `- **Passed:** ${summary.passed} (${Math.round((summary.passed / summary.total) * 100)}%)\n`;
    markdown += `- **Failed:** ${summary.failed} (${Math.round((summary.failed / summary.total) * 100)}%)\n`;
    markdown += `- **Skipped:** ${summary.skipped} (${Math.round((summary.skipped / summary.total) * 100)}%)\n`;
    markdown += `- **Total Duration:** ${summary.duration}ms\n\n`;
    
    // Test Suites
    markdown += `## Test Suites\n\n`;
    testSuites.forEach(suite => {
      markdown += `### ${suite.name}\n\n`;
      markdown += `- **Status:** ${suite.status}\n`;
      markdown += `- **Duration:** ${suite.duration}ms\n\n`;
      
      markdown += `| Test | Status | Duration |\n`;
      markdown += `| ---- | ------ | -------- |\n`;
      
      suite.tests.forEach(test => {
        const statusEmoji = test.status === 'passed' ? '✅' : (test.status === 'failed' ? '❌' : '⚠️');
        markdown += `| ${test.title} | ${statusEmoji} ${test.status} | ${test.duration || '-'}ms |\n`;
        
        if (test.failureMessages && test.failureMessages.length > 0) {
          markdown += `\n<details><summary>Failure Details</summary>\n\n`;
          markdown += '```\n';
          markdown += test.failureMessages.join('\n');
          markdown += '\n```\n\n';
          markdown += '</details>\n\n';
        }
      });
      
      markdown += '\n';
    });
    
    // Coverage
    if (coverageData) {
      markdown += `## Code Coverage\n\n`;
      markdown += `| File | Statements | Branches | Functions | Lines |\n`;
      markdown += `| ---- | ---------- | -------- | --------- | ----- |\n`;
      
      Object.entries(coverageData)
        .filter(([key]) => key !== 'total')
        .forEach(([file, coverage]) => {
          markdown += `| ${file} | ${coverage.statements.pct}% | ${coverage.branches.pct}% | ${coverage.functions.pct}% | ${coverage.lines.pct}% |\n`;
        });
      
      markdown += `| **Total** | **${coverageData.total.statements.pct}%** | **${coverageData.total.branches.pct}%** | **${coverageData.total.functions.pct}%** | **${coverageData.total.lines.pct}%** |\n\n`;
    }
    
    // Write report to file
    const reportPath = path.join(this.reportDir, 'report.md');
    fs.writeFileSync(reportPath, markdown);
    
    return reportPath;
  }
  
  /**
   * Generate a PDF report
   * @param {Object} testResults - Test results data
   * @param {Object} coverageData - Coverage data
   * @returns {string} - Path to the generated report
   * @private
   */
  generatePdfReport(testResults, coverageData) {
    // For PDF generation, first create an HTML report
    const htmlPath = this.generateHtmlReport(testResults, coverageData);
    const pdfPath = path.join(this.reportDir, 'report.pdf');
    
    // Log that PDF generation is not yet implemented
    logger.warn('PDF report generation is not fully implemented. Using HTML report instead.');
    
    // In a real implementation, we would convert the HTML to PDF here
    // using a library like puppeteer or html-pdf
    
    return htmlPath;
  }
  
  /**
   * Process test results data for reporting
   * @param {Object} testResults - Raw test results
   * @returns {Object} - Processed data
   * @private
   */
  processTestData(testResults) {
    // Calculate summary statistics
    const summary = {
      total: testResults.numTotalTests,
      passed: testResults.numPassedTests,
      failed: testResults.numFailedTests,
      skipped: testResults.numPendingTests,
      duration: 0
    };
    
    // Process test suites
    const testSuites = testResults.testResults.map(suite => {
      const suiteDuration = suite.endTime - suite.startTime;
      summary.duration += suiteDuration;
      
      return {
        name: suite.name,
        status: suite.status,
        duration: suiteDuration,
        tests: suite.assertionResults.map(test => ({
          title: test.title,
          status: test.status,
          duration: test.duration,
          failureMessages: test.failureMessages || []
        }))
      };
    });
    
    return { summary, testSuites };
  }
  
  /**
   * Load historical test data for comparison
   * @returns {Object} - Historical test data
   * @private
   */
  loadHistoricalData() {
    const historyFile = path.join(this.options.outputDir, 'history.json');
    
    if (fs.existsSync(historyFile)) {
      try {
        return JSON.parse(fs.readFileSync(historyFile, 'utf8'));
      } catch (error) {
        logger.error(`Error loading historical data: ${error.message}`);
      }
    }
    
    return { reports: [] };
  }
  
  /**
   * Update historical test data
   * @param {Object} reportData - Current report data
   * @private
   */
  updateHistoricalData(reportData) {
    if (!this.options.includeHistory) {
      return;
    }
    
    const historyFile = path.join(this.options.outputDir, 'history.json');
    const history = this.loadHistoricalData();
    
    // Add current report summary to history
    history.reports.push({
      timestamp: new Date().toISOString(),
      title: this.options.title,
      summary: reportData.summary,
      coverage: reportData.coverage ? {
        statements: reportData.coverage.total.statements.pct,
        branches: reportData.coverage.total.branches.pct,
        functions: reportData.coverage.total.functions.pct,
        lines: reportData.coverage.total.lines.pct
      } : null
    });
    
    // Keep only the last 30 reports
    if (history.reports.length > 30) {
      history.reports = history.reports.slice(-30);
    }
    
    // Write updated history
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
    logger.info('Historical test data updated');
  }
}

module.exports = TestReportGenerator; 