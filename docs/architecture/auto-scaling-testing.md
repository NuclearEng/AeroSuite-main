# Auto-Scaling Testing

## Overview

This document describes the testing methodology and tools implemented for RF040 - "Test scaling
under load" in the AeroSuite project. These tests validate that the auto-scaling capabilities
implemented in RF039 function correctly under various load conditions.

## Table of Contents

1. [Introduction](#introduction)
2. [Testing Tools](#testing-tools)
3. [Test Patterns](#test-patterns)
4. [Running Tests](#running-tests)
5. [Analyzing Results](#analyzing-results)
6. [Integration with CI/CD](#integration-with-cicd)
7. [Troubleshooting](#troubleshooting)

## Introduction

Auto-scaling is a critical capability for modern cloud applications, allowing them to handle
varying loads efficiently by automatically adjusting the number of running instances. Testing
auto-scaling properly requires generating controlled load patterns and monitoring how the system
responds.

The testing framework implemented for RF040 provides:

- Controlled load generation with various patterns
- Real-time monitoring of auto-scaling behavior
- Detailed metrics collection and visualization
- Comprehensive reporting for analysis

## Testing Tools

### Auto-Scaling Test Script

The main test script (`auto-scaling-test.js`) simulates user load according to predefined patterns
and monitors the system's auto-scaling behavior. It:

- Generates controlled load patterns
- Monitors CPU and memory utilization
- Tracks instance counts and scaling events
- Records response times and request rates
- Generates detailed JSON reports

### Visualization Tool

The visualization tool (`auto-scaling-visualizer.js`) converts test results into interactive HTML
reports with charts showing:

- Resource utilization over time (CPU, memory)
- Instance count changes
- Scaling events (up/down)
- Request rates and response times
- Test configuration details

### Test Runner Script

The test runner script (`run-auto-scaling-tests.sh`) automates running multiple tests with
different load patterns and generates a combined report.

## Test Patterns

The testing framework includes five load patterns designed to test different aspects of
auto-scaling:

### 1. Gradual Pattern

A steady, gradual increase in load from zero to maximum over the test duration. This pattern tests
how smoothly the system scales up under gradually increasing pressure.

```bash
Users
^
|                  /
|                /
|              /
|            /
|          /
|        /
|      /
|    /
|  /
+----------------------> Time
```bash

### 2. Step Pattern

Increases load in discrete steps. This pattern tests how the system responds to specific scaling
thresholds.

```bash
Users
^
|              ______
|             |
|        _____|
|       |
|   ____|
|  |
| _|
|/
+----------------------> Time
```bash

### 3. Spike Pattern

Maintains low load, then suddenly spikes to maximum before returning to low. This pattern tests how
quickly the system can scale up in response to sudden demand.

```bash
Users
^
|        ____________
|       |            |
|       |            |
|       |            |
|_______|            |_______
|
+----------------------> Time
```bash

### 4. Wave Pattern

Oscillates between low and high load in a sinusoidal pattern. This pattern tests the system's
ability to scale both up and down repeatedly.

```bash
Users
^
|      /\      /\      /\
|     /  \    /  \    /  \
|    /    \  /    \  /    \
|   /      \/      \/      \
|  /
| /
+----------------------> Time
```bash

### 5. Sustained Pattern

Quickly ramps up to maximum load and sustains it for the duration of the test. This pattern tests
stability under prolonged high load.

```bash
Users
^
|    _________________
|   /
|  /
| /
|/
+----------------------> Time
```bash

## Running Tests

### Prerequisites

- Node.js 14+
- Required npm packages: axios, yargs, chalk
- Access to the AeroSuite API with appropriate permissions

### Running a Single Test

To run a single test with specific parameters:

```bash
node scripts/performance/auto-scaling-test.js --pattern=spike --duration=300
--target=http://localhost:5000
```bash

Available parameters:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `--pattern`, `-p` | Load pattern (gradual, step, spike, wave, sustained) | gradual |
| `--duration`, `-d` | Test duration in seconds | 300 |
| `--target`, `-t` | Target URL | http://localhost:5000 |
| `--max-users`, `-m` | Maximum number of concurrent users | 200 |
| `--workers`, `-w` | Number of worker processes (0 = auto) | 0 |
| `--report-file`, `-r` | Report file path | auto-scaling-test-report.json |
| `--monitor-interval`, `-i` | Monitoring interval in seconds | 5 |
| `--auth-token` | Authentication token for API access | - |
| `--verbose`, `-v` | Enable verbose output | false |

### Running the Test Suite

To run all test patterns in sequence:

```bash
./scripts/performance/run-auto-scaling-tests.sh [target-url] [duration]
```bash

This will:

1. Run tests for all five load patterns
2. Generate individual JSON and HTML reports for each test
3. Create a combined HTML report linking to all individual reports

## Analyzing Results

### Key Metrics

When analyzing test results, focus on these key metrics:

- __Scaling Events__: How many times did the system scale up or down?
- __Scaling Latency__: How long did it take to respond to load changes?
- __Instance Range__: What was the minimum and maximum number of instances?
- __Resource Utilization__: Did CPU and memory stay within target ranges?
- __Response Times__: Did response times remain acceptable during scaling?

### Success Criteria

Auto-scaling is considered successful if:

1. The system scales up in response to increased load
2. The system scales down when load decreases
3. Resource utilization stays within target thresholds
4. Response times remain within acceptable limits
5. No errors or failed requests occur during scaling

## Integration with CI/CD

The auto-scaling tests can be integrated into CI/CD pipelines to verify scaling behavior before
deployment:

```yaml
# Example CI/CD integration
auto-scaling-test:
  stage: test
  script:
    - ./scripts/performance/run-auto-scaling-tests.sh https://staging-api.aerosuite.com 300
  artifacts:
    paths:
      - reports/auto-scaling/
```bash

## Troubleshooting

### Common Issues

#### No Scaling Events Detected

- Verify that auto-scaling is properly configured
- Check resource thresholds (CPU_HIGH_THRESHOLD, etc.)
- Ensure the test is generating sufficient load
- Verify that monitoring has sufficient permissions

#### Errors During Testing

- Check API endpoints are accessible
- Verify authentication token if required
- Check network connectivity to target system
- Ensure Redis is running for metrics collection

#### Poor Scaling Performance

- Review cooldown periods (may be too long)
- Check for resource constraints in the cluster
- Verify that HPA configurations are correct
- Check for bottlenecks outside of CPU/memory

## Conclusion

The auto-scaling testing framework provides comprehensive validation of the auto-scaling
capabilities implemented in RF039. By running tests with different load patterns and analyzing the
results, we can ensure that AeroSuite can automatically adjust to varying loads, providing optimal
performance and resource utilization.
