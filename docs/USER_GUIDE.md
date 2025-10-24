# KumoMTA UI Dashboard - User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Dashboard Overview](#dashboard-overview)
4. [Queue Management](#queue-management)
5. [Configuration](#configuration)
6. [Security Settings](#security-settings)
7. [Analytics](#analytics)
8. [Health Monitoring](#health-monitoring)
9. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the Dashboard

1. Open your web browser and navigate to: `http://your-server:3000`
2. You will be redirected to the login page
3. Enter your credentials (default: admin@example.com / password123)
4. Click "Sign In"

### First Time Setup

After logging in for the first time:

1. Navigate to **Configuration** → Update server settings
2. Go to **Security** → Configure TLS/SSL certificates
3. Set up **DKIM** signing for your domain
4. Configure **IP whitelist/blacklist** rules

---

## Authentication

### Login

- **Email**: Your administrator email address
- **Password**: Your secure password (minimum 6 characters)
- **Remember Me**: Check this to stay logged in across sessions

### Security

- Uses HTTP Basic Authentication compatible with KumoMTA
- Credentials are encoded in base64
- Session persists in browser storage
- Logout clears all session data

### Password Requirements

- Minimum 6 characters
- Email must be valid format
- Use strong passwords in production

---

## Dashboard Overview

The main dashboard provides real-time metrics:

### Key Metrics Cards

1. **Emails Sent**
   - Total messages delivered
   - Updates every 15 seconds
   - Formatted with thousands separator

2. **Bounces**
   - Failed delivery count
   - Categorized as hard/soft bounces
   - Click to view details in Analytics

3. **Delayed Messages**
   - Messages in retry queue
   - Indicates temporary failures
   - Monitor for delivery issues

4. **Throughput**
   - Messages per minute
   - Real-time sending rate
   - Peak performance indicator

5. **Active Connections**
   - Current SMTP connections
   - Indicates server load
   - Max: configurable in settings

### Charts

**Hourly Email Throughput**
- Line chart showing send rate over time
- Last 24 hours of data
- Helps identify peak usage times

---

## Queue Management

### Viewing Queue Items

Navigate to **Queue Manager** to see all queued messages:

- **Search**: Filter by customer name, email, or recipient
- **Status Filter**: waiting | in-progress | completed | failed
- **Service Type**: transactional | marketing | notification

### Queue Item Details

Each item displays:
- Customer information (name, email, phone)
- Recipient and sender addresses
- Service type and priority
- Current status
- Created/updated timestamps

### Managing Queue Items

**Change Status**:
1. Locate the message in the queue
2. Use the dropdown in the Actions column
3. Select new status (waiting/in-progress/completed/failed/cancelled)
4. Status updates immediately

**Export to CSV**:
1. Click "Export CSV" button
2. Downloads all visible items
3. CSV is sanitized against injection attacks
4. Use for reporting and analysis

### Virtual Scrolling

- Handles large queues (10,000+ items) efficiently
- Only renders visible items
- Smooth scrolling performance
- 600px viewport height

---

## Configuration

### Core Settings

**Max Concurrent Deliveries**
- Maximum parallel SMTP connections
- Default: 1000
- Adjust based on server capacity

**Message Retention**
- Days to keep message logs
- Default: 7 days
- Affects storage requirements

**Default Domain**
- Fallback domain for sending
- Used when sender domain unspecified

### Integration Settings

**Webhook URL**
- POST endpoint for events
- Receives delivery notifications
- JSON format payload

**API Key**
- Authentication for webhooks
- Rotate regularly for security

### Performance Settings

**Connection Pool Size**
- SMTP connection pool size
- Default: 100
- Higher = more concurrent sends

**Max Retries**
- Retry attempts for failed sends
- Default: 3
- Exponential backoff between retries

### Saving Changes

1. Modify desired settings
2. Click "Save Changes" button
3. Configuration applies immediately
4. No server restart required

---

## Security Settings

### TLS/SSL Configuration

**Enable TLS Encryption**:
1. Toggle "Enabled" switch
2. Specify certificate path: `/etc/kumomta/certs/server.crt`
3. Specify private key path: `/etc/kumomta/certs/server.key`
4. Configure cipher suites (optional)
5. Click "Save TLS Configuration"

**Recommended Cipher Suites**:
```
TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256
```

### DKIM/SPF Setup

**Configure DKIM Signing**:
1. Enable DKIM toggle
2. Enter your domain: `example.com`
3. Enter selector: `default` (or custom)
4. Specify private key path: `/etc/kumomta/dkim/private.key`
5. Click "Save DKIM Configuration"

**DNS Configuration**:
Add TXT record to your domain:
```
default._domainkey.example.com TXT "v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY"
```

### IP Access Control

**Add Whitelist Rule**:
1. Click "Add Rule"
2. Enter IP address or CIDR: `192.168.1.100` or `10.0.0.0/8`
3. Select "Whitelist"
4. Add description: "Office IP"
5. Click "Save IP Rules"

**Add Blacklist Rule**:
- Same process, select "Blacklist" instead
- Useful for blocking spam sources

### Rate Limiting

Configure sending limits:

- **Max Messages Per Hour**: Prevent sending spikes (default: 1000)
- **Max Recipients Per Message**: Limit bulk sends (default: 100)
- **Max Concurrent Connections**: Control server load (default: 50)
- **Throttle Delay**: Milliseconds between sends (default: 100ms)

---

## Analytics

### Advanced Metrics

Navigate to **Analytics** for detailed insights:

**Success Rate**
- Percentage of successfully delivered messages
- Target: >95%
- Green if meeting target, yellow if below

**Total Bounces**
- Hard bounces: permanent failures
- Soft bounces: temporary failures
- Drill down by classification code

**Queue Efficiency**
- % of messages completed vs waiting
- Higher is better
- Monitor for bottlenecks

**Throughput**
- Current sending rate (messages/min)
- Real-time performance metric

### Charts

**Bounce Distribution** (Pie Chart)
- Visual breakdown of hard vs soft bounces
- Helps identify delivery issues

**Queue Status** (Doughnut Chart)
- Shows waiting/processing/completed messages
- Monitor queue health

**Top Bounce Classifications** (Bar Chart)
- Most common bounce reasons
- Codes like 5.1.1 (bad mailbox), 5.7.1 (unauthorized)

### Bounce Classifications Table

Detailed table showing:
- SMTP error code
- Description of error
- Count of occurrences
- Percentage of total bounces

**Common Codes**:
- `5.1.1`: Bad destination mailbox address
- `5.7.1`: Delivery not authorized
- `4.2.2`: Mailbox full (soft bounce)
- `4.4.1`: Connection timeout (soft bounce)

---

## Health Monitoring

### System Health Overview

**Overall Status**:
- **Healthy**: All systems operational (green)
- **Degraded**: Some issues detected (yellow)
- **Down**: Critical failure (red)

### Service Status Cards

Monitor individual components:

1. **API**: REST API health
2. **Database**: Data persistence layer
3. **Queue**: Message queue service
4. **WebSocket**: Real-time connection

Each shows:
- Current status
- Last check timestamp
- Auto-refreshes every 30 seconds

### Performance Metrics

**Average Response Time**
- API endpoint latency
- Measured in milliseconds
- Target: <100ms

**Error Rate**
- Percentage of failed requests
- Critical and high severity errors
- Target: <1%

**Uptime**
- Minutes since last restart
- Dashboard session uptime
- Not server uptime

---

## Troubleshooting

### Common Issues

**Cannot Login**
- Verify credentials are correct
- Check browser console for errors
- Ensure backend server is running
- Try different browser

**Metrics Not Loading**
- Check `/metrics.json` endpoint accessibility
- Verify KumoMTA server is running
- Check network connectivity
- Review browser console errors

**Queue Not Updating**
- Refresh the page
- Check WebSocket connection
- Verify backend API is accessible
- Clear browser cache

**Configuration Not Saving**
- Check form validation errors
- Verify API endpoint is responding
- Check browser network tab
- Ensure proper permissions

### Performance Issues

**Slow Loading**
- Enable browser caching
- Check network bandwidth
- Reduce polling frequency
- Optimize virtual scrolling viewport

**High Memory Usage**
- Clear browser cache
- Reduce queue item count
- Check for memory leaks
- Restart browser

### Error Messages

**"Failed to load metrics"**
- Backend server unreachable
- Check server logs
- Verify API endpoint configuration
- Check firewall rules

**"Authentication failed"**
- Invalid credentials
- Session expired
- Clear cookies and re-login

**"Network error"**
- Check internet connection
- Verify server is running
- Check CORS configuration
- Review proxy settings

### Getting Help

1. Check server logs: `/var/log/kumomta/`
2. Browser console: F12 → Console tab
3. Network requests: F12 → Network tab
4. Contact support with error details

---

## Best Practices

### Security

- Change default password immediately
- Use strong, unique passwords
- Enable TLS/SSL in production
- Whitelist only trusted IPs
- Rotate API keys regularly
- Monitor audit logs

### Performance

- Set appropriate rate limits
- Monitor queue depths
- Optimize concurrent connections
- Use virtual scrolling for large queues
- Cache static assets
- Monitor server resources

### Monitoring

- Review analytics daily
- Set up bounce alerts
- Monitor success rates
- Track throughput trends
- Check health status regularly
- Export data for reports

### Maintenance

- Update dependencies regularly
- Backup configuration
- Test disaster recovery
- Document custom settings
- Review security settings
- Monitor error rates

---

## Keyboard Shortcuts

- `Escape`: Close modals/sidebars
- `Tab`: Navigate form fields
- `Enter`: Submit forms
- `Ctrl/Cmd + Click`: Open in new tab

---

## Support

- **Documentation**: https://docs.kumomta.com/
- **GitHub**: https://github.com/KumoCorp/kumomta
- **Version**: 1.0.0
- **Last Updated**: 2025-10-24
