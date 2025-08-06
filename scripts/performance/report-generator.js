/**
 * Performance Report Generator
 * Generates comprehensive performance test reports
 */

const fs = require('fs');
const path = require('path');

class ReportGenerator {
  constructor() {
    this.reportTemplates = {
      json: this.generateJsonReport.bind(this),
      html: this.generateHtmlReport.bind(this),
      console: this.generateConsoleReport.bind(this)
    };
  }

  async generateReport(results, config) {
    const format = config.reportFormat || 'json';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `performance-report-${timestamp}.${format}`;
    const reportPath = path.join(config.reportDir, filename);

    console.log(`Generating ${format.toUpperCase()} report: ${reportPath}`);

    if (this.reportTemplates[format]) {
      const report = await this.reportTemplates[format](results, config);
      
      if (format === 'console') {
        console.log(report);
        return reportPath;
      } else {
        fs.writeFileSync(reportPath, report);
        return reportPath;
      }
    } else {
      throw new Error(`Unsupported report format: ${format}`);
    }
  }

  generateJsonReport(results, config) {
    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        config,
        summary: this.generateSummary(results)
      },
      results
    };

    return JSON.stringify(report, null, 2);
  }

  generateHtmlReport(results, config) {
    const summary = this.generateSummary(results);
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>AeroSuite Performance Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .summary { margin: 20px 0; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #e8f4fd; border-radius: 3px; }
        .section { margin: 20px 0; }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
    </style>
</head>
<body>
    <div class="header">
        <h1>AeroSuite Performance Test Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="summary">
        <h2>Summary</h2>
        <div class="metric">Total Tests: ${summary.totalTests}</div>
        <div class="metric">Successful: <span class="success">${summary.successfulTests}</span></div>
        <div class="metric">Failed: <span class="error">${summary.failedTests}</span></div>
        <div class="metric">Average Response Time: ${summary.averageResponseTime}ms</div>
    </div>
    
    <div class="section">
        <h2>Detailed Results</h2>
        <pre>${JSON.stringify(results, null, 2)}</pre>
    </div>
</body>
</html>`;
  }

  generateConsoleReport(results, config) {
    const summary = this.generateSummary(results);
    
    let report = `
🚀 AeroSuite Performance Test Report
====================================

📊 Summary:
  Total Tests: ${summary.totalTests}
  Successful: ${summary.successfulTests}
  Failed: ${summary.failedTests}
  Average Response Time: ${summary.averageResponseTime}ms

📈 Results by Category:
`;

    // Add results for each category
    Object.keys(results).forEach(category => {
      if (results[category] && results[category].summary) {
        const catSummary = results[category].summary;
        report += `
${category.toUpperCase()}:
  Total Operations: ${catSummary.totalOperations || catSummary.totalRequests || 0}
  Successful: ${catSummary.successfulOperations || catSummary.successfulRequests || 0}
  Failed: ${catSummary.failedOperations || catSummary.failedRequests || 0}
  Average Response Time: ${catSummary.averageResponseTime || 0}ms
`;
      }
    });

    return report;
  }

  generateSummary(results) {
    let totalTests = 0;
    let successfulTests = 0;
    let failedTests = 0;
    let totalResponseTime = 0;
    let responseTimeCount = 0;

    Object.keys(results).forEach(category => {
      if (results[category] && results[category].summary) {
        const summary = results[category].summary;
        
        totalTests += summary.totalOperations || summary.totalRequests || summary.totalPages || 0;
        successfulTests += summary.successfulOperations || summary.successfulRequests || summary.successfulLoads || 0;
        failedTests += summary.failedOperations || summary.failedRequests || summary.failedLoads || 0;
        
        if (summary.averageResponseTime) {
          totalResponseTime += summary.averageResponseTime;
          responseTimeCount++;
        }
      }
    });

    const averageResponseTime = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0;

    return {
      totalTests,
      successfulTests,
      failedTests,
      averageResponseTime: Math.round(averageResponseTime)
    };
  }
}

module.exports = {
  generateReport: (results, config) => {
    const generator = new ReportGenerator();
    return generator.generateReport(results, config);
  }
}; 