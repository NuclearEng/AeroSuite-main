/**
 * security.test.js
 *
 * Security test script for AeroSuite
 * Runs npm audit and (optionally) OWASP ZAP
 */

const { execSync } = require('child_process');

describe('Security Audit', () => {
  it('should have no high or critical vulnerabilities (npm audit)', () => {
    let output = '';
    try {
      output = execSync('npm audit --json', { encoding: 'utf-8' });
      const audit = JSON.parse(output);
      const highOrCritical = Object.values(audit.advisories || {}).filter(a => a.severity === 'high' || a.severity === 'critical');
      expect(highOrCritical.length).toBe(0);
    } catch (err) {
      // If audit fails, print output and fail
      console.error('npm audit failed:', output || err.message);
      throw err;
    }
  });

  // Optionally, add OWASP ZAP scan here if available
  // it('should pass OWASP ZAP scan', () => { ... });
}); 