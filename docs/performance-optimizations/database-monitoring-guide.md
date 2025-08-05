# Database Monitoring Guide

This document outlines the database monitoring system implemented as part of RF032 in the AeroSuite project.

## Overview

Database monitoring is crucial for maintaining the performance, reliability, and security of the AeroSuite platform. This guide explains the monitoring tools and practices implemented to ensure optimal database performance.

## Monitoring Components

The AeroSuite database monitoring system consists of the following components:

1. **Database Monitoring Script**: A Node.js script that collects and analyzes MongoDB metrics
2. **Prometheus Integration**: Metrics exposed to Prometheus for long-term storage and alerting
3. **MongoDB Exporter**: A dedicated exporter that collects detailed MongoDB metrics
4. **Monitoring Dashboard**: Visualization of database metrics and performance indicators
5. **Alert System**: Notifications for critical database events and performance issues

## Key Metrics Monitored

### Server Metrics

- **Connections**: Current, available, and active connections
- **Memory Usage**: Resident and virtual memory usage
- **Operation Counters**: Insert, update, delete, query, and command operations
- **Uptime**: Server uptime and availability

### Database Metrics

- **Collection Stats**: Document count, size, storage size, and average object size
- **Index Stats**: Index size and usage statistics
- **Storage Metrics**: Data size, storage size, and index size
- **Performance Metrics**: Query execution time, slow queries, and operation latency

### Query Metrics

- **Slow Queries**: Queries taking longer than 100ms to execute
- **Query Patterns**: Common query patterns and their performance
- **Index Usage**: Effectiveness of indexes for queries
- **Query Errors**: Failed queries and error types

## Running the Monitoring Tools

### One-time Monitoring

To run a one-time database monitoring check:

```bash
./scripts/database-monitoring.sh
```

This will:
1. Connect to the MongoDB database
2. Collect metrics and statistics
3. Generate a report in both JSON and HTML formats
4. Store the report in the `reports` directory

### Continuous Monitoring

To start continuous monitoring:

```bash
./scripts/database-monitoring.sh --continuous
```

This will run the monitoring script at regular intervals (default: 60 seconds).

To specify a custom interval:

```bash
./scripts/database-monitoring.sh --continuous --interval 30000
```

## Prometheus Integration

The database monitoring system exposes metrics to Prometheus through:

1. **Custom Metrics Endpoint**: `/api/monitoring/metrics` on the AeroSuite server
2. **MongoDB Exporter**: A dedicated exporter running on port 9216

### Available Prometheus Metrics

- `mongodb_connections`: MongoDB connections by state
- `mongodb_operations_total`: Total MongoDB operations by type and collection
- `mongodb_operation_duration_seconds`: MongoDB operation duration histogram
- `mongodb_document_count`: Document count by collection
- `mongodb_index_size_bytes`: Index size by collection and index
- `mongodb_storage_size_bytes`: Storage size by collection
- `mongodb_slow_queries_total`: Slow query count by collection and operation
- `mongodb_query_errors_total`: Query error count by collection, operation, and error type

## MongoDB Exporter

The MongoDB exporter is deployed as a Kubernetes pod that collects detailed metrics from MongoDB. It is configured in `k8s/base/mongodb-exporter.yaml`.

### Deployment

To deploy the MongoDB exporter:

```bash
kubectl apply -f k8s/base/mongodb-exporter.yaml
```

### Configuration

The exporter is configured to:
- Connect to the MongoDB instance using authentication
- Collect all available metrics
- Expose metrics on port 9216
- Run with resource limits to prevent overloading the system

## Monitoring Dashboard

A Grafana dashboard is available for visualizing database metrics. The dashboard includes:

1. **Server Overview**: Connections, memory usage, and operation counters
2. **Database Health**: Collection stats, index usage, and storage metrics
3. **Query Performance**: Slow queries, operation latency, and error rates
4. **Resource Utilization**: CPU, memory, and disk usage

## Best Practices

### Regular Monitoring

- Run the monitoring script daily to track database performance
- Review the generated reports for potential issues
- Set up continuous monitoring in production environments

### Performance Tuning

- Use the slow query reports to identify and optimize problematic queries
- Monitor index usage and create indexes for common query patterns
- Review and optimize the database schema based on monitoring data

### Capacity Planning

- Track database growth over time
- Monitor resource utilization to plan for scaling
- Set up alerts for resource thresholds

## Alert Configuration

Alerts are configured in Prometheus to notify when:

- Database connections exceed 80% of the maximum
- Slow query count increases significantly
- Query error rate exceeds normal thresholds
- Database size approaches storage limits
- Index size grows too large relative to data size

## Troubleshooting

### Common Issues

1. **High Connection Count**: Check for connection leaks in the application
2. **Slow Queries**: Review and optimize query patterns, add missing indexes
3. **High Memory Usage**: Check for memory leaks, optimize query patterns
4. **Growing Index Size**: Review index strategy, remove unused indexes

### Diagnostic Commands

To check database status:

```javascript
db.serverStatus()
```

To check collection statistics:

```javascript
db.collection.stats()
```

To check index usage:

```javascript
db.collection.aggregate([{ $indexStats: {} }])
```

## Conclusion

The database monitoring system provides comprehensive visibility into the MongoDB database's performance and health. By regularly reviewing the metrics and reports, the team can proactively address issues, optimize performance, and ensure the reliability of the AeroSuite platform. 