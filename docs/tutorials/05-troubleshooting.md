# Video Tutorial Script: Troubleshooting & Problem Resolution
**Duration**: 8 minutes
**Target Audience**: All users, System Administrators, Support Teams
**Prerequisites**: Completed previous tutorials

## Scene 1: Introduction (30 seconds)

### Visual
- Show troubleshooting dashboard
- Display common error scenarios

### Narration
> "Welcome to Troubleshooting & Problem Resolution - your guide to diagnosing and fixing common issues with KumoMTA UI. In this 8-minute tutorial, we'll cover systematic troubleshooting approaches, common errors and solutions, connection issues, performance problems, queue debugging, and when to escalate to support. Let's turn problems into solutions."

### On-Screen Text
- "Troubleshooting: Quick Problem Resolution"
- "Topics: Diagnosis • Common Errors • Performance • Support"

---

## Scene 2: Systematic Troubleshooting Approach (60 seconds)

### Visual
- Show troubleshooting flowchart
- Display diagnostic tools

### Narration
> "Effective troubleshooting follows a systematic approach. First, identify the symptoms - what's not working? Second, gather information - check logs, metrics, and recent changes. Third, form hypotheses about the cause. Fourth, test your hypotheses systematically. Finally, implement and verify the solution.

> The Health Check page provides a starting point. It runs automatic diagnostics checking server connectivity, API health, database status, and queue operations. Start here for any issue."

### On-Screen Actions
1. Navigate to Health Check page
2. Click "Run Diagnostics"
3. Show diagnostic results:
   - ✓ Server connection: OK
   - ✓ API response: 45ms
   - ✗ Queue worker: ERROR
   - ✓ Database: OK
4. Click failed check for details
5. Show recommended actions

### Troubleshooting Framework
```
1. IDENTIFY
   - What's the symptom?
   - When did it start?
   - Who is affected?

2. GATHER
   - Check error messages
   - Review logs
   - Check metrics
   - List recent changes

3. HYPOTHESIZE
   - Form theories
   - Consider common issues
   - Check documentation

4. TEST
   - Verify one hypothesis at a time
   - Document findings
   - Eliminate possibilities

5. RESOLVE
   - Implement fix
   - Verify resolution
   - Monitor for recurrence
```

### On-Screen Text
- "Start with Health Check"
- "Document each step"
- "One change at a time"

---

## Scene 3: Connection Issues (90 seconds)

### Visual
- Simulate connection error
- Show diagnostic steps
- Resolve connection issue

### Narration
> "Connection issues are the most common problem. If you see 'Cannot connect to server', start by checking the basics. Is the KumoMTA server running? Use the command 'systemctl status kumomta' to verify. Is the API enabled? Check your KumoMTA configuration for the admin API listener.

> Verify the VITE_API_URL in your .env file matches your server address. Check firewall rules - port 8000 must be accessible. Test the connection manually with curl. If the curl test succeeds but the dashboard fails, check CORS configuration."

### On-Screen Actions
1. Show connection error in browser
2. Open terminal
3. Run: `systemctl status kumomta`
4. Show service status: active
5. Run: `curl http://localhost:8000/api/admin/metrics/v1`
6. Show successful JSON response
7. Check .env file:
   ```
   VITE_API_URL=http://localhost:8000
   ```
8. Check browser console for CORS error
9. Show KumoMTA config fix:
   ```lua
   kumo.on('http_server_init', function(hooks)
     hooks:add_header('Access-Control-Allow-Origin', '*')
   end)
   ```
10. Restart KumoMTA
11. Refresh dashboard - connection successful

### Connection Troubleshooting Checklist
```
□ Is KumoMTA server running?
  → systemctl status kumomta
□ Is API listener configured?
  → Check kumomta.toml
□ Is VITE_API_URL correct?
  → Check .env file
□ Is firewall blocking port 8000?
  → sudo ufw status
□ Test with curl
  → curl http://server:8000/api/admin/metrics/v1
□ Check CORS headers
  → Browser console (F12)
□ Verify network connectivity
  → ping server
```

### On-Screen Text
- "90% of issues are configuration"
- "Test connectivity with curl first"
- "Check browser console for CORS"

---

## Scene 4: Authentication Problems (60 seconds)

### Visual
- Show login failures
- Debug authentication issues
- Reset credentials

### Narration
> "Can't log in? First, verify you're using the correct credentials. Check caps lock - passwords are case-sensitive. If you've forgotten your password, use the password reset feature or contact your administrator.

> For account lockout issues, check the audit log. Accounts lock after 5 failed attempts by default. An administrator can unlock your account from the User Management page. For SSO issues, verify the OAuth configuration and check the external provider's status."

### On-Screen Actions
1. Show failed login attempt
2. Check audit log:
   - Multiple failed login attempts
   - Account locked
3. Admin unlocks account:
   - Navigate to User Management
   - Find locked user
   - Click "Unlock Account"
4. User tries login again - success
5. Show SSO troubleshooting:
   - Check OAuth config
   - Test OAuth flow
   - Review provider logs

### Authentication Issues & Solutions
```
Issue: Wrong password
→ Reset via email or admin

Issue: Account locked
→ Admin unlocks or wait 30 minutes

Issue: SSO not working
→ Check OAuth configuration
→ Verify provider connectivity

Issue: MFA code invalid
→ Check device time sync
→ Use backup codes

Issue: Session expired
→ Log in again
→ Adjust session timeout
```

### On-Screen Text
- "Default lockout: 30 minutes"
- "Admins can unlock immediately"
- "Check device time for MFA"

---

## Scene 5: Performance Issues (90 seconds)

### Visual
- Show slow dashboard
- Identify bottlenecks
- Apply performance fixes

### Narration
> "If the dashboard feels slow, several factors might be responsible. Large queue sizes can slow table rendering - use filtering to reduce visible items. Too-frequent auto-refresh can impact performance - increase the refresh interval from 5 to 15 seconds.

> Browser cache issues can cause slowness. Clear your browser cache and hard refresh with Ctrl+Shift+R. Check the browser console for JavaScript errors. Verify your network latency - slow API responses indicate server issues, not dashboard issues.

> For server-side performance, check KumoMTA's CPU and memory usage. Insufficient resources will slow down API responses."

### On-Screen Actions
1. Show slow queue table loading
2. Open browser DevTools (F12)
3. Check Network tab - slow API response (2.5s)
4. Navigate to server terminal
5. Run: `top` - show high CPU usage
6. Check queue depth: 15,000 items
7. Reduce queue by processing
8. Show performance improvements:
   - API response: 150ms
   - Page load: Fast
9. Adjust dashboard settings:
   - Refresh interval: 15s
   - Table pagination: 25 items per page

### Performance Optimization
```
Dashboard Side:
□ Increase refresh interval (15-30s)
□ Reduce items per page (25-50)
□ Use filtering to limit data
□ Clear browser cache
□ Disable unnecessary widgets

Server Side:
□ Check CPU/memory usage
□ Optimize queue processing
□ Increase worker processes
□ Review DNS performance
□ Check database query times
```

### On-Screen Text
- "Browser DevTools show network timing"
- "High queue depth impacts performance"
- "Balance refresh rate with performance"

---

## Scene 6: Queue Problems (90 seconds)

### Visual
- Identify stuck queues
- Debug delivery failures
- Resolve queue issues

### Narration
> "Queue problems manifest as growing queue depth or stuck emails. First, check queue status for suspended queues - someone might have paused processing. Check worker status - if workers are down, queues won't process.

> For stuck individual emails, check the error message. DNS errors indicate network issues. Recipient server rejections might indicate reputation problems. Timeout errors suggest network latency or slow recipient servers.

> Use the queue analytics to identify patterns. If all emails to a specific domain are failing, the issue is domain-specific. If random emails across domains fail, check your server's connectivity and DNS configuration."

### On-Screen Actions
1. Show queue depth increasing
2. Check queue status: Not suspended
3. Check worker status:
   - Workers running: 0/4 ⚠️
4. Restart workers:
   - systemctl restart kumomta-workers
5. Show workers active: 4/4 ✓
6. Queue depth decreases
7. Check failed email:
   - Error: "DNS resolution failed"
8. Test DNS: `dig mail.example.com`
9. DNS timeout - identified issue
10. Fix DNS configuration
11. Retry failed emails - success

### Queue Troubleshooting Decision Tree
```
Queue Growing?
  ├─ Workers running?
  │  ├─ Yes → Check worker CPU/memory
  │  └─ No → Restart workers
  │
  ├─ Queue suspended?
  │  ├─ Yes → Resume queue
  │  └─ No → Continue investigation
  │
  ├─ DNS issues?
  │  ├─ Yes → Fix DNS config
  │  └─ No → Check network
  │
  └─ Domain-specific?
     ├─ Yes → Check domain reputation
     └─ No → Check server config
```

### On-Screen Text
- "Check workers first"
- "DNS issues are common"
- "Domain-specific = reputation issue"

---

## Scene 7: Common Error Messages (60 seconds)

### Visual
- Show error message reference
- Explain each error type

### Narration
> "Let's review common error messages and their solutions. '550 User not found' means the email address doesn't exist - remove from your list. '450 Greylisting' is temporary - the email will retry automatically. '554 DNS resolution failed' indicates DNS problems - check your DNS servers.

> '421 Service unavailable' means the recipient's server is temporarily down - automatic retry will handle this. '552 Mailbox full' - the recipient needs to free space. '535 Authentication failed' - check your SMTP credentials."

### Error Reference Quick Guide
```
ERROR CODE    MEANING              SOLUTION
──────────    ───────              ────────
550           User not found       Remove email from list
450           Greylisting          Wait for auto-retry
554           DNS failed           Fix DNS configuration
421           Server down          Wait for auto-retry
552           Mailbox full         Recipient action needed
535           Auth failed          Check SMTP credentials
451           Temporary error      Will retry automatically
553           Invalid address      Fix email syntax
```

### On-Screen Actions
1. Show Error Reference page
2. Click error code: "550"
3. Show detailed explanation and solutions
4. Show related documentation links
5. Display similar errors

### On-Screen Text
- "5xx = Permanent errors"
- "4xx = Temporary errors"
- "Temporary errors auto-retry"

---

## Scene 8: Log Analysis (60 seconds)

### Visual
- Access system logs
- Filter and search logs
- Identify issues from logs

### Narration
> "Logs are invaluable for troubleshooting. The system logs show all application events, errors, and warnings. Filter by severity to find critical issues. Search for specific error messages or user actions.

> The audit log tracks user actions - useful for identifying who changed what and when. The SMTP logs show detailed delivery attempts - essential for debugging specific email failures."

### On-Screen Actions
1. Navigate to Logs page
2. Filter by severity: "Error"
3. Show recent errors:
   - Database connection timeout
   - API rate limit exceeded
   - Worker process crash
4. Click error for stack trace
5. Search logs for specific user
6. Show SMTP trace logs
7. Export logs for analysis

### Log Locations
```
Application Logs:  /var/log/kumomta-ui/app.log
Audit Logs:        Database (queryable via UI)
SMTP Logs:         /var/log/kumomta/smtp.log
System Logs:       /var/log/kumomta/system.log
```

### On-Screen Text
- "Logs tell the full story"
- "Filter by time and severity"
- "Export for external analysis"

---

## Scene 9: When to Contact Support (60 seconds)

### Visual
- Show support contact options
- Gather required information
- Submit support ticket

### Narration
> "Some issues require expert help. Contact support when you've exhausted troubleshooting steps, encounter critical security issues, need architectural guidance, or face data corruption.

> Before contacting support, gather information: error messages, log excerpts, your KumoMTA version, dashboard version, recent changes, and reproduction steps. The more information you provide, the faster support can help."

### On-Screen Actions
1. Click "Get Support" in help menu
2. Show support ticket form
3. Fill required information:
   - Issue category: Performance
   - Severity: High
   - Description: Detailed problem description
   - Error messages: Paste logs
   - Steps to reproduce
   - KumoMTA version
   - Dashboard version
   - System information
4. Attach screenshots
5. Attach log files
6. Click "Submit Ticket"

### Support Information to Gather
```
✓ Detailed problem description
✓ When did it start?
✓ Error messages (full text)
✓ Log excerpts (5-10 lines before/after error)
✓ KumoMTA version: kumomta --version
✓ Dashboard version: package.json
✓ OS & version: uname -a
✓ Recent changes
✓ Steps to reproduce
✓ Screenshots
✓ Configuration files (sanitized)
```

### On-Screen Text
- "More info = faster resolution"
- "Sanitize sensitive data before sharing"
- "Include version numbers"

---

## Scene 10: Self-Help Resources (45 seconds)

### Visual
- Tour documentation
- Show community resources
- Highlight knowledge base

### Narration
> "Many answers are in the documentation. Check the FAQ for common questions, the troubleshooting guide for detailed procedures, the API documentation for integration issues, and the quick reference for common tasks. The community forum is active - search for your issue or ask a question."

### On-Screen Actions
1. Show Help Center
2. Navigate to FAQ
3. Search FAQ: "connection error"
4. Show relevant results
5. Open Troubleshooting Guide
6. Show flowchart navigation
7. Display Quick Reference guide
8. Show Community Forum link

### Documentation Hierarchy
```
Help Center
├── FAQ (30+ common questions)
├── Troubleshooting Guide (step-by-step)
├── Quick Reference (commands & shortcuts)
├── API Documentation (integration)
├── Video Tutorials (this series)
├── Community Forum (user discussions)
└── Support Tickets (official support)
```

### On-Screen Text
- "Search documentation first"
- "Community often has answers"
- "Documentation updated regularly"

---

## Scene 11: Conclusion (30 seconds)

### Visual
- Show troubleshooting summary
- Display success cases

### Narration
> "You now have the skills to troubleshoot common KumoMTA UI issues! Remember: start with Health Check, follow a systematic approach, check logs, consult documentation, and contact support when needed. Most issues have simple solutions when approached methodically.

> Congratulations on completing the entire KumoMTA UI tutorial series! You're now equipped to manage, monitor, and troubleshoot your email infrastructure effectively. Happy emailing!"

### On-Screen Text
- "Tutorial Series Complete!"
- "Resources:"
  - "📚 Full Documentation: /docs"
  - "❓ FAQ: /docs/FAQ.md"
  - "🔍 Troubleshooting: /docs/TROUBLESHOOTING.md"
  - "⚡ Quick Reference: /docs/QUICK_REFERENCE.md"

---

## Screenshots Needed

1. Health Check Dashboard
2. Connection Error
3. Authentication Failure
4. Performance Issues (slow loading)
5. Queue Problems (stuck emails)
6. Error Message Reference
7. Log Analysis Interface
8. Support Ticket Form
9. Help Center
10. Community Forum

---

## Diagrams Required

### Troubleshooting Flowchart
```
Issue Occurs
    ↓
Health Check
    ↓
Pass? ──No──→ Specific Component Failed
  │               ↓
  │          Fix Component
  │               ↓
  └──Yes──→ Check Logs
                  ↓
            Error Found? ──Yes──→ Apply Solution
                  │                   ↓
                  │              Verify Fix
                  │                   ↓
                  │              Monitor
                  │
                  └──No──→ Contact Support
```

---

## Interactive Quiz

1. **What's the first step in troubleshooting?**
   - a) Contact support
   - b) Run Health Check ✓
   - c) Restart server
   - d) Check logs

2. **What does error code 450 indicate?**
   - a) Permanent failure
   - b) Temporary failure ✓
   - c) Success
   - d) Authentication error

3. **Where should you check for CORS errors?**
   - a) Server logs
   - b) Email logs
   - c) Browser console ✓
   - d) Database logs
