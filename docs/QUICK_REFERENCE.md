# Quick Reference Guide - KumoMTA UI Dashboard

Quick access to keyboard shortcuts, API endpoints, configuration variables, and common tasks.

---

## Keyboard Shortcuts

### Global Shortcuts
| Shortcut | Action |
|----------|--------|
| `F1` | Toggle help panel |
| `?` | Show all keyboard shortcuts |
| `ESC` | Close modal/panel/dropdown |
| `/` or `S` | Focus search box |
| `R` | Manual refresh |
| `Ctrl/Cmd + K` | Quick command palette |

### Navigation
| Shortcut | Action |
|----------|--------|
| `G D` | Go to Dashboard |
| `G Q` | Go to Queue Management |
| `G C` | Go to Configuration |
| `G A` | Go to Analytics |
| `G S` | Go to Security |
| `G H` | Go to Health Check |

### Queue Management
| Shortcut | Action |
|----------|--------|
| `F` | Open filters panel |
| `E` | Export to CSV |
| `Ctrl/Cmd + A` | Select all items |
| `Space` | Toggle selected item |
| `N` | Create new item |
| `Delete` | Delete selected items |

### Data Tables
| Shortcut | Action |
|----------|--------|
| `←` `→` | Navigate columns |
| `↑` `↓` | Navigate rows |
| `Home` | First row |
| `End` | Last row |
| `Page Up` | Previous page |
| `Page Down` | Next page |

---

## API Endpoints Reference

### Metrics & Monitoring
```http
GET  /api/admin/metrics/v1              # Server metrics
GET  /api/admin/health                  # Health check
GET  /api/admin/status                  # Server status
```

### Queue Operations
```http
GET  /api/admin/bounce-list/v1          # Get scheduled queues
POST /api/admin/suspend/v1              # Suspend scheduled queue
POST /api/admin/resume/v1               # Resume queue
POST /api/admin/suspend-ready-q/v1      # Suspend ready queue
```

### Message Operations
```http
POST /api/admin/rebind/v1               # Rebind messages
POST /api/admin/bounce/v1               # Bounce messages
GET  /api/admin/trace-smtp-server/v1    # Get trace logs
POST /api/admin/set-diagnostic-log-filter/v1  # Set log filter
```

### Configuration
```http
GET  /api/admin/config/core             # Get core config
PUT  /api/admin/config/core             # Update core config
GET  /api/admin/config/integration      # Get integration config
PUT  /api/admin/config/integration      # Update integration config
GET  /api/admin/config/performance      # Get performance config
PUT  /api/admin/config/performance      # Update performance config
```

### Authentication & Security
```http
POST /api/auth/login                    # User login
POST /api/auth/logout                   # User logout
POST /api/auth/refresh                  # Refresh token
GET  /api/auth/me                       # Current user info
POST /api/auth/verify-mfa               # Verify MFA code
```

### API Request Format
```bash
# With authentication token
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     http://server:8000/api/admin/metrics/v1

# POST request with data
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"domain":"example.com","reason":"Maintenance"}' \
     http://server:8000/api/admin/suspend/v1
```

---

## Environment Variables

### Required Variables
```env
VITE_API_URL=http://your-kumomta-server:8000
```

### Optional Variables
```env
# Environment
VITE_ENV=production                     # development | production

# API Configuration
VITE_API_TIMEOUT=10000                  # Request timeout (ms)
VITE_API_RETRY_ATTEMPTS=3               # Number of retry attempts
VITE_API_RETRY_DELAY=1000               # Initial retry delay (ms)

# Features
VITE_ENABLE_MFA=true                    # Enable MFA features
VITE_ENABLE_LDAP=false                  # Enable LDAP integration
VITE_ENABLE_OAUTH=false                 # Enable OAuth 2.0

# UI Configuration
VITE_DEFAULT_REFRESH_INTERVAL=5000      # Auto-refresh interval (ms)
VITE_DEFAULT_PAGE_SIZE=50               # Default table page size
VITE_MAX_EXPORT_ROWS=10000              # Maximum CSV export rows

# Monitoring
VITE_DEBUG=false                        # Enable debug logging
VITE_SENTRY_DSN=                        # Sentry error tracking DSN
```

---

## Common Tasks Checklist

### Initial Setup
- [ ] Install Node.js 18+ and npm 9+
- [ ] Clone repository
- [ ] Run `npm install`
- [ ] Create `.env` file with `VITE_API_URL`
- [ ] Start development server: `npm run dev`
- [ ] Access dashboard at http://localhost:5173
- [ ] Log in with default credentials
- [ ] Change default password immediately
- [ ] Enable MFA for admin account

### Daily Operations
- [ ] Check dashboard metrics (delivery rate, bounce rate)
- [ ] Review queue depth and status
- [ ] Check for failed login attempts (security)
- [ ] Review any alerts or notifications
- [ ] Check worker status (all active)
- [ ] Monitor throughput trends

### Weekly Maintenance
- [ ] Review queue analytics and performance
- [ ] Check bounce analysis by domain
- [ ] Review audit logs for anomalies
- [ ] Verify backup processes completed
- [ ] Check for software updates
- [ ] Clean up completed queue items (7+ days old)
- [ ] Export weekly performance report

### Monthly Tasks
- [ ] Full security audit (users, roles, permissions)
- [ ] Review and rotate API tokens
- [ ] Export audit logs for compliance
- [ ] Analyze delivery trends and patterns
- [ ] Review sender reputation metrics
- [ ] Update documentation
- [ ] Test disaster recovery procedures

### Troubleshooting Workflow
1. [ ] Run Health Check diagnostics
2. [ ] Check error messages in browser console (F12)
3. [ ] Review application logs
4. [ ] Verify KumoMTA server is running
5. [ ] Test API connectivity with curl
6. [ ] Check CORS configuration
7. [ ] Review recent configuration changes
8. [ ] Check audit logs for related events
9. [ ] Consult FAQ and troubleshooting docs
10. [ ] Contact support if unresolved

---

## Configuration Quick Reference

### Password Policy
```yaml
minimum_length: 12
require_uppercase: true
require_lowercase: true
require_numbers: true
require_special_chars: true
expiration_days: 90
history_count: 10
```

### Account Lockout
```yaml
failed_attempts_threshold: 5
lockout_duration_minutes: 30
require_admin_unlock: false
```

### Session Management
```yaml
session_timeout_minutes: 30
require_reauth_for_sensitive_ops: true
concurrent_sessions_limit: 3
```

### API Token Defaults
```yaml
default_expiration_days: 90
max_expiration_days: 365
require_ip_restriction: false
```

### Queue Processing
```yaml
worker_count: 4
batch_size: 100
retry_attempts: 3
retry_delay_minutes: [1, 5, 15]  # Exponential backoff
```

### Performance Tuning
```yaml
cache_enabled: true
cache_max_size_mb: 512
cache_ttl_seconds: 3600
load_balancing: round-robin
queue_workers: 4
```

---

## Common Error Codes

### HTTP Status Codes
| Code | Meaning | Common Cause |
|------|---------|--------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |
| 503 | Service Unavailable | Server temporarily down |

### SMTP Error Codes
| Code | Category | Meaning | Action |
|------|----------|---------|--------|
| 2xx | Success | Delivered successfully | None needed |
| 450 | Temporary | Greylisting delay | Auto-retry |
| 451 | Temporary | Server error | Auto-retry |
| 452 | Temporary | Insufficient storage | Auto-retry |
| 550 | Permanent | User not found | Remove from list |
| 551 | Permanent | User moved | Update address |
| 552 | Permanent | Mailbox full | Recipient action |
| 553 | Permanent | Invalid address | Fix or remove |
| 554 | Permanent | Transaction failed | Investigate |

---

## Dashboard Metrics Explained

### Key Performance Indicators
| Metric | Description | Healthy Range |
|--------|-------------|---------------|
| Delivery Rate | % of emails successfully delivered | >95% |
| Bounce Rate | % of emails that failed delivery | <5% |
| Average Delivery Time | Time from submit to delivery | <5s (transactional) |
| Throughput | Emails sent per minute | Depends on capacity |
| Queue Depth | Number of queued emails | <1000 (typical) |

### Queue Status Distribution
- **Waiting**: Normal for recently submitted emails
- **In Progress**: Should be <10% of total queue
- **Completed**: Majority of processed emails
- **Failed**: Should be <5% of total
- **Cancelled**: Minimal, only intentional

---

## CLI Commands Reference

### KumoMTA Server
```bash
# Service management
systemctl status kumomta
systemctl start kumomta
systemctl stop kumomta
systemctl restart kumomta

# Check version
kumomta --version

# View logs
journalctl -u kumomta -f
tail -f /var/log/kumomta/smtp.log

# Configuration test
kumomta --config /etc/kumomta/kumomta.toml --validate
```

### Dashboard Management
```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run test             # Run tests
npm run lint             # Lint code
npm run type-check       # TypeScript type checking

# Deployment
npm ci                   # Clean install (CI/CD)
npm run build            # Production build
rsync -av dist/ user@server:/var/www/dashboard/
```

### Troubleshooting Commands
```bash
# Test API connectivity
curl http://localhost:8000/api/admin/metrics/v1

# Test with authentication
curl -H "Authorization: Bearer TOKEN" \
     http://localhost:8000/api/admin/metrics/v1

# Check DNS resolution
dig mail.example.com MX

# Test SMTP connectivity
telnet mail.example.com 25

# Check firewall
sudo ufw status
sudo netstat -tulpn | grep 8000

# View system resources
top
htop
free -h
df -h
```

---

## Default Ports

| Service | Port | Protocol | Purpose |
|---------|------|----------|---------|
| Dashboard (Dev) | 5173 | HTTP | Vite dev server |
| Dashboard (Prod) | 80/443 | HTTP/HTTPS | Web server |
| KumoMTA API | 8000 | HTTP | Admin API |
| KumoMTA SMTP | 25 | SMTP | Email delivery |
| KumoMTA Submission | 587 | SMTP | Email submission |
| KumoMTA Secure | 465 | SMTPS | Secure SMTP |

---

## Browser Console Commands

Access browser console with `F12` (DevTools)

### Check Dashboard Version
```javascript
console.log(import.meta.env);
```

### Clear Local Storage
```javascript
localStorage.clear();
sessionStorage.clear();
```

### Test API Connection
```javascript
fetch('/api/admin/metrics/v1')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### Check Authentication
```javascript
console.log(localStorage.getItem('auth_token'));
```

---

## File Locations

### Configuration Files
```
/home/ruhroh/kumo-mta-ui/
├── .env                          # Environment variables
├── vite.config.ts                # Vite configuration
├── tailwind.config.js            # Tailwind CSS config
├── tsconfig.json                 # TypeScript config
└── package.json                  # Dependencies

/etc/kumomta/
└── kumomta.toml                  # KumoMTA configuration
```

### Log Files
```
/var/log/kumomta-ui/
├── app.log                       # Application logs
├── error.log                     # Error logs
└── access.log                    # Access logs

/var/log/kumomta/
├── smtp.log                      # SMTP transaction logs
├── system.log                    # System logs
└── bounce.log                    # Bounce logs
```

---

## Support Contacts

- **Documentation**: `/docs` folder
- **FAQ**: `/docs/FAQ.md`
- **Troubleshooting**: `/docs/TROUBLESHOOTING.md`
- **GitHub Issues**: https://github.com/thepingdoctor/kumo-mta-dashboard/issues
- **Community Forum**: https://github.com/thepingdoctor/kumo-mta-dashboard/discussions
- **Email Support**: support@example.com

---

## Version Information

**Current Version**: 1.0.0
**Last Updated**: 2025-01-19
**Compatibility**: KumoMTA 1.0+

---

*This quick reference is designed for quick lookups. For detailed information, see the full documentation in `/docs`.*
