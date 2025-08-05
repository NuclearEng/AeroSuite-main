# Deployment Guide

## CI/CD
- Automated via GitHub Actions
- See `.github/workflows/ci.yml`

## Docker
- Build images: `docker build -t aerosuite-server .`
- Push to registry and deploy

## Kubernetes
- Manifests in `k8s/`
- Use `kubectl` and `kustomize` for deployment

## Environment Variables
- See `.env.example` for required vars
- Use secret managers for production secrets 