#!/bin/bash

# Docker Troubleshooting Script for AeroSuite
# Based on Docker Desktop Best Practices
# https://docs.docker.com/desktop/use-desktop/

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if Docker is running
check_docker_running() {
    log "Checking if Docker is running..."
    if ! docker info >/dev/null 2>&1; then
        error "Docker is not running. Please start Docker Desktop."
        exit 1
    fi
    success "Docker is running"
}

# Check Docker Desktop features
check_docker_desktop() {
    log "Checking Docker Desktop features..."
    
    # Check if Docker Desktop is available
    if docker info | grep -q "Docker Desktop"; then
        success "Docker Desktop detected"
    else
        warning "Docker Desktop not detected - some features may not be available"
    fi
    
    # Check Docker Scout availability
    if command -v docker-scout >/dev/null 2>&1; then
        success "Docker Scout is available"
    else
        warning "Docker Scout not found - security scanning may be limited"
    fi
}

# Check container health
check_container_health() {
    log "Checking container health..."
    
    # Get all containers
    local containers=$(docker ps --format "{{.Names}}")
    
    if [ -z "$containers" ]; then
        warning "No containers are running"
        return
    fi
    
    echo "$containers" | while read -r container; do
        log "Checking container: $container"
        
        # Check container status
        local status=$(docker inspect --format='{{.State.Status}}' "$container")
        if [ "$status" = "running" ]; then
            success "Container $container is running"
        else
            error "Container $container is not running (status: $status)"
        fi
        
        # Check health status
        local health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "no-health-check")
        if [ "$health" = "healthy" ]; then
            success "Container $container is healthy"
        elif [ "$health" = "unhealthy" ]; then
            error "Container $container is unhealthy"
        else
            warning "Container $container has no health check"
        fi
        
        # Check resource usage
        local resources=$(docker stats --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}" "$container" | tail -n 1)
        if [ -n "$resources" ]; then
            log "Container $container resource usage: $resources"
        fi
    done
}

# Check container security
check_container_security() {
    log "Checking container security..."
    
    local containers=$(docker ps --format "{{.Names}}")
    
    echo "$containers" | while read -r container; do
        log "Checking security for container: $container"
        
        # Check if running as root
        local user=$(docker exec "$container" whoami 2>/dev/null || echo "unknown")
        if [ "$user" = "root" ]; then
            warning "Container $container is running as root"
        else
            success "Container $container is running as $user"
        fi
        
        # Check container capabilities
        local capabilities=$(docker inspect --format='{{.HostConfig.CapAdd}}' "$container")
        if [ "$capabilities" = "<no value>" ] || [ -z "$capabilities" ]; then
            success "Container $container has no additional capabilities"
        else
            warning "Container $container has additional capabilities: $capabilities"
        fi
        
        # Check if container is read-only
        local readonly=$(docker inspect --format='{{.HostConfig.ReadonlyRootfs}}' "$container")
        if [ "$readonly" = "true" ]; then
            success "Container $container has read-only filesystem"
        else
            warning "Container $container has writable filesystem"
        fi
    done
}

# Check container networking
check_container_networking() {
    log "Checking container networking..."
    
    # Check if all required ports are accessible
    local expected_ports=(
        "3000:80"    # Client
        "5001:5000"  # Server
        "27017:27017" # MongoDB
        "6379:6379"  # Redis
    )
    
    for port_mapping in "${expected_ports[@]}"; do
        local host_port=$(echo "$port_mapping" | cut -d: -f1)
        if netstat -an 2>/dev/null | grep -q ":$host_port "; then
            success "Port $host_port is listening"
        else
            error "Port $host_port is not listening"
        fi
    done
    
    # Check container network connectivity
    local containers=$(docker ps --format "{{.Names}}")
    echo "$containers" | while read -r container; do
        if docker exec "$container" ping -c 1 google.com >/dev/null 2>&1; then
            success "Container $container has internet connectivity"
        else
            warning "Container $container has no internet connectivity"
        fi
    done
}

# Check container logs for errors
check_container_logs() {
    log "Checking container logs for errors..."
    
    local containers=$(docker ps --format "{{.Names}}")
    
    echo "$containers" | while read -r container; do
        log "Checking logs for container: $container"
        
        # Get recent logs
        local logs=$(docker logs --tail 50 "$container" 2>/dev/null)
        
        # Check for common error patterns
        local error_count=$(echo "$logs" | grep -i "error\|exception\|failed\|fatal" | wc -l)
        if [ "$error_count" -gt 0 ]; then
            warning "Container $container has $error_count potential errors in recent logs"
            echo "$logs" | grep -i "error\|exception\|failed\|fatal" | head -5
        else
            success "Container $container logs look clean"
        fi
    done
}

# Check Docker system resources
check_docker_resources() {
    log "Checking Docker system resources..."
    
    # Check Docker disk usage
    local disk_usage=$(docker system df)
    log "Docker disk usage:"
    echo "$disk_usage"
    
    # Check Docker system info
    local system_info=$(docker system info --format "table {{.OperatingSystem}}\t{{.KernelVersion}}\t{{.DockerRootDir}}")
    log "Docker system info:"
    echo "$system_info"
    
    # Check for dangling resources
    local dangling_images=$(docker images -f "dangling=true" -q | wc -l)
    local dangling_containers=$(docker ps -a -f "status=exited" -q | wc -l)
    local dangling_volumes=$(docker volume ls -f "dangling=true" -q | wc -l)
    
    if [ "$dangling_images" -gt 0 ]; then
        warning "Found $dangling_images dangling images"
    fi
    if [ "$dangling_containers" -gt 0 ]; then
        warning "Found $dangling_containers stopped containers"
    fi
    if [ "$dangling_volumes" -gt 0 ]; then
        warning "Found $dangling_volumes dangling volumes"
    fi
}

# Run Docker Scout security scan
run_security_scan() {
    log "Running Docker Scout security scan..."
    
    if command -v docker-scout >/dev/null 2>&1; then
        local images=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep -v "<none>")
        
        echo "$images" | while read -r image; do
            log "Scanning image: $image"
            docker-scout cves "$image" || warning "Failed to scan $image"
        done
    else
        warning "Docker Scout not available - skipping security scan"
    fi
}

# Generate troubleshooting report
generate_report() {
    log "Generating troubleshooting report..."
    
    local report_file="docker-troubleshooting-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "Docker Troubleshooting Report"
        echo "Generated: $(date)"
        echo "=================================="
        echo ""
        echo "Docker Version:"
        docker --version
        echo ""
        echo "Docker Info:"
        docker info
        echo ""
        echo "Container Status:"
        docker ps -a
        echo ""
        echo "Container Resource Usage:"
        docker stats --no-stream
        echo ""
        echo "Docker System DF:"
        docker system df
        echo ""
        echo "Recent Container Logs:"
        docker ps --format "{{.Names}}" | while read -r container; do
            echo "=== $container ==="
            docker logs --tail 20 "$container" 2>/dev/null || echo "No logs available"
            echo ""
        done
    } > "$report_file"
    
    success "Troubleshooting report saved to: $report_file"
}

# Main troubleshooting function
main() {
    log "Starting Docker troubleshooting for AeroSuite..."
    
    check_docker_running
    check_docker_desktop
    check_container_health
    check_container_security
    check_container_networking
    check_container_logs
    check_docker_resources
    run_security_scan
    generate_report
    
    log "Docker troubleshooting completed"
}

# Handle command line arguments
case "${1:-}" in
    "health")
        check_docker_running
        check_container_health
        ;;
    "security")
        check_docker_running
        check_container_security
        run_security_scan
        ;;
    "networking")
        check_docker_running
        check_container_networking
        ;;
    "logs")
        check_docker_running
        check_container_logs
        ;;
    "resources")
        check_docker_running
        check_docker_resources
        ;;
    "report")
        check_docker_running
        generate_report
        ;;
    "all"|"")
        main
        ;;
    *)
        echo "Usage: $0 [health|security|networking|logs|resources|report|all]"
        echo ""
        echo "Options:"
        echo "  health     - Check container health and status"
        echo "  security   - Check container security settings"
        echo "  networking - Check container networking"
        echo "  logs       - Check container logs for errors"
        echo "  resources  - Check Docker system resources"
        echo "  report     - Generate troubleshooting report"
        echo "  all        - Run all checks (default)"
        exit 1
        ;;
esac 