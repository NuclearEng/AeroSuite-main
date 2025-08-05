# Auto-Scaling Configuration

## Overview

This document describes the auto-scaling system implemented in the AeroSuite project as part of RF039. The system enables automatic scaling of services based on resource utilization and traffic patterns, ensuring optimal performance and cost efficiency.

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture](#architecture)
3. [Components](#components)
4. [Configuration](#configuration)
5. [Kubernetes Integration](#kubernetes-integration)
6. [Monitoring](#monitoring)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Introduction

Auto-scaling is a critical capability for modern cloud-native applications, allowing them to handle varying loads efficiently by automatically adjusting the number of running instances. AeroSuite implements a comprehensive auto-scaling solution that works at both the application level and infrastructure level.

### Key Benefits

- **Cost Optimization**: Scale down during low-traffic periods to reduce resource costs
- **Performance Reliability**: Scale up during high-traffic periods to maintain performance
- **High Availability**: Ensure service availability even during traffic spikes
- **Resource Efficiency**: Optimize resource utilization across the system
- **Predictive Scaling**: Use traffic patterns to scale proactively before demand increases

## Architecture

The auto-scaling system uses a multi-layered approach:

1. **Application-Level Metrics Collection**: Each service instance collects and reports its own metrics
2. **Centralized Metrics Aggregation**: Redis is used to aggregate metrics across all instances
3. **Scaling Decision Engine**: Analyzes metrics and determines when to scale
4. **Kubernetes Integration**: Horizontal Pod Autoscalers (HPAs) implement the scaling decisions
5. **Monitoring and Feedback**: Continuous monitoring of scaling effectiveness

### Architecture Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│  Server A   │     │  Server B   │     │  Server C   │
│             │     │             │     │             │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │    Metrics        │    Metrics        │    Metrics
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────────────────────────────────────────┐
│                                                 │
│               Redis Metrics Store               │
│                                                 │
└──────────────────────┬──────────────────────────┘
                       │
                       │    Aggregated Metrics
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│                                                 │
│            Auto-Scaling Manager                 │
│                                                 │
└──────────────────────┬──────────────────────────┘
                       │
                       │    Scaling Decisions
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│                                                 │
│            Kubernetes HPA Controller            │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Components

### AutoScalingManager

The core class that manages auto-scaling operations:

- Collects system metrics (CPU, memory, requests)
- Aggregates metrics across instances
- Analyzes metrics to generate scaling recommendations
- Publishes recommendations for implementation
- Tracks scaling history and effectiveness

### Auto-Scaling Middleware

Integrates the auto-scaling manager with the Express application:

- Initializes the auto-scaling manager
- Provides request tracking middleware
- Exposes metrics and scaling history
- Handles graceful shutdown

### Auto-Scaling API

REST API endpoints for managing and monitoring auto-scaling:

- `/api/v1/auto-scaling/metrics`: Get current metrics
- `/api/v1/auto-scaling/efficiency`: Get scaling efficiency metrics
- `/api/v1/auto-scaling/history`: Get scaling history
- `/api/v1/auto-scaling/config`: Get/update configuration
- `/api/v1/auto-scaling/status`: Get current status

### Kubernetes HPA Configurations

Kubernetes Horizontal Pod Autoscaler configurations:

- Development environment: `k8s/overlays/dev/auto-scaling.yaml`
- Production environment: `k8s/overlays/prod/auto-scaling.yaml`
- Deployment script: `k8s/scripts/apply-auto-scaling.sh`

## Configuration

The auto-scaling system is highly configurable through environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `MIN_INSTANCES` | Minimum number of instances | 1 |
| `MAX_INSTANCES` | Maximum number of instances | 10 |
| `CPU_HIGH_THRESHOLD` | CPU utilization threshold for scaling up | 0.7 (70%) |
| `CPU_LOW_THRESHOLD` | CPU utilization threshold for scaling down | 0.3 (30%) |
| `MEMORY_HIGH_THRESHOLD` | Memory utilization threshold for scaling up | 0.8 (80%) |
| `MEMORY_LOW_THRESHOLD` | Memory utilization threshold for scaling down | 0.4 (40%) |
| `SCALE_UP_COOLDOWN` | Cooldown period after scaling up (ms) | 60000 (1 minute) |
| `SCALE_DOWN_COOLDOWN` | Cooldown period after scaling down (ms) | 300000 (5 minutes) |
| `PREDICTIVE_SCALING` | Enable predictive scaling | false |
| `SCALING_CHECK_INTERVAL` | Interval for checking scaling needs (ms) | 30000 (30 seconds) |
| `METRICS_INTERVAL` | Interval for collecting metrics (ms) | 5000 (5 seconds) |
| `METRICS_SAMPLE_SIZE` | Number of metrics samples to keep | 10 |

## Kubernetes Integration

### Horizontal Pod Autoscalers (HPAs)

HPAs are configured for each service:

#### Server HPA (Production)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: aerosuite-server-hpa
  namespace: aerosuite-prod
spec:
  minReplicas: 4
  maxReplicas: 16
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Applying Auto-Scaling Configuration

Use the provided script to apply auto-scaling configuration:

```bash
./k8s/scripts/apply-auto-scaling.sh prod
```

For a dry run:

```bash
./k8s/scripts/apply-auto-scaling.sh prod true
```

## Monitoring

### Metrics

The auto-scaling system collects and exposes the following metrics:

- **CPU Usage**: Average CPU utilization across instances
- **Memory Usage**: Average memory utilization across instances
- **Requests Per Minute**: Total requests per minute across instances
- **Response Time**: Average response time in milliseconds
- **Active Connections**: Number of active connections
- **Scaling Events**: History of scaling events (up/down)
- **Scaling Efficiency**: Measure of how effectively scaling is working

### Monitoring Commands

To monitor HPAs in Kubernetes:

```bash
kubectl get hpa -n aerosuite-prod -w
```

To view scaling history via API:

```bash
curl -X GET http://localhost:5000/api/v1/auto-scaling/history -H "Authorization: Bearer <token>"
```

## Best Practices

1. **Start Conservative**: Begin with conservative thresholds and adjust based on observations
2. **Monitor Scaling Patterns**: Regularly review scaling history to identify patterns
3. **Set Appropriate Cooldowns**: Prevent "thrashing" by setting appropriate cooldown periods
4. **Balance Min/Max Instances**: Set minimum instances for baseline performance and maximum for cost control
5. **Consider Time-Based Scaling**: For predictable traffic patterns, consider time-based scaling rules
6. **Test Scaling Behavior**: Regularly test how the system responds to traffic spikes
7. **Review Resource Requests/Limits**: Ensure container resource requests and limits are properly set

## Troubleshooting

### Common Issues

#### Scaling Not Triggered

- Check that metrics are being collected correctly
- Verify that thresholds are set appropriately
- Ensure HPAs are correctly configured
- Check for active cooldown periods

#### Excessive Scaling

- Increase cooldown periods
- Adjust thresholds to be less sensitive
- Check for metrics anomalies
- Review scaling policies

#### Poor Scaling Efficiency

- Review resource allocation
- Check for bottlenecks outside of CPU/memory
- Consider custom metrics for scaling
- Adjust scaling thresholds

### Logging

The auto-scaling system logs important events to help with troubleshooting:

- Scaling recommendations
- Scaling actions
- Metrics collection issues
- Configuration changes

## Conclusion

The auto-scaling system provides a robust, configurable solution for automatically adjusting the number of service instances based on demand. By combining application-level metrics with Kubernetes HPAs, it ensures optimal performance and resource utilization across the AeroSuite platform. 
