# Test Coverage Reporting

This document describes the test coverage reporting setup for the AeroSuite project (Task TS355).

## Overview

The test coverage reporting system provides:

1. __Comprehensive coverage metrics__: Track statement, branch, function, and line coverage for
client and server code
2. __Visual dashboard__: Interactive HTML dashboard with historical trends
3. __Coverage badges__: SVG badges to display in README or documentation
4. __Configurable thresholds__: Set minimum coverage requirements
5. __CI/CD integration__: Enforce coverage thresholds in the build pipeline

## Setup

The test coverage reporting system is configured through the `.coverage-config.json` file at the
project root. This file defines coverage thresholds, output formats, and other settings.

### Default Configuration

```json
{
  "coverageThresholds": {
    "global": {
      "statements": 75,
      "branches": 70,
      "functions": 75,
      "lines": 75
    },
    "client": {
      "statements": 70,
      "branches": 65,
      "functions": 70,
      "lines": 70
    },
    "server": {
      "statements": 80,
      "branches": 75,
      "functions": 80,
      "lines": 80
    }
  },
  "outputFormats": ["html", "json", "lcov", "text"],
  "badgeEnabled": true,
  "badgeOutputPath": "./coverage/badge.svg",
  "summaryOutputPath": "./coverage/summary.json",
  "dashboardOutputPath": "./coverage/dashboard.html",
  "coverageDirectory": "./coverage",
  "jestConfigPath": "./jest.config.js"
}
```bash

## Usage

### Running Test Coverage

To generate test coverage reports, use the following commands:

```bash
# Run with default configuration
npm run test:coverage

# Run with custom threshold
npm run test:coverage -- --threshold=80

# Initialize configuration (creates .coverage-config.json)
node scripts/test-coverage-setup.js --init
```bash

### Viewing Reports

After running the coverage script, reports are available at:

- __HTML Dashboard__: `coverage/dashboard.html`
- __Detailed HTML Report__: `coverage/lcov-report/index.html`
- __JSON Summary__: `coverage/coverage-summary.json`
- __Coverage Badge__: `coverage/badge.svg`

## CI/CD Integration

The test coverage system integrates with CI/CD pipelines to enforce coverage thresholds. Add the
following to your CI/CD workflow:

```yaml
# Example GitHub Actions workflow step
- name: Run tests with coverage
  run: npm run test:coverage

# Example for running with strict thresholds in CI
- name: Run tests with strict coverage
  run: npm run test:coverage -- --threshold=80
```bash

## Writing Testable Code

To improve test coverage, follow these guidelines:

1. __Small, focused functions__: Write small functions with a single responsibility
2. __Dependency injection__: Use dependency injection to make code testable
3. __Avoid side effects__: Minimize side effects for easier testing
4. __Test edge cases__: Write tests for error conditions and edge cases
5. __Mock external dependencies__: Use mocks for external services and APIs

## Test Structure

AeroSuite uses a consistent test structure:

1. __Unit tests__: Test individual functions and components
2. __Integration tests__: Test interactions between components
3. __End-to-end tests__: Test complete user flows

### Example Test

```javascript
// Example test for a component
import { render, screen } from '@testing-library/react';
import UserProfile from '../components/UserProfile';

describe('UserProfile', () => {
  it('renders user information correctly', () => {
    const user = {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Admin'
    };

    render(<UserProfile user={user} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    render(<UserProfile isLoading={true} />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<UserProfile error="Failed to load user" />);
    expect(screen.getByText('Failed to load user')).toBeInTheDocument();
  });
});
```bash

## Troubleshooting

### Common Issues

1. __Low coverage__: Identify uncovered code paths and add tests
2. __Failing thresholds__: Adjust thresholds or improve test coverage
3. __Slow tests__: Split large test suites, optimize heavy tests

### Debugging Coverage

If you're having trouble understanding why coverage is low:

1. Check the detailed HTML report to see uncovered lines
2. Use the `--coverage` flag with Jest to see coverage in the console
3. Look for untested edge cases and error conditions
