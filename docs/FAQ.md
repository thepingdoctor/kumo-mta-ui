# Frequently Asked Questions (FAQ)

## Table of Contents
- [General Questions](#general-questions)
- [Installation & Setup](#installation--setup)
- [Authentication & Security](#authentication--security)
- [Queue Management](#queue-management)
- [Performance & Optimization](#performance--optimization)
- [Troubleshooting](#troubleshooting)
- [Integration & API](#integration--api)
- [Best Practices](#best-practices)

---

## General Questions

### What is KumoMTA UI Dashboard?
The KumoMTA UI Dashboard is a modern, responsive web interface for managing KumoMTA email servers. It provides real-time monitoring, queue management, configuration tools, analytics, and security features for email delivery infrastructure.

### What are the system requirements?
- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **KumoMTA Server**: Running instance with admin API enabled
- **Browser**: Modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- **Screen Resolution**: Minimum 1024x768 (responsive design supports mobile)

### Is the dashboard free to use?
Yes, the KumoMTA UI Dashboard is open-source and released under the MIT License. It's free for commercial and personal use.

### How often is the dashboard updated?
We release updates regularly with bug fixes, security patches, and new features. Check the [CHANGELOG](../CHANGELOG.md) for version history.

### Can I run the dashboard without KumoMTA server?
No, the dashboard requires a running KumoMTA server with the admin API enabled. The dashboard is a management interface, not a standalone application.

---

## Installation & Setup

### How do I install the dashboard?
```bash
# Clone repository
git clone https://github.com/thepingdoctor/kumo-mta-dashboard.git
cd kumo-mta-dashboard

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your KumoMTA server URL

# Start development server
npm run dev

# Or build for production
npm run build
```

### What environment variables do I need to set?
```env
# Required
VITE_API_URL=http://your-kumomta-server:8000

# Optional
VITE_ENV=production
VITE_API_TIMEOUT=10000
VITE_DEBUG=false
```

### How do I deploy to production?
See the [Deployment Guide](./DEPLOYMENT_GUIDE.md) for detailed instructions. Quick summary:

1. Build the application: `npm run build`
2. Deploy `dist/` folder to your web server
3. Configure Nginx/Apache for SPA routing
4. Enable HTTPS (required for production)
5. Configure CORS on KumoMTA server

### Can I run the dashboard on a different port?
Yes. For development, use:
```bash
npm run dev -- --port 3000
```

For production, configure your web server (Nginx/Apache) to listen on the desired port.

### How do I enable HTTPS?
For production deployments, configure your web server (Nginx/Apache) with TLS certificates:

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    # ... rest of configuration
}
```

Use Let's Encrypt for free SSL certificates:
```bash
sudo certbot --nginx -d dashboard.example.com
```

---

## Authentication & Security

### What are the default login credentials?
Default credentials are set during KumoMTA installation. Check your KumoMTA configuration or contact your system administrator. **Change default credentials immediately after first login.**

### How do I reset a forgotten password?
1. Click "Forgot Password" on login page
2. Enter your email address
3. Check email for reset link
4. Follow link to set new password

Alternatively, an administrator can reset your password from the User Management page.

### Should I enable Multi-Factor Authentication (MFA)?
**Yes, absolutely!** MFA reduces account compromise risk by 99.9%. Enable MFA for all users, especially administrators. Navigate to Security > Multi-Factor Authentication to configure.

### How do I set up MFA?
1. Navigate to Security > Multi-Factor Authentication
2. Click "Enable MFA"
3. Scan QR code with authenticator app (Google Authenticator, Authy, Microsoft Authenticator)
4. Enter verification code
5. Save backup codes securely
6. MFA is now enabled

### What should I do if I lose my MFA device?
Use your backup codes to log in, then reconfigure MFA with a new device. If you've lost backup codes, contact an administrator to reset MFA for your account.

### How do I create API tokens?
1. Navigate to Security > API Tokens
2. Click "Create New Token"
3. Set name, permissions, and expiration (recommended: 90 days)
4. Click "Generate Token"
5. Copy token immediately (it won't be shown again)
6. Store token securely

### How often should I rotate API tokens?
Rotate API tokens every 90 days. Set expiration dates when creating tokens to enforce automatic rotation.

### Can I integrate with LDAP/Active Directory?
Yes! Navigate to Security > LDAP Integration, configure your LDAP server details, map groups to roles, and test the connection. See the [Security Configuration Tutorial](./tutorials/03-security-configuration.md) for detailed steps.

### How do I configure SSO with OAuth 2.0?
1. Navigate to Security > OAuth 2.0 / SSO
2. Select your OAuth provider (Google Workspace, Azure AD, Okta)
3. Enter Client ID and Client Secret
4. Configure claim mapping
5. Test OAuth flow
6. Enable for users

Supported providers: Google Workspace, Microsoft Azure AD, Okta, custom OAuth 2.0 providers.

### What's the difference between roles?
- **Administrator**: Full system access, manage users and configuration
- **Operator**: Manage queues and view metrics, no configuration changes
- **Analyst**: Read-only access to analytics and reports
- **Viewer**: Read-only dashboard access, no queue management
- **Custom Roles**: Tailored permissions for specific needs

---

## Queue Management

### What do queue statuses mean?
- **Waiting**: Queued for processing (normal for recently submitted emails)
- **In Progress**: Currently being sent
- **Sending**: Message transmission in progress
- **Completed**: Successfully delivered
- **Failed**: Delivery failed, may retry based on configuration
- **Cancelled**: Manually stopped by user/system

### How do I find a specific email in the queue?
Use the search bar to search by:
- Customer name
- Recipient email address
- Sender email address
- Email subject
- Message ID

Combine with filters (status, service type) for precise results.

### Can I export queue data?
Yes! Click "Export to CSV" to download queue data. You can export all items or just filtered results. The CSV includes all queue details for external analysis.

### How do I retry failed emails?
1. Filter by status: "Failed"
2. Select emails to retry (checkbox)
3. Click "Bulk Actions" > "Retry Selected"
4. Confirm action

Failed emails are queued for immediate retry.

### What's the maximum queue size?
Queue size is limited by your server's disk space and memory. Monitor queue depth in Analytics. If sustained growth occurs, increase worker processes or investigate delivery issues.

### How often does the queue table refresh?
The queue table refreshes automatically every 5 seconds. You can pause auto-refresh by clicking the pause button or adjust the interval in settings.

### Can I suspend a queue?
Yes! Navigate to Queue Control, select the domain/queue, enter a reason, optionally set duration, and click "Suspend Queue". Suspended queues don't drop emails - they're held until resume.

### What's the difference between suspending scheduled vs ready queues?
- **Scheduled Queue**: Suspends queue for future sends, with optional duration
- **Ready Queue**: Suspends currently ready-to-send messages, requires explicit reason

Use scheduled suspension for maintenance windows, ready suspension for immediate halts.

---

## Performance & Optimization

### Why is the dashboard slow?
Common causes and solutions:

**Large queue sizes**: Filter queue to reduce visible items. Use pagination.

**Frequent auto-refresh**: Increase refresh interval from 5s to 15s in settings.

**Browser cache**: Clear cache and hard refresh (Ctrl+Shift+R / Cmd+Shift+R).

**Network latency**: Check browser DevTools Network tab for slow API responses.

**Server resources**: Check KumoMTA server CPU/memory usage. Insufficient resources slow API responses.

### How can I improve dashboard performance?
1. Increase auto-refresh interval (15-30 seconds)
2. Reduce items per page (25-50)
3. Use filtering to limit displayed data
4. Clear browser cache regularly
5. Ensure adequate server resources
6. Enable browser caching for static assets
7. Use production build (not development server)

### What's causing high bounce rates?
High bounce rates (>10%) indicate:
- **List quality issues**: Invalid or outdated email addresses
- **Sender reputation problems**: IP/domain blocklisted
- **Content triggers**: Emails flagged as spam
- **DNS configuration**: SPF, DKIM, DMARC issues
- **Recipient server issues**: Greylisting, rate limiting

Check bounce analysis for specific reasons and domains.

### How do I optimize throughput?
1. **Increase worker processes**: More parallel sending
2. **Optimize DNS**: Use fast, reliable DNS servers
3. **Review rate limits**: Adjust per-domain sending rates
4. **Monitor queue depth**: If growing, increase workers
5. **Check network bandwidth**: Ensure adequate connectivity
6. **Review recipient domains**: Slow domains drag down average

### Why are emails delayed?
Common causes:
- **Queue backlog**: High volume exceeds throughput
- **Greylisting**: Recipient servers delay acceptance (normal, will retry)
- **DNS slowness**: DNS lookups taking too long
- **Rate limiting**: Intentional sending rate limits
- **Recipient server slowness**: Remote server responding slowly

Check queue analytics and delivery time metrics to identify bottlenecks.

---

## Troubleshooting

### The dashboard shows "Cannot connect to server"
**Troubleshooting steps:**

1. **Verify KumoMTA is running**:
   ```bash
   systemctl status kumomta
   ```

2. **Check API listener**:
   Verify KumoMTA configuration includes admin API listener on port 8000.

3. **Test API manually**:
   ```bash
   curl http://localhost:8000/api/admin/metrics/v1
   ```

4. **Check VITE_API_URL** in `.env`:
   ```env
   VITE_API_URL=http://your-server:8000
   ```

5. **Verify firewall**:
   ```bash
   sudo ufw status
   sudo ufw allow 8000/tcp
   ```

6. **Check CORS configuration**:
   Browser console (F12) shows CORS errors? Configure KumoMTA to allow dashboard origin.

### Login fails with correct credentials
Possible causes:
1. **Account locked**: Too many failed attempts (default: 5). Wait 30 minutes or ask admin to unlock.
2. **Password expired**: Change password via reset link or contact admin.
3. **LDAP/OAuth misconfiguration**: Check authentication settings if using external auth.
4. **Browser cache**: Clear cookies and cache.
5. **MFA issues**: Verify device time is synchronized (affects TOTP codes).

### Queue items stuck in "Waiting" status
**Diagnosis:**

1. **Check workers**:
   ```bash
   systemctl status kumomta-workers
   ```
   If not running: `systemctl restart kumomta-workers`

2. **Check queue suspension**: Navigate to Queue Control, verify queue not suspended.

3. **Check DNS**: Test DNS resolution:
   ```bash
   dig recipient-domain.com MX
   ```

4. **Check logs**: Review KumoMTA logs for specific errors.

5. **Check network**: Verify outbound SMTP connectivity (port 25).

### Charts not displaying data
1. **Check date range**: Ensure selected time range contains data
2. **Check API response**: Browser DevTools Network tab shows metrics API returning data?
3. **Clear cache**: Hard refresh (Ctrl+Shift+R)
4. **Check KumoMTA metrics**: Verify KumoMTA is recording metrics
5. **Check browser console**: Look for JavaScript errors (F12)

### CSV export fails or incomplete
1. **Large dataset**: Exports limited to 10,000 rows. Use filtering to reduce size.
2. **Browser popup blocker**: Allow popups for dashboard domain.
3. **Network timeout**: Increase timeout for large exports.
4. **Permissions**: Verify you have export permission for your role.

### How do I report a bug?
1. **Check FAQ and documentation** first
2. **Search existing issues**: https://github.com/thepingdoctor/kumo-mta-dashboard/issues
3. **Gather information**:
   - Dashboard version (package.json)
   - KumoMTA version (`kumomta --version`)
   - Browser and version
   - Steps to reproduce
   - Error messages / screenshots
   - Relevant log excerpts
4. **Create issue**: Provide detailed description with gathered information

### Where can I get support?
- **Documentation**: Check `/docs` folder and tutorials
- **FAQ**: This document
- **Community Forum**: GitHub Discussions
- **Bug Reports**: GitHub Issues
- **Email Support**: support@example.com (for commercial support)

---

## Integration & API

### How do I integrate with external tools?
Use the REST API for programmatic access:

```javascript
// Get metrics
GET /api/admin/metrics/v1

// Get queue status
GET /api/admin/bounce-list/v1

// Suspend queue
POST /api/admin/suspend/v1
```

Create an API token (Security > API Tokens) and include in requests:
```bash
curl -H "Authorization: Bearer your-token-here" \
  http://server:8000/api/admin/metrics/v1
```

### Can I integrate with Grafana?
Yes! Use the Grafana JSON API datasource plugin to visualize KumoMTA metrics in Grafana dashboards. Configure datasource with your API URL and token.

### Can I integrate with Slack for alerts?
Yes! Configure webhooks in alert settings:
1. Create Slack incoming webhook
2. Navigate to Analytics > Alerts
3. Create alert rule
4. Add Slack webhook URL to notifications
5. Test alert

### Is there a Python/JavaScript library?
Not officially, but the REST API is straightforward to use with standard HTTP libraries:

**Python**:
```python
import requests

headers = {'Authorization': 'Bearer your-token'}
response = requests.get('http://server:8000/api/admin/metrics/v1', headers=headers)
metrics = response.json()
```

**JavaScript**:
```javascript
const response = await fetch('http://server:8000/api/admin/metrics/v1', {
  headers: { 'Authorization': 'Bearer your-token' }
});
const metrics = await response.json();
```

### What's the API rate limit?
Default: 100 requests per minute per API token. Exceeding the limit returns HTTP 429 (Too Many Requests). For higher limits, contact support or adjust in KumoMTA configuration.

### Can I use webhooks for real-time events?
Yes! Configure webhooks for events like:
- Email sent
- Email delivered
- Bounce received
- Queue suspended
- Alert triggered

Navigate to Configuration > Webhooks to set up.

---

## Best Practices

### What security best practices should I follow?
✓ **Use HTTPS** in production (required)
✓ **Enable MFA** for all users, especially admins
✓ **Strong passwords**: 12+ characters, complexity enabled
✓ **Regular password rotation**: Every 90 days
✓ **Least privilege**: Users have only needed permissions
✓ **API token expiration**: 90 days maximum
✓ **Audit log reviews**: Weekly
✓ **Keep software updated**: Apply security patches promptly
✓ **Network restrictions**: Firewall rules limiting access
✓ **Backup admin account**: Offline credentials for emergencies

### How often should I review queue performance?
- **Real-time**: During campaign launches or incidents
- **Daily**: Quick check of queue depth and bounce rates
- **Weekly**: Review performance trends and analytics
- **Monthly**: Comprehensive analysis with exported data

### What's a healthy bounce rate?
- **Excellent**: <2%
- **Good**: 2-5%
- **Warning**: 5-10% (investigate and improve list quality)
- **Critical**: >10% (immediate action required, damages sender reputation)

Hard bounce rates >5% indicate serious list quality issues. Remove hard bounces immediately.

### Should I use queue suspension?
Use queue suspension for:
- **Planned maintenance**: Suspend before server updates
- **Security incidents**: Immediate halt during investigation
- **Debugging**: Pause to analyze delivery issues
- **Rate limiting**: Temporary slowdown to specific domains

Always document suspension reasons in audit log.

### How do I maintain good sender reputation?
1. **Monitor bounce rates**: Keep <5%, remove hard bounces immediately
2. **Implement SPF, DKIM, DMARC**: Email authentication
3. **Maintain list hygiene**: Regular cleaning, double opt-in
4. **Monitor feedback loops**: Subscribe to ISP feedback loops
5. **Gradual IP warm-up**: Increase volume slowly for new IPs
6. **Consistent sending patterns**: Avoid sudden volume spikes
7. **Quality content**: Avoid spam triggers, relevant emails
8. **Engagement tracking**: Remove unengaged recipients

### What metrics should I monitor daily?
- **Delivery rate**: Should stay >95%
- **Bounce rate**: Should stay <5%
- **Queue depth**: Should remain stable
- **Throughput**: Monitor for unexpected drops
- **Failed login attempts**: Security indicator
- **Worker status**: All workers should be active

Set up alerts for thresholds to enable proactive monitoring.

### How do I plan for growth?
1. **Monitor trends**: Use analytics to forecast growth
2. **Capacity planning**: Add workers before hitting limits
3. **Infrastructure scaling**: Plan server upgrades
4. **List management**: Clean lists as they grow
5. **Performance testing**: Test at 2x expected peak volume
6. **Redundancy**: Consider failover configuration
7. **Documentation**: Keep runbooks updated

### What should I backup?
- **Configuration**: Export settings regularly
- **User data**: User accounts, roles, permissions
- **Audit logs**: Historical compliance data
- **Custom dashboards**: Dashboard configurations
- **API tokens**: Encrypted token inventory (not values!)
- **Database**: Queue metadata and analytics

Backup frequency: Daily (automated), before major changes (manual).

---

## Additional Resources

- **User Guide**: [USER_GUIDE.md](./USER_GUIDE.md)
- **API Documentation**: [API.md](./API.md)
- **Deployment Guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Quick Reference**: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- **Video Tutorials**: [tutorials/](./tutorials/)

---

## Still Have Questions?

If your question isn't answered here:

1. **Search documentation**: Check `/docs` folder
2. **Video tutorials**: Watch relevant tutorials
3. **Community forum**: Ask the community on GitHub Discussions
4. **Bug reports**: Create issue on GitHub for bugs
5. **Email support**: Contact support@example.com

**Last Updated**: 2025-01-19
**Version**: 1.0.0
