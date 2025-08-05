# Dependency Vulnerability Monitoring

This document describes the dependency vulnerability monitoring system implemented in the AeroSuite project.

## Overview

Dependency vulnerabilities represent a significant security risk in modern applications. Our monitoring system automatically scans all project dependencies for known security vulnerabilities and generates reports to help identify and address these risks.

## Key Features

- **Automated Scanning**: Regular scheduled scans and on-demand scanning
- **Comprehensive Coverage**: Scans both client and server dependencies
- **Detailed Reporting**: Reports vulnerabilities by severity level with remediation recommendations
- **CI/CD Integration**: Automated scanning on code changes and dependency updates
- **Custom Thresholds**: Configurable severity thresholds for failing builds

## How It Works

### Scanning Process

1. The system uses `npm audit` to identify vulnerabilities in dependencies
2. Results are parsed and categorized by severity level
3. A detailed report is generated with information about each vulnerability
4. If critical vulnerabilities are found, the CI/CD pipeline is notified

### Scan Triggers

The dependency scan is triggered by:

- **Schedule**: Automatically runs every Sunday at midnight
- **Code Changes**: Runs when package.json or package-lock.json files are modified
- **Manual Trigger**: Can be run on-demand through GitHub Actions

### Severity Levels

Vulnerabilities are categorized into the following severity levels:

- **Info**: Informational issues with minimal risk
- **Low**: Low-risk vulnerabilities
- **Moderate**: Vulnerabilities with moderate risk
- **High**: High-risk vulnerabilities that should be addressed promptly
- **Critical**: Critical vulnerabilities that require immediate attention

## Usage

### Running a Manual Scan

To run a vulnerability scan manually:

```bash
# Make the script executable
chmod +x scripts/security-scan.js

# Run the scan
node scripts/security-scan.js
```

You can customize the scan behavior with environment variables:

```bash
# Set the maximum allowed severity level before failing
MAX_ALLOWED_SEVERITY=moderate node scripts/security-scan.js

# Ignore development dependencies
IGNORE_DEV_DEPENDENCIES=true node scripts/security-scan.js
```

### Understanding Reports

The scan generates two types of reports:

1. **JSON Report**: A detailed report with all vulnerability information
2. **Summary Report**: A human-readable summary of findings

Reports are stored in the `security-reports` directory with a timestamp in the filename.

### Remediation Process

When vulnerabilities are identified:

1. Review the vulnerability report to understand the risks
2. Check the recommendation for each vulnerability
3. Update dependencies to secure versions
4. If updates are not available, consider alternative packages or implement mitigations
5. Re-run the scan to verify the vulnerabilities have been addressed

## Best Practices

- Run scans regularly, not just after dependency updates
- Always address high and critical vulnerabilities promptly
- Review even low-severity vulnerabilities during regular maintenance
- Keep dependencies up-to-date to minimize vulnerability exposure
- Include dependency scanning in your code review process

## Integration with CI/CD

The dependency scanning is integrated into our CI/CD pipeline via GitHub Actions. The configuration is defined in `.github/workflows/dependency-scan.yml`.

The workflow:

1. Runs automatically on a schedule and when dependencies change
2. Installs all project dependencies
3. Executes the security scan script
4. Uploads reports as artifacts for review
5. Fails the build if critical vulnerabilities are found

## Additional Resources

- [npm audit documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [OWASP Dependency-Check](https://owasp.org/www-project-dependency-check/)
- [Snyk Vulnerability Database](https://snyk.io/vuln) 