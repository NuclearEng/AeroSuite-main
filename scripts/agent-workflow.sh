#!/bin/bash

# AeroSuite Agent Workflow Script
# This script provides common development workflows for the Agent

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Function to check backend health
check_backend_health() {
    print_status "Checking backend health..."
    if curl -s http://localhost:5002/api/health > /dev/null; then
        print_success "Backend is healthy"
        return 0
    else
        print_warning "Backend is not responding"
        return 1
    fi
}

# Function to start development environment
start_dev_environment() {
    print_status "Starting development environment..."
    
    check_docker
    
    # Start Docker containers
    print_status "Starting Docker containers..."
    docker-compose -f docker-compose.fixed.yml up -d
    
    # Wait for containers to be ready
    print_status "Waiting for containers to be ready..."
    sleep 10
    
    # Check backend health
    if check_backend_health; then
        print_success "Development environment is ready"
    else
        print_warning "Backend may need more time to start"
    fi
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    
    # Check dependencies first
    print_status "Checking dependencies..."
    npm run npm:check
    
    # Run backend tests
    print_status "Running backend tests..."
    cd server && npm test --silent && cd ..
    
    # Run frontend tests
    print_status "Running frontend tests..."
    cd client && npm test --silent && cd ..
    
    # Run Cypress tests with new configuration
    print_status "Running Cypress E2E tests..."
    
    # Run API health tests first
    print_status "Running API health tests..."
    npx cypress run --spec "cypress/e2e/api-health.cy.js" --headless
    
    # Run comprehensive application tests
    print_status "Running application tests..."
    npx cypress run --spec "cypress/e2e/app-testing.cy.js" --headless
    
    # Run all existing tests
    print_status "Running all existing tests..."
    npx cypress run --headless
    
    print_success "All tests completed"
}

# Function to check code quality
check_code_quality() {
    print_status "Checking code quality..."
    
    # Run ESLint
    print_status "Running ESLint..."
    npm run lint
    
    # Run TypeScript check
    print_status "Running TypeScript check..."
    cd client && npm run type-check && cd ..
    
    # Check for security vulnerabilities
    print_status "Checking for security vulnerabilities..."
    npm audit --audit-level moderate
    
    # Run Cypress linting
    print_status "Running Cypress linting..."
    npx cypress lint
    
    # Validate Cypress configuration
    print_status "Validating Cypress configuration..."
    npx cypress verify
    
    # Run npm best practices check
    print_status "Running npm best practices check..."
    npm run npm:check
    
    # Check for outdated dependencies
    print_status "Checking for outdated dependencies..."
    npm run npm:outdated
    
    print_success "Code quality checks completed"
}

# Function to deploy to production
deploy_production() {
    print_status "Starting production deployment..."
    
    # Run all tests first
    run_tests
    
    # Check code quality
    check_code_quality
    
    # Build production images
    print_status "Building production images..."
    docker-compose -f docker-compose.production.yml build
    
    # Deploy using production script
    print_status "Deploying to production..."
    ./deploy-production.sh
    
    print_success "Production deployment completed"
}

# Function to debug backend issues
debug_backend() {
    print_status "Starting backend debugging..."
    
    # Check Docker logs
    print_status "Checking Docker logs..."
    docker-compose logs server
    
    # Check backend health
    check_backend_health
    
    # Run diagnostic script
    print_status "Running diagnostic script..."
    node scripts/debug-backend.js
    
    print_success "Backend debugging completed"
}

# Function to run Cypress tests
run_cypress_tests() {
    print_status "Starting Cypress testing..."
    
    # Check if Cypress is installed
    if ! command -v npx cypress &> /dev/null; then
        print_error "Cypress is not installed. Installing Cypress..."
        npm install cypress --save-dev
    fi
    
    # Validate Cypress configuration
    print_status "Validating Cypress configuration..."
    npx cypress verify
    
    # Run specific test suites
    print_status "Running API health tests..."
    npx cypress run --spec "cypress/e2e/api-health.cy.js" --headless
    
    print_status "Running application tests..."
    npx cypress run --spec "cypress/e2e/app-testing.cy.js" --headless
    
    # Run all tests if requested
    if [ "$1" = "all" ]; then
        print_status "Running all Cypress tests..."
        npx cypress run --headless
    fi
    
    print_success "Cypress testing completed"
}

# Function to show help
show_help() {
    echo "AeroSuite Agent Workflow Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
echo "  start-dev    - Start development environment"
echo "  test         - Run all tests"
echo "  cypress      - Run Cypress tests (use 'cypress all' for all tests)"
echo "  quality      - Check code quality"
echo "  deploy       - Deploy to production"
echo "  debug        - Debug backend issues"
echo "  health       - Check backend health"
echo "  help         - Show this help message"
    echo ""
}

# Main script logic
case "${1:-help}" in
    "start-dev")
        start_dev_environment
        ;;
    "test")
        run_tests
        ;;
    "cypress")
        run_cypress_tests "$2"
        ;;
    "quality")
        check_code_quality
        ;;
    "deploy")
        deploy_production
        ;;
    "debug")
        debug_backend
        ;;
    "health")
        check_backend_health
        ;;
    "help"|*)
        show_help
        ;;
esac 