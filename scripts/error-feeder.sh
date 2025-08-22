#!/bin/bash

# Compilation Error Feeder Shell Wrapper
# Provides easy access to the compilation error feeder with common options

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT_PATH="$PROJECT_ROOT/scripts/compilation-error-feeder.js"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_help() {
    cat << EOF
Compilation Error Feeder - AeroSuite

USAGE:
    $0 [OPTIONS] [COMMAND]

COMMANDS:
    check           Run a single error check (default)
    watch           Start watch mode for continuous monitoring
    build-check     Include build errors in checks
    help            Show this help message

OPTIONS:
    --typescript    Check TypeScript errors (default: enabled)
    --eslint        Check ESLint errors (default: enabled)
    --build         Include build errors
    --no-typescript Disable TypeScript checking
    --no-eslint     Disable ESLint checking
    --no-cursor     Disable Cursor integration
    --file          Save errors to file
    --output-file   Specify output file path
    --verbose       Verbose output
    --no-colors     Disable colored output

EXAMPLES:
    # Basic error check
    $0

    # Watch mode with all checks
    $0 watch --build

    # TypeScript only check
    $0 --no-eslint

    # Save to file
    $0 --file --output-file ./my-errors.json

    # Build check only
    $0 build-check --no-typescript --no-eslint

EOF
}

# Check dependencies
check_dependencies() {
    if [ ! -f "$SCRIPT_PATH" ]; then
        log_error "Error feeder script not found: $SCRIPT_PATH"
        exit 1
    fi

    if ! command -v node >/dev/null 2>&1; then
        log_error "Node.js not found. Please install Node.js."
        exit 1
    fi

    # Check if chokidar is available for watch mode
    if ! node -e "require('chokidar')" 2>/dev/null; then
        log_warn "chokidar not found. Installing for watch mode..."
        cd "$PROJECT_ROOT"
        if [ -f "package.json" ]; then
            npm install chokidar --save-dev
        else
            npm install chokidar
        fi
    fi
}

# Install missing dependencies
install_deps() {
    log_info "Checking and installing dependencies..."
    
    cd "$PROJECT_ROOT"
    
    # Install chokidar if not present
    if ! node -e "require('chokidar')" 2>/dev/null; then
        log_info "Installing chokidar for file watching..."
        npm install chokidar --save-dev
    fi
    
    log_success "Dependencies ready"
}

# Run the error feeder
run_feeder() {
    local args=("$@")
    
    log_info "Starting compilation error feeder..."
    log_info "Project: $PROJECT_ROOT"
    
    cd "$PROJECT_ROOT"
    node "$SCRIPT_PATH" "${args[@]}"
}

# Quick checks
quick_typescript_check() {
    log_info "Running quick TypeScript check..."
    cd "$PROJECT_ROOT"
    
    if [ -d "client" ]; then
        log_info "Checking client TypeScript..."
        cd client
        if npx tsc --noEmit --skipLibCheck 2>/dev/null; then
            log_success "Client TypeScript: OK"
        else
            log_error "Client TypeScript: ERRORS FOUND"
            return 1
        fi
        cd ..
    fi
    
    if [ -d "server" ] && [ -f "server/tsconfig.json" ]; then
        log_info "Checking server TypeScript..."
        cd server
        if npx tsc --noEmit --skipLibCheck 2>/dev/null; then
            log_success "Server TypeScript: OK"
        else
            log_error "Server TypeScript: ERRORS FOUND"
            return 1
        fi
        cd ..
    fi
    
    return 0
}

quick_eslint_check() {
    log_info "Running quick ESLint check..."
    cd "$PROJECT_ROOT"
    
    if [ -d "client" ]; then
        log_info "Checking client ESLint..."
        cd client
        if npx eslint src --quiet 2>/dev/null; then
            log_success "Client ESLint: OK"
        else
            log_error "Client ESLint: ERRORS FOUND"
            return 1
        fi
        cd ..
    fi
    
    return 0
}

# Parse arguments
COMMAND=""
ARGS=()

while [[ $# -gt 0 ]]; do
    case $1 in
        check|watch|build-check|help)
            COMMAND="$1"
            shift
            ;;
        --install-deps)
            install_deps
            exit 0
            ;;
        --quick-ts)
            quick_typescript_check
            exit $?
            ;;
        --quick-eslint)
            quick_eslint_check
            exit $?
            ;;
        *)
            ARGS+=("$1")
            shift
            ;;
    esac
done

# Default command
if [ -z "$COMMAND" ]; then
    COMMAND="check"
fi

# Handle commands
case $COMMAND in
    help)
        show_help
        exit 0
        ;;
    watch)
        check_dependencies
        run_feeder --watch "${ARGS[@]}"
        ;;
    build-check)
        check_dependencies
        run_feeder --build "${ARGS[@]}"
        ;;
    check)
        check_dependencies
        run_feeder "${ARGS[@]}"
        ;;
    *)
        log_error "Unknown command: $COMMAND"
        echo
        show_help
        exit 1
        ;;
esac
