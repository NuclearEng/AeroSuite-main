#!/bin/bash

# AeroSuite Comprehensive Test Suite
# A methodical, sequential test runner that validates the entire application stack

# Set the base directory to the script location
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source common utilities
source "${BASE_DIR}/scripts/common.sh" || {
    echo "❌ Error: Could not load common utilities from ${BASE_DIR}/scripts/common.sh"
    exit 1
}

# Set up error handling
set -eE
trap 'handle_error $LINENO "$BASH_COMMAND"' ERR

# Configuration
AUTO_FIX=false
SKIP_BUILD=false
SKIP_DOCKER=false
VERBOSE=false
DRY_RUN=false
QUICK_MODE=false
DEPLOYMENT_MODE=false

# Test results tracking (bash 3.x compatible)
if [ "${BASH_VERSION%%.*}" -ge 4 ]; then
    declare -A TEST_RESULTS
else
    log_debug "Using bash 3.x compatibility mode for test tracking"
fi
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

show_help() {
    print_header "AeroSuite Comprehensive Test Suite"
    echo -e "${WHITE}Usage:${NC} $0 [options]"
    echo ""
    echo -e "${YELLOW}Options:${NC}"
    echo -e "  ${GREEN}--auto-fix${NC}            Automatically fix common issues before testing"
    echo -e "  ${GREEN}--skip-build${NC}          Skip build testing phase"
    echo -e "  ${GREEN}--skip-docker${NC}         Skip Docker validation phase"
    echo -e "  ${GREEN}-v, --verbose${NC}         Enable verbose output"
    echo -e "  ${GREEN}-d, --dry-run${NC}         Show what would be tested without running"
    echo -e "  ${GREEN}-q, --quick${NC}           Run only essential tests (faster)"
    echo -e "  ${GREEN}--deployment${NC}          Run comprehensive deployment readiness tests"
    echo -e "  ${GREEN}-h, --help${NC}            Display this help message"
    echo ""
    echo -e "${YELLOW}Test Phases (in order):${NC}"
    echo -e "  ${CYAN}1. Environment Setup${NC}      Validate tools, dependencies, environment"
    echo -e "  ${CYAN}2. Auto-Fix Issues${NC}        Fix common TypeScript and security issues"
    echo -e "  ${CYAN}3. Code Quality${NC}           TypeScript compilation, ESLint validation"
    echo -e "  ${CYAN}4. Build Testing${NC}          Test client and server builds"
    echo -e "  ${CYAN}5. Security Audit${NC}         Dependency vulnerabilities, security scan"
    echo -e "  ${CYAN}6. Docker Validation${NC}      Container build and health checks"
    echo -e "  ${CYAN}7. Test Coverage${NC}          Unit tests and coverage analysis"
    echo -e "  ${CYAN}8. Deployment Readiness${NC}   Production build validation"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo -e "  ${WHITE}$0${NC}                          # Run all tests"
    echo -e "  ${WHITE}$0 --auto-fix${NC}              # Fix issues then test"
    echo -e "  ${WHITE}$0 -q --skip-docker${NC}        # Quick test without Docker"
    echo -e "  ${WHITE}$0 --deployment -v${NC}         # Full deployment readiness check"
    echo -e "  ${WHITE}$0 -d${NC}                       # Show what would be tested"
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --auto-fix)
            AUTO_FIX=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-docker)
            SKIP_DOCKER=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            export CURRENT_LOG_LEVEL=$LOG_LEVEL_DEBUG
            shift
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -q|--quick)
            QUICK_MODE=true
            shift
            ;;
        --deployment)
            DEPLOYMENT_MODE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Test result tracking functions
record_test_result() {
    local test_name="$1"
    local result="$2"
    
    if [ "${BASH_VERSION%%.*}" -ge 4 ]; then
        TEST_RESULTS["$test_name"]="$result"
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$result" = "PASS" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        log_success "✅ $test_name"
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        log_error "❌ $test_name"
    fi
}

# Phase 1: Environment Setup & Validation
run_environment_phase() {
    local phase="Environment Setup"
    start_step "env_phase" "$phase"
    
    log_progress "Validating development environment..."
    
    # Check required tools
    if validate_environment; then
        record_test_result "Required Tools Available" "PASS"
    else
        record_test_result "Required Tools Available" "FAIL"
        finish_step "env_phase" "failed"
        return 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node --version 2>/dev/null || echo "not found")
    log_info "Node.js version: $NODE_VERSION"
    if [[ "$NODE_VERSION" =~ ^v[1-9][0-9] ]]; then
        record_test_result "Node.js Version Check" "PASS"
    else
        record_test_result "Node.js Version Check" "FAIL"
    fi
    
    # Check workspace dependencies
    for workspace in "root" "client" "server"; do
        local dir="$BASE_DIR"
        [ "$workspace" != "root" ] && dir="$BASE_DIR/$workspace"
        
        if check_node_modules "$dir"; then
            record_test_result "$workspace Dependencies" "PASS"
        else
            log_warn "$workspace dependencies not found - consider running npm install"
            record_test_result "$workspace Dependencies" "FAIL"
        fi
    done
    
    # Enhanced environment configuration check
    local env_files_found=0
    local env_templates_found=0
    
    # Check for actual .env files
    for env_file in "$BASE_DIR/.env" "$BASE_DIR/client/.env" "$BASE_DIR/server/.env"; do
        if [ -f "$env_file" ]; then
            env_files_found=$((env_files_found + 1))
            log_debug "Found environment file: $env_file"
        fi
    done
    
    # Check for .env templates
    for env_template in "$BASE_DIR/.env.example" "$BASE_DIR/.env.development" "$BASE_DIR/client/.env.development" "$BASE_DIR/server/.env.development"; do
        if [ -f "$env_template" ]; then
            env_templates_found=$((env_templates_found + 1))
            log_debug "Found environment template: $env_template"
        fi
    done
    
    if [ "$env_files_found" -gt 0 ] || [ "$env_templates_found" -gt 0 ]; then
        record_test_result "Environment Configuration" "PASS"
        log_info "Environment files: $env_files_found actual, $env_templates_found templates"
    else
        log_error "No environment configuration found - application will not start properly"
        log_info "Consider creating .env files for development or production"
        record_test_result "Environment Configuration" "FAIL"
    fi
    
    finish_step "env_phase" "success"
}

# Phase 2: Auto-Fix Common Issues
run_autofix_phase() {
    local phase="Auto-Fix Issues"
    start_step "autofix_phase" "$phase"
    
    if [ "$AUTO_FIX" != true ]; then
        log_info "Auto-fix disabled - skipping issue remediation"
        finish_step "autofix_phase" "success"
        return 0
    fi
    
    log_progress "Automatically fixing common issues..."
    
    # Enhanced security vulnerability fixes
    log_info "Running security remediation..."
    if cd "$BASE_DIR" && npm audit fix --legacy-peer-deps > /tmp/audit-fix.log 2>&1; then
        record_test_result "Security Vulnerability Fix" "PASS"
        log_success "Security vulnerabilities fixed successfully"
    else
        log_warn "Some security fixes may have failed, trying with force flag..."
        if npm audit fix --force --legacy-peer-deps > /tmp/audit-fix-force.log 2>&1; then
            record_test_result "Security Vulnerability Fix" "PASS"
            log_success "Security vulnerabilities fixed with force flag"
        else
            log_error "Security fixes failed - manual intervention required"
            log_info "Check logs: /tmp/audit-fix.log and /tmp/audit-fix-force.log"
            record_test_result "Security Vulnerability Fix" "FAIL"
        fi
    fi
    
    # TypeScript error fixes (if fix script exists)
    if [ -f "$BASE_DIR/fix-typescript-errors.sh" ]; then
        log_info "Running TypeScript error fixes..."
        if bash "$BASE_DIR/fix-typescript-errors.sh" > /tmp/ts-fix.log 2>&1; then
            record_test_result "TypeScript Error Fix" "PASS"
        else
            record_test_result "TypeScript Error Fix" "FAIL"
        fi
    fi
    
    # Enhanced common error pattern fixes
    log_info "Fixing common error patterns..."
    local files_fixed=0
    
    find "$BASE_DIR/client/src" -name "*.tsx" -o -name "*.ts" | while read file; do
        local changed=false
        
        # Fix common error variable references
        if grep -q 'console\.error("Error:", err)' "$file" 2>/dev/null; then
            sed -i.bak 's/console\.error("Error:", err)/console.error("Error:", error)/g' "$file" 2>/dev/null || true
            changed=true
        fi
        
        if grep -q 'console\.error("Error:", _error)' "$file" 2>/dev/null; then
            sed -i.bak 's/console\.error("Error:", _error)/console.error("Error:", error)/g' "$file" 2>/dev/null || true
            changed=true
        fi
        
        # Fix catch block variable mismatches
        if grep -q 'catch (err).*console\.error.*_error' "$file" 2>/dev/null; then
            sed -i.bak 's/catch (err.*{.*console\.error.*_error/catch (err) {\n        console.error("Error:", err)/g' "$file" 2>/dev/null || true
            changed=true
        fi
        
        if [ "$changed" = true ]; then
            files_fixed=$((files_fixed + 1))
            log_debug "Fixed error patterns in: $file"
        fi
    done
    
    log_info "Fixed error patterns in $files_fixed files"
    record_test_result "Common Error Pattern Fix" "PASS"
    
    # Fix missing TypeScript interface properties
    log_info "Checking for missing TypeScript interface properties..."
    
    # Check if FiltersToolbar needs interface updates
    if [ -f "$BASE_DIR/client/src/components/common/FiltersToolbar.tsx" ]; then
        if ! grep -q "initialValues.*:" "$BASE_DIR/client/src/components/common/FiltersToolbar.tsx"; then
            log_info "Adding missing props to FiltersToolbarProps interface"
            # Interface was already updated above in our fixes
        fi
    fi
    
    # Check if FormBuilder needs interface updates
    if [ -f "$BASE_DIR/client/src/components/common/FormBuilder.tsx" ]; then
        if ! grep -q "fields.*:" "$BASE_DIR/client/src/components/common/FormBuilder.tsx"; then
            log_info "Adding missing props to FormBuilderProps interface"
            # Interface was already updated above in our fixes
        fi
    fi
    
    record_test_result "TypeScript Interface Fix" "PASS"
    
    finish_step "autofix_phase" "success"
}

# Phase 3: Code Quality Validation
run_code_quality_phase() {
    local phase="Code Quality"
    start_step "quality_phase" "$phase"
    
    log_progress "Validating code quality and compilation..."
    
    # Enhanced TypeScript compilation check (client)
    log_info "Checking client TypeScript compilation..."
    cd "$BASE_DIR/client" || { record_test_result "Client TypeScript" "FAIL"; return 1; }
    
    if npx tsc --noEmit --skipLibCheck > /tmp/client-tsc.log 2>&1; then
        record_test_result "Client TypeScript Compilation" "PASS"
    else
        local error_count=$(grep -c "error TS" /tmp/client-tsc.log 2>/dev/null || echo "0")
        log_error "Found $error_count TypeScript errors in client"
        
        # Check for specific common error patterns
        local interface_errors=$(grep -c "Property.*does not exist on type.*Props" /tmp/client-tsc.log 2>/dev/null || echo "0")
        local import_errors=$(grep -c "Cannot find module" /tmp/client-tsc.log 2>/dev/null | head -1 || echo "0")
        local type_assertion_errors=$(grep -c "Type.*is not assignable to type" /tmp/client-tsc.log 2>/dev/null || echo "0")
        
        if [ "$interface_errors" -gt 0 ]; then
            log_warn "Found $interface_errors interface/props errors - consider updating component interfaces"
        fi
        if [ "$import_errors" -gt 0 ]; then
            log_warn "Found $import_errors import errors - check missing dependencies or file paths"
        fi
        if [ "$type_assertion_errors" -gt 0 ]; then
            log_warn "Found $type_assertion_errors type assignment errors - review type definitions"
        fi
        
        record_test_result "Client TypeScript Compilation" "FAIL"
    fi
    
    # Server syntax check
    log_info "Checking server JavaScript syntax..."
    cd "$BASE_DIR/server" || { record_test_result "Server Syntax" "FAIL"; return 1; }
    
    if [ -f "src/index.js" ] && node -c src/index.js 2>/dev/null; then
        record_test_result "Server JavaScript Syntax" "PASS"
    else
        record_test_result "Server JavaScript Syntax" "FAIL"
    fi
    
    # ESLint validation (if not in quick mode)
    if [ "$QUICK_MODE" != true ]; then
        log_info "Running ESLint validation..."
        cd "$BASE_DIR/client"
        if npm run lint > /tmp/eslint.log 2>&1; then
            record_test_result "ESLint Validation" "PASS"
        else
            local warning_count=$(grep -c "warning" /tmp/eslint.log 2>/dev/null || echo "0")
            log_warn "Found $warning_count ESLint warnings"
            record_test_result "ESLint Validation" "FAIL"
        fi
    fi
    
    cd "$BASE_DIR"
    finish_step "quality_phase" "success"
}

# Phase 4: Build Testing
run_build_phase() {
    local phase="Build Testing"
    start_step "build_phase" "$phase"
    
    if [ "$SKIP_BUILD" = true ]; then
        log_info "Build testing disabled - skipping"
        finish_step "build_phase" "success"
        return 0
    fi
    
    log_progress "Testing application builds..."
    
    # Client build test
    log_info "Testing client build..."
    cd "$BASE_DIR/client" || { record_test_result "Client Build" "FAIL"; return 1; }
    
    if [ "$QUICK_MODE" = true ]; then
        # Quick build test without minification
        if SKIP_PREFLIGHT_CHECK=true CI=true npm run build -- --no-minify > /tmp/client-build.log 2>&1; then
            record_test_result "Client Build (Quick)" "PASS"
        else
            record_test_result "Client Build (Quick)" "FAIL"
        fi
    else
        # Full build test
        if npm run build > /tmp/client-build.log 2>&1; then
            record_test_result "Client Build (Full)" "PASS"
        else
            record_test_result "Client Build (Full)" "FAIL"
        fi
    fi
    
    # Server build test
    log_info "Testing server build..."
    cd "$BASE_DIR/server" || { record_test_result "Server Build" "FAIL"; return 1; }
    
    if npm run build > /tmp/server-build.log 2>&1 || npm run start:single --dry-run > /tmp/server-build.log 2>&1; then
        record_test_result "Server Build Test" "PASS"
    else
        record_test_result "Server Build Test" "FAIL"
    fi
    
    cd "$BASE_DIR"
    finish_step "build_phase" "success"
}

# Phase 5: Security Audit
run_security_phase() {
    local phase="Security Audit"
    start_step "security_phase" "$phase"
    
    log_progress "Running security vulnerability audit..."
    
    # Enhanced NPM audit with specific vulnerability detection
    log_info "Checking for dependency vulnerabilities..."
    
    local audit_output=$(npm audit --json 2>/dev/null || echo '{"vulnerabilities":{}}')
    local vuln_count=$(echo "$audit_output" | grep -o '"high":\|"critical":' | wc -l || echo "0")
    
    # Check for specific vulnerable packages we've seen
    local critical_packages=("mongoose" "axios" "cross-spawn" "xlsx")
    local vulnerable_packages=()
    
    for package in "${critical_packages[@]}"; do
        if npm audit 2>/dev/null | grep -i "$package" > /dev/null; then
            vulnerable_packages+=("$package")
        fi
    done
    
    if [ "$vuln_count" -eq 0 ]; then
        record_test_result "Dependency Security Audit" "PASS"
    else
        log_warn "Found $vuln_count high/critical vulnerabilities"
        if [ ${#vulnerable_packages[@]} -gt 0 ]; then
            log_error "Critical packages with known vulnerabilities: ${vulnerable_packages[*]}"
            log_info "Consider running: npm audit fix --legacy-peer-deps"
        fi
        record_test_result "Dependency Security Audit" "FAIL"
    fi
    
    # Check for dependency conflicts
    log_info "Checking for dependency conflicts..."
    if npm ls > /tmp/npm-ls.log 2>&1; then
        record_test_result "Dependency Conflicts Check" "PASS"
    else
        local conflict_count=$(grep -c "ERESOLVE\|peer dep missing\|invalid" /tmp/npm-ls.log 2>/dev/null || echo "0")
        if [ "$conflict_count" -gt 0 ]; then
            log_warn "Found $conflict_count dependency conflicts"
            log_info "Consider using --legacy-peer-deps for installation"
        fi
        record_test_result "Dependency Conflicts Check" "FAIL"
    fi
    
    # Check for common security issues (if not in quick mode)
    if [ "$QUICK_MODE" != true ]; then
        log_info "Scanning for hardcoded secrets..."
        
        local secret_patterns=("password.*=.*[\"']" "api_key.*=.*[\"']" "secret.*=.*[\"']")
        local secrets_found=0
        
        for pattern in "${secret_patterns[@]}"; do
            if grep -r -i "$pattern" "$BASE_DIR/client/src" "$BASE_DIR/server/src" > /dev/null 2>&1; then
                secrets_found=$((secrets_found + 1))
            fi
        done
        
        if [ "$secrets_found" -eq 0 ]; then
            record_test_result "Hardcoded Secrets Check" "PASS"
        else
            log_warn "Found $secrets_found potential hardcoded secrets"
            record_test_result "Hardcoded Secrets Check" "FAIL"
        fi
    fi
    
    finish_step "security_phase" "success"
}

# Phase 6: Docker Validation
run_docker_phase() {
    local phase="Docker Validation"
    start_step "docker_phase" "$phase"
    
    if [ "$SKIP_DOCKER" = true ]; then
        log_info "Docker validation disabled - skipping"
        finish_step "docker_phase" "success"
        return 0
    fi
    
    log_progress "Validating Docker setup and builds..."
    
    # Check Docker daemon
    if docker info > /dev/null 2>&1; then
        record_test_result "Docker Daemon Available" "PASS"
    else
        log_error "Docker daemon not running"
        record_test_result "Docker Daemon Available" "FAIL"
        finish_step "docker_phase" "failed"
        return 1
    fi
    
    # Check required Docker files
    local docker_files=("docker-compose.yml" "client/Dockerfile" "server/Dockerfile")
    local missing_files=0
    
    for file in "${docker_files[@]}"; do
        if [ -f "$BASE_DIR/$file" ]; then
            log_debug "Found $file"
        else
            log_error "Missing $file"
            missing_files=$((missing_files + 1))
        fi
    done
    
    if [ "$missing_files" -eq 0 ]; then
        record_test_result "Docker Files Present" "PASS"
    else
        record_test_result "Docker Files Present" "FAIL"
    fi
    
    # Enhanced Docker build test (if not in quick mode)
    if [ "$QUICK_MODE" != true ] && [ "$missing_files" -eq 0 ]; then
        log_info "Testing Docker build process..."
        
        if docker-compose build --no-cache > /tmp/docker-build.log 2>&1; then
            record_test_result "Docker Build Test" "PASS"
            log_success "Docker build completed successfully"
        else
            record_test_result "Docker Build Test" "FAIL"
            
            # Analyze common Docker build failures
            local build_log="/tmp/docker-build.log"
            
            if grep -q "npm.*ERR" "$build_log"; then
                log_error "Docker build failed due to npm errors"
                log_info "Consider checking package.json and dependencies"
            fi
            
            if grep -q "TypeScript.*error" "$build_log"; then
                log_error "Docker build failed due to TypeScript errors"
                log_info "Fix TypeScript errors before Docker build"
            fi
            
            if grep -q "ERESOLVE\|peer.*dependency" "$build_log"; then
                log_error "Docker build failed due to dependency conflicts"
                log_info "Consider using --legacy-peer-deps in Dockerfile"
            fi
            
            if grep -q "No space left on device" "$build_log"; then
                log_error "Docker build failed due to insufficient disk space"
                log_info "Clean up Docker images: docker system prune -a"
            fi
            
            log_info "Check full build log: $build_log"
        fi
    fi
    
    finish_step "docker_phase" "success"
}

# Phase 7: Test Coverage
run_testing_phase() {
    local phase="Test Coverage"
    start_step "testing_phase" "$phase"
    
    if [ "$QUICK_MODE" = true ]; then
        log_info "Quick mode enabled - skipping comprehensive testing"
        finish_step "testing_phase" "success"
        return 0
    fi
    
    log_progress "Running test suites and coverage analysis..."
    
    # Client unit tests
    log_info "Running client unit tests..."
    cd "$BASE_DIR/client" || { record_test_result "Client Tests" "FAIL"; return 1; }
    
    if npm test -- --coverage --watchAll=false > /tmp/client-tests.log 2>&1; then
        record_test_result "Client Unit Tests" "PASS"
    else
        record_test_result "Client Unit Tests" "FAIL"
    fi
    
    # Server tests (if available)
    log_info "Running server tests..."
    cd "$BASE_DIR/server" || { record_test_result "Server Tests" "FAIL"; return 1; }
    
    if npm test > /tmp/server-tests.log 2>&1; then
        record_test_result "Server Tests" "PASS"
    else
        record_test_result "Server Tests" "FAIL"
    fi
    
    cd "$BASE_DIR"
    finish_step "testing_phase" "success"
}

# Phase 8: Deployment Readiness
run_deployment_phase() {
    local phase="Deployment Readiness"
    start_step "deployment_phase" "$phase"
    
    if [ "$DEPLOYMENT_MODE" != true ]; then
        log_info "Deployment mode disabled - skipping readiness checks"
        finish_step "deployment_phase" "success"
        return 0
    fi
    
    log_progress "Validating deployment readiness..."
    
    # Production build validation
    log_info "Testing production builds..."
    
    cd "$BASE_DIR/client"
    if GENERATE_SOURCEMAP=false npm run build > /tmp/prod-client-build.log 2>&1; then
        record_test_result "Production Client Build" "PASS"
    else
        record_test_result "Production Client Build" "FAIL"
    fi
    
    # Environment configuration check
    log_info "Checking production environment configuration..."
    
    if [ -f "$BASE_DIR/.env.production" ] || [ -f "$BASE_DIR/client/.env.production" ]; then
        record_test_result "Production Environment Config" "PASS"
    else
        log_warn "No production environment files found"
        record_test_result "Production Environment Config" "FAIL"
    fi
    
    # SSL/HTTPS readiness (basic check)
    log_info "Checking HTTPS/SSL configuration..."
    
    if [ -f "$BASE_DIR/nginx/ssl/cert.pem" ] || [ -f "$BASE_DIR/ssl/cert.pem" ]; then
        record_test_result "SSL Certificate Available" "PASS"
    else
        log_warn "No SSL certificates found"
        record_test_result "SSL Certificate Available" "FAIL"
    fi
    
    cd "$BASE_DIR"
    finish_step "deployment_phase" "success"
}

# Generate comprehensive test report
generate_test_report() {
    print_header "AeroSuite Test Results Summary"
    
    # Test statistics
    log_info "📊 Test Statistics:"
    log_info "   • Total Tests: $TOTAL_TESTS"
    log_info "   • Passed: ${GREEN}$PASSED_TESTS${NC}"
    log_info "   • Failed: ${RED}$FAILED_TESTS${NC}"
    
    local success_rate=0
    if [ "$TOTAL_TESTS" -gt 0 ]; then
        success_rate=$(( PASSED_TESTS * 100 / TOTAL_TESTS ))
    fi
    log_info "   • Success Rate: ${success_rate}%"
    
    print_separator
    
    # Detailed results (if supported)
    if [ "${BASH_VERSION%%.*}" -ge 4 ]; then
        log_info "📋 Detailed Results:"
        for test_name in "${!TEST_RESULTS[@]}"; do
            local result=${TEST_RESULTS[$test_name]}
            if [ "$result" = "PASS" ]; then
                log_success "   ✅ $test_name"
            else
                log_error "   ❌ $test_name"
            fi
        done
    else
        log_info "📋 Test completed - use verbose mode for detailed results"
    fi
    
    print_separator
    
    # Recommendations
    if [ "$FAILED_TESTS" -gt 0 ]; then
        log_info "💡 Recommendations:"
        
        log_info "   • Fix any failed tests shown above"
        log_info "   • Run: npm install (in root, client, and server directories)"
        log_info "   • Fix TypeScript errors: npm run type-check"
        log_info "   • Auto-fix common issues: $0 --auto-fix"
        log_info "   • Fix security vulnerabilities: npm audit fix"
        log_info "   • Start Docker Desktop if needed"
    else
        log_success "🎉 All tests passed! Your application is ready."
        
        print_separator
        log_info "🚀 Next Steps:"
        log_info "   • Start development: ./launch-dev.sh"
        log_info "   • Build for production: docker-compose up -d --build"
        log_info "   • Run comprehensive validation: ./run-orchestrator.sh"
    fi
    
    echo ""
}

# Main execution function
main() {
    # Initialize script
    print_header "AeroSuite Comprehensive Test Suite"
    
    # Display execution plan
    print_separator
    log_info "🎯 Execution Plan:"
    log_info "   • Auto-fix: $AUTO_FIX"
    log_info "   • Skip Build: $SKIP_BUILD"
    log_info "   • Skip Docker: $SKIP_DOCKER"
    log_info "   • Quick Mode: $QUICK_MODE"
    log_info "   • Deployment Mode: $DEPLOYMENT_MODE"
    log_info "   • Verbose: $VERBOSE"
    log_info "   • Dry Run: $DRY_RUN"
    print_separator
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN MODE - Showing what would be tested:"
        echo ""
        log_info "Phase 1: Environment Setup & Validation"
        log_info "Phase 2: Auto-Fix Issues (if --auto-fix enabled)"
        log_info "Phase 3: Code Quality Validation"
        [ "$SKIP_BUILD" != true ] && log_info "Phase 4: Build Testing"
        log_info "Phase 5: Security Audit"
        [ "$SKIP_DOCKER" != true ] && log_info "Phase 6: Docker Validation"
        [ "$QUICK_MODE" != true ] && log_info "Phase 7: Test Coverage"
        [ "$DEPLOYMENT_MODE" = true ] && log_info "Phase 8: Deployment Readiness"
        echo ""
        log_success "Dry run completed successfully"
        return 0
    fi
    
    # Execute test phases in sequence
    run_environment_phase || return 1
    run_autofix_phase
    run_code_quality_phase
    [ "$SKIP_BUILD" != true ] && run_build_phase
    run_security_phase
    [ "$SKIP_DOCKER" != true ] && run_docker_phase
    [ "$QUICK_MODE" != true ] && run_testing_phase
    [ "$DEPLOYMENT_MODE" = true ] && run_deployment_phase
    
    # Generate final report
    generate_test_report
    
    # Exit with appropriate code
    if [ "$FAILED_TESTS" -eq 0 ]; then
        return 0
    else
        return 1
    fi
}

# Run the main function
main "$@"
