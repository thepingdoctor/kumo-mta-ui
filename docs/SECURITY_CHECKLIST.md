# KumoMTA UI Security Checklist

This comprehensive security checklist ensures your KumoMTA UI deployment is properly hardened and secure.

## Table of Contents

- [Pre-Deployment Checks](#pre-deployment-checks)
- [Deployment Security](#deployment-security)
- [Post-Deployment Verification](#post-deployment-verification)
- [Regular Security Audits](#regular-security-audits)
- [Incident Response](#incident-response)

---

## Pre-Deployment Checks

### 1. Environment Configuration

- [ ] All `.env` files have permissions set to `600` (owner read/write only)
- [ ] No sensitive data hardcoded in source code
- [ ] Environment variables use strong, randomly generated secrets
- [ ] `SESSION_SECRET` is at least 64 characters
- [ ] `CSRF_SECRET` is at least 64 characters
- [ ] `JWT_SECRET` is at least 64 characters
- [ ] Default passwords have been changed
- [ ] Database credentials are unique and strong

### 2. Code Security

- [ ] All user inputs are validated and sanitized
- [ ] XSS protection implemented on all user-facing inputs
- [ ] CSRF tokens implemented for state-changing operations
- [ ] SQL injection prevention (parameterized queries only)
- [ ] No `eval()` or `Function()` constructor usage
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] Authentication tokens stored securely (httpOnly cookies or secure storage)
- [ ] Sensitive data not logged to console or files

### 3. Dependencies

- [ ] All dependencies updated to latest secure versions
- [ ] `npm audit` or `yarn audit` shows no high/critical vulnerabilities
- [ ] No unused dependencies in `package.json`
- [ ] Package-lock file committed to version control
- [ ] Dependencies from trusted sources only

### 4. Build Configuration

- [ ] Production build removes all debug code
- [ ] Source maps disabled in production
- [ ] Console logs removed from production build
- [ ] React DevTools disabled in production
- [ ] Environment variables properly injected at build time

---

## Deployment Security

### 1. SSL/TLS Configuration

- [ ] Valid SSL certificate installed (not self-signed for production)
- [ ] Certificate chain properly configured
- [ ] Private keys have permissions `600`
- [ ] Private keys stored in `/etc/ssl/private/`
- [ ] TLS 1.2 and 1.3 only (no TLS 1.0 or 1.1)
- [ ] Strong cipher suites configured
- [ ] OCSP stapling enabled
- [ ] Certificate auto-renewal configured (Let's Encrypt)
- [ ] HTTP to HTTPS redirect enabled

**Verification Command:**
```bash
openssl s_client -connect your-domain.com:443 -tls1_2
```

### 2. Web Server (Nginx)

- [ ] Server version hiding enabled (`server_tokens off`)
- [ ] Security headers configured (see section below)
- [ ] Rate limiting enabled for API endpoints
- [ ] Connection limits configured
- [ ] Request size limits configured
- [ ] Timeout values properly set
- [ ] Gzip compression enabled
- [ ] Static asset caching configured
- [ ] Directory listing disabled
- [ ] Hidden files (.git, .env) blocked

#### Required Security Headers

- [ ] `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- [ ] `X-Frame-Options: DENY`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Content-Security-Policy` configured (see CSP section)
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy` configured

**Verification Command:**
```bash
curl -I https://your-domain.com | grep -E "(Strict-Transport|X-Frame|X-Content|X-XSS|Content-Security)"
```

### 3. Content Security Policy (CSP)

- [ ] `default-src 'self'` - Only allow resources from same origin
- [ ] `script-src` properly configured (avoid 'unsafe-inline' in production)
- [ ] `style-src` properly configured
- [ ] `img-src` limited to trusted sources
- [ ] `connect-src` limited to API endpoints
- [ ] `frame-ancestors 'none'` - Prevent clickjacking
- [ ] `base-uri 'self'` - Prevent base tag injection
- [ ] `form-action 'self'` - Restrict form submissions
- [ ] Report-URI configured for CSP violations (optional)

**Example CSP:**
```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.kumomta.example.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```

### 4. Firewall (UFW)

- [ ] UFW enabled and active
- [ ] Default incoming policy set to `deny`
- [ ] Default outgoing policy set to `allow`
- [ ] SSH port (22) restricted to trusted IPs only
- [ ] HTTP port (80) open for redirect only
- [ ] HTTPS port (443) open
- [ ] SMTP ports configured if needed (25, 587, 465)
- [ ] Unnecessary ports closed
- [ ] IPv6 rules configured if using IPv6

**Verification Command:**
```bash
sudo ufw status verbose
```

### 5. Fail2ban

- [ ] Fail2ban installed and running
- [ ] Custom jail for KumoMTA UI configured
- [ ] Authentication failure detection enabled
- [ ] DoS attack detection enabled
- [ ] Ban time appropriately configured (default: 1 hour)
- [ ] Max retry attempts configured (default: 5)
- [ ] Email notifications configured (optional)
- [ ] Log monitoring active

**Verification Command:**
```bash
sudo fail2ban-client status kumomta-ui-auth
```

### 6. System Security

- [ ] System packages updated
- [ ] Automatic security updates enabled
- [ ] Unnecessary services disabled
- [ ] SSH key authentication enabled
- [ ] SSH password authentication disabled
- [ ] SSH root login disabled
- [ ] Kernel security parameters configured (`/etc/sysctl.conf`)
- [ ] File system permissions properly set
- [ ] Audit logging enabled (optional)

---

## Post-Deployment Verification

### 1. Security Scan

Run the automated security audit:
```bash
sudo ./scripts/security-audit.sh
```

**Expected Results:**
- Score > 80%
- 0 critical issues
- 0 high-severity issues

### 2. SSL/TLS Verification

Test SSL configuration:
```bash
# Online testing
https://www.ssllabs.com/ssltest/

# Command line
testssl.sh your-domain.com
```

**Target Grade:** A or A+

### 3. Security Headers Verification

Test security headers:
```bash
# Online testing
https://securityheaders.com/

# Command line
curl -I https://your-domain.com
```

**Target Grade:** A or A+

### 4. Penetration Testing

- [ ] XSS testing completed (automated + manual)
- [ ] CSRF testing completed
- [ ] SQL injection testing completed
- [ ] Authentication bypass testing completed
- [ ] Authorization bypass testing completed
- [ ] Session management testing completed
- [ ] File upload testing completed (if applicable)
- [ ] API security testing completed

**Recommended Tools:**
- OWASP ZAP
- Burp Suite Community Edition
- Nikto
- SQLmap

### 5. Application Testing

- [ ] Login with valid credentials works
- [ ] Login with invalid credentials fails properly
- [ ] Session timeout works correctly
- [ ] Logout clears session properly
- [ ] CSRF tokens validated on forms
- [ ] API endpoints require authentication
- [ ] Rate limiting prevents abuse
- [ ] Error messages don't leak sensitive information

### 6. Monitoring Setup

- [ ] Log aggregation configured (optional)
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Uptime monitoring configured
- [ ] SSL certificate expiration monitoring
- [ ] Disk space monitoring
- [ ] Failed login attempt monitoring
- [ ] Alert notifications configured

---

## Regular Security Audits

### Daily Tasks

- [ ] Review failed login attempts
- [ ] Check Fail2ban logs for blocked IPs
- [ ] Monitor system resource usage
- [ ] Review application error logs

**Commands:**
```bash
# Check fail2ban
sudo fail2ban-client status

# Recent authentication failures
sudo grep "401\|403" /var/log/nginx/access.log | tail -20

# System resources
htop
df -h
```

### Weekly Tasks

- [ ] Review all security logs
- [ ] Check for system updates
- [ ] Review firewall logs
- [ ] Verify backup integrity
- [ ] Check SSL certificate expiration
- [ ] Review user access logs

**Commands:**
```bash
# System updates
sudo apt update && apt list --upgradable

# SSL certificate expiry
echo | openssl s_client -servername your-domain.com -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates
```

### Monthly Tasks

- [ ] Full security audit (`./scripts/security-audit.sh`)
- [ ] Dependency vulnerability scan (`npm audit`)
- [ ] Review and update access controls
- [ ] Review and rotate secrets/keys
- [ ] Test backup restoration
- [ ] Review incident response procedures
- [ ] Update security documentation
- [ ] Penetration testing (automated)

### Quarterly Tasks

- [ ] Comprehensive penetration testing
- [ ] Security training for team
- [ ] Disaster recovery drill
- [ ] Third-party security audit (recommended)
- [ ] Review and update security policies
- [ ] Rotate SSL certificates (if not auto-renewed)
- [ ] Review compliance requirements

---

## Incident Response

### Preparation

- [ ] Incident response team identified
- [ ] Contact information documented
- [ ] Escalation procedures defined
- [ ] Communication templates prepared
- [ ] Backup and recovery procedures tested
- [ ] Forensics tools available

### Detection

**Signs of Security Incident:**
- Unusual login attempts or patterns
- Unexpected system resource usage
- Unauthorized file modifications
- Unusual network traffic
- Failed authentication spikes
- Database query anomalies
- Application errors or crashes

**Monitoring Commands:**
```bash
# Real-time access log monitoring
sudo tail -f /var/log/nginx/access.log | grep "401\|403\|500"

# Failed SSH attempts
sudo grep "Failed password" /var/log/auth.log | tail -20

# Current connections
sudo netstat -tupn | grep ESTABLISHED
```

### Response Procedure

#### 1. Immediate Actions (< 15 minutes)

- [ ] Isolate affected systems (if compromise confirmed)
- [ ] Preserve logs and evidence
- [ ] Document timeline of events
- [ ] Notify incident response team
- [ ] Disable compromised accounts

**Emergency Commands:**
```bash
# Block specific IP immediately
sudo ufw deny from <IP_ADDRESS>

# Disable user account
sudo usermod -L <username>

# Kill suspicious processes
sudo kill -9 <PID>
```

#### 2. Containment (< 1 hour)

- [ ] Identify scope of incident
- [ ] Block malicious IPs/networks
- [ ] Revoke compromised credentials
- [ ] Enable additional logging
- [ ] Create system snapshot/backup
- [ ] Isolate affected services

#### 3. Investigation (< 4 hours)

- [ ] Analyze logs for attack vector
- [ ] Identify compromised data
- [ ] Determine attacker access level
- [ ] Document all findings
- [ ] Preserve forensic evidence
- [ ] Notify stakeholders (if required)

#### 4. Eradication (< 8 hours)

- [ ] Remove malware/backdoors
- [ ] Close security vulnerabilities
- [ ] Patch exploited systems
- [ ] Reset all credentials
- [ ] Rebuild compromised systems (if necessary)
- [ ] Verify system integrity

#### 5. Recovery (< 24 hours)

- [ ] Restore from clean backups
- [ ] Verify system functionality
- [ ] Monitor for re-compromise
- [ ] Gradually restore services
- [ ] Update security measures
- [ ] Document lessons learned

#### 6. Post-Incident (< 1 week)

- [ ] Complete incident report
- [ ] Update security procedures
- [ ] Implement preventive measures
- [ ] Team debrief and training
- [ ] Notify affected parties (if applicable)
- [ ] Review and update response plan

### Contact Information

**Internal Contacts:**
- Security Team Lead: _________________
- System Administrator: _________________
- Development Lead: _________________
- Management: _________________

**External Contacts:**
- Hosting Provider: _________________
- Security Consultant: _________________
- Legal Counsel: _________________
- Law Enforcement: _________________

### Evidence Collection

**Critical Data to Preserve:**
- System logs (`/var/log/`)
- Application logs
- Network traffic captures
- Memory dumps (if needed)
- Database logs
- Firewall logs
- Modified files list

**Collection Commands:**
```bash
# Create incident evidence directory
sudo mkdir -p /var/evidence/incident-$(date +%Y%m%d-%H%M%S)
cd /var/evidence/incident-$(date +%Y%m%d-%H%M%S)

# Collect logs
sudo cp -r /var/log/nginx ./nginx-logs
sudo cp -r /var/log/auth.log ./auth.log
sudo journalctl > systemd.log

# Network connections
sudo netstat -tupn > network-connections.txt
sudo ss -tupn > socket-stats.txt

# System info
uname -a > system-info.txt
ps auxf > process-list.txt
dpkg -l > installed-packages.txt
```

---

## Security Tools Reference

### Essential Tools

1. **Security Audit:**
   ```bash
   ./scripts/security-audit.sh
   ```

2. **Hardening:**
   ```bash
   sudo ./scripts/security-hardening.sh
   ```

3. **IP Management:**
   ```bash
   sudo ./scripts/manage-ip-whitelist.sh
   ```

4. **SSL Testing:**
   ```bash
   testssl.sh your-domain.com
   ```

5. **Dependency Audit:**
   ```bash
   npm audit
   npm audit fix
   ```

### Recommended External Tools

- **SSL Testing:** https://www.ssllabs.com/ssltest/
- **Security Headers:** https://securityheaders.com/
- **OWASP ZAP:** https://www.zaproxy.org/
- **Mozilla Observatory:** https://observatory.mozilla.org/
- **Qualys SSL Labs:** https://www.ssllabs.com/ssltest/

---

## Compliance Considerations

### GDPR (EU)

- [ ] User data minimization
- [ ] Encryption at rest and in transit
- [ ] Right to erasure implemented
- [ ] Data breach notification procedures
- [ ] Privacy policy updated

### HIPAA (Healthcare)

- [ ] PHI encryption
- [ ] Access controls and audit logs
- [ ] Breach notification procedures
- [ ] Business associate agreements

### PCI DSS (Payment Cards)

- [ ] Cardholder data encryption
- [ ] Network segmentation
- [ ] Access control measures
- [ ] Regular security testing
- [ ] Vendor management

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CIS Security Benchmarks](https://www.cisecurity.org/cis-benchmarks/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [Mozilla Web Security Guidelines](https://infosec.mozilla.org/guidelines/web_security)

---

**Last Updated:** 2025-10-25
**Version:** 1.0
**Maintained By:** Security Team
