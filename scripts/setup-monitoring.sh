#!/bin/bash

###############################################################################
# Monitoring Setup Script for KumoMTA UI
# Configures health checks, log rotation, and alert notifications
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
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.prod.yml"
MONITORING_DIR="$PROJECT_ROOT/monitoring"
LOGS_DIR="$PROJECT_ROOT/logs"

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

Setup monitoring, health checks, and alerting for KumoMTA UI

OPTIONS:
    --email EMAIL           Email address for alerts
    --slack-webhook URL     Slack webhook URL for notifications
    --discord-webhook URL   Discord webhook URL for notifications
    --skip-cron             Skip cron job setup
    --skip-logrotate        Skip log rotation setup
    -h, --help              Display this help message

EXAMPLES:
    # Basic setup
    $0

    # With email alerts
    $0 --email admin@example.com

    # With Slack notifications
    $0 --slack-webhook https://hooks.slack.com/services/YOUR/WEBHOOK/URL

EOF
    exit 1
}

# Parse command line arguments
ALERT_EMAIL=""
SLACK_WEBHOOK=""
DISCORD_WEBHOOK=""
SKIP_CRON=false
SKIP_LOGROTATE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --email)
            ALERT_EMAIL="$2"
            shift 2
            ;;
        --slack-webhook)
            SLACK_WEBHOOK="$2"
            shift 2
            ;;
        --discord-webhook)
            DISCORD_WEBHOOK="$2"
            shift 2
            ;;
        --skip-cron)
            SKIP_CRON=true
            shift
            ;;
        --skip-logrotate)
            SKIP_LOGROTATE=true
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

# Create monitoring directories
setup_directories() {
    log_step "Creating monitoring directories..."
    mkdir -p "$MONITORING_DIR"
    mkdir -p "$LOGS_DIR"
    mkdir -p "$PROJECT_ROOT/config/grafana/dashboards"
    mkdir -p "$PROJECT_ROOT/config/grafana/datasources"
    log_info "Directories created"
}

# Create health check script
create_health_check_script() {
    log_step "Creating health check script..."

    cat > "$MONITORING_DIR/health-check.sh" << 'EOF'
#!/bin/bash

# Health Check Script for KumoMTA UI
# Checks service health and sends alerts if issues detected

set -e

# Configuration
PROJECT_ROOT="$(dirname "$(dirname "$(readlink -f "$0")")")"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.prod.yml"
LOG_FILE="$PROJECT_ROOT/logs/health-check.log"
ALERT_EMAIL="${ALERT_EMAIL:-}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"
DISCORD_WEBHOOK="${DISCORD_WEBHOOK:-}"

# Logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Send alert via email
send_email_alert() {
    local SUBJECT="$1"
    local MESSAGE="$2"

    if [[ -n "$ALERT_EMAIL" ]] && command -v mail &> /dev/null; then
        echo "$MESSAGE" | mail -s "$SUBJECT" "$ALERT_EMAIL"
        log "Email alert sent to $ALERT_EMAIL"
    fi
}

# Send alert via Slack
send_slack_alert() {
    local MESSAGE="$1"

    if [[ -n "$SLACK_WEBHOOK" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$MESSAGE\"}" \
            "$SLACK_WEBHOOK" 2>/dev/null
        log "Slack alert sent"
    fi
}

# Send alert via Discord
send_discord_alert() {
    local MESSAGE="$1"

    if [[ -n "$DISCORD_WEBHOOK" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"content\":\"$MESSAGE\"}" \
            "$DISCORD_WEBHOOK" 2>/dev/null
        log "Discord alert sent"
    fi
}

# Check if containers are running
check_containers() {
    log "Checking container status..."

    local CONTAINERS=$(docker-compose -f "$COMPOSE_FILE" ps --services)
    local ISSUES=()

    for CONTAINER in $CONTAINERS; do
        local STATUS=$(docker-compose -f "$COMPOSE_FILE" ps "$CONTAINER" | grep -E "Up|running" | wc -l)
        if [[ $STATUS -eq 0 ]]; then
            ISSUES+=("Container $CONTAINER is not running")
            log "ERROR: Container $CONTAINER is not running"
        fi
    done

    if [[ ${#ISSUES[@]} -gt 0 ]]; then
        local ALERT_MSG="KumoMTA UI Alert: Containers Down\n\n${ISSUES[*]}"
        send_email_alert "KumoMTA UI: Containers Down" "$ALERT_MSG"
        send_slack_alert ":warning: $ALERT_MSG"
        send_discord_alert "$ALERT_MSG"
        return 1
    fi

    log "All containers are running"
    return 0
}

# Check UI health endpoint
check_ui_health() {
    log "Checking UI health endpoint..."

    if curl -sSf -k --max-time 10 https://localhost/health > /dev/null 2>&1; then
        log "UI health check: PASSED"
        return 0
    else
        local ALERT_MSG="KumoMTA UI Alert: UI health endpoint not responding"
        log "ERROR: $ALERT_MSG"
        send_email_alert "KumoMTA UI: Health Check Failed" "$ALERT_MSG"
        send_slack_alert ":x: $ALERT_MSG"
        send_discord_alert "$ALERT_MSG"
        return 1
    fi
}

# Check backend health
check_backend_health() {
    log "Checking backend health..."

    if docker-compose -f "$COMPOSE_FILE" exec -T kumomta-backend curl -sSf --max-time 10 http://localhost:8000/api/v1/health > /dev/null 2>&1; then
        log "Backend health check: PASSED"
        return 0
    else
        local ALERT_MSG="KumoMTA UI Alert: Backend health endpoint not responding"
        log "ERROR: $ALERT_MSG"
        send_email_alert "KumoMTA UI: Backend Health Check Failed" "$ALERT_MSG"
        send_slack_alert ":x: $ALERT_MSG"
        send_discord_alert "$ALERT_MSG"
        return 1
    fi
}

# Check disk space
check_disk_space() {
    log "Checking disk space..."

    local USAGE=$(df -h "$PROJECT_ROOT" | awk 'NR==2 {print $5}' | sed 's/%//')

    if [[ $USAGE -gt 90 ]]; then
        local ALERT_MSG="KumoMTA UI Alert: Disk space usage is ${USAGE}%"
        log "WARNING: $ALERT_MSG"
        send_email_alert "KumoMTA UI: High Disk Usage" "$ALERT_MSG"
        send_slack_alert ":warning: $ALERT_MSG"
        send_discord_alert "$ALERT_MSG"
        return 1
    fi

    log "Disk space usage: ${USAGE}%"
    return 0
}

# Check memory usage
check_memory() {
    log "Checking memory usage..."

    local TOTAL_MEM=$(free -m | awk 'NR==2 {print $2}')
    local USED_MEM=$(free -m | awk 'NR==2 {print $3}')
    local USAGE=$((USED_MEM * 100 / TOTAL_MEM))

    if [[ $USAGE -gt 90 ]]; then
        local ALERT_MSG="KumoMTA UI Alert: Memory usage is ${USAGE}%"
        log "WARNING: $ALERT_MSG"
        send_email_alert "KumoMTA UI: High Memory Usage" "$ALERT_MSG"
        send_slack_alert ":warning: $ALERT_MSG"
        send_discord_alert "$ALERT_MSG"
        return 1
    fi

    log "Memory usage: ${USAGE}%"
    return 0
}

# Main health check
main() {
    log "Starting health check..."

    local EXIT_CODE=0

    check_containers || EXIT_CODE=1
    check_ui_health || EXIT_CODE=1
    check_backend_health || EXIT_CODE=1
    check_disk_space || EXIT_CODE=1
    check_memory || EXIT_CODE=1

    if [[ $EXIT_CODE -eq 0 ]]; then
        log "All health checks passed"
    else
        log "Some health checks failed"
    fi

    exit $EXIT_CODE
}

main
EOF

    chmod +x "$MONITORING_DIR/health-check.sh"

    # Update with alert settings
    if [[ -n "$ALERT_EMAIL" ]]; then
        sed -i "s|ALERT_EMAIL=\"\${ALERT_EMAIL:-}\"|ALERT_EMAIL=\"$ALERT_EMAIL\"|" "$MONITORING_DIR/health-check.sh"
    fi
    if [[ -n "$SLACK_WEBHOOK" ]]; then
        sed -i "s|SLACK_WEBHOOK=\"\${SLACK_WEBHOOK:-}\"|SLACK_WEBHOOK=\"$SLACK_WEBHOOK\"|" "$MONITORING_DIR/health-check.sh"
    fi
    if [[ -n "$DISCORD_WEBHOOK" ]]; then
        sed -i "s|DISCORD_WEBHOOK=\"\${DISCORD_WEBHOOK:-}\"|DISCORD_WEBHOOK=\"$DISCORD_WEBHOOK\"|" "$MONITORING_DIR/health-check.sh"
    fi

    log_info "Health check script created"
}

# Setup cron jobs
setup_cron_jobs() {
    if [[ "$SKIP_CRON" == "true" ]]; then
        log_warn "Skipping cron job setup"
        return
    fi

    log_step "Setting up health check cron jobs..."

    # Health check every 5 minutes
    local HEALTH_CRON="*/5 * * * * $MONITORING_DIR/health-check.sh"

    # Certificate renewal check daily
    local CERT_CRON="0 2 * * * cd $PROJECT_ROOT && docker-compose -f docker-compose.prod.yml exec -T certbot certbot renew --quiet && docker-compose -f docker-compose.prod.yml exec -T kumomta-ui nginx -s reload"

    # Container restart check (restart unhealthy containers)
    local RESTART_CRON="*/10 * * * * cd $PROJECT_ROOT && docker-compose -f docker-compose.prod.yml up -d --no-recreate"

    # Add cron jobs
    (crontab -l 2>/dev/null | grep -v "health-check.sh"; echo "$HEALTH_CRON") | crontab -
    (crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CERT_CRON") | crontab -

    log_info "Cron jobs configured:"
    log_info "  - Health checks: Every 5 minutes"
    log_info "  - Certificate renewal: Daily at 2 AM"
}

# Setup log rotation
setup_log_rotation() {
    if [[ "$SKIP_LOGROTATE" == "true" ]]; then
        log_warn "Skipping log rotation setup"
        return
    fi

    log_step "Setting up log rotation..."

    # Check if logrotate is installed
    if ! command -v logrotate &> /dev/null; then
        log_warn "logrotate is not installed. Installing..."
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y logrotate
        elif command -v yum &> /dev/null; then
            sudo yum install -y logrotate
        else
            log_error "Cannot install logrotate. Please install it manually."
            return
        fi
    fi

    # Create logrotate configuration
    sudo tee /etc/logrotate.d/kumomta-ui > /dev/null << EOF
$LOGS_DIR/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
    postrotate
        docker-compose -f $COMPOSE_FILE exec -T kumomta-ui nginx -s reopen > /dev/null 2>&1 || true
    endscript
}

/var/lib/docker/containers/*/*.log {
    weekly
    missingok
    rotate 4
    compress
    delaycompress
    notifempty
    copytruncate
    maxsize 100M
}
EOF

    log_info "Log rotation configured"
}

# Create Prometheus configuration
create_prometheus_config() {
    log_step "Creating Prometheus configuration..."

    cat > "$PROJECT_ROOT/config/prometheus.yml" << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'kumomta-production'
    environment: 'production'

scrape_configs:
  # KumoMTA Backend
  - job_name: 'kumomta-backend'
    static_configs:
      - targets: ['kumomta-backend:8000']
    metrics_path: '/metrics'

  # Node Exporter (if installed)
  - job_name: 'node'
    static_configs:
      - targets: ['host.docker.internal:9100']

  # Docker metrics (if enabled)
  - job_name: 'docker'
    static_configs:
      - targets: ['host.docker.internal:9323']

  # Nginx metrics (if nginx-prometheus-exporter is installed)
  - job_name: 'nginx'
    static_configs:
      - targets: ['kumomta-ui:9113']

# Alerting rules
rule_files:
  - 'alerts.yml'

# Alertmanager configuration (optional)
# alerting:
#   alertmanagers:
#     - static_configs:
#         - targets: ['alertmanager:9093']
EOF

    log_info "Prometheus configuration created"
}

# Create Grafana datasource
create_grafana_datasource() {
    log_step "Creating Grafana datasource configuration..."

    cat > "$PROJECT_ROOT/config/grafana/datasources/prometheus.yml" << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
    jsonData:
      timeInterval: 15s
EOF

    log_info "Grafana datasource configuration created"
}

# Create monitoring dashboard
create_monitoring_dashboard() {
    log_step "Creating monitoring dashboard script..."

    cat > "$MONITORING_DIR/dashboard.sh" << 'EOF'
#!/bin/bash

# Simple monitoring dashboard

clear
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║              KumoMTA UI Monitoring Dashboard                  ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

PROJECT_ROOT="$(dirname "$(dirname "$(readlink -f "$0")")")"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.prod.yml"

# Container status
echo "Container Status:"
docker-compose -f "$COMPOSE_FILE" ps
echo ""

# Resource usage
echo "Resource Usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
echo ""

# Disk usage
echo "Disk Usage:"
df -h "$PROJECT_ROOT" | awk 'NR==1 || NR==2'
echo ""

# Recent logs
echo "Recent Errors (last 10):"
docker-compose -f "$COMPOSE_FILE" logs --tail=10 --no-color | grep -i error || echo "No errors found"
echo ""

# Health status
echo "Health Status:"
curl -sSf -k https://localhost/health && echo "UI: ✓ Healthy" || echo "UI: ✗ Unhealthy"
docker-compose -f "$COMPOSE_FILE" exec -T kumomta-backend curl -sSf http://localhost:8000/api/v1/health > /dev/null 2>&1 && echo "Backend: ✓ Healthy" || echo "Backend: ✗ Unhealthy"
EOF

    chmod +x "$MONITORING_DIR/dashboard.sh"
    log_info "Monitoring dashboard created"
}

# Display summary
display_summary() {
    log_step "Monitoring Setup Summary"

    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║          Monitoring Setup Completed Successfully              ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Monitoring Components:"
    echo "  ✓ Health check script: $MONITORING_DIR/health-check.sh"
    echo "  ✓ Monitoring dashboard: $MONITORING_DIR/dashboard.sh"
    echo "  ✓ Prometheus config: $PROJECT_ROOT/config/prometheus.yml"
    echo "  ✓ Grafana datasource: $PROJECT_ROOT/config/grafana/datasources/prometheus.yml"
    if [[ "$SKIP_CRON" == "false" ]]; then
        echo "  ✓ Cron jobs configured"
    fi
    if [[ "$SKIP_LOGROTATE" == "false" ]]; then
        echo "  ✓ Log rotation configured"
    fi
    echo ""
    echo "Alert Notifications:"
    [[ -n "$ALERT_EMAIL" ]] && echo "  ✓ Email: $ALERT_EMAIL" || echo "  - Email: Not configured"
    [[ -n "$SLACK_WEBHOOK" ]] && echo "  ✓ Slack: Configured" || echo "  - Slack: Not configured"
    [[ -n "$DISCORD_WEBHOOK" ]] && echo "  ✓ Discord: Configured" || echo "  - Discord: Not configured"
    echo ""
    echo "Useful Commands:"
    echo "  - Run health check:     $MONITORING_DIR/health-check.sh"
    echo "  - View dashboard:       $MONITORING_DIR/dashboard.sh"
    echo "  - View logs:            tail -f $LOGS_DIR/health-check.log"
    echo "  - Check cron jobs:      crontab -l"
    echo ""
    echo "Access Monitoring Tools:"
    echo "  - Prometheus: http://localhost:9090"
    echo "  - Grafana:    http://localhost:3001"
    echo ""
}

# Main execution
main() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║          KumoMTA UI Monitoring Setup Script                   ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""

    setup_directories
    create_health_check_script
    create_prometheus_config
    create_grafana_datasource
    create_monitoring_dashboard
    setup_log_rotation
    setup_cron_jobs

    display_summary

    log_info "Monitoring setup completed successfully!"
}

main
