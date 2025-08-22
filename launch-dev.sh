#!/bin/bash

# AeroSuite Development Launch Script
# Enhanced with comprehensive logging and monitoring

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

# Global variables for tracking (bash 3.x compatible)
if [ "${BASH_VERSION%%.*}" -ge 4 ]; then
    declare -A SERVICE_PIDS
else
    log_debug "Using bash 3.x compatibility mode for service tracking"
fi
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:5000"
HEALTH_URL="http://localhost:5000/api/health"

# Enhanced cleanup function
enhanced_cleanup() {
    log_warn "Shutting down AeroSuite services..."
    
    # Kill tracked processes (if associative arrays are supported)
    if [ "${BASH_VERSION%%.*}" -ge 4 ]; then
        for service in "${!SERVICE_PIDS[@]}"; do
            local pid=${SERVICE_PIDS[$service]}
            if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
                log_info "Stopping $service (PID: $pid)..."
                kill "$pid" 2>/dev/null || true
            fi
        done
    else
        # Fallback: kill by port
        log_debug "Using port-based cleanup for older bash"
    fi
    
    # Clean up ports
    kill_port 3000 "Frontend service"
    kill_port 5000 "Backend service"
    kill_port 5002 "Additional service"
    
    log_success "All services stopped"
    exit 0
}

# Set up cleanup trap
setup_cleanup enhanced_cleanup

# Parse command line arguments
SKIP_DEPS=false
VERBOSE=false
QUICK_START=false

show_help() {
    print_header "AeroSuite Development Launcher"
    echo -e "${WHITE}Usage:${NC} $0 [options]"
    echo ""
    echo -e "${YELLOW}Options:${NC}"
    echo -e "  ${GREEN}--skip-deps${NC}           Skip dependency checks"
    echo -e "  ${GREEN}-v, --verbose${NC}         Enable verbose output"
    echo -e "  ${GREEN}-q, --quick${NC}           Quick start (minimal checks)"
    echo -e "  ${GREEN}-h, --help${NC}            Display this help message"
    echo ""
    echo -e "${YELLOW}Services launched:${NC}"
    echo -e "  ${CYAN}• Frontend${NC}             React development server (port 3000)"
    echo -e "  ${CYAN}• Backend${NC}              Express API server (port 5000)"
    echo -e "  ${CYAN}• MongoDB${NC}              Database (if available)"
    echo -e "  ${CYAN}• Redis${NC}                Cache (if available)"
    echo ""
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-deps)
            SKIP_DEPS=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            export CURRENT_LOG_LEVEL=$LOG_LEVEL_DEBUG
            shift
            ;;
        -q|--quick)
            QUICK_START=true
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
print_header "AeroSuite Development Environment"

# Clean up any existing processes
start_step "cleanup" "Cleaning up existing processes"
kill_port 3000 "Frontend service"
kill_port 5000 "Backend service"  
kill_port 5002 "Additional service"
finish_step "cleanup" "success"

# Dependency validation (unless skipped)
if [ "$SKIP_DEPS" != true ] && [ "$QUICK_START" != true ]; then
    start_step "deps_check" "Dependency validation"
    
    if ! validate_environment; then
        finish_step "deps_check" "failed"
        log_error "Environment validation failed"
        exit 1
    fi
    
    # Check if workspaces have dependencies
    for workspace in "client" "server"; do
        if ! check_node_modules "$BASE_DIR/$workspace"; then
            log_warn "$workspace dependencies not found"
            log_info "Consider running: cd $workspace && npm install"
        fi
    done
    
    finish_step "deps_check" "success"
fi

# Database services
start_step "database" "Setting up database services"

log_progress "Checking MongoDB..."
if ! pgrep -x "mongod" > /dev/null; then
    log_info "Starting MongoDB..."
    # Create data directory if it doesn't exist
    mkdir -p /tmp/mongodb-data 2>/dev/null || true
    
    if mongod --fork --logpath /tmp/mongodb.log --dbpath /tmp/mongodb-data 2>/dev/null; then
        log_success "MongoDB started successfully"
    else
        log_warn "MongoDB startup failed or already running"
    fi
else
    log_debug "MongoDB already running"
fi

log_progress "Checking Redis..."
if check_command "redis-server" "Redis server"; then
    if ! pgrep -x "redis-server" > /dev/null; then
        log_info "Starting Redis..."
        if redis-server --daemonize yes 2>/dev/null; then
            log_success "Redis started successfully"
        else
            log_warn "Redis startup failed or already running"
        fi
    else
        log_debug "Redis already running"
    fi
else
    log_warn "Redis not installed - caching will be unavailable"
fi

finish_step "database" "success"

# Start the backend server
start_step "backend" "Starting backend server"
cd "$BASE_DIR/server" || {
    log_error "Failed to navigate to server directory"
    finish_step "backend" "failed"
    exit 1
}

log_progress "Launching backend development server..."
if [ "$VERBOSE" = true ]; then
    npm run dev &
else
    npm run dev > /tmp/aerosuite-backend.log 2>&1 &
fi

SERVER_PID=$!
if [ "${BASH_VERSION%%.*}" -ge 4 ]; then
    SERVICE_PIDS["backend"]=$SERVER_PID
fi
log_info "Backend server starting (PID: $SERVER_PID)"

# Wait for backend to be ready
if wait_for_service "$HEALTH_URL" "Backend API" 30 2; then
    finish_step "backend" "success"
else
    finish_step "backend" "failed"
    log_error "Backend server failed to start properly"
    log_info "Check logs: tail -f /tmp/aerosuite-backend.log"
    exit 1
fi

# Start the frontend
start_step "frontend" "Starting frontend development server"
cd "$BASE_DIR/client" || {
    log_error "Failed to navigate to client directory"
    finish_step "frontend" "failed"
    exit 1
}

log_progress "Launching frontend development server..."
if [ "$VERBOSE" = true ]; then
    npm start &
else
    npm start > /tmp/aerosuite-frontend.log 2>&1 &
fi

CLIENT_PID=$!
if [ "${BASH_VERSION%%.*}" -ge 4 ]; then
    SERVICE_PIDS["frontend"]=$CLIENT_PID
fi
log_info "Frontend server starting (PID: $CLIENT_PID)"

# Wait for frontend to be ready
if wait_for_service "$FRONTEND_URL" "Frontend application" 60 3; then
    finish_step "frontend" "success"
else
    finish_step "frontend" "failed"
    log_error "Frontend server failed to start properly"
    log_info "Check logs: tail -f /tmp/aerosuite-frontend.log"
    exit 1
fi

# Success! Display comprehensive summary
print_header "AeroSuite Development Environment Ready"

log_success "🎉 All services started successfully!"
print_separator

log_info "📍 Service Access Points:"
log_info "   • Frontend:    ${WHITE}$FRONTEND_URL${NC}"
log_info "   • Backend API: ${WHITE}$BACKEND_URL${NC}"
log_info "   • Health Check: ${WHITE}$HEALTH_URL${NC}"

print_separator
log_info "📋 Active Processes:"
if [ "${BASH_VERSION%%.*}" -ge 4 ]; then
    for service in "${!SERVICE_PIDS[@]}"; do
        local pid=${SERVICE_PIDS[$service]}
        log_info "   • ${service}: PID $pid"
    done
else
    log_info "   • Backend: PID $SERVER_PID"
    log_info "   • Frontend: PID $CLIENT_PID"
fi

print_separator
log_info "📊 Quick Status Check:"
log_info "   • Frontend: $(curl -s "$FRONTEND_URL" >/dev/null && echo "✅ Running" || echo "❌ Not responding")"
log_info "   • Backend:  $(curl -s "$HEALTH_URL" >/dev/null && echo "✅ Running" || echo "❌ Not responding")"

print_separator
log_info "💡 Development Tips:"
log_info "   • View logs: ${WHITE}tail -f /tmp/aerosuite-*.log${NC}"
log_info "   • Stop services: ${WHITE}Ctrl+C${NC}"
log_info "   • Restart: ${WHITE}./launch-dev.sh${NC}"
log_info "   • Quick restart: ${WHITE}./launch-dev.sh --skip-deps${NC}"

print_separator
log_success "Press Ctrl+C to stop all services"
echo ""

# Enhanced monitoring loop
HEALTH_CHECK_INTERVAL=30
LAST_HEALTH_CHECK=0

while true; do
    sleep 5
    
    # Check if processes are still running
    if [ "${BASH_VERSION%%.*}" -ge 4 ]; then
        for service in "${!SERVICE_PIDS[@]}"; do
            local pid=${SERVICE_PIDS[$service]}
            if ! kill -0 "$pid" 2>/dev/null; then
                log_error "$service process (PID: $pid) has stopped unexpectedly!"
                log_info "Check logs: tail -f /tmp/aerosuite-$service.log"
            fi
        done
    else
        # Fallback monitoring for older bash
        if ! kill -0 "$SERVER_PID" 2>/dev/null; then
            log_error "Backend process (PID: $SERVER_PID) has stopped unexpectedly!"
        fi
        if ! kill -0 "$CLIENT_PID" 2>/dev/null; then
            log_error "Frontend process (PID: $CLIENT_PID) has stopped unexpectedly!"
        fi
    fi
    
    # Periodic health checks
    current_time=$(date +%s)
    if [ $((current_time - LAST_HEALTH_CHECK)) -ge $HEALTH_CHECK_INTERVAL ]; then
        log_debug "Performing health check..."
        
        # Check services
        if ! curl -s "$HEALTH_URL" >/dev/null; then
            log_warn "Backend health check failed"
        fi
        
        if ! curl -s "$FRONTEND_URL" >/dev/null; then
            log_warn "Frontend health check failed"
        fi
        
        LAST_HEALTH_CHECK=$current_time
    fi
done