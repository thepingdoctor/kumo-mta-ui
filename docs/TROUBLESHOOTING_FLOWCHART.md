# Troubleshooting Decision Tree & Flowcharts

Visual troubleshooting guides for common KumoMTA UI Dashboard issues.

---

## Master Troubleshooting Flowchart

```
┌─────────────────────────────────────────┐
│         Issue Reported                  │
└───────────────┬─────────────────────────┘
                ↓
┌───────────────────────────────────────────────┐
│ Run Health Check (Health Check page)         │
│ F12 → Check browser console for errors       │
└───────────────┬───────────────────────────────┘
                ↓
        All checks pass?
                ├─ Yes → Intermittent issue
                │         └→ Monitor logs, enable debug mode
                │
                └─ No → Which component failed?
                        ↓
        ┌───────────────┴───────────────┐
        ↓                               ↓
 Connection Failed              Other Component Failed
        ↓                               ↓
 [Connection Tree]              [Component-Specific Tree]
```

---

## 1. Connection Issues Decision Tree

```
┌─────────────────────────────────────────┐
│ Error: "Cannot connect to server"      │
└───────────────┬─────────────────────────┘
                ↓
┌────────────────────────────────────────────┐
│ Is KumoMTA server running?                 │
│ Command: systemctl status kumomta          │
└────────┬───────────────────────────────────┘
         │
    ┌────┴────┐
    ↓         ↓
   No        Yes
    │         │
    │         ↓
    │    ┌────────────────────────────────────┐
    │    │ Is API listener configured?        │
    │    │ Check: kumomta.toml for http       │
    │    └────────┬───────────────────────────┘
    │         ┌───┴───┐
    │         ↓       ↓
    │        No      Yes
    │         │       │
    │         │       ↓
    │         │   ┌───────────────────────────────┐
    │         │   │ Test with curl:               │
    │         │   │ curl localhost:8000/api/...   │
    │         │   └────────┬──────────────────────┘
    │         │        ┌───┴───┐
    │         │        ↓       ↓
    │         │      Fails   Success
    │         │        │       │
    ↓         ↓        ↓       ↓
┌─────────────────────────────────────────────┐
│         FIX ACTIONS                         │
├─────────────────────────────────────────────┤
│ No (server down):                           │
│   → systemctl start kumomta                 │
│                                             │
│ No (API not configured):                    │
│   → Add http listener to kumomta.toml       │
│   → Restart KumoMTA                         │
│                                             │
│ Curl fails (but server up):                │
│   → Check firewall: ufw status             │
│   → Check port: netstat -tulpn | grep 8000 │
│   → Review kumomta logs                     │
│                                             │
│ Curl succeeds (but dashboard fails):       │
│   → Check VITE_API_URL in .env             │
│   → Check CORS in browser console (F12)    │
│   → Add CORS headers to kumomta.toml       │
│   → Clear browser cache                     │
└─────────────────────────────────────────────┘
```

---

## 2. Authentication Issues Decision Tree

```
┌─────────────────────────────────────────┐
│   Login Fails / Access Denied           │
└───────────────┬─────────────────────────┘
                ↓
        What's the error?
                ↓
    ┌───────────┴───────────┬──────────────┬────────────┐
    ↓                       ↓              ↓            ↓
"Invalid        "Account      "MFA code    "Session
credentials"     locked"       invalid"     expired"
    │                │              │            │
    ↓                ↓              ↓            ↓
┌──────────┐   ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Password │   │ Lockout  │  │   MFA    │  │  Session │
│  Issue   │   │  Issue   │  │  Issue   │  │  Issue   │
└────┬─────┘   └────┬─────┘  └────┬─────┘  └────┬─────┘
     │              │              │              │
     ↓              ↓              ↓              ↓
Check:         Check:         Check:         Fix:
- Caps Lock    - Audit log    - Device time  - Log in
- Correct      - Failed       - Sync time    again
  username       attempts     - Use backup   - Adjust
- Password     - Lock time      codes        session
  expiry                                     timeout
     │              │              │              │
     ↓              ↓              ↓              ↓
  ┌────────────────────────────────────────────────┐
  │ FIX ACTIONS                                    │
  ├────────────────────────────────────────────────┤
  │ Wrong password:                                │
  │   → Use "Forgot Password" link                 │
  │   → Or admin resets via User Management        │
  │                                                │
  │ Account locked:                                │
  │   → Wait 30 minutes (auto-unlock)             │
  │   → Or admin unlocks immediately               │
  │                                                │
  │ MFA invalid:                                   │
  │   → Check device time (must be synced)         │
  │   → Use backup codes if available              │
  │   → Admin can reset MFA                        │
  │                                                │
  │ Session expired:                               │
  │   → Log in again                               │
  │   → Check session timeout settings             │
  └────────────────────────────────────────────────┘
```

---

## 3. Performance Issues Decision Tree

```
┌─────────────────────────────────────────┐
│   Dashboard is slow / unresponsive      │
└───────────────┬─────────────────────────┘
                ↓
        Where's the slowness?
                ↓
    ┌───────────┴───────────┬──────────────┐
    ↓                       ↓              ↓
Initial load          Table/Queue     Charts/Analytics
    │                 rendering           │
    ↓                     │               ↓
Check:                   ↓            Check:
- Network          Check:            - Date range
- Browser cache    - Queue size      - Data volume
- Build mode       - Pagination      - Browser cache
    │              - Filters              │
    ↓                  │                  ↓
    │                  ↓                  │
    ├──────────────────┴──────────────────┤
    │ Open Browser DevTools (F12)        │
    │ → Network tab for API timing       │
    │ → Console for JS errors            │
    └────────────┬───────────────────────┘
                 ↓
        API response time?
                 ↓
    ┌────────────┴────────────┐
    ↓                         ↓
  Fast (<200ms)         Slow (>1000ms)
    │                         │
    ↓                         ↓
Frontend issue          Backend issue
    │                         │
    ↓                         ↓
┌────────────────┐    ┌──────────────────┐
│ Frontend Fixes │    │ Backend Fixes    │
├────────────────┤    ├──────────────────┤
│ - Clear cache  │    │ - Check CPU/RAM  │
│ - Reduce       │    │ - Check queue    │
│   refresh rate │    │   depth          │
│ - Filter data  │    │ - Optimize DB    │
│ - Reduce page  │    │ - Add workers    │
│   size         │    │ - Review logs    │
│ - Disable      │    │ - Check DNS      │
│   widgets      │    │   performance    │
└────────────────┘    └──────────────────┘
```

---

## 4. Queue Problems Decision Tree

```
┌─────────────────────────────────────────┐
│   Queue issue detected                  │
└───────────────┬─────────────────────────┘
                ↓
        What's the symptom?
                ↓
    ┌───────────┴───────────┬──────────────────┐
    ↓                       ↓                  ↓
Queue depth           Emails stuck      All emails to
  growing            in "Waiting"       domain failing
    │                       │                  │
    ↓                       ↓                  ↓
┌──────────┐         ┌──────────┐       ┌──────────┐
│ Capacity │         │ Workers  │       │  Domain  │
│  Issue   │         │  Issue   │       │  Issue   │
└────┬─────┘         └────┬─────┘       └────┬─────┘
     ↓                    ↓                   ↓
Check:               Check:              Check:
- Workers active     - Worker status     - Error messages
- Throughput         - Queue suspended   - Bounce reasons
- DNS speed          - DNS issues        - Domain reputation
- Network            - Logs for errors   - Recipient server
     │                    │                   │
     ↓                    ↓                   ↓
┌─────────────────────────────────────────────────┐
│         DIAGNOSTIC STEPS                        │
├─────────────────────────────────────────────────┤
│ 1. Check worker status:                         │
│    systemctl status kumomta-workers             │
│                                                 │
│ 2. Check queue suspension:                      │
│    Dashboard → Queue Control                    │
│                                                 │
│ 3. Test DNS resolution:                         │
│    dig mail.example.com MX                      │
│                                                 │
│ 4. Check error messages:                        │
│    Filter queue by Failed status                │
│    Review error details                         │
│                                                 │
│ 5. Review logs:                                 │
│    tail -f /var/log/kumomta/smtp.log           │
└─────────────────────────────────────────────────┘
     │
     ↓
┌─────────────────────────────────────────────────┐
│         FIX ACTIONS                             │
├─────────────────────────────────────────────────┤
│ Workers down:                                   │
│   → systemctl restart kumomta-workers           │
│                                                 │
│ Queue suspended:                                │
│   → Resume queue via Dashboard                  │
│                                                 │
│ DNS issues:                                     │
│   → Fix DNS configuration                       │
│   → Switch to alternative DNS servers           │
│                                                 │
│ Domain-specific failures:                       │
│   → Check domain reputation                     │
│   → Reduce sending rate to domain               │
│   → Contact domain postmaster                   │
│                                                 │
│ Capacity issues:                                │
│   → Increase worker count                       │
│   → Optimize queue processing                   │
│   → Scale infrastructure                        │
└─────────────────────────────────────────────────┘
```

---

## 5. High Bounce Rate Troubleshooting

```
┌─────────────────────────────────────────┐
│   Bounce Rate > 10%                     │
└───────────────┬─────────────────────────┘
                ↓
┌────────────────────────────────────────────┐
│ Navigate to Analytics → Bounce Analysis   │
└────────────┬───────────────────────────────┘
             ↓
     Check bounce types:
             ↓
    ┌────────┴────────┬────────────────┐
    ↓                 ↓                ↓
Hard Bounces     Soft Bounces    Domain-Specific
   (>60%)           (>40%)          Failures
    │                 │                │
    ↓                 ↓                ↓
List quality     Temporary        Reputation
   issue            issues           issue
    │                 │                │
    ↓                 ↓                ↓
Check:           Check:           Check:
- Invalid        - Greylisting    - Blacklists
  addresses      - Full mailboxes - SPF/DKIM
- Non-existent   - Server issues  - Content
  domains        - Message size   - Volume
    │                 │                │
    ↓                 ↓                ↓
┌─────────────────────────────────────────────────┐
│         REMEDIATION ACTIONS                     │
├─────────────────────────────────────────────────┤
│ High hard bounces (list quality):               │
│   1. Export hard bounces                        │
│   2. Remove from mailing lists immediately      │
│   3. Implement double opt-in                    │
│   4. Regular list validation                    │
│   5. Check signup process for typos             │
│                                                 │
│ High soft bounces (temporary):                  │
│   1. Verify retry configuration                 │
│   2. Wait for automatic retries                 │
│   3. Check message size limits                  │
│   4. Monitor for resolution                     │
│                                                 │
│ Domain-specific failures (reputation):          │
│   1. Check blacklist status (MXToolbox)         │
│   2. Verify SPF, DKIM, DMARC records           │
│   3. Review email content for spam triggers     │
│   4. Reduce sending volume (warm-up)            │
│   5. Contact domain postmaster                  │
│   6. Review feedback loop reports               │
└─────────────────────────────────────────────────┘
```

---

## 6. Data Export Issues

```
┌─────────────────────────────────────────┐
│   CSV Export Fails or Incomplete        │
└───────────────┬─────────────────────────┘
                ↓
        What happens?
                ↓
    ┌───────────┴───────────┬──────────────┐
    ↓                       ↓              ↓
Nothing happens      Partial data    Wrong data
    │                       │              │
    ↓                       ↓              ↓
Check:               Check:           Check:
- Popup blocker      - Row limit      - Filters
- Permissions        - Network        - Date range
- Browser console    - Timeout        - Columns
    │                       │              │
    ↓                       ↓              ↓
┌─────────────────────────────────────────────────┐
│         FIX ACTIONS                             │
├─────────────────────────────────────────────────┤
│ Popup blocked:                                  │
│   → Allow popups for dashboard domain           │
│   → Try export again                            │
│                                                 │
│ Large dataset (>10,000 rows):                   │
│   → Use filters to reduce data                  │
│   → Export in batches                           │
│   → Request increased limit from admin          │
│                                                 │
│ Partial data:                                   │
│   → Check network timeout                       │
│   → Reduce date range                           │
│   → Export smaller batches                      │
│                                                 │
│ Wrong data:                                     │
│   → Verify filters are correct                  │
│   → Check date range settings                   │
│   → Ensure correct columns selected             │
│                                                 │
│ Permission denied:                              │
│   → Verify your role has export permission      │
│   → Contact admin for permission                │
└─────────────────────────────────────────────────┘
```

---

## 7. Chart Display Issues

```
┌─────────────────────────────────────────┐
│   Charts Not Displaying / No Data       │
└───────────────┬─────────────────────────┘
                ↓
┌────────────────────────────────────────────┐
│ Open Browser DevTools (F12)                │
│ Check Console and Network tabs             │
└────────────┬───────────────────────────────┘
             ↓
     API returning data?
             ↓
    ┌────────┴────────┐
    ↓                 ↓
   Yes               No
    │                 │
    ↓                 ↓
Frontend issue    Backend issue
    │                 │
    ↓                 ↓
Check:            Check:
- Date range      - Metrics collection
- Chart library   - Database
- Browser cache   - API endpoint
- Console errors  - Server logs
    │                 │
    ↓                 ↓
┌─────────────────────────────────────────────────┐
│         FIX ACTIONS                             │
├─────────────────────────────────────────────────┤
│ No data in date range:                          │
│   → Adjust date range to include data           │
│   → Verify emails were sent in period           │
│                                                 │
│ API not returning data:                         │
│   → Check KumoMTA metrics collection            │
│   → Verify database has data                    │
│   → Check API endpoint configuration            │
│                                                 │
│ Frontend rendering issue:                       │
│   → Clear browser cache (Ctrl+Shift+R)          │
│   → Check console for JS errors                 │
│   → Try different browser                       │
│   → Disable browser extensions                  │
│                                                 │
│ Chart library error:                            │
│   → Check Chart.js version compatibility        │
│   → Reinstall dependencies: npm install         │
│   → Check for console errors                    │
└─────────────────────────────────────────────────┘
```

---

## Quick Diagnosis: Symptoms to Root Cause

| Symptom | Likely Cause | Quick Check | Solution Path |
|---------|--------------|-------------|---------------|
| Can't load dashboard | Server down or network issue | `curl localhost:8000` | [Connection Tree](#1-connection-issues-decision-tree) |
| Can't log in | Credentials or auth issue | Check audit logs | [Authentication Tree](#2-authentication-issues-decision-tree) |
| Slow dashboard | Performance bottleneck | F12 Network tab | [Performance Tree](#3-performance-issues-decision-tree) |
| Queue growing | Workers or capacity | Check worker status | [Queue Tree](#4-queue-problems-decision-tree) |
| High bounces | List quality or reputation | Bounce analysis | [Bounce Tree](#5-high-bounce-rate-troubleshooting) |
| Export fails | Browser or permission | Check popup blocker | [Export Tree](#6-data-export-issues) |
| No charts | Data or rendering | F12 Console | [Chart Tree](#7-chart-display-issues) |

---

## Escalation Path

```
┌─────────────────────────────────────────┐
│   Issue remains unresolved              │
└───────────────┬─────────────────────────┘
                ↓
┌────────────────────────────────────────────┐
│ 1. Gather troubleshooting information:    │
│    - Exact error messages                  │
│    - Steps to reproduce                    │
│    - Browser console logs (F12)            │
│    - Server logs excerpt                   │
│    - KumoMTA version                       │
│    - Dashboard version                     │
│    - Recent changes                        │
└────────────┬───────────────────────────────┘
             ↓
┌────────────────────────────────────────────┐
│ 2. Check documentation:                    │
│    - FAQ.md                                │
│    - TROUBLESHOOTING.md                    │
│    - Relevant tutorial                     │
└────────────┬───────────────────────────────┘
             ↓
      Still unresolved?
             ↓
    ┌────────┴────────┬──────────────┐
    ↓                 ↓              ↓
Low Priority    Medium Priority  Critical
    │                 │              │
    ↓                 ↓              ↓
Create         Community        Contact
GitHub         Forum Post       Support
 Issue                          Immediately
    │                 │              │
    └─────────────────┴──────────────┘
                ↓
        Response & Resolution
```

---

**Last Updated**: 2025-01-19
**Version**: 1.0.0
