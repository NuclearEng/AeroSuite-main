# AeroSuite Architecture Overview

AeroSuite uses Domain-Driven Design (DDD) with clear bounded contexts:

```mermaid
graph TD
  Supplier -->|references| Inspection
  Customer -->|references| Inspection
  Inspection -->|references| Component
  Component -->|references| Supplier
```

## Layers
- Presentation (React, API controllers)
- Application (Services, Orchestrators)
- Domain (Models, Aggregates, Repositories)
- Infrastructure (DB, Caching, Messaging)

## Deployment
- Dockerized microservices
- K8s for orchestration
- CI/CD via GitHub Actions

See ADRs in this folder for key decisions. 