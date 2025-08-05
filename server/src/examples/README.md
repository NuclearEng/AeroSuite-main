# AeroSuite Examples

This directory contains example scripts demonstrating various features of the AeroSuite system.

## Cache Examples

### Cache Invalidation Example

Demonstrates the cache invalidation patterns implemented in RF027:

- Tag-based invalidation
- Dependency-based invalidation
- Time-based invalidation
- Pattern-based invalidation
- Batch invalidation

To run this example:

```bash
./run-cache-invalidation-example.sh
```

### Cache Monitoring Example

Demonstrates the cache monitoring and metrics implemented in RF028:

- Basic metrics collection (hits, misses, error rates)
- Detailed metrics collection (per-key, per-provider metrics)
- Prometheus integration for metrics export
- Hot and cold key identification

To run this example:

```bash
./run-cache-monitoring-example.sh
```

## Running Examples

All examples are designed to be self-contained and can be run directly from the project root using the provided shell scripts.

The examples use the same infrastructure components as the main application but are configured to run in isolation without affecting production data. 