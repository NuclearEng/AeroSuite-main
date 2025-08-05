# AeroSuite Load Testing Framework

This framework provides comprehensive load testing capabilities for the AeroSuite application. It allows you to test various scenarios, simulate different user loads, and generate detailed reports.

## Features

- **Multiple Test Profiles**: Preconfigured baseline, production, and stress test profiles
- **Customizable Scenarios**: Create reusable test scenarios that simulate real user behavior
- **Distributed Testing**: Run tests across multiple worker processes for higher load simulation
- **Detailed Reporting**: Generate console, JSON, or HTML reports with detailed metrics
- **Configurable Parameters**: Customize user count, test duration, endpoints, and more
- **System Metrics**: Monitor CPU, memory, and load metrics during tests
- **Graceful Ramp-up**: Gradually increase load to prevent immediate system overload
- **Performance Comparison**: Compare results between different tests to evaluate scaling efficiency

## Usage

### Basic Usage

Run a basic load test with default settings:

```bash
npm run loadtest:framework
```

### Using Profiles

Run tests with predefined profiles:

```bash
# Baseline profile (low load)
npm run loadtest:baseline

# Production profile (medium load)
npm run loadtest:production

# Stress test profile (high load)
npm run loadtest:stress
```

### Running Specific Scenarios

Test specific user flows:

```bash
# Authentication flow
npm run loadtest:auth

# Browsing flow
npm run loadtest:browse

# CRUD operations
npm run loadtest:crud

# Stress test scenario (combines multiple operations)
npm run loadtest:stress-scenario

# Concurrent operations (tests horizontal scaling)
npm run loadtest:concurrent

# Session persistence test (tests Redis-based session management)
npm run loadtest:session
```

### Comparing Test Results

To evaluate the effectiveness of horizontal scaling and other optimizations, you can compare results from multiple load tests:

```bash
# Basic comparison with console output
npm run loadtest:compare -- --files=reports/test1.json,reports/test2.json

# Generate HTML comparison report
npm run loadtest:compare -- --files=reports/test1.json,reports/test2.json --output=html

# Custom output file
npm run loadtest:compare -- --files=reports/test1.json,reports/test2.json --output=html --out-file=scaling-report.html
```

The comparison tool analyzes:
- Scaling efficiency (how well performance scales with increased workers)
- Response time degradation under load
- Resource utilization patterns
- Success rates across different tests

This is particularly useful for verifying the effectiveness of the horizontal scaling implementation (TS350).

### Custom Parameters

Run with custom parameters:

```bash
node scripts/performance/load-testing/index.js --users=50 --duration=60 --target=http://localhost:5000
```

### Available Options

| Option | Description | Default |
|--------|-------------|---------|
| `--profile`, `-p` | Test profile to use | `baseline` |
| `--scenario`, `-s` | Test scenario to run | - |
| `--users`, `-u` | Number of concurrent users | 10 |
| `--duration`, `-d` | Test duration in seconds | 30 |
| `--target`, `-t` | Target URL | `http://localhost:5000` |
| `--output`, `-o` | Output format (console, json, html) | `console` |
| `--report`, `-r` | Generate detailed report | `false` |
| `--workers`, `-w` | Number of worker processes | auto |
| `--warmup` | Warmup period in seconds | 5 |
| `--rampUp` | Ramp-up period in seconds | 0 |
| `--auth` | Authentication credentials | - |
| `--headers` | Custom headers as JSON string | - |
| `--debug` | Enable debug mode | `false` |
| `--sessionWaitTime` | Wait time in ms for session tests | 5000 |

## Creating Custom Profiles

Create a new JavaScript file in the `profiles` directory:

```javascript
// profiles/custom.js
module.exports = {
  concurrentUsers: 20,
  testDurationSec: 60,
  targetUrl: 'http://localhost:5000',
  // Add other parameters as needed
};
```

Then run with your custom profile:

```bash
node scripts/performance/load-testing/index.js --profile=custom
```

## Creating Custom Scenarios

Create a new JavaScript file in the `scenarios` directory:

```javascript
// scenarios/custom.js
async function run(client, config) {
  // Make API requests using the client
  await client.get('/api/endpoint');
  // Add more requests as needed
}

module.exports = { run };
```

Then run with your custom scenario:

```bash
node scripts/performance/load-testing/index.js --scenario=custom
```

## Available Scenarios

### Authentication Scenario
Tests the login flow, fetching user data, and logout operations.

### Browsing Scenario
Simulates a user browsing through the application, viewing various lists and details.

### CRUD Scenario
Tests Create, Read, Update, and Delete operations on a specific resource.

### Stress Scenario
Combines multiple operations in sequence to stress test the system:
1. Authentication
2. Loading dashboard data
3. Parallel data retrieval from multiple endpoints
4. Creating, updating, retrieving, and deleting resources
5. Performing search operations

### Concurrent Operations Scenario
Tests the system's ability to handle multiple simultaneous operations:
1. Creates multiple resources in parallel
2. Retrieves all created resources in parallel
3. Updates all resources in parallel
4. Performs multiple search operations simultaneously
5. Deletes all resources in parallel
6. Verifies deletions in parallel

This scenario is particularly useful for testing the horizontal scaling capabilities implemented in TS350.

### Session Persistence Scenario
Tests the Redis-based session management implemented for horizontal scaling:
1. Establishes a user session through login
2. Performs authenticated operations
3. Simulates inactivity period
4. Verifies session persistence after inactivity
5. Continues to perform authenticated operations

This scenario verifies that user sessions persist properly in a distributed environment, which is critical for the horizontal scaling implementation in TS350.

## Performance Comparison Tool

The performance comparison tool helps evaluate the effectiveness of horizontal scaling by comparing metrics from different load tests. It calculates:

- **Scaling Efficiency**: How close the system gets to ideal linear scaling
- **Response Time Degradation**: How response times change as load increases
- **Optimal Worker Count**: The most efficient number of workers for different loads
- **Resource Utilization Patterns**: CPU, memory, and load patterns across tests
- **Success Rate Stability**: Whether errors increase under higher load

The tool provides recommendations for optimizing scaling behavior and can output results in console, JSON, or HTML formats.

### Usage:

```bash
node scripts/performance/load-testing/compare-tests.js --files=file1.json,file2.json,file3.json --output=html
```

### Options:

| Option | Description | Default |
|--------|-------------|---------|
| `--files`, `-f` | Comma-separated list of test result files | (required) |
| `--output`, `-o` | Output format (console, json, html) | `console` |
| `--out-file` | Output file path for HTML or JSON reports | auto-generated |
| `--title`, `-t` | Report title | `Load Test Comparison` |

## CI/CD Integration

For continuous integration testing:

```bash
npm run loadtest:ci
```

This will output results in JSON format that can be parsed by CI/CD tools.

## Directory Structure

- `index.js`: Main entry point
- `profiles/`: Contains test profiles
- `scenarios/`: Contains test scenarios
- `utils/`: Contains utility functions
- `reports/`: Contains generated reports
- `compare-tests.js`: Test comparison tool

## Requirements

- Node.js 14+
- Dependencies: axios, yargs, chalk

## Relation to Task TS354

This framework was developed as part of task TS354 to implement comprehensive load testing capabilities for AeroSuite. It provides:

1. Various load testing scenarios
2. Multiple configurable profiles
3. Detailed reporting mechanisms
4. System metrics collection
5. CI/CD integration
6. Performance comparison and analysis tools 