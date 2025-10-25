#!/bin/bash

###############################################################################
# SSL Certificate Setup Script for KumoMTA UI
# Automates Let's Encrypt SSL certificate generation and renewal
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CERTS_DIR="$PROJECT_ROOT/certs"
EMAIL="${LETSENCRYPT_EMAIL:-}"
DOMAIN="${DOMAIN:-}"
STAGING="${STAGING:-false}"

# Logging
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Display usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Setup SSL certificates for KumoMTA UI using Let's Encrypt

OPTIONS:
    -d, --domain DOMAIN      Domain name for SSL certificate (required)
    -e, --email EMAIL        Email for Let's Encrypt notifications (required)
    -s, --staging            Use Let's Encrypt staging server for testing
    -r, --renew              Renew existing certificates
    -h, --help               Display this help message

EXAMPLES:
    # Initial setup
    $0 -d kumomta.example.com -e admin@example.com

    # Testing with staging
    $0 -d kumomta.example.com -e admin@example.com --staging

    # Renew certificates
    $0 -d kumomta.example.com -e admin@example.com --renew

ENVIRONMENT VARIABLES:
    DOMAIN               Domain name (alternative to -d flag)
    LETSENCRYPT_EMAIL    Email address (alternative to -e flag)
    STAGING              Use staging server if set to 'true'

EOF
    exit 1
}

# Parse command line arguments
RENEW=false
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--domain)
            DOMAIN="$2"
            shift 2
            ;;
        -e|--email)
            EMAIL="$2"
            shift 2
            ;;
        -s|--staging)
            STAGING=true
            shift
            ;;
        -r|--renew)
            RENEW=true
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

# Validate required parameters
if [[ -z "$DOMAIN" ]]; then
    log_error "Domain name is required"
    usage
fi

if [[ -z "$EMAIL" ]]; then
    log_error "Email address is required"
    usage
fi

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    log_info "Docker is installed"
}

# Check if docker-compose is installed
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    log_info "Docker Compose is installed"
}

# Create certificates directory
setup_directories() {
    log_info "Creating certificates directory..."
    mkdir -p "$CERTS_DIR/live/kumomta"
    mkdir -p "$PROJECT_ROOT/config"
    log_info "Directories created"
}

# Generate self-signed certificate for initial setup
generate_selfsigned() {
    log_info "Generating self-signed certificate for initial setup..."

    if [[ -f "$CERTS_DIR/live/kumomta/fullchain.pem" ]] && [[ -f "$CERTS_DIR/live/kumomta/privkey.pem" ]]; then
        log_warn "Self-signed certificates already exist, skipping generation"
        return
    fi

    docker run --rm \
        -v "$CERTS_DIR:/etc/letsencrypt" \
        alpine/openssl \
        req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/letsencrypt/live/kumomta/privkey.pem \
        -out /etc/letsencrypt/live/kumomta/fullchain.pem \
        -subj "/CN=$DOMAIN" \
        -addext "subjectAltName=DNS:$DOMAIN,DNS:*.$DOMAIN"

    cp "$CERTS_DIR/live/kumomta/fullchain.pem" "$CERTS_DIR/live/kumomta/chain.pem"

    log_info "Self-signed certificate generated"
}

# Obtain Let's Encrypt certificate
obtain_letsencrypt() {
    log_info "Obtaining Let's Encrypt certificate for $DOMAIN..."

    local STAGING_FLAG=""
    if [[ "$STAGING" == "true" ]]; then
        STAGING_FLAG="--staging"
        log_warn "Using Let's Encrypt STAGING server (certificates will not be trusted)"
    fi

    # Start nginx temporarily for webroot validation
    log_info "Starting temporary web server for domain validation..."

    docker run -d \
        --name kumomta-webroot \
        -p 80:80 \
        -v "$PROJECT_ROOT:/usr/share/nginx/html:ro" \
        nginx:alpine

    sleep 2

    # Obtain certificate
    docker run --rm \
        --network host \
        -v "$CERTS_DIR:/etc/letsencrypt" \
        -v "$PROJECT_ROOT:/var/www/certbot" \
        certbot/certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        $STAGING_FLAG \
        -d "$DOMAIN" \
        --non-interactive

    # Stop temporary web server
    docker stop kumomta-webroot || true
    docker rm kumomta-webroot || true

    # Create symlinks
    if [[ -d "$CERTS_DIR/live/$DOMAIN" ]]; then
        ln -sf "$CERTS_DIR/live/$DOMAIN/fullchain.pem" "$CERTS_DIR/live/kumomta/fullchain.pem"
        ln -sf "$CERTS_DIR/live/$DOMAIN/privkey.pem" "$CERTS_DIR/live/kumomta/privkey.pem"
        ln -sf "$CERTS_DIR/live/$DOMAIN/chain.pem" "$CERTS_DIR/live/kumomta/chain.pem"
        log_info "Let's Encrypt certificate obtained successfully"
    else
        log_error "Failed to obtain certificate"
        exit 1
    fi
}

# Renew certificates
renew_certificates() {
    log_info "Renewing certificates..."

    docker run --rm \
        -v "$CERTS_DIR:/etc/letsencrypt" \
        -v "$PROJECT_ROOT:/var/www/certbot" \
        certbot/certbot renew \
        --webroot \
        --webroot-path=/var/www/certbot \
        --quiet

    log_info "Certificate renewal completed"
}

# Setup certificate renewal cron job
setup_renewal_cron() {
    log_info "Setting up automatic certificate renewal..."

    local CRON_JOB="0 0 * * * cd $PROJECT_ROOT && docker-compose -f docker-compose.prod.yml exec -T certbot certbot renew --quiet && docker-compose -f docker-compose.prod.yml exec -T kumomta-ui nginx -s reload"

    # Check if cron job already exists
    if crontab -l 2>/dev/null | grep -q "certbot renew"; then
        log_warn "Renewal cron job already exists"
    else
        (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
        log_info "Automatic renewal cron job added (runs daily at midnight)"
    fi
}

# Verify certificate
verify_certificate() {
    log_info "Verifying certificate..."

    if [[ -f "$CERTS_DIR/live/kumomta/fullchain.pem" ]] && [[ -f "$CERTS_DIR/live/kumomta/privkey.pem" ]]; then
        local EXPIRY=$(docker run --rm \
            -v "$CERTS_DIR:/etc/letsencrypt" \
            alpine/openssl \
            x509 -enddate -noout -in /etc/letsencrypt/live/kumomta/fullchain.pem | cut -d= -f2)

        log_info "Certificate is valid until: $EXPIRY"
        return 0
    else
        log_error "Certificate files not found"
        return 1
    fi
}

# Main execution
main() {
    log_info "Starting SSL setup for KumoMTA UI"
    log_info "Domain: $DOMAIN"
    log_info "Email: $EMAIL"

    check_docker
    check_docker_compose
    setup_directories

    if [[ "$RENEW" == "true" ]]; then
        renew_certificates
    else
        # First, generate self-signed for initial nginx startup
        generate_selfsigned

        # Then obtain real certificate
        obtain_letsencrypt

        # Setup automatic renewal
        setup_renewal_cron
    fi

    verify_certificate

    log_info "SSL setup completed successfully!"
    log_info ""
    log_info "Next steps:"
    log_info "1. Update .env file with DOMAIN=$DOMAIN"
    log_info "2. Run: docker-compose -f docker-compose.prod.yml up -d"
    log_info "3. Access your site at: https://$DOMAIN"
}

main
