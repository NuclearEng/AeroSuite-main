#!/bin/bash

# Run Pre-Build Check Script
# This script runs comprehensive pre-build validation before Docker build

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

# Parse command line arguments
VERBOSE=false
DRY_RUN=false
QUICK_MODE=false

show_help() {
    print_header "AeroSuite Pre-Build Checker"
    echo -e "${WHITE}Usage:${NC} $0 [options]"
    echo ""
    echo -e "${YELLOW}Options:${NC}"
    echo -e "  ${GREEN}-v, --verbose${NC}         Enable verbose output"
    echo -e "  ${GREEN}-d, --dry-run${NC}         Show what would be checked without running"
    echo -e "  ${GREEN}-q, --quick${NC}           Run only essential checks (faster)"
    echo -e "  ${GREEN}-h, --help${NC}            Display this help message"
    echo ""
    echo -e "${YELLOW}What this script checks:${NC}"
    echo -e "  ${CYAN}• Environment setup${NC}       Node.js, npm, dependencies"
    echo -e "  ${CYAN}• TypeScript compilation${NC}  Type checking and errors"
    echo -e "  ${CYAN}• Code linting${NC}            ESLint validation"
    echo -e "  ${CYAN}• Security vulnerabilities${NC} Dependency audit"
    echo -e "  ${CYAN}• Build prerequisites${NC}     Docker readiness"
    echo ""
}

while [[ $# -gt 0 ]]; do
    case $1 in
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

# Initialize script
print_header "AeroSuite Pre-Build Validation"

# Environment validation
start_step "env_check" "Environment validation"
if ! validate_environment; then
    finish_step "env_check" "failed"
    log_error "Environment validation failed"
    exit 1
fi
finish_step "env_check" "success"

# Node.js environment checks
start_step "node_env" "Node.js environment validation"
log_debug "Checking Node.js version..."
NODE_VERSION=$(node --version 2>/dev/null || echo "not found")
log_info "Node.js version: $NODE_VERSION"

log_debug "Checking npm version..."
NPM_VERSION=$(npm --version 2>/dev/null || echo "not found")
log_info "npm version: $NPM_VERSION"

if ! check_node_modules "$BASE_DIR"; then
    log_warn "Root dependencies not installed"
fi

if ! check_node_modules "$BASE_DIR/client"; then
    log_warn "Client dependencies not installed"
fi

if ! check_node_modules "$BASE_DIR/server"; then
    log_warn "Server dependencies not installed"
fi
finish_step "node_env" "success"

# Quick mode skips detailed checks
if [ "$QUICK_MODE" = true ]; then
    log_info "Quick mode enabled - running essential checks only"
    ORCHESTRATOR_AGENTS="preBuild"
else
    log_info "Full validation mode - running comprehensive checks"
    ORCHESTRATOR_AGENTS="preBuild,lint,security"
fi

# Display execution plan
print_separator
log_info "Pre-build execution plan:"
log_info "  • Mode: $([ "$QUICK_MODE" = true ] && echo "Quick" || echo "Comprehensive")"
log_info "  • Agents: $ORCHESTRATOR_AGENTS"
log_info "  • Verbose: $VERBOSE"
log_info "  • Dry Run: $DRY_RUN"
print_separator

if [ "$DRY_RUN" = true ]; then
    log_info "DRY RUN MODE - No actual validation will occur"
    log_info "Would execute: ./run-orchestrator.sh -a $ORCHESTRATOR_AGENTS"
    log_success "Dry run completed successfully"
    exit 0
fi

# Run the orchestrator with appropriate agents
start_step "orchestrator" "Running pre-build validation agents"
log_progress "Executing pre-build checks via orchestrator..."

ORCHESTRATOR_CMD=("$BASE_DIR/run-orchestrator.sh" "-a" "$ORCHESTRATOR_AGENTS")
if [ "$VERBOSE" = true ]; then
    ORCHESTRATOR_CMD+=("-v")
fi

log_debug "Orchestrator command: ${ORCHESTRATOR_CMD[*]}"

if "${ORCHESTRATOR_CMD[@]}"; then
    finish_step "orchestrator" "success"
else
    EXIT_CODE=$?
    finish_step "orchestrator" "failed"
    
    print_header "Pre-Build Check Results"
    log_error "Pre-build checks failed with exit code: $EXIT_CODE"
    print_separator
    
    log_info "Troubleshooting steps:"
    log_info "  1. Check specific errors with verbose mode:"
    log_info "     ${WHITE}./run-prebuild-check.sh -v${NC}"
    log_info "  2. Run individual checks:"
    log_info "     ${WHITE}./run-orchestrator.sh -a preBuild -v${NC}"
    log_info "     ${WHITE}./run-orchestrator.sh -a lint -v${NC}"
    log_info "     ${WHITE}./run-orchestrator.sh -a security -v${NC}"
    log_info "  3. Install/update dependencies:"
    log_info "     ${WHITE}npm install${NC}"
    log_info "  4. Check TypeScript compilation:"
    log_info "     ${WHITE}npm run typecheck${NC}"
    
    print_separator
    log_error "Cannot proceed with Docker build until these issues are resolved"
    exit $EXIT_CODE
fi

# Success summary
print_header "Pre-Build Validation Results"
log_success "All pre-build checks passed successfully!"
print_separator

log_info "✅ Environment: Ready"
log_info "✅ Dependencies: Installed"
log_info "✅ Code Quality: Validated"
if [ "$QUICK_MODE" != true ]; then
    log_info "✅ Security: Scanned"
    log_info "✅ Linting: Passed"
fi

print_separator
log_success "🚀 Ready to proceed with Docker build!"
echo ""
log_info "Next steps:"
log_info "  • Start development: ${WHITE}./launch-dev.sh${NC}"
log_info "  • Build containers: ${WHITE}docker-compose up -d --build${NC}"
log_info "  • Run tests: ${WHITE}./run-docker-tests.sh${NC}"
echo ""
