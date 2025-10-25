#!/bin/bash
#
# KumoMTA UI - IP Whitelist Management Tool
# Manages IP whitelisting for enhanced security
#
# Usage:
#   ./manage-ip-whitelist.sh add <IP> <description>
#   ./manage-ip-whitelist.sh remove <IP>
#   ./manage-ip-whitelist.sh list
#   ./manage-ip-whitelist.sh apply
#

set -e

WHITELIST_FILE="/etc/kumomta-ui/ip-whitelist.conf"
NGINX_CONF="/etc/nginx/sites-available/kumomta-ui"
UFW_COMMENT="KumoMTA-UI"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Error: This script must be run as root${NC}"
  exit 1
fi

# Create whitelist file if not exists
mkdir -p "$(dirname "$WHITELIST_FILE")"
touch "$WHITELIST_FILE"

show_help() {
  echo "KumoMTA UI - IP Whitelist Management"
  echo ""
  echo "Usage:"
  echo "  $0 add <IP/CIDR> <description>     Add IP to whitelist"
  echo "  $0 remove <IP/CIDR>                Remove IP from whitelist"
  echo "  $0 list                            List all whitelisted IPs"
  echo "  $0 apply                           Apply whitelist to firewall and Nginx"
  echo "  $0 clear                           Remove all whitelist rules"
  echo ""
  echo "Examples:"
  echo "  $0 add 192.168.1.100 \"Office IP\""
  echo "  $0 add 10.0.0.0/24 \"Internal network\""
  echo "  $0 remove 192.168.1.100"
  echo "  $0 list"
  echo "  $0 apply"
}

validate_ip() {
  local ip="$1"

  # Check for CIDR notation
  if [[ $ip =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$ ]]; then
    return 0
  fi

  # Check for regular IP
  if [[ $ip =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
    return 0
  fi

  return 1
}

add_ip() {
  local ip="$1"
  local description="$2"

  if [ -z "$ip" ]; then
    echo -e "${RED}Error: IP address is required${NC}"
    show_help
    exit 1
  fi

  if ! validate_ip "$ip"; then
    echo -e "${RED}Error: Invalid IP address format${NC}"
    exit 1
  fi

  if grep -q "^$ip" "$WHITELIST_FILE"; then
    echo -e "${YELLOW}Warning: IP $ip already exists in whitelist${NC}"
    exit 0
  fi

  echo "$ip|$description|$(date +%Y-%m-%d)" >> "$WHITELIST_FILE"
  echo -e "${GREEN}[✓]${NC} Added $ip to whitelist"
  echo -e "${YELLOW}Run '$0 apply' to activate changes${NC}"
}

remove_ip() {
  local ip="$1"

  if [ -z "$ip" ]; then
    echo -e "${RED}Error: IP address is required${NC}"
    show_help
    exit 1
  fi

  if ! grep -q "^$ip" "$WHITELIST_FILE"; then
    echo -e "${RED}Error: IP $ip not found in whitelist${NC}"
    exit 1
  fi

  sed -i "/^$ip/d" "$WHITELIST_FILE"
  echo -e "${GREEN}[✓]${NC} Removed $ip from whitelist"
  echo -e "${YELLOW}Run '$0 apply' to activate changes${NC}"
}

list_ips() {
  if [ ! -s "$WHITELIST_FILE" ]; then
    echo "No IPs in whitelist"
    return
  fi

  echo "Current IP Whitelist:"
  echo "----------------------------------------"
  printf "%-20s %-30s %-12s\n" "IP Address" "Description" "Added Date"
  echo "----------------------------------------"

  while IFS='|' read -r ip desc date; do
    printf "%-20s %-30s %-12s\n" "$ip" "$desc" "$date"
  done < "$WHITELIST_FILE"
}

apply_whitelist() {
  if [ ! -s "$WHITELIST_FILE" ]; then
    echo -e "${YELLOW}Whitelist is empty - no changes to apply${NC}"
    return
  fi

  echo "Applying IP whitelist..."

  # Generate Nginx geo block configuration
  local geo_conf="/etc/nginx/conf.d/kumomta-whitelist.conf"

  cat > "$geo_conf" << 'EOF'
# KumoMTA UI IP Whitelist
# Auto-generated - DO NOT EDIT MANUALLY

geo $ip_whitelist {
    default 0;
EOF

  while IFS='|' read -r ip desc date; do
    echo "    $ip 1; # $desc (added $date)" >> "$geo_conf"
  done < "$WHITELIST_FILE"

  cat >> "$geo_conf" << 'EOF'
}

# Use in server block with:
# if ($ip_whitelist = 0) {
#     return 403;
# }
EOF

  echo -e "${GREEN}[✓]${NC} Updated Nginx whitelist configuration"

  # Apply UFW rules
  echo "Applying UFW rules..."

  # First, remove old KumoMTA whitelist rules
  ufw status numbered | grep "$UFW_COMMENT" | awk '{print $1}' | sed 's/\[//' | sed 's/\]//' | tac | while read -r rule_num; do
    echo "y" | ufw delete "$rule_num" 2>/dev/null || true
  done

  # Add new whitelist rules
  while IFS='|' read -r ip desc date; do
    ufw allow from "$ip" to any port 443 proto tcp comment "$UFW_COMMENT: $desc" 2>/dev/null || true
    ufw allow from "$ip" to any port 80 proto tcp comment "$UFW_COMMENT: $desc" 2>/dev/null || true
  done < "$WHITELIST_FILE"

  echo -e "${GREEN}[✓]${NC} Applied UFW whitelist rules"

  # Test and reload Nginx
  nginx -t
  if [ $? -eq 0 ]; then
    systemctl reload nginx
    echo -e "${GREEN}[✓]${NC} Reloaded Nginx configuration"
  else
    echo -e "${RED}[✗]${NC} Nginx configuration test failed"
    exit 1
  fi

  echo ""
  echo -e "${GREEN}Whitelist applied successfully!${NC}"
  echo ""
  echo "To enable whitelist enforcement in Nginx, add this to your server block:"
  echo ""
  echo "  if (\$ip_whitelist = 0) {"
  echo "      return 403 'Access denied: IP not whitelisted';"
  echo "  }"
  echo ""
}

clear_whitelist() {
  read -p "Are you sure you want to clear all whitelist entries? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    > "$WHITELIST_FILE"
    echo -e "${GREEN}[✓]${NC} Cleared all whitelist entries"
    echo -e "${YELLOW}Run '$0 apply' to remove firewall rules${NC}"
  else
    echo "Cancelled"
  fi
}

# Main command dispatcher
case "${1:-}" in
  add)
    add_ip "$2" "$3"
    ;;
  remove)
    remove_ip "$2"
    ;;
  list)
    list_ips
    ;;
  apply)
    apply_whitelist
    ;;
  clear)
    clear_whitelist
    ;;
  help|--help|-h)
    show_help
    ;;
  *)
    echo -e "${RED}Error: Invalid command${NC}"
    echo ""
    show_help
    exit 1
    ;;
esac
