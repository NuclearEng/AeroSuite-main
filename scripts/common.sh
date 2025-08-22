#!/bin/bash

# Common utilities for shell scripts
# Source this file in other scripts: source "$(dirname "$0")/scripts/common.sh"

# Colors for output
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export PURPLE='\033[0;35m'
export CYAN='\033[0;36m'
export WHITE='\033[1;37m'
export NC='\033[0m' # No Color

# Icons
export SUCCESS_ICON="✅"
export ERROR_ICON="❌" 
export WARNING_ICON="⚠️"
export INFO_ICON="ℹ️"
export ROCKET_ICON="🚀"
export GEAR_ICON="⚙️"
export MAGNIFYING_GLASS="🔍"
export PROGRESS_ICON="📊"
export TIME_ICON="⏱️"

# Log levels
export LOG_LEVEL_DEBUG=0
export LOG_LEVEL_INFO=1
export LOG_LEVEL_WARN=2
export LOG_LEVEL_ERROR=3

# Default log level
export CURRENT_LOG_LEVEL=${LOG_LEVEL:-$LOG_LEVEL_INFO}

# Timestamp function
timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

# Logging functions
log_debug() {
    if [ ${CURRENT_LOG_LEVEL:-$LOG_LEVEL_INFO} -le $LOG_LEVEL_DEBUG ]; then
        echo -e "${CYAN}[$(timestamp)] DEBUG: $1${NC}"
    fi
}

log_info() {
    if [ ${CURRENT_LOG_LEVEL:-$LOG_LEVEL_INFO} -le $LOG_LEVEL_INFO ]; then
        echo -e "${BLUE}${INFO_ICON} [$(timestamp)] INFO: $1${NC}"
    fi
}

log_success() {
    if [ ${CURRENT_LOG_LEVEL:-$LOG_LEVEL_INFO} -le $LOG_LEVEL_INFO ]; then
        echo -e "${GREEN}${SUCCESS_ICON} [$(timestamp)] SUCCESS: $1${NC}"
    fi
}

log_warn() {
    if [ ${CURRENT_LOG_LEVEL:-$LOG_LEVEL_INFO} -le $LOG_LEVEL_WARN ]; then
        echo -e "${YELLOW}${WARNING_ICON} [$(timestamp)] WARNING: $1${NC}"
    fi
}

log_error() {
    if [ ${CURRENT_LOG_LEVEL:-$LOG_LEVEL_INFO} -le $LOG_LEVEL_ERROR ]; then
        echo -e "${RED}${ERROR_ICON} [$(timestamp)] ERROR: $1${NC}" >&2
    fi
}

log_progress() {
    echo -e "${PURPLE}${PROGRESS_ICON} [$(timestamp)] PROGRESS: $1${NC}"
}

log_step() {
    echo -e "${WHITE}${GEAR_ICON} [$(timestamp)] STEP: $1${NC}"
}

# Enhanced section headers
print_header() {
    local title="$1"
    local width=60
    local padding=$(( (width - ${#title}) / 2 ))
    
    echo ""
    echo -e "${CYAN}$(printf '═%.0s' $(seq 1 $width))${NC}"
    echo -e "${CYAN}$(printf '%*s' $padding)${WHITE}$title${CYAN}$(printf '%*s' $padding)${NC}"
    echo -e "${CYAN}$(printf '═%.0s' $(seq 1 $width))${NC}"
    echo ""
}

print_separator() {
    echo -e "${BLUE}$(printf '─%.0s' $(seq 1 60))${NC}"
}

# Progress tracking (bash 3.x compatible)
if [ "${BASH_VERSION%%.*}" -ge 4 ]; then
    declare -A STEP_TIMERS
    declare -A STEP_STATUS
else
    # Fallback for older bash versions
    log_debug "Using bash 3.x compatibility mode for step tracking"
fi

start_step() {
    local step_name="$1"
    local description="$2"
    
    if [ "${BASH_VERSION%%.*}" -ge 4 ]; then
        STEP_TIMERS["$step_name"]=$(date +%s)
        STEP_STATUS["$step_name"]="running"
    fi
    
    log_step "Starting: $description"
    log_debug "Step '$step_name' started at $(timestamp)"
}

finish_step() {
    local step_name="$1"
    local status="${2:-success}"
    local description="$3"
    
    local duration=""
    if [ "${BASH_VERSION%%.*}" -ge 4 ]; then
        local start_time=${STEP_TIMERS["$step_name"]}
        if [ -n "$start_time" ]; then
            local end_time=$(date +%s)
            duration=" ($(($end_time - $start_time))s)"
        fi
        STEP_STATUS["$step_name"]="$status"
    fi
    
    if [ "$status" = "success" ]; then
        log_success "Completed: $description$duration"
    else
        log_error "Failed: $description$duration"
    fi
}

# Process management
kill_port() {
    local port=$1
    local service_name="${2:-service on port $port}"
    
    log_debug "Checking for processes on port $port"
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$pids" ]; then
        log_warn "Found processes on port $port, terminating..."
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
        
        # Verify termination
        local remaining=$(lsof -ti:$port 2>/dev/null)
        if [ -z "$remaining" ]; then
            log_success "Successfully freed port $port"
        else
            log_error "Failed to free port $port completely"
            return 1
        fi
    else
        log_debug "Port $port is already free"
    fi
}

# Service health checks
wait_for_service() {
    local url="$1"
    local service_name="$2"
    local max_attempts="${3:-30}"
    local delay="${4:-2}"
    
    log_progress "Waiting for $service_name to be ready..."
    log_debug "Health check URL: $url"
    log_debug "Max attempts: $max_attempts, Delay: ${delay}s"
    
    for i in $(seq 1 $max_attempts); do
        if curl -s --connect-timeout 5 --max-time 10 "$url" > /dev/null 2>&1; then
            log_success "$service_name is ready! (attempt $i/$max_attempts)"
            return 0
        fi
        
        if [ $((i % 5)) -eq 0 ]; then
            log_progress "$service_name health check: attempt $i/$max_attempts"
        fi
        
        sleep $delay
    done
    
    log_error "$service_name failed to become ready after $max_attempts attempts"
    return 1
}

# Environment validation
check_command() {
    local cmd="$1"
    local description="${2:-$cmd}"
    
    if command -v "$cmd" &> /dev/null; then
        log_debug "$description is available"
        return 0
    else
        log_error "$description is not installed or not in PATH"
        return 1
    fi
}

check_file() {
    local file="$1"
    local description="${2:-$file}"
    
    if [ -f "$file" ]; then
        log_debug "$description exists"
        return 0
    else
        log_error "$description not found"
        return 1
    fi
}

check_directory() {
    local dir="$1"
    local description="${2:-$dir}"
    
    if [ -d "$dir" ]; then
        log_debug "$description exists"
        return 0
    else
        log_error "$description not found"
        return 1
    fi
}

# Node.js/NPM helpers
check_node_modules() {
    local dir="${1:-.}"
    
    if [ -d "$dir/node_modules" ]; then
        log_debug "node_modules found in $dir"
        return 0
    else
        log_warn "node_modules not found in $dir - dependencies may need to be installed"
        return 1
    fi
}

run_npm_command() {
    local cmd="$1"
    local description="$2"
    local directory="${3:-.}"
    
    log_step "Running: $description"
    log_debug "Command: npm $cmd in $directory"
    
    (
        cd "$directory" || {
            log_error "Failed to change directory to $directory"
            return 1
        }
        
        npm $cmd 2>&1 | while IFS= read -r line; do
            log_debug "npm: $line"
        done
        return ${PIPESTATUS[0]}
    )
    
    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
        log_success "$description completed successfully"
    else
        log_error "$description failed with exit code $exit_code"
    fi
    
    return $exit_code
}

# Error handling
handle_error() {
    local exit_code=$?
    local line_number=$1
    local command="$2"
    
    log_error "Script failed at line $line_number: $command"
    log_error "Exit code: $exit_code"
    
    # Print call stack if available
    if [ ${#BASH_SOURCE[@]} -gt 1 ]; then
        log_error "Call stack:"
        for ((i=1; i<${#BASH_SOURCE[@]}; i++)); do
            log_error "  ${BASH_SOURCE[i]}:${BASH_LINENO[i-1]} in ${FUNCNAME[i]}"
        done
    fi
    
    exit $exit_code
}

# Signal handling
setup_cleanup() {
    local cleanup_function="$1"
    
    log_debug "Setting up cleanup function: $cleanup_function"
    trap "$cleanup_function" INT TERM EXIT
}

# Summary reporting
print_summary() {
    local title="$1"
    shift
    local items=("$@")
    
    print_header "$title"
    
    for item in "${items[@]}"; do
        echo -e "${WHITE}• $item${NC}"
    done
    
    echo ""
}

# Validation helpers
validate_environment() {
    log_step "Validating environment..."
    
    local required_commands=("node" "npm" "curl")
    local missing_commands=()
    
    for cmd in "${required_commands[@]}"; do
        if ! check_command "$cmd"; then
            missing_commands+=("$cmd")
        fi
    done
    
    if [ ${#missing_commands[@]} -eq 0 ]; then
        log_success "All required commands are available"
        return 0
    else
        log_error "Missing required commands: ${missing_commands[*]}"
        return 1
    fi
}

# Export functions for use in other scripts
export -f timestamp log_debug log_info log_success log_warn log_error log_progress log_step
export -f print_header print_separator start_step finish_step
export -f kill_port wait_for_service check_command check_file check_directory
export -f check_node_modules run_npm_command handle_error setup_cleanup
export -f print_summary validate_environment
