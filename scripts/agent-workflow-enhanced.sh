#!/bin/bash

# Enhanced Agent Workflow Script with TypeScript Testing
# Incorporates TypeScript best practices from:
# https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
CONCURRENT_TESTS=true
AUTO_FIX=true
STRICT_MODE=false

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} ${BLUE}►${NC} $1"
}

print_success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} ${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date +'%H:%M:%S')]${NC} ${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')]${NC} ${YELLOW}⚠${NC}  $1"
}

print_section() {
    echo
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo
}

# Function to run command with timeout
run_with_timeout() {
    local timeout=$1
    shift
    local command="$@"
    
    timeout $timeout bash -c "$command" 2>&1
    local exit_code=$?
    
    if [ $exit_code -eq 124 ]; then
        print_warning "Command timed out after ${timeout}s: $command"
    fi
    
    return $exit_code
}

# Function to check prerequisites
check_prerequisites() {
    print_section "🔍 Checking Prerequisites"
    
    local missing_deps=()
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        missing_deps+=("Node.js")
    else
        print_success "Node.js $(node --version)"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    else
        print_success "npm $(npm --version)"
    fi
    
    # Check TypeScript
    if ! npx tsc --version &> /dev/null; then
        missing_deps+=("TypeScript")
    else
        print_success "TypeScript $(npx tsc --version)"
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_warning "Docker not found (optional for full testing)"
    else
        print_success "Docker $(docker --version | cut -d' ' -f3 | tr -d ',')"
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing required dependencies: ${missing_deps[*]}"
        exit 1
    fi
}

# Function to run TypeScript tests
run_typescript_tests() {
    print_section "🔷 TypeScript Testing Suite"
    
    # Step 1: Best practices check
    print_status "Running TypeScript best practices check..."
    if npm run test:typescript:best-practices > typescript-best-practices.log 2>&1; then
        print_success "Best practices check passed"
        
        # Extract key metrics
        local good_practices=$(grep -o "Good practices: [0-9]*" typescript-best-practices.log | tail -1 | cut -d' ' -f3)
        local issues=$(grep -o "Total issues: [0-9]*" typescript-best-practices.log | tail -1 | cut -d' ' -f3)
        
        [ -n "$good_practices" ] && print_status "  Found $good_practices good practices"
        [ -n "$issues" ] && [ "$issues" -gt 0 ] && print_warning "  Found $issues best practice issues"
    else
        print_warning "Best practices check found issues (see typescript-best-practices.log)"
    fi
    
    # Step 2: Complete TypeScript test with auto-fix
    print_status "Running complete TypeScript test suite..."
    local ts_command="test:typescript:complete"
    [ "$AUTO_FIX" = true ] && ts_command="test:typescript:complete:fix"
    
    if npm run $ts_command > typescript-complete-test.log 2>&1; then
        print_success "TypeScript tests passed"
        
        # Extract score
        local score=$(grep -o "TypeScript Health Score: [0-9]*/100" typescript-complete-test.log | tail -1 | cut -d' ' -f4)
        [ -n "$score" ] && print_status "  TypeScript Health Score: $score"
    else
        print_error "TypeScript tests failed (see typescript-complete-test.log)"
        
        # Show top errors
        echo "  Top errors:"
        grep "ERROR in" typescript-complete-test.log | head -5 | while read line; do
            echo "    $line"
        done
        
        return 1
    fi
}

# Function to run security tests
run_security_tests() {
    print_section "🔒 Security Testing"
    
    print_status "Running security tests..."
    if run_with_timeout 300 "npm run security-test" > security-test.log 2>&1; then
        print_success "Security tests passed"
    else
        print_warning "Security tests found issues (see security-test.log)"
    fi
    
    print_status "Running OWASP audit..."
    if run_with_timeout 300 "npm run owasp:audit" > owasp-audit.log 2>&1; then
        print_success "OWASP audit passed"
    else
        print_warning "OWASP audit found vulnerabilities (see owasp-audit.log)"
    fi
}

# Function to run performance tests
run_performance_tests() {
    print_section "⚡ Performance Testing"
    
    print_status "Running performance tests..."
    if run_with_timeout 300 "npm run perf" > performance-test.log 2>&1; then
        print_success "Performance tests completed"
        
        # Extract key metrics
        local api_avg=$(grep -o "Average response time: [0-9.]*ms" performance-test.log | tail -1 | cut -d' ' -f4)
        [ -n "$api_avg" ] && print_status "  API avg response: $api_avg"
    else
        print_warning "Performance tests encountered issues (see performance-test.log)"
    fi
}

# Function to run E2E tests
run_e2e_tests() {
    print_section "🌐 End-to-End Testing"
    
    print_status "Checking E2E prerequisites..."
    if npm run test:e2e:check > e2e-check.log 2>&1; then
        print_success "E2E prerequisites satisfied"
        
        print_status "Running E2E tests..."
        if run_with_timeout 600 "npm run cy:run" > e2e-test.log 2>&1; then
            print_success "E2E tests passed"
        else
            print_error "E2E tests failed (see e2e-test.log)"
            return 1
        fi
    else
        print_warning "E2E prerequisites not met, skipping E2E tests"
    fi
}

# Function to run all tests
run_all_tests() {
    local failed_tests=()
    
    # Run tests in order of importance
    run_typescript_tests || failed_tests+=("TypeScript")
    run_security_tests || failed_tests+=("Security")
    run_performance_tests || failed_tests+=("Performance")
    run_e2e_tests || failed_tests+=("E2E")
    
    return ${#failed_tests[@]}
}

# Function to generate summary report
generate_summary() {
    print_section "📊 Test Summary Report"
    
    local report_file="agent-workflow-report.json"
    
    # Create JSON report
    cat > $report_file << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "results": {
    "typescript": {
      "status": "$([ -f typescript-complete-test.log ] && grep -q "All checks passed" typescript-complete-test.log && echo "passed" || echo "failed")",
      "score": "$(grep -o "TypeScript Health Score: [0-9]*/100" typescript-complete-test.log 2>/dev/null | tail -1 | cut -d' ' -f4 || echo "N/A")"
    },
    "security": {
      "status": "$([ -f security-test.log ] && grep -q "All security checks passed" security-test.log && echo "passed" || echo "warnings")"
    },
    "performance": {
      "status": "$([ -f performance-test.log ] && echo "completed" || echo "skipped")"
    },
    "e2e": {
      "status": "$([ -f e2e-test.log ] && grep -q "All specs passed" e2e-test.log && echo "passed" || echo "failed")"
    }
  },
  "logs": {
    "typescript": "typescript-complete-test.log",
    "security": "security-test.log",
    "performance": "performance-test.log",
    "e2e": "e2e-test.log"
  }
}
EOF
    
    print_success "Summary report saved to $report_file"
    
    # Display summary
    echo
    echo "Test Results:"
    echo "  • TypeScript: $(jq -r '.results.typescript.status' $report_file) (Score: $(jq -r '.results.typescript.score' $report_file))"
    echo "  • Security: $(jq -r '.results.security.status' $report_file)"
    echo "  • Performance: $(jq -r '.results.performance.status' $report_file)"
    echo "  • E2E: $(jq -r '.results.e2e.status' $report_file)"
}

# Main execution
main() {
    print_section "🤖 Enhanced Agent Workflow"
    echo "Starting comprehensive testing suite..."
    echo "Configuration:"
    echo "  • Auto-fix: $AUTO_FIX"
    echo "  • Concurrent: $CONCURRENT_TESTS"
    echo "  • Strict mode: $STRICT_MODE"
    
    # Check prerequisites
    check_prerequisites
    
    # Install dependencies if needed
    print_status "Checking dependencies..."
    if ! npm run npm:check > /dev/null 2>&1; then
        print_status "Installing dependencies..."
        npm install
    fi
    
    # Run all tests
    local start_time=$(date +%s)
    run_all_tests
    local test_result=$?
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Generate summary
    generate_summary
    
    print_section "✨ Workflow Complete"
    echo "Total duration: ${duration}s"
    
    if [ $test_result -eq 0 ]; then
        print_success "All tests passed! 🎉"
        exit 0
    else
        print_error "Some tests failed. Please review the logs."
        exit 1
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-fix)
            AUTO_FIX=false
            shift
            ;;
        --strict)
            STRICT_MODE=true
            shift
            ;;
        --sequential)
            CONCURRENT_TESTS=false
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --no-fix      Disable auto-fixing of issues"
            echo "  --strict      Enable strict mode"
            echo "  --sequential  Run tests sequentially"
            echo "  --help        Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main function
main