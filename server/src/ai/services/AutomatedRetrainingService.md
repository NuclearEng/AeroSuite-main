# AutomatedRetrainingService

__Implements RF059: Automated Retraining Triggers__

This service listens for data drift and model performance events and automatically triggers model
retraining when thresholds are exceeded.

## Features
- Listens for drift and performance drop events
- Per-model configuration for metrics, thresholds, and cooldowns
- Cooldown to prevent retrain loops
- Notification callback for integration with Slack/email/etc.
- __Audit logging__ of all retrain attempts (see `retrain-audit.log`)
- __Custom retrain policy__ (register a function to control retrain logic)
- __Human-in-the-loop approval__ (register a callback for manual approval)
- __Status/metrics API__ for dashboards and monitoring
- Emits events for retrain start/failure

## Usage

```bash
const { automatedRetrainingService } = require('../index');

// Optionally set a notification callback
automatedRetrainingService.setNotificationCallback((type, payload) => {
  if (type === 'retraining-started') {
    // Notify team via Slack, email, etc.
  }
});

// To trigger retraining manually:
automatedRetrainingService.triggerRetraining('model-1', 'performance', { metricName: 'accuracy',
value: 0.7 });
```bash

## Per-Model Configuration

You can specify per-model settings for performance metric, threshold, and cooldown:

```bash
const service = new AutomatedRetrainingService({
  modelConfig: {
    'model-1': {
      performanceMetric: 'accuracy',
      performanceThreshold: 0.85,
      retrainCooldownMs: 2 _ 60 _ 60 * 1000 // 2 hours
    }
  }
});
```bash

## Cooldown

A retrain cooldown (default: 6 hours) prevents retraining the same model too frequently. This can
be set globally or per-model.

## Notification Callback

Set a callback to receive notifications on retrain start/failure:

```bash
service.setNotificationCallback((type, payload) => {
  // type: 'retraining-started' | 'retraining-failed'
  // payload: { modelId, experimentId, environmentId, reason, error? }
});
```bash

## Audit Logging

All retrain attempts (success, failure, cooldown, policy/approval denial) are logged to
`retrain-audit.log` in JSONL format for traceability and compliance.

## Custom Retrain Policy

You can register a custom policy function to control retrain logic:

```bash
service.setRetrainPolicy(async ({ modelId, reason, event }) => {
  // Return true to allow retrain, false to deny
  if (reason === 'drift' && event.severity === 'critical') return true;
  return false;
});
```bash

## Human-in-the-Loop Approval

You can require human approval before retraining:

```bash
service.setApprovalCallback(async ({ modelId, reason, event }) => {
  // Show UI, send Slack, etc. Return true to approve, false to deny
  return await getHumanApproval(modelId);
});
```bash

## Status/Metrics API

- `await service.getRetrainHistory(modelId)` — Array of audit log entries for the model
- `await service.getLastRetrainStatus(modelId)` — Most recent retrain status for the model
- `service.getNextEligibleRetrainTime(modelId)` — Date when retrain is next allowed

## Testing

See `AutomatedRetrainingService.test.js` for Jest-based tests covering drift, performance,
cooldown, notifications, and policies.

## Extension

- You can extend the notification callback to integrate with any alerting/ops system.
- You can add more sophisticated retrain policies by extending the class.
- You can build a dashboard or CLI using the status/metrics API.
