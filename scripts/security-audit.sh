#!/bin/bash
#
# KumoMTA UI Security Audit Script
# Performs comprehensive security checks
#
# Usage: ./security-audit.sh [--json]
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Scoring
SCORE=0
MAX_SCORE=0
ISSUES_CRITICAL=0
ISSUES_HIGH=0
ISSUES_MEDIUM=0
ISSUES_LOW=0

JSON_OUTPUT=false
if [ "$1" == "--json" ]; then
  JSON_OUTPUT=true
fi

check_pass() {
  ((SCORE++))
  ((MAX_SCORE++))
  if [ "$JSON_OUTPUT" = false ]; then
    echo -e "${GREEN}[✓]${NC} $1"
  fi
}

check_fail() {
  ((MAX_SCORE++))
  local severity="$2"

  case "$severity" in
    critical) ((ISSUES_CRITICAL++)) ;;
    high) ((ISSUES_HIGH++)) ;;
    medium) ((ISSUES_MEDIUM++)) ;;
    low) ((ISSUES_LOW++)) ;;
  esac

  if [ "$JSON_OUTPUT" = false ]; then
    echo -e "${RED}[✗]${NC} $1 (Severity: $severity)"
  fi
}

check_warn() {
  ((MAX_SCORE++))
  if [ "$JSON_OUTPUT" = false ]; then
    echo -e "${YELLOW}[!]${NC} $1"
  fi
}

if [ "$JSON_OUTPUT" = false ]; then
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}KumoMTA UI Security Audit${NC}"
  echo -e "${BLUE}========================================${NC}"
  echo ""
fi

# ============================================
# 1. SSL/TLS CONFIGURATION
# ============================================
if [ "$JSON_OUTPUT" = false ]; then
  echo -e "${BLUE}[1] SSL/TLS Configuration${NC}"
fi

if [ -f "/etc/nginx/sites-enabled/kumomta-ui" ]; then
  if grep -q "ssl_protocols TLSv1.2 TLSv1.3" /etc/nginx/sites-enabled/kumomta-ui; then
    check_pass "Modern TLS protocols configured (1.2, 1.3)"
  else
    check_fail "Outdated TLS protocols in use" "high"
  fi

  if grep -q "ssl_certificate" /etc/nginx/sites-enabled/kumomta-ui; then
    check_pass "SSL certificate configured"
  else
    check_fail "No SSL certificate configured" "critical"
  fi

  if grep -q "ssl_stapling on" /etc/nginx/sites-enabled/kumomta-ui; then
    check_pass "OCSP stapling enabled"
  else
    check_warn "OCSP stapling not enabled"
  fi
else
  check_fail "Nginx configuration not found" "critical"
fi

# ============================================
# 2. SECURITY HEADERS
# ============================================
if [ "$JSON_OUTPUT" = false ]; then
  echo ""
  echo -e "${BLUE}[2] Security Headers${NC}"
fi

if [ -f "/etc/nginx/sites-enabled/kumomta-ui" ]; then
  headers=(
    "Strict-Transport-Security:high"
    "X-Frame-Options:medium"
    "X-Content-Type-Options:medium"
    "X-XSS-Protection:medium"
    "Content-Security-Policy:high"
    "Referrer-Policy:low"
  )

  for header_def in "${headers[@]}"; do
    IFS=':' read -r header severity <<< "$header_def"
    if grep -q "$header" /etc/nginx/sites-enabled/kumomta-ui; then
      check_pass "$header header configured"
    else
      check_fail "$header header missing" "$severity"
    fi
  done

  if grep -q "server_tokens off" /etc/nginx/sites-enabled/kumomta-ui; then
    check_pass "Server version hiding enabled"
  else
    check_fail "Server version exposed" "low"
  fi
fi

# ============================================
# 3. FIREWALL CONFIGURATION
# ============================================
if [ "$JSON_OUTPUT" = false ]; then
  echo ""
  echo -e "${BLUE}[3] Firewall Configuration${NC}"
fi

if command -v ufw &> /dev/null; then
  if ufw status | grep -q "Status: active"; then
    check_pass "UFW firewall is active"

    if ufw status | grep -q "22/tcp"; then
      check_pass "SSH port protected by firewall"
    else
      check_warn "SSH port not in firewall rules"
    fi

    if ufw status | grep -q "443/tcp"; then
      check_pass "HTTPS port configured in firewall"
    else
      check_fail "HTTPS port not in firewall rules" "medium"
    fi
  else
    check_fail "UFW firewall is not active" "high"
  fi
else
  check_fail "UFW firewall not installed" "high"
fi

# ============================================
# 4. FAIL2BAN CONFIGURATION
# ============================================
if [ "$JSON_OUTPUT" = false ]; then
  echo ""
  echo -e "${BLUE}[4] Fail2ban Configuration${NC}"
fi

if command -v fail2ban-client &> /dev/null; then
  if systemctl is-active --quiet fail2ban; then
    check_pass "Fail2ban service is running"

    if [ -f "/etc/fail2ban/jail.d/kumomta-ui.conf" ]; then
      check_pass "KumoMTA UI Fail2ban jail configured"
    else
      check_warn "Custom Fail2ban jail not configured"
    fi
  else
    check_fail "Fail2ban service is not running" "medium"
  fi
else
  check_fail "Fail2ban not installed" "medium"
fi

# ============================================
# 5. FILE PERMISSIONS
# ============================================
if [ "$JSON_OUTPUT" = false ]; then
  echo ""
  echo -e "${BLUE}[5] File Permissions${NC}"
fi

if [ -f "/opt/kumomta-ui/.env" ]; then
  perms=$(stat -c %a /opt/kumomta-ui/.env)
  if [ "$perms" == "600" ] || [ "$perms" == "400" ]; then
    check_pass "Environment file has secure permissions ($perms)"
  else
    check_fail "Environment file has insecure permissions ($perms)" "high"
  fi
else
  check_warn "Environment file not found at /opt/kumomta-ui/.env"
fi

if [ -d "/etc/ssl/private" ]; then
  perms=$(stat -c %a /etc/ssl/private)
  if [ "$perms" == "700" ]; then
    check_pass "SSL private directory has secure permissions"
  else
    check_fail "SSL private directory has insecure permissions" "high"
  fi
fi

# ============================================
# 6. AUTHENTICATION & SESSIONS
# ============================================
if [ "$JSON_OUTPUT" = false ]; then
  echo ""
  echo -e "${BLUE}[6] Authentication & Sessions${NC}"
fi

if [ -f "/opt/kumomta-ui/.env" ]; then
  if grep -q "SESSION_SECRET=" /opt/kumomta-ui/.env; then
    secret=$(grep "SESSION_SECRET=" /opt/kumomta-ui/.env | cut -d'=' -f2)
    if [ ${#secret} -ge 32 ]; then
      check_pass "Session secret is sufficiently long"
    else
      check_fail "Session secret is too short" "critical"
    fi
  else
    check_fail "Session secret not configured" "critical"
  fi

  if grep -q "CSRF_SECRET=" /opt/kumomta-ui/.env; then
    check_pass "CSRF protection configured"
  else
    check_fail "CSRF protection not configured" "high"
  fi
fi

# ============================================
# 7. RATE LIMITING
# ============================================
if [ "$JSON_OUTPUT" = false ]; then
  echo ""
  echo -e "${BLUE}[7] Rate Limiting${NC}"
fi

if [ -f "/etc/nginx/sites-enabled/kumomta-ui" ]; then
  if grep -q "limit_req_zone" /etc/nginx/sites-enabled/kumomta-ui; then
    check_pass "Rate limiting configured in Nginx"
  else
    check_fail "Rate limiting not configured" "medium"
  fi

  if grep -q "limit_conn_zone" /etc/nginx/sites-enabled/kumomta-ui; then
    check_pass "Connection limiting configured"
  else
    check_warn "Connection limiting not configured"
  fi
fi

# ============================================
# 8. SYSTEM UPDATES
# ============================================
if [ "$JSON_OUTPUT" = false ]; then
  echo ""
  echo -e "${BLUE}[8] System Updates${NC}"
fi

if command -v unattended-upgrades &> /dev/null; then
  if systemctl is-active --quiet unattended-upgrades; then
    check_pass "Automatic security updates enabled"
  else
    check_warn "Automatic security updates service not active"
  fi
else
  check_fail "Automatic security updates not configured" "medium"
fi

# Check for pending updates
if command -v apt &> /dev/null; then
  pending=$(apt list --upgradable 2>/dev/null | grep -c "upgradable" || true)
  if [ "$pending" -eq 0 ]; then
    check_pass "System is up to date"
  else
    check_warn "$pending package updates available"
  fi
fi

# ============================================
# 9. LOGGING & MONITORING
# ============================================
if [ "$JSON_OUTPUT" = false ]; then
  echo ""
  echo -e "${BLUE}[9] Logging & Monitoring${NC}"
fi

if [ -d "/var/log/nginx" ]; then
  check_pass "Nginx logging directory exists"

  if [ -f "/var/log/nginx/access.log" ]; then
    log_size=$(du -h /var/log/nginx/access.log | cut -f1)
    check_pass "Access logs enabled (size: $log_size)"
  else
    check_warn "Access logs not found"
  fi
else
  check_fail "Nginx logging directory not found" "medium"
fi

# ============================================
# 10. DATABASE SECURITY (if applicable)
# ============================================
if [ "$JSON_OUTPUT" = false ]; then
  echo ""
  echo -e "${BLUE}[10] Database Security${NC}"
fi

if command -v mysql &> /dev/null; then
  check_pass "MySQL/MariaDB installed"

  # Check for default credentials
  if mysql -u root -e "SELECT 1" 2>/dev/null; then
    check_fail "MySQL root has no password" "critical"
  else
    check_pass "MySQL root password is set"
  fi
fi

# ============================================
# FINAL SCORE & REPORT
# ============================================
if [ "$JSON_OUTPUT" = true ]; then
  cat << EOF
{
  "score": $SCORE,
  "max_score": $MAX_SCORE,
  "percentage": $(( SCORE * 100 / MAX_SCORE )),
  "issues": {
    "critical": $ISSUES_CRITICAL,
    "high": $ISSUES_HIGH,
    "medium": $ISSUES_MEDIUM,
    "low": $ISSUES_LOW
  },
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "$([ $ISSUES_CRITICAL -eq 0 ] && [ $ISSUES_HIGH -eq 0 ] && echo 'PASS' || echo 'FAIL')"
}
EOF
else
  echo ""
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}Security Audit Summary${NC}"
  echo -e "${BLUE}========================================${NC}"
  echo ""

  percentage=$(( SCORE * 100 / MAX_SCORE ))

  echo "Score: $SCORE / $MAX_SCORE ($percentage%)"
  echo ""
  echo "Issues Found:"
  echo "  Critical: $ISSUES_CRITICAL"
  echo "  High:     $ISSUES_HIGH"
  echo "  Medium:   $ISSUES_MEDIUM"
  echo "  Low:      $ISSUES_LOW"
  echo ""

  if [ $ISSUES_CRITICAL -gt 0 ] || [ $ISSUES_HIGH -gt 0 ]; then
    echo -e "${RED}Status: FAIL${NC}"
    echo -e "${RED}Critical or high-severity issues found!${NC}"
    exit 1
  elif [ $percentage -ge 80 ]; then
    echo -e "${GREEN}Status: PASS${NC}"
    echo -e "${GREEN}Security posture is good!${NC}"
  else
    echo -e "${YELLOW}Status: WARNING${NC}"
    echo -e "${YELLOW}Some security improvements recommended${NC}"
  fi

  echo ""
  echo "Next steps:"
  echo "  1. Address all critical and high-severity issues"
  echo "  2. Review medium and low-severity issues"
  echo "  3. Run security hardening script if needed"
  echo "  4. Re-run this audit after making changes"
  echo ""
fi
