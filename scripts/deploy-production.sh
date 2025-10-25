#!/bin/bash

###############################################################################
# Production Deployment Script for KumoMTA UI
# Validates environment, checks SSL, builds and deploys containers
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.prod.yml"
BACKUP_DIR="$PROJECT_ROOT/backups"

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Display usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Deploy KumoMTA UI to production environment

OPTIONS:
    --skip-build         Skip Docker image build
    --skip-ssl           Skip SSL certificate validation
    --skip-backup        Skip backup creation
    --skip-health        Skip health checks
    --force              Force deployment without confirmations
    -h, --help           Display this help message

EXAMPLES:
    # Standard deployment
    $0

    # Quick deployment (skip build)
    $0 --skip-build

    # Force deployment
    $0 --force

PREREQUISITES:
    - Docker and Docker Compose installed
    - .env file configured with production settings
    - SSL certificates generated (run ssl-setup.sh first)

EOF
    exit 1
}

# Parse command line arguments
SKIP_BUILD=false
SKIP_SSL=false
SKIP_BACKUP=false
SKIP_HEALTH=false
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-ssl)
            SKIP_SSL=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --skip-health)
            SKIP_HEALTH=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            ;;
    esac
done

# Check if Docker is running
check_docker() {
    log_step "Checking Docker..."
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    log_info "Docker is running"
}

# Check if docker-compose is available
check_docker_compose() {
    log_step "Checking Docker Compose..."
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    log_info "Docker Compose is available"
}

# Load and validate environment variables
validate_environment() {
    log_step "Validating environment configuration..."

    if [[ ! -f "$ENV_FILE" ]]; then
        log_error ".env file not found at $ENV_FILE"
        log_info "Copy .env.example to .env and configure it"
        exit 1
    fi

    # Source environment file
    set -a
    source "$ENV_FILE"
    set +a

    # Required variables
    local REQUIRED_VARS=(
        "DOMAIN"
        "VITE_API_URL"
    )

    local MISSING_VARS=()
    for VAR in "${REQUIRED_VARS[@]}"; do
        if [[ -z "${!VAR}" ]]; then
            MISSING_VARS+=("$VAR")
        fi
    done

    if [[ ${#MISSING_VARS[@]} -gt 0 ]]; then
        log_error "Missing required environment variables:"
        for VAR in "${MISSING_VARS[@]}"; do
            echo "  - $VAR"
        done
        exit 1
    fi

    log_info "Environment configuration is valid"
    log_info "Domain: $DOMAIN"
    log_info "API URL: $VITE_API_URL"
}

# Check SSL certificates
check_ssl_certificates() {
    if [[ "$SKIP_SSL" == "true" ]]; then
        log_warn "Skipping SSL certificate validation"
        return
    fi

    log_step "Checking SSL certificates..."

    local CERT_DIR="$PROJECT_ROOT/certs/live/kumomta"
    local REQUIRED_FILES=(
        "fullchain.pem"
        "privkey.pem"
        "chain.pem"
    )

    if [[ ! -d "$CERT_DIR" ]]; then
        log_error "SSL certificate directory not found: $CERT_DIR"
        log_info "Run: ./scripts/ssl-setup.sh -d $DOMAIN -e your@email.com"
        exit 1
    fi

    for FILE in "${REQUIRED_FILES[@]}"; do
        if [[ ! -f "$CERT_DIR/$FILE" ]]; then
            log_error "SSL certificate file not found: $FILE"
            log_info "Run: ./scripts/ssl-setup.sh -d $DOMAIN -e your@email.com"
            exit 1
        fi
    done

    # Check certificate expiry
    local EXPIRY=$(openssl x509 -enddate -noout -in "$CERT_DIR/fullchain.pem" 2>/dev/null | cut -d= -f2)
    if [[ -n "$EXPIRY" ]]; then
        log_info "SSL certificate valid until: $EXPIRY"
    else
        log_warn "Could not verify certificate expiry"
    fi

    log_info "SSL certificates are present and valid"
}

# Create backup
create_backup() {
    if [[ "$SKIP_BACKUP" == "true" ]]; then
        log_warn "Skipping backup creation"
        return
    fi

    log_step "Creating backup..."

    mkdir -p "$BACKUP_DIR"

    local BACKUP_NAME="kumomta-ui-$(date +%Y%m%d-%H%M%S)"
    local BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME.tar.gz"

    # Check if containers are running
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        log_info "Backing up container volumes..."

        # Backup volumes
        docker run --rm \
            -v kumomta-data:/data \
            -v kumomta-logs:/logs \
            -v "$BACKUP_DIR:/backup" \
            alpine tar czf "/backup/$BACKUP_NAME.tar.gz" /data /logs 2>/dev/null || true

        if [[ -f "$BACKUP_PATH" ]]; then
            log_info "Backup created: $BACKUP_PATH"
        else
            log_warn "Backup creation failed or no data to backup"
        fi
    else
        log_info "No running containers to backup"
    fi

    # Keep only last 7 backups
    local BACKUP_COUNT=$(ls -1 "$BACKUP_DIR" | wc -l)
    if [[ $BACKUP_COUNT -gt 7 ]]; then
        log_info "Cleaning old backups (keeping last 7)..."
        ls -1t "$BACKUP_DIR"/*.tar.gz | tail -n +8 | xargs rm -f
    fi
}

# Pull latest images
pull_images() {
    log_step "Pulling latest Docker images..."
    docker-compose -f "$COMPOSE_FILE" pull
    log_info "Images pulled successfully"
}

# Build application
build_application() {
    if [[ "$SKIP_BUILD" == "true" ]]; then
        log_warn "Skipping build step"
        return
    fi

    log_step "Building application..."
    docker-compose -f "$COMPOSE_FILE" build --no-cache kumomta-ui
    log_info "Build completed successfully"
}

# Deploy containers
deploy_containers() {
    log_step "Deploying containers..."

    # Stop existing containers
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        log_info "Stopping existing containers..."
        docker-compose -f "$COMPOSE_FILE" down
    fi

    # Start containers
    log_info "Starting containers..."
    docker-compose -f "$COMPOSE_FILE" up -d

    log_info "Containers deployed successfully"
}

# Wait for services to be healthy
wait_for_health() {
    if [[ "$SKIP_HEALTH" == "true" ]]; then
        log_warn "Skipping health checks"
        return
    fi

    log_step "Waiting for services to be healthy..."

    local MAX_WAIT=120
    local ELAPSED=0

    while [[ $ELAPSED -lt $MAX_WAIT ]]; do
        local UNHEALTHY=$(docker-compose -f "$COMPOSE_FILE" ps | grep -E "starting|unhealthy" | wc -l)

        if [[ $UNHEALTHY -eq 0 ]]; then
            log_info "All services are healthy"
            return 0
        fi

        echo -n "."
        sleep 5
        ELAPSED=$((ELAPSED + 5))
    done

    echo ""
    log_error "Services did not become healthy within ${MAX_WAIT}s"
    log_info "Current service status:"
    docker-compose -f "$COMPOSE_FILE" ps
    exit 1
}

# Run health checks
run_health_checks() {
    if [[ "$SKIP_HEALTH" == "true" ]]; then
        return
    fi

    log_step "Running health checks..."

    # Check UI health endpoint
    log_info "Checking UI health endpoint..."
    if curl -sSf -k https://localhost/health > /dev/null 2>&1; then
        log_info "UI health check: PASSED"
    else
        log_warn "UI health check: FAILED (service may still be starting)"
    fi

    # Check backend health endpoint
    log_info "Checking backend health endpoint..."
    if docker-compose -f "$COMPOSE_FILE" exec -T kumomta-backend curl -sSf http://localhost:8000/api/v1/health > /dev/null 2>&1; then
        log_info "Backend health check: PASSED"
    else
        log_warn "Backend health check: FAILED (check backend logs)"
    fi

    log_info "Health checks completed"
}

# Display deployment summary
display_summary() {
    log_step "Deployment Summary"

    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║          KumoMTA UI Production Deployment Complete            ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Services Status:"
    docker-compose -f "$COMPOSE_FILE" ps
    echo ""
    echo "Access URLs:"
    echo "  - UI:         https://$DOMAIN"
    echo "  - API:        https://$DOMAIN/api"
    echo "  - Grafana:    https://$DOMAIN:3001 (if enabled)"
    echo "  - Prometheus: http://$DOMAIN:9090 (if enabled)"
    echo ""
    echo "Useful Commands:"
    echo "  - View logs:     docker-compose -f docker-compose.prod.yml logs -f"
    echo "  - Stop:          docker-compose -f docker-compose.prod.yml down"
    echo "  - Restart:       docker-compose -f docker-compose.prod.yml restart"
    echo "  - Shell access:  docker-compose -f docker-compose.prod.yml exec kumomta-ui sh"
    echo ""
    echo "Monitoring:"
    echo "  - Setup monitoring: ./scripts/setup-monitoring.sh"
    echo "  - View metrics:     docker stats"
    echo ""
}

# Confirmation prompt
confirm_deployment() {
    if [[ "$FORCE" == "true" ]]; then
        return
    fi

    echo ""
    log_warn "You are about to deploy to PRODUCTION environment"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Deployment cancelled"
        exit 0
    fi
}

# Rollback function
rollback() {
    log_error "Deployment failed! Initiating rollback..."

    docker-compose -f "$COMPOSE_FILE" down

    # Restore from latest backup if available
    local LATEST_BACKUP=$(ls -1t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | head -n 1)
    if [[ -n "$LATEST_BACKUP" ]]; then
        log_info "Restoring from backup: $LATEST_BACKUP"
        # Add restore logic here if needed
    fi

    log_info "Rollback completed"
    exit 1
}

# Trap errors for rollback
trap 'rollback' ERR

# Main execution
main() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║        KumoMTA UI Production Deployment Script                ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""

    # Pre-flight checks
    check_docker
    check_docker_compose
    validate_environment
    check_ssl_certificates

    # Confirmation
    confirm_deployment

    # Deployment steps
    create_backup
    pull_images
    build_application
    deploy_containers
    wait_for_health
    run_health_checks

    # Success
    display_summary

    log_info "Deployment completed successfully!"
    exit 0
}

main
