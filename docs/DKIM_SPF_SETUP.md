# DKIM and SPF Setup Guide for KumoMTA

Complete guide for implementing DKIM (DomainKeys Identified Mail) and SPF (Sender Policy Framework) to improve email deliverability and prevent spoofing.

## Table of Contents

- [Overview](#overview)
- [Why DKIM and SPF Matter](#why-dkim-and-spf-matter)
- [DKIM Setup](#dkim-setup)
- [SPF Setup](#spf-setup)
- [DMARC Setup](#dmarc-setup)
- [Testing and Verification](#testing-and-verification)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Overview

### What is DKIM?

**DKIM (DomainKeys Identified Mail)** adds a digital signature to email headers, allowing receiving servers to verify:
- The email came from your domain
- The email content wasn't modified in transit

### What is SPF?

**SPF (Sender Policy Framework)** specifies which mail servers are authorized to send email on behalf of your domain.

### What is DMARC?

**DMARC (Domain-based Message Authentication, Reporting & Conformance)** builds on SPF and DKIM to:
- Tell receivers what to do with failed authentication
- Provide reports on email authentication results

---

## Why DKIM and SPF Matter

### Benefits

✅ **Improved Deliverability**
- Reduces spam classification
- Increases inbox placement rate
- Builds domain reputation

✅ **Brand Protection**
- Prevents email spoofing
- Protects recipients from phishing
- Maintains trust in your communications

✅ **Compliance**
- Required by major email providers (Gmail, Yahoo, etc.)
- Meets industry standards (RFC 6376, RFC 7208)

### Consequences of Not Having DKIM/SPF

❌ Emails marked as spam
❌ Emails rejected by receiving servers
❌ Poor sender reputation
❌ Domain used for spoofing attacks
❌ Failed email delivery to major providers

---

## DKIM Setup

### Step 1: Generate DKIM Keys

```bash
# Install OpenDKIM tools
sudo apt update
sudo apt install opendkim opendkim-tools -y

# Create DKIM directory
sudo mkdir -p /etc/kumomta/dkim
cd /etc/kumomta/dkim

# Generate 2048-bit RSA key pair
sudo opendkim-genkey -D /etc/kumomta/dkim/ \
  -d your-domain.com \
  -s default \
  -b 2048

# This creates two files:
# - default.private (private key - keep secret!)
# - default.txt (public key - for DNS)

# Set correct permissions
sudo chown kumomta:kumomta /etc/kumomta/dkim/default.private
sudo chmod 600 /etc/kumomta/dkim/default.private
sudo chmod 644 /etc/kumomta/dkim/default.txt
```

**Verify key generation:**
```bash
# View private key
sudo cat /etc/kumomta/dkim/default.private

# View public key (for DNS)
sudo cat /etc/kumomta/dkim/default.txt
```

### Step 2: Configure KumoMTA for DKIM Signing

Edit your KumoMTA configuration (typically `/opt/kumomta/etc/policy/init.lua`):

```lua
-- DKIM Configuration
local dkim_signer = kumo.dkim.rsa_sha256_signer {
  domain = 'your-domain.com',
  selector = 'default',
  headers = {'From', 'To', 'Subject', 'Date', 'Message-ID'},

  -- Path to private key
  key = {
    key_data = io.open('/etc/kumomta/dkim/default.private'):read('*a'),
  },
}

-- Sign outbound messages
kumo.on('smtp_server_message_received', function(msg)
  msg:dkim_sign(dkim_signer)
end)
```

**Alternative: Multiple domains/selectors:**

```lua
-- Multi-domain DKIM configuration
local dkim_signers = {
  ['domain1.com'] = kumo.dkim.rsa_sha256_signer {
    domain = 'domain1.com',
    selector = 'mail',
    headers = {'From', 'To', 'Subject'},
    key = { key_data = io.open('/etc/kumomta/dkim/domain1.private'):read('*a') },
  },
  ['domain2.com'] = kumo.dkim.rsa_sha256_signer {
    domain = 'domain2.com',
    selector = 'default',
    headers = {'From', 'To', 'Subject'},
    key = { key_data = io.open('/etc/kumomta/dkim/domain2.private'):read('*a') },
  },
}

kumo.on('smtp_server_message_received', function(msg)
  local from_domain = msg:get_first_named_header_value('From'):match('@(.+)>?$')
  local signer = dkim_signers[from_domain]

  if signer then
    msg:dkim_sign(signer)
  end
end)
```

### Step 3: Add DKIM DNS Record

Extract the public key from the generated file:

```bash
sudo cat /etc/kumomta/dkim/default.txt
```

**Example output:**
```
default._domainkey	IN	TXT	( "v=DKIM1; h=sha256; k=rsa; "
	"p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..." )
```

**Create DNS TXT record:**

| Record Type | Name | Value |
|------------|------|-------|
| TXT | `default._domainkey.your-domain.com` | `v=DKIM1; h=sha256; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...` |

**DNS Configuration Examples:**

**Cloudflare:**
```
Type: TXT
Name: default._domainkey
Content: v=DKIM1; h=sha256; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
TTL: Auto
```

**Route53 (AWS):**
```
Name: default._domainkey.your-domain.com.
Type: TXT
Value: "v=DKIM1; h=sha256; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..."
TTL: 3600
```

**cPanel/WHM:**
```
Name: default._domainkey.your-domain.com.
Type: TXT
Record: v=DKIM1; h=sha256; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
```

**Important Notes:**
- Remove line breaks and quotation marks from the public key
- The full value should be on one line
- Some DNS providers require quotes, others don't
- DNS propagation can take up to 48 hours (usually much faster)

### Step 4: Verify DKIM DNS Record

```bash
# Query DKIM record
dig default._domainkey.your-domain.com TXT +short

# Or using host command
host -t TXT default._domainkey.your-domain.com

# Or using nslookup
nslookup -type=TXT default._domainkey.your-domain.com
```

**Expected output:**
```
"v=DKIM1; h=sha256; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..."
```

### Step 5: Restart KumoMTA

```bash
sudo systemctl restart kumomta
sudo systemctl status kumomta
```

---

## SPF Setup

### Step 1: Identify Mail Servers

List all servers/services that send email for your domain:

- [ ] Your KumoMTA server IP(s)
- [ ] Third-party services (SendGrid, Mailchimp, etc.)
- [ ] Office 365 / Google Workspace
- [ ] Other email servers

### Step 2: Create SPF Record

**Basic SPF record structure:**
```
v=spf1 [mechanisms] [qualifier]
```

**Common mechanisms:**
- `ip4:192.0.2.1` - Allow specific IPv4 address
- `ip6:2001:db8::1` - Allow specific IPv6 address
- `a` - Allow domain's A record
- `mx` - Allow domain's MX records
- `include:_spf.google.com` - Include another domain's SPF
- `~all` - Soft fail for all others
- `-all` - Hard fail for all others

**Example SPF records:**

**Simple (single server):**
```
v=spf1 ip4:203.0.113.10 -all
```

**Multiple IPs:**
```
v=spf1 ip4:203.0.113.10 ip4:203.0.113.11 ip4:203.0.113.12 -all
```

**With third-party services:**
```
v=spf1 ip4:203.0.113.10 include:_spf.google.com include:sendgrid.net -all
```

**Recommended for KumoMTA:**
```
v=spf1 ip4:YOUR_SERVER_IP a mx ~all
```

### Step 3: Add SPF DNS Record

| Record Type | Name | Value |
|------------|------|-------|
| TXT | `@` (or your-domain.com) | `v=spf1 ip4:YOUR_SERVER_IP a mx ~all` |

**DNS Provider Examples:**

**Cloudflare:**
```
Type: TXT
Name: @
Content: v=spf1 ip4:203.0.113.10 a mx ~all
TTL: Auto
```

**Route53 (AWS):**
```
Name: your-domain.com.
Type: TXT
Value: "v=spf1 ip4:203.0.113.10 a mx ~all"
TTL: 3600
```

### Step 4: Verify SPF Record

```bash
# Query SPF record
dig your-domain.com TXT +short | grep "v=spf1"

# Or using host
host -t TXT your-domain.com | grep "v=spf1"

# Online checker
# Visit: https://mxtoolbox.com/spf.aspx
```

### Important SPF Notes

⚠️ **SPF Limitations:**
- Maximum 10 DNS lookups (includes, a, mx)
- Only one SPF record per domain
- Maximum 512 characters

⚠️ **SPF Qualifiers:**
- `+` (pass) - Default if not specified
- `-` (fail) - Reject email
- `~` (softfail) - Accept but mark (recommended for testing)
- `?` (neutral) - No policy

---

## DMARC Setup

DMARC builds on SPF and DKIM to provide policy and reporting.

### Step 1: Create DMARC Record

**Basic DMARC structure:**
```
v=DMARC1; p=policy; rua=mailto:email
```

**DMARC policies:**
- `none` - Monitor only, don't reject (recommended for initial setup)
- `quarantine` - Mark as spam if failed
- `reject` - Reject if failed

**Recommended DMARC records:**

**Phase 1 - Monitoring (start here):**
```
v=DMARC1; p=none; rua=mailto:dmarc@your-domain.com; ruf=mailto:dmarc@your-domain.com; sp=none; ri=86400
```

**Phase 2 - Quarantine (after successful monitoring):**
```
v=DMARC1; p=quarantine; pct=10; rua=mailto:dmarc@your-domain.com; sp=quarantine; adkim=r; aspf=r
```

**Phase 3 - Reject (production):**
```
v=DMARC1; p=reject; rua=mailto:dmarc@your-domain.com; ruf=mailto:dmarc@your-domain.com; sp=reject; adkim=s; aspf=s
```

**DMARC tags explained:**
- `v=DMARC1` - Version (required)
- `p=` - Policy for domain (none/quarantine/reject)
- `sp=` - Policy for subdomains
- `rua=` - Aggregate report email
- `ruf=` - Forensic report email
- `pct=` - Percentage of email to filter (default: 100)
- `adkim=` - DKIM alignment (r=relaxed, s=strict)
- `aspf=` - SPF alignment (r=relaxed, s=strict)
- `ri=` - Report interval in seconds (default: 86400 = 24h)

### Step 2: Add DMARC DNS Record

| Record Type | Name | Value |
|------------|------|-------|
| TXT | `_dmarc.your-domain.com` | `v=DMARC1; p=none; rua=mailto:dmarc@your-domain.com` |

### Step 3: Verify DMARC Record

```bash
# Query DMARC record
dig _dmarc.your-domain.com TXT +short

# Expected output
"v=DMARC1; p=none; rua=mailto:dmarc@your-domain.com"
```

### Step 4: Monitor DMARC Reports

DMARC reports are sent to the email specified in `rua=` (aggregate) and `ruf=` (forensic).

**Report analyzers:**
- [DMARC Analyzer](https://www.dmarcanalyzer.com/)
- [Postmark DMARC Tools](https://dmarc.postmarkapp.com/)
- [MxToolbox DMARC](https://mxtoolbox.com/dmarc.aspx)

---

## Testing and Verification

### 1. Send Test Email

```bash
# Send test email
echo "Test email body" | mail -s "DKIM/SPF Test" test@gmail.com
```

### 2. Check Email Headers

In Gmail:
1. Open the test email
2. Click the three dots (⋮)
3. Select "Show original"
4. Look for:
   - `DKIM-Signature:` header
   - `Authentication-Results:` header

**Expected headers:**
```
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;
  d=your-domain.com; s=default;
  h=from:to:subject:date:message-id;
  bh=...;
  b=...

Authentication-Results: mx.google.com;
  dkim=pass header.i=@your-domain.com header.s=default header.b=...;
  spf=pass (google.com: domain of sender@your-domain.com designates ... as permitted sender) smtp.mailfrom=sender@your-domain.com;
  dmarc=pass (p=NONE sp=NONE dis=NONE) header.from=your-domain.com
```

### 3. Online Testing Tools

**DKIM Validator:**
```
https://dkimvalidator.com/
1. Send email to the provided address
2. Check results page
```

**Mail Tester:**
```
https://www.mail-tester.com/
1. Send email to the provided address
2. View comprehensive report
```

**MXToolbox Suite:**
```
https://mxtoolbox.com/
- SPF Record Lookup
- DKIM Record Lookup
- DMARC Record Lookup
- Email Health Check
```

### 4. Command Line Testing

**Test DKIM selector:**
```bash
# Check if DKIM record exists
dig default._domainkey.your-domain.com TXT +short

# Verify key format
echo "v=DKIM1; h=sha256; k=rsa; p=..." | grep -o 'p=[^"]*'
```

**Test SPF:**
```bash
# Check SPF record
dig your-domain.com TXT +short | grep spf1

# Test SPF with specific IP
# Visit: https://www.kitterman.com/spf/validate.html
```

**Test DMARC:**
```bash
# Check DMARC record
dig _dmarc.your-domain.com TXT +short
```

---

## Troubleshooting

### DKIM Issues

**Problem: DKIM signature fails**

**Check 1:** Verify DNS record
```bash
dig default._domainkey.your-domain.com TXT +short
```

**Check 2:** Verify private key permissions
```bash
ls -l /etc/kumomta/dkim/default.private
# Should show: -rw------- (600)
```

**Check 3:** Check KumoMTA logs
```bash
sudo journalctl -u kumomta -f | grep -i dkim
```

**Check 4:** Verify selector matches
- DNS record name: `default._domainkey.your-domain.com`
- Config selector: `selector = 'default'`
- Must match exactly

**Problem: "DKIM signature header b= does not verify"**

**Solution:**
- Public/private key mismatch
- Regenerate keys and update DNS
- Wait for DNS propagation (up to 48 hours)

### SPF Issues

**Problem: SPF fails for legitimate mail**

**Check 1:** Verify sending IP is in SPF record
```bash
dig your-domain.com TXT +short | grep spf1
```

**Check 2:** Count DNS lookups
```bash
# Use SPF query tool
# Visit: https://www.kitterman.com/spf/validate.html
```
Maximum 10 lookups allowed.

**Check 3:** Verify syntax
```bash
# Common errors:
# - Missing "v=spf1"
# - Missing "-all" or "~all"
# - Too many DNS lookups
# - Invalid IP format
```

**Problem: "SPF PermError"**

**Solution:**
- Too many DNS lookups (reduce includes)
- Syntax error in SPF record
- Multiple SPF records (only one allowed)

### DMARC Issues

**Problem: Not receiving DMARC reports**

**Check 1:** Verify report email exists
```bash
# Email in rua= must be valid and monitored
```

**Check 2:** Create report mailbox
```bash
# Create dmarc@your-domain.com
# Set up forwarding or monitoring
```

**Check 3:** Check spam folder
- DMARC reports often marked as spam
- Whitelist report senders

**Problem: "DMARC policy not enabled"**

**Solution:**
```bash
# Verify _dmarc record exists
dig _dmarc.your-domain.com TXT +short

# Should return something like:
# "v=DMARC1; p=none; rua=mailto:dmarc@your-domain.com"
```

---

## Best Practices

### DKIM Best Practices

✅ **DO:**
- Use 2048-bit keys (more secure than 1024-bit)
- Rotate keys annually
- Use descriptive selectors (e.g., `mail2025`)
- Sign important headers (From, To, Subject, Date)
- Keep private keys secure (600 permissions)
- Monitor DKIM failures

❌ **DON'T:**
- Use weak keys (< 1024-bit)
- Share private keys
- Commit keys to version control
- Use generic selectors without rotation plan

### SPF Best Practices

✅ **DO:**
- Start with `~all` (soft fail) for testing
- Move to `-all` (hard fail) for production
- Keep SPF record under 10 DNS lookups
- Document all authorized senders
- Review SPF monthly
- Use `ip4:` for specific servers

❌ **DON'T:**
- Use `+all` (allows anyone)
- Exceed 10 DNS lookups
- Forget to update when adding mail servers
- Use outdated IP addresses

### DMARC Best Practices

✅ **DO:**
- Start with `p=none` (monitor)
- Progress slowly: none → quarantine → reject
- Monitor reports regularly
- Set up dedicated reporting email
- Use percentage (`pct=`) for gradual rollout
- Review reports weekly

❌ **DON'T:**
- Jump directly to `p=reject`
- Ignore DMARC reports
- Use personal email for reports
- Skip monitoring phase

### Key Rotation Schedule

**DKIM Keys:**
- Rotate annually
- Generate new key
- Add new DNS record
- Update configuration
- Remove old DNS record after 48 hours

**Process:**
```bash
# 1. Generate new key with new selector
sudo opendkim-genkey -D /etc/kumomta/dkim/ \
  -d your-domain.com \
  -s mail2025 \
  -b 2048

# 2. Add new DNS record (mail2025._domainkey)
# 3. Update KumoMTA config to use new selector
# 4. Restart KumoMTA
# 5. Test thoroughly
# 6. Remove old DNS record after 48 hours
```

---

## Quick Reference

### DNS Records Summary

```
# DKIM
Type: TXT
Name: default._domainkey.your-domain.com
Value: v=DKIM1; h=sha256; k=rsa; p=MIIBIjAN...

# SPF
Type: TXT
Name: @
Value: v=spf1 ip4:YOUR_IP a mx ~all

# DMARC (Phase 1 - Monitoring)
Type: TXT
Name: _dmarc.your-domain.com
Value: v=DMARC1; p=none; rua=mailto:dmarc@your-domain.com
```

### Testing Commands

```bash
# Check DKIM
dig default._domainkey.your-domain.com TXT +short

# Check SPF
dig your-domain.com TXT +short | grep spf1

# Check DMARC
dig _dmarc.your-domain.com TXT +short

# Send test email
echo "Test" | mail -s "Auth Test" test@gmail.com
```

### Recommended Deployment Timeline

**Week 1-2: Setup and Monitoring**
- Generate DKIM keys
- Add DNS records
- Configure KumoMTA
- Set DMARC to `p=none`
- Monitor reports

**Week 3-4: Quarantine Testing**
- Review DMARC reports
- Fix any failures
- Update DMARC to `p=quarantine; pct=10`
- Gradually increase percentage

**Week 5+: Full Enforcement**
- Confirm 100% authentication
- Update DMARC to `p=reject`
- Continue monitoring

---

## Additional Resources

- [RFC 6376 - DKIM](https://tools.ietf.org/html/rfc6376)
- [RFC 7208 - SPF](https://tools.ietf.org/html/rfc7208)
- [RFC 7489 - DMARC](https://tools.ietf.org/html/rfc7489)
- [DMARC.org](https://dmarc.org/)
- [MXToolbox](https://mxtoolbox.com/)
- [Google Postmaster Tools](https://postmaster.google.com/)

---

**Last Updated:** 2025-10-25
**Version:** 1.0
**Maintained By:** Email Infrastructure Team
