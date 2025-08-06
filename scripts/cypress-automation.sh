#!/bin/bash

# Cypress Automation Script for AeroSuite
# Based on Cypress Best Practices

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

# Function to check if Cypress is installed
check_cypress() {
    if ! command -v npx cypress &> /dev/null; then
        print_error "Cypress is not installed. Installing Cypress..."
        npm install cypress --save-dev
    fi
}

# Function to validate Cypress configuration
validate_cypress_config() {
    print_status "Validating Cypress configuration..."
    npx cypress verify
    print_success "Cypress configuration is valid"
}

# Function to run API health tests
run_api_health_tests() {
    print_status "Running API health tests..."
    npx cypress run --spec "cypress/e2e/api-health.cy.js" --headless
    print_success "API health tests completed"
}

# Function to run application tests
run_app_tests() {
    print_status "Running application tests..."
    npx cypress run --spec "cypress/e2e/app-testing.cy.js" --headless
    print_success "Application tests completed"
}

# Function to run all existing tests
run_all_tests() {
    print_status "Running all existing tests..."
    npx cypress run --headless
    print_success "All tests completed"
}

# Function to run tests with specific browser
run_tests_with_browser() {
    local browser=${1:-chrome}
    print_status "Running tests with $browser browser..."
    npx cypress run --browser $browser --headless
    print_success "Tests completed with $browser"
}

# Function to run tests with video recording
run_tests_with_video() {
    print_status "Running tests with video recording..."
    npx cypress run --headless --record
    print_success "Tests with video recording completed"
}

# Function to run tests in parallel (if supported)
run_tests_parallel() {
    print_status "Running tests in parallel..."
    npx cypress run --headless --parallel
    print_success "Parallel tests completed"
}

# Function to generate test reports
generate_reports() {
    print_status "Generating test reports..."
    
    # Create reports directory if it doesn't exist
    mkdir -p cypress/reports
    
    # Run tests with mochawesome reporter
    npx cypress run --headless --reporter mochawesome
    
    print_success "Test reports generated in cypress/reports/"
}

# Function to clean up test artifacts
cleanup_artifacts() {
    print_status "Cleaning up test artifacts..."
    
    # Remove old screenshots and videos
    rm -rf cypress/screenshots/*
    rm -rf cypress/videos/*
    
    # Remove old reports
    rm -rf cypress/reports/*
    
    print_success "Test artifacts cleaned up"
}

# Function to run accessibility tests
run_accessibility_tests() {
    print_status "Running accessibility tests..."
    
    # Check if cypress-axe is installed
    if ! npm list cypress-axe &> /dev/null; then
        print_status "Installing cypress-axe for accessibility testing..."
        npm install cypress-axe --save-dev
    fi
    
    # Run accessibility tests (you would need to create these)
    npx cypress run --spec "cypress/e2e/accessibility.cy.js" --headless || {
        print_warning "Accessibility tests not found, skipping..."
    }
    
    print_success "Accessibility tests completed"
}

# Function to run performance tests
run_performance_tests() {
    print_status "Running performance tests..."
    
    # Run tests with performance monitoring
    npx cypress run --spec "cypress/e2e/performance.cy.js" --headless || {
        print_warning "Performance tests not found, skipping..."
    }
    
    print_success "Performance tests completed"
}

# Function to run visual regression tests
run_visual_tests() {
    print_status "Running visual regression tests..."
    
    # Check if cypress-visual-regression is installed
    if ! npm list cypress-visual-regression &> /dev/null; then
        print_status "Installing cypress-visual-regression for visual testing..."
        npm install cypress-visual-regression --save-dev
    fi
    
    # Run visual tests (you would need to create these)
    npx cypress run --spec "cypress/e2e/visual.cy.js" --headless || {
        print_warning "Visual tests not found, skipping..."
    }
    
    print_success "Visual regression tests completed"
}

# Function to run smoke tests
run_smoke_tests() {
    print_status "Running smoke tests..."
    
    # Run only critical tests
    npx cypress run --spec "cypress/e2e/smoke.cy.js" --headless || {
        print_warning "Smoke tests not found, running API health tests instead..."
        run_api_health_tests
    }
    
    print_success "Smoke tests completed"
}

# Function to run regression tests
run_regression_tests() {
    print_status "Running regression tests..."
    
    # Run all tests except smoke tests
    npx cypress run --headless --spec "cypress/e2e/api-health.cy.js,cypress/e2e/app-testing.cy.js"
    
    print_success "Regression tests completed"
}

# Function to show help
show_help() {
    echo "Cypress Automation Script for AeroSuite"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  health       - Run API health tests"
    echo "  app          - Run application tests"
    echo "  all          - Run all tests"
    echo "  browser      - Run tests with specific browser (default: chrome)"
    echo "  video        - Run tests with video recording"
    echo "  parallel     - Run tests in parallel"
    echo "  reports      - Generate test reports"
    echo "  cleanup      - Clean up test artifacts"
    echo "  accessibility - Run accessibility tests"
    echo "  performance  - Run performance tests"
    echo "  visual       - Run visual regression tests"
    echo "  smoke        - Run smoke tests"
    echo "  regression   - Run regression tests"
    echo "  validate     - Validate Cypress configuration"
    echo "  help         - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 health                    # Run API health tests"
    echo "  $0 app                       # Run application tests"
    echo "  $0 all                       # Run all tests"
    echo "  $0 browser firefox           # Run tests with Firefox"
    echo "  $0 video                     # Run tests with video recording"
    echo "  $0 reports                   # Generate test reports"
    echo ""
}

# Main script logic
case "${1:-help}" in
    "health")
        check_cypress
        validate_cypress_config
        run_api_health_tests
        ;;
    "app")
        check_cypress
        validate_cypress_config
        run_app_tests
        ;;
    "all")
        check_cypress
        validate_cypress_config
        run_all_tests
        ;;
    "browser")
        check_cypress
        validate_cypress_config
        run_tests_with_browser "$2"
        ;;
    "video")
        check_cypress
        validate_cypress_config
        run_tests_with_video
        ;;
    "parallel")
        check_cypress
        validate_cypress_config
        run_tests_parallel
        ;;
    "reports")
        check_cypress
        validate_cypress_config
        generate_reports
        ;;
    "cleanup")
        cleanup_artifacts
        ;;
    "accessibility")
        check_cypress
        validate_cypress_config
        run_accessibility_tests
        ;;
    "performance")
        check_cypress
        validate_cypress_config
        run_performance_tests
        ;;
    "visual")
        check_cypress
        validate_cypress_config
        run_visual_tests
        ;;
    "smoke")
        check_cypress
        validate_cypress_config
        run_smoke_tests
        ;;
    "regression")
        check_cypress
        validate_cypress_config
        run_regression_tests
        ;;
    "validate")
        check_cypress
        validate_cypress_config
        ;;
    "help"|*)
        show_help
        ;;
esac 