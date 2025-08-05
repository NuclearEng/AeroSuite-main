#!/bin/bash

# AeroSuite Production Deployment Script
# This script deploys the application to production

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"your-registry.com"}
IMAGE_TAG=${2:-latest}

echo -e "${GREEN}🚀 AeroSuite Production Deployment${NC}"
echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
echo -e "${YELLOW}Image Tag: $IMAGE_TAG${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command_exists docker; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

if ! command_exists docker-compose; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites satisfied${NC}"

# Create necessary directories
echo -e "${YELLOW}Creating directories...${NC}"
mkdir -p logs uploads monitoring/grafana/provisioning nginx/ssl

# Check for SSL certificates
if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/key.pem" ]; then
    echo -e "${YELLOW}SSL certificates not found. Generating self-signed certificates...${NC}"
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/key.pem \
        -out nginx/ssl/cert.pem \
        -subj "/C=US/ST=State/L=City/O=AeroSuite/CN=localhost"
    echo -e "${GREEN}✓ Self-signed certificates generated${NC}"
fi

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
    echo -e "${YELLOW}Loading environment variables from .env.$ENVIRONMENT${NC}"
    export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)
else
    echo -e "${RED}Warning: .env.$ENVIRONMENT not found${NC}"
    echo -e "${YELLOW}Using default values${NC}"
fi

# Build images
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose -f docker-compose.production.yml build

# Tag images for registry
if [ "$DOCKER_REGISTRY" != "your-registry.com" ]; then
    echo -e "${YELLOW}Tagging images for registry...${NC}"
    docker tag aerosuite-app:latest $DOCKER_REGISTRY/aerosuite-app:$IMAGE_TAG
    
    # Push to registry
    echo -e "${YELLOW}Pushing images to registry...${NC}"
    docker push $DOCKER_REGISTRY/aerosuite-app:$IMAGE_TAG
fi

# Stop existing containers
echo -e "${YELLOW}Stopping existing containers...${NC}"
docker-compose -f docker-compose.production.yml down

# Start services
echo -e "${YELLOW}Starting services...${NC}"
docker-compose -f docker-compose.production.yml up -d

# Wait for services to be healthy
echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
sleep 10

# Check service health
echo -e "${YELLOW}Checking service health...${NC}"

# MongoDB
if docker-compose -f docker-compose.production.yml exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ MongoDB is healthy${NC}"
else
    echo -e "${RED}✗ MongoDB is not responding${NC}"
fi

# Redis
if docker-compose -f docker-compose.production.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis is healthy${NC}"
else
    echo -e "${RED}✗ Redis is not responding${NC}"
fi

# Application
if curl -f -s http://localhost:5000/api/health > /dev/null; then
    echo -e "${GREEN}✓ Application is healthy${NC}"
else
    echo -e "${RED}✗ Application is not responding${NC}"
fi

# Nginx
if curl -f -s http://localhost/health > /dev/null; then
    echo -e "${GREEN}✓ Nginx is healthy${NC}"
else
    echo -e "${RED}✗ Nginx is not responding${NC}"
fi

# Create initial admin user
echo -e "${YELLOW}Creating initial admin user...${NC}"
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@aerosuite.com",
    "password": "changeme123",
    "name": "Admin User",
    "role": "admin"
  }' > /dev/null 2>&1 || true

# Show service URLs
echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo -e "${YELLOW}Service URLs:${NC}"
echo -e "  Application: https://localhost"
echo -e "  API: https://localhost/api"
echo -e "  Grafana: http://localhost:3001 (admin/changeme)"
echo -e "  Prometheus: http://localhost:9090"
echo ""
echo -e "${YELLOW}Default Admin Credentials:${NC}"
echo -e "  Email: admin@aerosuite.com"
echo -e "  Password: changeme123"
echo ""
echo -e "${RED}⚠️  Remember to:${NC}"
echo -e "  1. Change default passwords"
echo -e "  2. Update SSL certificates"
echo -e "  3. Configure firewall rules"
echo -e "  4. Set up backups"
echo -e "  5. Configure monitoring alerts"

# Show logs
echo ""
echo -e "${YELLOW}To view logs:${NC}"
echo "  docker-compose -f docker-compose.production.yml logs -f" 