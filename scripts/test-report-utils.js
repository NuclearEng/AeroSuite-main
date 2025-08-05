/**
 * Test Report Utilities
 * 
 * This module provides utility functions for test report generation.
 */

const fs = require('fs');
const path = require('path');

/**
 * Get historical test data from previous reports
 * @param {string} reportsDir - Directory containing test reports
 * @param {number} limit - Maximum number of historical reports to include
 * @returns {Array} Array of historical test data
 */
function getHistoricalData(reportsDir, limit = 10) {
  try {
    const history = [];
    
    // Get all subdirectories in the reports directory
    const dirs = fs.readdirSync(reportsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && dirent.name !== 'latest')
      .map(dirent => dirent.name)
      .sort()
      .reverse()
      .slice(0, limit);
    
    // Read report data from each directory
    for (const dir of dirs) {
      const reportPath = path.join(reportsDir, dir, 'report.json');
      if (fs.existsSync(reportPath)) {
        const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        history.push({
          timestamp: reportData.timestamp,
          summary: reportData.summary
        });
      }
    }
    
    return history;
  } catch (error) {
    console.error(`Error reading historical data: ${error.message}`);
    return [];
  }
}

/**
 * Compare two test reports and generate a diff
 * @param {Object} currentReport - Current test report data
 * @param {Object} previousReport - Previous test report data
 * @returns {Object} Diff between the two reports
 */
function compareReports(currentReport, previousReport) {
  const diff = {
    summary: {
      tests: {
        total: currentReport.summary.tests.total - previousReport.summary.tests.total,
        passed: currentReport.summary.tests.passed - previousReport.summary.tests.passed,
        failed: currentReport.summary.tests.failed - previousReport.summary.tests.failed,
        skipped: currentReport.summary.tests.skipped - previousReport.summary.tests.skipped,
      }
    },
    newFailures: [],
    newPasses: [],
    stillFailing: []
  };
  
  // Add coverage diff if available
  if (currentReport.summary.coverage && previousReport.summary.coverage) {
    diff.summary.coverage = {
      statements: {
        pct: currentReport.summary.coverage.statements.pct - previousReport.summary.coverage.statements.pct
      },
      branches: {
        pct: currentReport.summary.coverage.branches.pct - previousReport.summary.coverage.branches.pct
      },
      functions: {
        pct: currentReport.summary.coverage.functions.pct - previousReport.summary.coverage.functions.pct
      },
      lines: {
        pct: currentReport.summary.coverage.lines.pct - previousReport.summary.coverage.lines.pct
      }
    };
  }
  
  // Map previous test results for comparison
  const previousTests = new Map();
  previousReport.testSuites.forEach(suite => {
    suite.tests.forEach(test => {
      const key = `${suite.name}::${test.title}`;
      previousTests.set(key, test.status);
    });
  });
  
  // Compare current tests with previous tests
  currentReport.testSuites.forEach(suite => {
    suite.tests.forEach(test => {
      const key = `${suite.name}::${test.title}`;
      const previousStatus = previousTests.get(key);
      
      if (test.status === 'failed') {
        if (previousStatus === 'passed') {
          diff.newFailures.push({ suite: suite.name, test: test.title });
        } else if (previousStatus === 'failed') {
          diff.stillFailing.push({ suite: suite.name, test: test.title });
        }
      } else if (test.status === 'passed' && previousStatus === 'failed') {
        diff.newPasses.push({ suite: suite.name, test: test.title });
      }
    });
  });
  
  return diff;
}

/**
 * Generate trend data for visualizations
 * @param {Array} history - Historical test data
 * @returns {Object} Trend data for charts
 */
function generateTrendData(history) {
  const labels = history.map(item => {
    const date = new Date(item.timestamp);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  }).reverse();
  
  const passedTests = history.map(item => item.summary.tests.passed).reverse();
  const failedTests = history.map(item => item.summary.tests.failed).reverse();
  const skippedTests = history.map(item => item.summary.tests.skipped).reverse();
  
  let coverageTrend = null;
  if (history[0].summary.coverage) {
    coverageTrend = {
      statements: history.map(item => item.summary.coverage?.statements.pct || 0).reverse(),
      branches: history.map(item => item.summary.coverage?.branches.pct || 0).reverse(),
      functions: history.map(item => item.summary.coverage?.functions.pct || 0).reverse(),
      lines: history.map(item => item.summary.coverage?.lines.pct || 0).reverse()
    };
  }
  
  return {
    labels,
    testResults: {
      passed: passedTests,
      failed: failedTests,
      skipped: skippedTests
    },
    coverage: coverageTrend
  };
}

/**
 * Generate HTML for trend charts
 * @param {Object} trendData - Trend data for charts
 * @returns {string} HTML for charts
 */
function generateTrendCharts(trendData) {
  return `
<div class="trends-section">
  <h2>Test Result Trends</h2>
  <div class="chart-container">
    <canvas id="testResultsChart"></canvas>
  </div>
  
  ${trendData.coverage ? `
  <h2>Coverage Trends</h2>
  <div class="chart-container">
    <canvas id="coverageChart"></canvas>
  </div>
  ` : ''}
  
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script>
    // Test Results Chart
    const testResultsCtx = document.getElementById('testResultsChart').getContext('2d');
    new Chart(testResultsCtx, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(trendData.labels)},
        datasets: [
          {
            label: 'Passed Tests',
            data: ${JSON.stringify(trendData.testResults.passed)},
            backgroundColor: 'rgba(75, 192, 75, 0.2)',
            borderColor: 'rgba(75, 192, 75, 1)',
            borderWidth: 2,
            tension: 0.1
          },
          {
            label: 'Failed Tests',
            data: ${JSON.stringify(trendData.testResults.failed)},
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2,
            tension: 0.1
          },
          {
            label: 'Skipped Tests',
            data: ${JSON.stringify(trendData.testResults.skipped)},
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
    
    ${trendData.coverage ? `
    // Coverage Chart
    const coverageCtx = document.getElementById('coverageChart').getContext('2d');
    new Chart(coverageCtx, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(trendData.labels)},
        datasets: [
          {
            label: 'Statements',
            data: ${JSON.stringify(trendData.coverage.statements)},
            borderColor: 'rgba(75, 192, 75, 1)',
            backgroundColor: 'rgba(0, 0, 0, 0)',
            borderWidth: 2,
            tension: 0.1
          },
          {
            label: 'Branches',
            data: ${JSON.stringify(trendData.coverage.branches)},
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(0, 0, 0, 0)',
            borderWidth: 2,
            tension: 0.1
          },
          {
            label: 'Functions',
            data: ${JSON.stringify(trendData.coverage.functions)},
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(0, 0, 0, 0)',
            borderWidth: 2,
            tension: 0.1
          },
          {
            label: 'Lines',
            data: ${JSON.stringify(trendData.coverage.lines)},
            borderColor: 'rgba(255, 206, 86, 1)',
            backgroundColor: 'rgba(0, 0, 0, 0)',
            borderWidth: 2,
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
    ` : ''}
  </script>
</div>
  `;
}

/**
 * Generate HTML for report comparison
 * @param {Object} diff - Report comparison diff
 * @returns {string} HTML for comparison
 */
function generateComparisonHTML(diff) {
  return `
<div class="comparison-section">
  <h2>Comparison with Previous Report</h2>
  
  <div class="summary-comparison">
    <h3>Summary Changes</h3>
    <div class="summary-change">
      <div>Total Tests: ${diff.summary.tests.total >= 0 ? '+' : ''}${diff.summary.tests.total}</div>
      <div>Passed Tests: ${diff.summary.tests.passed >= 0 ? '+' : ''}${diff.summary.tests.passed}</div>
      <div>Failed Tests: ${diff.summary.tests.failed >= 0 ? '+' : ''}${diff.summary.tests.failed}</div>
      <div>Skipped Tests: ${diff.summary.tests.skipped >= 0 ? '+' : ''}${diff.summary.tests.skipped}</div>
    </div>
    
    ${diff.summary.coverage ? `
    <div class="coverage-change">
      <div>Statement Coverage: ${diff.summary.coverage.statements.pct >= 0 ? '+' : ''}${diff.summary.coverage.statements.pct.toFixed(2)}%</div>
      <div>Branch Coverage: ${diff.summary.coverage.branches.pct >= 0 ? '+' : ''}${diff.summary.coverage.branches.pct.toFixed(2)}%</div>
      <div>Function Coverage: ${diff.summary.coverage.functions.pct >= 0 ? '+' : ''}${diff.summary.coverage.functions.pct.toFixed(2)}%</div>
      <div>Line Coverage: ${diff.summary.coverage.lines.pct >= 0 ? '+' : ''}${diff.summary.coverage.lines.pct.toFixed(2)}%</div>
    </div>
    ` : ''}
  </div>
  
  <div class="detailed-comparison">
    ${diff.newFailures.length > 0 ? `
    <div class="comparison-category new-failures">
      <h3>New Failures (${diff.newFailures.length})</h3>
      <ul>
        ${diff.newFailures.map(item => `<li><strong>${item.suite}:</strong> ${item.test}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
    
    ${diff.newPasses.length > 0 ? `
    <div class="comparison-category new-passes">
      <h3>New Passes (${diff.newPasses.length})</h3>
      <ul>
        ${diff.newPasses.map(item => `<li><strong>${item.suite}:</strong> ${item.test}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
    
    ${diff.stillFailing.length > 0 ? `
    <div class="comparison-category still-failing">
      <h3>Still Failing (${diff.stillFailing.length})</h3>
      <ul>
        ${diff.stillFailing.map(item => `<li><strong>${item.suite}:</strong> ${item.test}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
  </div>
</div>
  `;
}

module.exports = {
  getHistoricalData,
  compareReports,
  generateTrendData,
  generateTrendCharts,
  generateComparisonHTML
}; 