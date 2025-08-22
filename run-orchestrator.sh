#!/bin/bash

# Run Orchestrator Script
# This script provides a convenient way to run the orchestrator with various options

# Set the base directory to the script location
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUTOMATION_DIR="${BASE_DIR}/automation"

# Source common utilities
source "${BASE_DIR}/scripts/common.sh" || {
    echo "❌ Error: Could not load common utilities from ${BASE_DIR}/scripts/common.sh"
    exit 1
}

# Set up error handling
set -eE
trap 'handle_error $LINENO "$BASH_COMMAND"' ERR

# Default values
MODULE="all"
VERBOSE=false
AGENTS=""
DRY_RUN=false

# Display help message
show_help() {
    print_header "AeroSuite Orchestrator"
    echo -e "${WHITE}Usage:${NC} $0 [options]"
    echo ""
    echo -e "${YELLOW}Options:${NC}"
    echo -e "  ${GREEN}-m, --module MODULE${NC}   Specify module to test (default: all)"
    echo -e "  ${GREEN}-a, --agent AGENT${NC}     Run specific agent only (e.g., preBuild, dockerBuild)"
    echo -e "  ${GREEN}-v, --verbose${NC}         Enable verbose output"
    echo -e "  ${GREEN}-d, --dry-run${NC}         Show what would be executed without running"
    echo -e "  ${GREEN}-h, --help${NC}            Display this help message"
    echo ""
    echo -e "${YELLOW}Available Modules:${NC}"
    echo -e "  ${CYAN}all${NC}                   Run for all modules (default)"
    echo -e "  ${CYAN}Login${NC}                 Authentication module"
    echo -e "  ${CYAN}Reports${NC}               Reporting module"
    echo -e "  ${CYAN}Settings${NC}              Settings module" 
    echo -e "  ${CYAN}Suppliers${NC}             Supplier management module"
    echo ""
    echo -e "${YELLOW}Available Agents:${NC}"
    echo -e "  ${CYAN}preBuild${NC}              Pre-build validation checks"
    echo -e "  ${CYAN}dockerBuild${NC}           Docker build validation"
    echo -e "  ${CYAN}lint${NC}                  Code linting checks"
    echo -e "  ${CYAN}security${NC}              Security vulnerability scans"
    echo -e "  ${CYAN}testCoverage${NC}          Test coverage analysis"
    echo -e "  ${CYAN}performance${NC}           Performance testing"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo -e "  ${WHITE}$0${NC}                           # Run all agents for all modules"
    echo -e "  ${WHITE}$0 -m Suppliers${NC}             # Run all agents for Suppliers module"
    echo -e "  ${WHITE}$0 -a preBuild${NC}              # Run only preBuild agent"
    echo -e "  ${WHITE}$0 -a preBuild -v${NC}           # Run preBuild agent with verbose output"
    echo -e "  ${WHITE}$0 -a lint,security -d${NC}      # Dry run lint and security agents"
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -m|--module)
            MODULE="$2"
            shift 2
            ;;
        -a|--agent)
            AGENTS="$2"
            shift 2
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
print_header "AeroSuite Orchestrator"

# Validate environment
start_step "env_check" "Environment validation"
if ! validate_environment; then
    finish_step "env_check" "failed"
    exit 1
fi

# Check if automation directory exists
if ! check_directory "$AUTOMATION_DIR" "Automation directory"; then
    log_error "Automation directory not found at $AUTOMATION_DIR"
    exit 1
fi
finish_step "env_check" "success"

# Navigate to repo root (script's base dir)
start_step "nav_dir" "Navigating to project root"
if ! cd "$BASE_DIR"; then
    log_error "Failed to navigate to repo base directory: $BASE_DIR"
    finish_step "nav_dir" "failed"
    exit 1
fi
log_debug "Current directory: $(pwd)"
finish_step "nav_dir" "success"

# Check dependencies
start_step "deps_check" "Checking TypeScript dependencies"
if ! check_node_modules; then
    log_warn "Dependencies may not be installed. Consider running 'npm install'"
fi

if ! check_command "npx" "Node Package Execute"; then
    log_error "npx is required but not available"
    finish_step "deps_check" "failed"
    exit 1
fi

if ! check_file "$AUTOMATION_DIR/orchestrator.ts" "Orchestrator TypeScript file"; then
    finish_step "deps_check" "failed"
    exit 1
fi
finish_step "deps_check" "success"

# Build orchestrator flags
ORCH_FLAGS=""
if [ -n "$AGENTS" ]; then
    ORCH_FLAGS="$ORCH_FLAGS --agents=$AGENTS"
fi
if [ "$MODULE" != "all" ]; then
    ORCH_FLAGS="$ORCH_FLAGS --modules=$MODULE"
fi

# Display execution plan
print_separator
log_info "Execution Plan:"
log_info "  • Module(s): ${MODULE}"
log_info "  • Agent(s): ${AGENTS:-all available}"
log_info "  • Verbose: ${VERBOSE}"
log_info "  • Dry Run: ${DRY_RUN}"
log_info "  • Working Directory: $BASE_DIR"
log_info "  • Command: npx ts-node automation/orchestrator.ts $ORCH_FLAGS"
print_separator

if [ "$DRY_RUN" = true ]; then
    log_info "DRY RUN MODE - No actual execution will occur"
    log_success "Dry run completed successfully"
    exit 0
fi

# Execute orchestrator
start_step "orchestrator" "Running orchestrator"
log_progress "Starting orchestrator ${MODULE:+for module: $MODULE} ${AGENTS:+with agents: $AGENTS}"

if [ "$VERBOSE" = true ]; then
    log_debug "Verbose mode enabled - full output will be shown"
    npx ts-node automation/orchestrator.ts $ORCH_FLAGS
else
    log_debug "Standard mode - orchestrator output will be captured"
    npx ts-node automation/orchestrator.ts $ORCH_FLAGS 2>&1 | while IFS= read -r line; do
        # Filter and format orchestrator output
        if [[ "$line" =~ ^(✅|❌|⚠️|🚀|📊) ]]; then
            echo "$line"
        else
            log_debug "orchestrator: $line"
        fi
    done
fi

# Check exit status
EXIT_CODE=${PIPESTATUS[0]}
if [ $EXIT_CODE -eq 0 ]; then
    finish_step "orchestrator" "success"
    log_success "Orchestrator completed successfully"
    
    # Print summary
    print_header "Execution Summary"
    log_success "Module(s): $MODULE"
    log_success "Agent(s): ${AGENTS:-all}"
    log_success "Duration: $(($(date +%s) - ${STEP_TIMERS["orchestrator"]}))s"
else
    finish_step "orchestrator" "failed"
    log_error "Orchestrator failed with exit code: $EXIT_CODE"
    
    # Provide troubleshooting info
    print_separator
    log_info "Troubleshooting tips:"
    log_info "  • Run with -v flag for detailed output"
    log_info "  • Check automation/agent-memory/ for agent logs"
    log_info "  • Verify dependencies: npm install"
    log_info "  • Check TypeScript compilation: npm run typecheck"
fi

exit $EXIT_CODE
