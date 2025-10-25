# Video Tutorial Script: Security Configuration & Access Control
**Duration**: 15 minutes
**Target Audience**: System Administrators, Security Engineers, DevOps Teams
**Prerequisites**: Completed "Getting Started" and "Queue Management" tutorials, understanding of authentication concepts

## Scene 1: Introduction (45 seconds)

### Visual
- Show Security page with authentication settings
- Display security dashboard with audit logs
- Highlight security indicators

### Narration
> "Welcome to Security Configuration - the critical foundation of your KumoMTA infrastructure. In this comprehensive 15-minute tutorial, we'll cover authentication and authorization, role-based access control, API security, audit logging, security best practices, and incident response. Security isn't optional - it's essential for protecting your email delivery infrastructure and your users' data."

### On-Screen Text
- "Security Configuration: Protect Your Infrastructure"
- "Topics: Authentication • Authorization • RBAC • Audit Logs • Best Practices"
- "⚠️ This tutorial contains critical security information"

---

## Scene 2: Authentication Overview (90 seconds)

### Visual
- Navigate to Security > Authentication
- Show authentication methods panel
- Display current auth configuration

### Narration
> "Authentication verifies who users are. KumoMTA UI supports multiple authentication methods: Local authentication with username and password, LDAP integration for enterprise directories, OAuth 2.0 for single sign-on, and API token authentication for programmatic access.

> By default, local authentication is enabled. For production environments, we strongly recommend enabling multi-factor authentication and integrating with your organization's identity provider via LDAP or OAuth."

### On-Screen Actions
1. Click "Security" in navigation
2. Click "Authentication" tab
3. Show authentication methods list:
   - Local Authentication (enabled)
   - LDAP Integration (disabled)
   - OAuth 2.0 (disabled)
   - API Tokens (enabled)
4. Highlight MFA status: "Not configured"

### Authentication Methods Comparison
```
┌────────────────┬──────────┬────────────┬─────────────┐
│ Method         │ Security │ Enterprise │ API Support │
├────────────────┼──────────┼────────────┼─────────────┤
│ Local Auth     │ Medium   │ No         │ No          │
│ LDAP/AD        │ High     │ Yes        │ No          │
│ OAuth 2.0      │ High     │ Yes        │ Yes         │
│ API Tokens     │ High     │ Yes        │ Yes         │
└────────────────┴──────────┴────────────┴─────────────┘
```

### On-Screen Text
- "Production: Always enable MFA"
- "Enterprise: Use LDAP or OAuth"
- "Automation: Use API tokens"

---

## Scene 3: Configuring Local Authentication (120 seconds)

### Visual
- Click "Configure Local Auth"
- Show password policy settings
- Configure MFA options

### Narration
> "Let's configure local authentication securely. Click 'Configure Local Auth' to access password policies. Set minimum password length to at least 12 characters. Enable password complexity requiring uppercase, lowercase, numbers, and special characters. Configure password expiration - we recommend 90 days for standard users, 60 days for administrators.

> Enable account lockout after 5 failed login attempts to prevent brute force attacks. Set lockout duration to 30 minutes or require administrator unlock. Configure session timeout - 30 minutes of inactivity is a good balance between security and usability."

### On-Screen Actions
1. Click "Configure Local Auth" button
2. Show Password Policy form:
   - Minimum length: 12
   - Require uppercase: ✓
   - Require lowercase: ✓
   - Require numbers: ✓
   - Require special chars: ✓
   - Password expiration: 90 days
3. Show Account Lockout settings:
   - Failed attempts: 5
   - Lockout duration: 30 minutes
4. Show Session settings:
   - Session timeout: 30 minutes
   - Require re-auth for sensitive ops: ✓
5. Click "Save Settings"
6. Show success notification

### Password Policy Recommendations
```
Setting                    Minimum    Recommended
─────────────────────────  ─────────  ─────────────
Length                     8          12+
Complexity                 2 types    4 types
Expiration                 Never      90 days
History                    3          10
Failed attempts            10         5
Lockout duration           10 min     30 min
Session timeout            60 min     30 min
```

### On-Screen Text
- "Strong passwords are your first line of defense"
- "Balance security with usability"
- "Document policy for users"

---

## Scene 4: Enabling Multi-Factor Authentication (120 seconds)

### Visual
- Navigate to MFA settings
- Configure TOTP authentication
- Test MFA enrollment

### Narration
> "Multi-factor authentication adds a critical second layer of security. KumoMTA UI supports TOTP (Time-based One-Time Password) compatible with apps like Google Authenticator, Authy, or Microsoft Authenticator. Let's enable MFA for all users.

> Click 'Enable MFA'. Choose enforcement mode - 'Required for all users' forces MFA, while 'Optional' allows users to opt in. We recommend 'Required' for production. Configure recovery options - backup codes and email recovery help users regain access if they lose their authentication device."

### On-Screen Actions
1. Click "Multi-Factor Authentication" section
2. Click "Enable MFA" toggle
3. Configure MFA settings:
   - Enforcement: "Required for all users"
   - Methods: TOTP (enabled), SMS (disabled)
   - Recovery: Backup codes (enabled), Email (enabled)
   - Grace period: 7 days
4. Click "Save MFA Settings"
5. Show admin MFA enrollment prompt
6. Scan QR code with authenticator app
7. Enter verification code
8. Show backup codes
9. Click "I've saved my backup codes"
10. Show MFA successfully enabled

### MFA Enrollment Flow
```
User Logs In
    ↓
Password Correct
    ↓
MFA Not Configured? → Enrollment Required
    ↓                      ↓
Enter TOTP Code      Scan QR Code
    ↓                      ↓
Code Valid?          Save Backup Codes
    ↓                      ↓
Access Granted       MFA Enabled
```

### On-Screen Text
- "MFA reduces breach risk by 99.9%"
- "Save backup codes securely"
- "Test MFA before enforcing"

---

## Scene 5: Role-Based Access Control (RBAC) (150 seconds)

### Visual
- Navigate to Roles & Permissions
- Show default roles
- Create custom role

### Narration
> "Role-Based Access Control ensures users have only the permissions they need. KumoMTA UI includes four default roles:

> **Administrator** - Full system access, can manage users and configuration
> **Operator** - Can manage queues and view metrics, no configuration changes
> **Analyst** - Read-only access to analytics and reports
> **Viewer** - Read-only dashboard access, no queue management

> Let's create a custom role for your support team. They need queue management access but shouldn't modify configuration."

### On-Screen Actions
1. Click "Roles & Permissions" tab
2. Show default roles table:
   - Administrator (full access)
   - Operator (queue + metrics)
   - Analyst (read metrics)
   - Viewer (read dashboard)
3. Click "Create Custom Role"
4. Fill role creation form:
   - Name: "Support Engineer"
   - Description: "Queue management for support team"
5. Configure permissions:
   - Dashboard: View ✓
   - Queue Management: View ✓, Manage ✓, Export ✓
   - Configuration: View ✗, Edit ✗
   - Analytics: View ✓
   - Users: View ✗, Manage ✗
   - Audit Logs: View ✓
6. Click "Create Role"
7. Show role added to list
8. Assign role to a user

### RBAC Permission Matrix
```
┌─────────────┬───────┬──────────┬─────────┬────────┐
│ Resource    │ Admin │ Operator │ Analyst │ Viewer │
├─────────────┼───────┼──────────┼─────────┼────────┤
│ Dashboard   │ R/W   │ R/W      │ R       │ R      │
│ Queues      │ R/W   │ R/W      │ R       │ R      │
│ Config      │ R/W   │ R        │ -       │ -      │
│ Users       │ R/W   │ -        │ -       │ -      │
│ Audit Logs  │ R     │ R        │ R       │ -      │
│ API Tokens  │ R/W   │ R/W      │ -       │ -      │
└─────────────┴───────┴──────────┴─────────┴────────┘
R = Read, W = Write, - = No Access
```

### On-Screen Text
- "Principle of least privilege"
- "Regular permission audits recommended"
- "Custom roles for specific needs"

---

## Scene 6: API Token Management (120 seconds)

### Visual
- Navigate to API Tokens section
- Create new API token
- Configure token permissions

### Narration
> "API tokens enable secure programmatic access without storing passwords. Each token can have limited permissions and expiration dates. Let's create a token for monitoring automation.

> Click 'Create API Token'. Give it a descriptive name - 'Monitoring Bot'. Set permissions to read-only for metrics and queue status. Configure expiration - we recommend 90 days for automated systems, with rotation procedures in place. Never use tokens with more permissions than needed."

### On-Screen Actions
1. Click "API Tokens" tab
2. Click "Create New Token" button
3. Fill token creation form:
   - Name: "Monitoring Bot"
   - Description: "Prometheus metrics scraper"
   - Permissions: Read metrics, Read queue status
   - Expires: 90 days
   - IP Restriction: 10.0.0.0/24 (optional)
4. Click "Generate Token"
5. Show token value: "kumo_xxxxxxxxxxxx"
6. Click "Copy Token"
7. Show warning: "Save this token - it won't be shown again"
8. Click "I've saved my token"
9. Show token in active tokens list

### API Token Best Practices
```
✓ Descriptive names (purpose + owner)
✓ Minimum required permissions
✓ Expiration dates (90 days max)
✓ IP restrictions when possible
✓ Regular rotation schedule
✓ Immediate revocation when compromised
✓ Audit token usage monthly
✗ Never commit tokens to code
✗ Never share tokens between systems
✗ Never use admin tokens for automation
```

### On-Screen Text
- "Treat tokens like passwords"
- "Rotate tokens every 90 days"
- "Revoke unused tokens immediately"

---

## Scene 7: Audit Logging (120 seconds)

### Visual
- Navigate to Audit Logs
- Filter logs by user and action
- Export audit data

### Narration
> "Audit logs track every security-relevant action in the system. Who logged in, what they changed, when they did it - it's all recorded. This is critical for security investigations, compliance, and accountability.

> The audit log shows user actions, timestamps, IP addresses, and success/failure status. You can filter by user, action type, or date range. Let's review recent authentication events."

### On-Screen Actions
1. Click "Audit Logs" tab
2. Show audit log table with entries:
   - User login successful
   - Password changed
   - Role assigned
   - Configuration updated
   - Queue suspended
   - API token created
3. Filter by action: "Authentication"
4. Show filtered results (logins only)
5. Click log entry to see details:
   - Timestamp: 2025-01-19 14:23:45 UTC
   - User: admin@example.com
   - Action: Login successful
   - IP: 192.168.1.100
   - User Agent: Firefox 122.0
6. Click "Export Logs" button
7. Select date range: Last 30 days
8. Export to CSV

### Audit Log Categories
```
Authentication Events:
  - Login success/failure
  - Logout
  - MFA enrollment/removal
  - Password changes

Authorization Events:
  - Permission denied
  - Role assigned/revoked
  - Access attempts

Configuration Changes:
  - Settings updated
  - Users created/deleted
  - Roles modified

Data Operations:
  - Queue suspensions
  - Bulk updates
  - Data exports
```

### On-Screen Text
- "All actions are logged"
- "Logs retained for 90 days (configurable)"
- "Review logs weekly for anomalies"

---

## Scene 8: LDAP Integration (90 seconds)

### Visual
- Configure LDAP connection
- Test LDAP authentication
- Map LDAP groups to roles

### Narration
> "Enterprise organizations should integrate with LDAP or Active Directory for centralized user management. This allows single sign-on and automatic user provisioning. Let's configure LDAP integration.

> Enter your LDAP server details, bind credentials, and base DN. Configure group mapping to automatically assign roles based on LDAP group membership. Test the connection to verify configuration."

### On-Screen Actions
1. Click "LDAP Integration" tab
2. Click "Enable LDAP" toggle
3. Fill LDAP configuration:
   - Server: ldap://ldap.example.com:389
   - Bind DN: cn=admin,dc=example,dc=com
   - Bind Password: ********
   - Base DN: dc=example,dc=com
   - User Filter: (objectClass=person)
   - Group Filter: (objectClass=groupOfNames)
4. Configure group mapping:
   - cn=admins,ou=groups → Administrator role
   - cn=operators,ou=groups → Operator role
   - cn=analysts,ou=groups → Analyst role
5. Click "Test Connection"
6. Show success: "Connected to LDAP server"
7. Click "Test Authentication" with sample user
8. Show: "User 'john.doe' authenticated successfully"
9. Click "Save LDAP Configuration"

### LDAP Configuration Example
```yaml
ldap:
  server: ldap://ldap.example.com:389
  bind_dn: cn=admin,dc=example,dc=com
  base_dn: dc=example,dc=com
  user_filter: (&(objectClass=person)(uid={username}))
  group_membership: memberOf

  group_mapping:
    "cn=admins,ou=groups,dc=example,dc=com": Administrator
    "cn=operators,ou=groups,dc=example,dc=com": Operator
    "cn=analysts,ou=groups,dc=example,dc=com": Analyst
```

### On-Screen Text
- "Centralize user management"
- "Test thoroughly before enabling"
- "Keep local admin account for emergencies"

---

## Scene 9: OAuth 2.0 / SSO Configuration (90 seconds)

### Visual
- Configure OAuth provider
- Test OAuth login flow
- Map OAuth claims to roles

### Narration
> "OAuth 2.0 enables single sign-on with providers like Google Workspace, Microsoft Azure AD, or Okta. Users log in once with their corporate credentials and access all integrated applications seamlessly.

> Configure your OAuth provider's client ID, secret, and authorization endpoints. Map OAuth claims to user attributes and roles. Let's set up Google Workspace integration."

### On-Screen Actions
1. Click "OAuth 2.0 / SSO" tab
2. Click "Add OAuth Provider"
3. Select provider: "Google Workspace"
4. Fill OAuth configuration:
   - Client ID: xxxxxxxxxxxx.apps.googleusercontent.com
   - Client Secret: ********
   - Authorized Domain: example.com
5. Configure claim mapping:
   - Email: email
   - Name: name
   - Role: hd (domain) mapping
6. Set role mapping:
   - example.com domain → Operator role
   - admin.example.com → Administrator role
7. Click "Save OAuth Configuration"
8. Click "Test OAuth Flow"
9. Redirect to Google login (simulated)
10. Show successful OAuth login
11. Display user profile with mapped role

### OAuth Flow Diagram
```
User clicks "Login with Google"
        ↓
Redirect to Google OAuth
        ↓
User authenticates with Google
        ↓
Google redirects with auth code
        ↓
Dashboard exchanges code for token
        ↓
Retrieve user profile from Google
        ↓
Map claims to KumoMTA roles
        ↓
Create session, log user in
```

### On-Screen Text
- "SSO improves user experience"
- "Reduces password fatigue"
- "Centralizes access revocation"

---

## Scene 10: Security Best Practices (120 seconds)

### Visual
- Show security checklist
- Highlight recommendations
- Display security score

### Narration
> "Let's review security best practices. The security dashboard shows your security score and recommendations.

> **Use HTTPS only** - Never run the dashboard over HTTP in production. Configure TLS certificates and redirect HTTP to HTTPS.

> **Enable MFA** - Multi-factor authentication should be mandatory for all users, especially administrators.

> **Regular password rotation** - Enforce password changes every 90 days.

> **Least privilege** - Users should have only the minimum permissions needed.

> **Monitor audit logs** - Review logs weekly for suspicious activity.

> **Keep software updated** - Apply security patches promptly.

> **Network security** - Use firewalls to restrict dashboard access to authorized networks.

> **Backup access** - Maintain offline administrator credentials for emergency access."

### On-Screen Actions
1. Click "Security Dashboard" tab
2. Show security score: 75/100
3. Display recommendations:
   - ⚠️ HTTPS not enforced (-10 points)
   - ⚠️ MFA not enabled for all users (-10 points)
   - ⚠️ Password policy weak (-5 points)
   - ✓ Audit logging enabled
   - ✓ Session timeout configured
4. Click each recommendation to see fix
5. Show improved score after fixes: 95/100

### Security Checklist
```
✓ HTTPS/TLS configured
✓ MFA enabled for all users
✓ Strong password policy (12+ chars, complexity)
✓ Session timeout (30 minutes)
✓ Account lockout (5 failed attempts)
✓ Audit logging enabled
✓ Regular log reviews (weekly)
✓ RBAC implemented
✓ API token expiration (90 days)
✓ Firewall rules configured
✓ Security updates applied
✓ Backup admin account (offline)
✓ LDAP/OAuth integration (for enterprises)
✓ IP restrictions on API tokens
✓ Regular security audits (quarterly)
```

### On-Screen Text
- "Security is a continuous process"
- "Regular audits prevent breaches"
- "Defense in depth: multiple layers"

---

## Scene 11: Incident Response (90 seconds)

### Visual
- Simulate security incident
- Show response procedure
- Demonstrate account lockout and revocation

### Narration
> "Let's walk through responding to a security incident. Suppose you notice suspicious login attempts in the audit log - multiple failed logins from an unknown IP address targeting an admin account.

> First, lock the targeted account immediately. Click the user in the user management panel and select 'Lock Account'. This prevents any further access.

> Next, review the audit log to determine the scope. Filter by the affected user and suspicious IP. Check if any successful logins occurred.

> Revoke all active sessions for the compromised account. If API tokens were exposed, revoke them immediately.

> Force a password reset for the affected user. Enable MFA if not already configured.

> Finally, add the malicious IP to the firewall blocklist and document the incident for security review."

### On-Screen Actions
1. Show audit log with failed login attempts:
   - 23:45:12 - Login failed - user: admin - IP: 203.0.113.45
   - 23:45:23 - Login failed - user: admin - IP: 203.0.113.45
   - 23:45:34 - Login failed - user: admin - IP: 203.0.113.45
   (10 more failed attempts)
2. Click "User Management"
3. Find admin user
4. Click "Lock Account" button
5. Show confirmation: "Account locked"
6. Click "Revoke All Sessions" button
7. Navigate to API Tokens
8. Revoke admin's tokens
9. Click "Force Password Reset"
10. Add IP to blocklist: 203.0.113.45
11. Create incident report

### Incident Response Procedure
```
1. DETECT
   └─ Monitor audit logs
   └─ Automated alerts for anomalies
   └─ User reports

2. CONTAIN
   └─ Lock affected accounts
   └─ Revoke sessions/tokens
   └─ Block malicious IPs

3. INVESTIGATE
   └─ Review audit logs
   └─ Determine scope of breach
   └─ Identify affected data

4. REMEDIATE
   └─ Force password resets
   └─ Enable MFA
   └─ Patch vulnerabilities
   └─ Update security policies

5. DOCUMENT
   └─ Incident report
   └─ Timeline of events
   └─ Lessons learned

6. PREVENT
   └─ Implement recommended controls
   └─ Security awareness training
   └─ Regular security audits
```

### On-Screen Text
- "Speed matters in incident response"
- "Document everything"
- "Learn from incidents to improve"

---

## Scene 12: Compliance & Reporting (60 seconds)

### Visual
- Generate compliance reports
- Show audit summaries
- Export compliance data

### Narration
> "For organizations with compliance requirements like SOC 2, HIPAA, or GDPR, the dashboard provides compliance reporting. Generate reports showing authentication events, access patterns, configuration changes, and data exports. Schedule automated reports to be sent to your compliance team monthly."

### On-Screen Actions
1. Click "Compliance Reports" section
2. Select report type: "SOC 2 Access Control"
3. Set date range: Last 90 days
4. Click "Generate Report"
5. Show report preview:
   - User access summary
   - Failed login attempts
   - Role changes
   - Configuration modifications
6. Click "Export PDF"
7. Show downloaded report
8. Click "Schedule Report"
9. Configure: Monthly, send to compliance@example.com

### Compliance Reports Available
```
- SOC 2 Trust Principles
  * Access Control
  * Change Management
  * Monitoring & Logging

- HIPAA Security Rule
  * Access Management
  * Audit Controls
  * Integrity Controls

- GDPR Article 32
  * Data Access Logs
  * Security Measures
  * Breach Notification

- Custom Compliance
  * Configurable criteria
  * Custom templates
```

### On-Screen Text
- "Compliance requires evidence"
- "Automated reports save time"
- "Regular compliance reviews"

---

## Scene 13: Advanced Security Features (60 seconds)

### Visual
- Show IP allowlist/blocklist
- Configure rate limiting
- Enable security headers

### Narration
> "Additional security features include IP allowlisting and blocklisting, rate limiting to prevent brute force attacks, and security headers to protect against common web vulnerabilities. Let's configure these.

> Add your organization's IP ranges to the allowlist for an extra layer of protection. Configure rate limiting to allow maximum 5 login attempts per minute per IP. Enable security headers like Content Security Policy, X-Frame-Options, and HSTS."

### On-Screen Actions
1. Click "Advanced Security" tab
2. Configure IP Allowlist:
   - Add: 10.0.0.0/8 (internal network)
   - Add: 203.0.113.0/24 (office network)
3. Configure Rate Limiting:
   - Login attempts: 5 per minute per IP
   - API requests: 100 per minute per token
4. Enable Security Headers:
   - Content-Security-Policy: ✓
   - X-Frame-Options: DENY ✓
   - X-Content-Type-Options: nosniff ✓
   - Strict-Transport-Security: ✓
5. Click "Save Advanced Settings"

### Security Headers
```
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### On-Screen Text
- "Defense in depth strategy"
- "Multiple security layers"
- "Test thoroughly after enabling"

---

## Scene 14: Conclusion & Next Steps (45 seconds)

### Visual
- Show security dashboard with improved score
- Display security checklist

### Narration
> "You've now mastered security configuration for KumoMTA UI! You can configure authentication methods, enable MFA, implement role-based access control, manage API tokens, review audit logs, integrate with LDAP/OAuth, respond to incidents, and generate compliance reports.

> Remember: security is an ongoing process, not a one-time setup. Review security settings monthly, audit user access quarterly, and stay informed about security best practices.

> In the next tutorial, we'll explore Analytics & Monitoring for deep insights into your email delivery performance. Thanks for watching!"

### On-Screen Text
- "Next Tutorial: Analytics & Monitoring"
- "Security Resources:"
  - "🔒 Security Checklist: /docs/SECURITY_CHECKLIST.md"
  - "📋 Compliance Guide: /docs/COMPLIANCE.md"
  - "🚨 Incident Response: /docs/INCIDENT_RESPONSE.md"

### Call to Action
> "Ready to analyze your email performance? Watch Tutorial 4: Analytics & Monitoring!"

---

## Screenshots Needed

1. **Security Dashboard** - Overall security score and recommendations
2. **Authentication Settings** - All auth methods with status
3. **Password Policy** - Configuration form with all options
4. **MFA Enrollment** - QR code and backup codes screen
5. **Roles & Permissions** - RBAC matrix and custom role creation
6. **API Tokens** - Token list with permissions and expiration
7. **Audit Logs** - Filtered log view with entry details
8. **LDAP Configuration** - Full LDAP setup form
9. **OAuth Setup** - OAuth provider configuration
10. **Incident Response** - Locked account and blocked IP
11. **Compliance Report** - Generated PDF report preview
12. **Security Headers** - Advanced security settings

---

## Diagrams Required

### Authentication Flow
```
User → Login Page → Auth Method Selection
                         ↓
            ┌────────────┴────────────┐
            ↓                         ↓
    Local Auth                   LDAP/OAuth
            ↓                         ↓
    Password Check              External Auth
            ↓                         ↓
    MFA Challenge              Map Claims/Groups
            ↓                         ↓
    TOTP Verification           Assign Roles
            ↓                         ↓
            └────────────┬────────────┘
                         ↓
                  Create Session
                         ↓
                   Grant Access
```

### RBAC Hierarchy
```
                Administrator
                      │
        ┌─────────────┼─────────────┐
        │             │             │
    Operator      Analyst       Viewer
        │
    Support Engineer (Custom)
```

### Security Layers
```
┌───────────────────────────────────────────┐
│ Network Layer: Firewall, IP Filtering    │
├───────────────────────────────────────────┤
│ Transport Layer: HTTPS/TLS Encryption    │
├───────────────────────────────────────────┤
│ Application Layer: Security Headers      │
├───────────────────────────────────────────┤
│ Authentication: MFA, SSO, LDAP           │
├───────────────────────────────────────────┤
│ Authorization: RBAC, API Tokens          │
├───────────────────────────────────────────┤
│ Audit Layer: Logging, Monitoring         │
└───────────────────────────────────────────┘
```

---

## Interactive Elements

### Quiz Questions
1. **What is the recommended minimum password length?**
   - a) 8 characters
   - b) 10 characters
   - c) 12 characters ✓
   - d) 16 characters

2. **How much does MFA reduce the risk of account compromise?**
   - a) 50%
   - b) 75%
   - c) 90%
   - d) 99.9% ✓

3. **What principle should guide role assignment?**
   - a) Maximum access
   - b) Least privilege ✓
   - c) Equal access
   - d) Role-based

4. **How often should API tokens be rotated?**
   - a) 30 days
   - b) 60 days
   - c) 90 days ✓
   - d) Never

5. **What's the first step when responding to a security incident?**
   - a) Document the incident
   - b) Contain the threat ✓
   - c) Notify users
   - d) Run a security scan

---

## Production Notes

### Camera Movements
- Slow zoom for security warnings
- Highlight critical settings with glow effect
- Use screen shake for security alerts
- Smooth transitions between sections

### Audio
- Serious, authoritative voice-over
- Minimal background music for focus
- Alert sounds for security warnings
- Click sounds for confirmations

### Graphics
- Red highlights for security risks
- Green checkmarks for secure configurations
- Animated shield icon for security features
- Lock/unlock animations for account actions

### Accessibility
- Closed captions with security terminology
- Audio descriptions for visual security indicators
- High contrast for critical information
- Screen reader-friendly security alerts
