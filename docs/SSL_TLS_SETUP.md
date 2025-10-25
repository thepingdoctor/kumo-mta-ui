# SSL/TLS Setup Guide for KumoMTA UI

Complete guide for setting up and maintaining secure SSL/TLS certificates for your KumoMTA UI deployment.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Certificate Options](#certificate-options)
- [Let's Encrypt (Recommended)](#lets-encrypt-recommended)
- [Self-Signed Certificates (Development)](#self-signed-certificates-development)
- [Commercial Certificates](#commercial-certificates)
- [Nginx SSL Configuration](#nginx-ssl-configuration)
- [Testing and Verification](#testing-and-verification)
- [Certificate Renewal](#certificate-renewal)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Overview

SSL/TLS certificates encrypt traffic between clients and your KumoMTA UI server, ensuring:

- **Confidentiality:** Data cannot be read by third parties
- **Integrity:** Data cannot be modified in transit
- **Authentication:** Clients can verify server identity

### Modern TLS Requirements

- ✅ **TLS 1.2** and **TLS 1.3** only
- ❌ **NO** TLS 1.0 or TLS 1.1 (deprecated)
- ✅ Strong cipher suites only
- ✅ Perfect Forward Secrecy (PFS)
- ✅ OCSP stapling

---

## Prerequisites

Before starting, ensure you have:

- [ ] Root or sudo access to the server
- [ ] Domain name pointing to your server's IP address
- [ ] Nginx installed and configured
- [ ] Port 80 (HTTP) accessible for Let's Encrypt validation
- [ ] Port 443 (HTTPS) accessible for secure traffic

**Verify DNS:**
```bash
dig your-domain.com +short
# Should return your server's IP address
```

**Verify ports:**
```bash
sudo netstat -tlnp | grep ':80\|:443'
```

---

## Certificate Options

### 1. Let's Encrypt (FREE) - **RECOMMENDED**

**Pros:**
- ✅ Free and automated
- ✅ Trusted by all browsers
- ✅ Auto-renewal
- ✅ Easy setup with Certbot

**Cons:**
- ⚠️ 90-day validity (requires auto-renewal)
- ⚠️ Rate limits (50 certs per week per domain)

**Best for:** Production deployments

### 2. Self-Signed Certificates (FREE)

**Pros:**
- ✅ No cost
- ✅ Works offline
- ✅ Quick setup

**Cons:**
- ❌ Browser warnings
- ❌ Not trusted by default
- ❌ Manual renewal

**Best for:** Development and testing only

### 3. Commercial Certificates ($$$)

**Pros:**
- ✅ Extended validation options
- ✅ Insurance/warranty
- ✅ Multi-year validity

**Cons:**
- ❌ Annual cost
- ❌ Manual renewal process

**Best for:** Enterprise deployments with specific requirements

---

## Let's Encrypt (Recommended)

### Installation

#### Ubuntu/Debian:
```bash
# Update system
sudo apt update

# Install Certbot
sudo apt install certbot python3-certbot-nginx -y
```

#### CentOS/RHEL:
```bash
# Enable EPEL repository
sudo yum install epel-release -y

# Install Certbot
sudo yum install certbot python3-certbot-nginx -y
```

### Obtaining a Certificate

#### Method 1: Automatic Nginx Configuration (Easiest)

```bash
# Obtain and configure certificate automatically
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow prompts:
# - Enter email address
# - Agree to Terms of Service
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

#### Method 2: Certificate Only (Manual Nginx Config)

```bash
# Obtain certificate without modifying Nginx config
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com
```

Certificates will be saved to:
```
Certificate: /etc/letsencrypt/live/your-domain.com/fullchain.pem
Private Key: /etc/letsencrypt/live/your-domain.com/privkey.pem
```

#### Method 3: Webroot Plugin

```bash
# Create webroot directory
sudo mkdir -p /var/www/certbot

# Update Nginx to serve .well-known directory
# (Add to server block)
location /.well-known/acme-challenge/ {
    root /var/www/certbot;
}

# Reload Nginx
sudo nginx -t && sudo nginx -s reload

# Obtain certificate
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d your-domain.com \
  -d www.your-domain.com
```

### Automatic Renewal

Let's Encrypt certificates expire after 90 days. Set up automatic renewal:

```bash
# Test renewal process (dry run)
sudo certbot renew --dry-run

# Certbot automatically creates a systemd timer for renewal
# Verify it's enabled
sudo systemctl status certbot.timer

# If not enabled, enable it
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

**Manual renewal test:**
```bash
# Force renewal (even if not due)
sudo certbot renew --force-renewal
```

### Post-Installation Hook

Create a hook to reload Nginx after renewal:

```bash
sudo nano /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

Add:
```bash
#!/bin/bash
nginx -t && systemctl reload nginx
```

Make executable:
```bash
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

---

## Self-Signed Certificates (Development)

**⚠️ WARNING:** Self-signed certificates will show browser warnings. Use only for development!

### Generate Self-Signed Certificate

```bash
# Create directory
sudo mkdir -p /etc/ssl/private

# Generate certificate (valid for 365 days)
sudo openssl req -x509 -nodes -days 365 -newkey rsa:4096 \
  -keyout /etc/ssl/private/kumomta-selfsigned.key \
  -out /etc/ssl/certs/kumomta-selfsigned.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=kumomta.local"

# Set permissions
sudo chmod 600 /etc/ssl/private/kumomta-selfsigned.key
sudo chmod 644 /etc/ssl/certs/kumomta-selfsigned.crt
```

### Generate with Subject Alternative Names (SAN)

For multiple domains/IPs:

```bash
# Create OpenSSL config
cat > /tmp/san.cnf << EOF
[req]
default_bits = 4096
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=US
ST=State
L=City
O=Organization
CN=kumomta.local

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = kumomta.local
DNS.2 = www.kumomta.local
DNS.3 = localhost
IP.1 = 127.0.0.1
IP.2 = 192.168.1.100
EOF

# Generate certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:4096 \
  -keyout /etc/ssl/private/kumomta-selfsigned.key \
  -out /etc/ssl/certs/kumomta-selfsigned.crt \
  -config /tmp/san.cnf \
  -extensions v3_req

# Clean up
rm /tmp/san.cnf
```

---

## Commercial Certificates

### 1. Generate Certificate Signing Request (CSR)

```bash
# Generate private key
sudo openssl genrsa -out /etc/ssl/private/kumomta.key 4096

# Generate CSR
sudo openssl req -new \
  -key /etc/ssl/private/kumomta.key \
  -out /tmp/kumomta.csr \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=your-domain.com"

# View CSR
cat /tmp/kumomta.csr
```

### 2. Submit CSR to Certificate Authority

Submit the CSR content to your CA (Digicert, Sectigo, GoDaddy, etc.)

### 3. Install Issued Certificate

Once you receive the certificate from your CA:

```bash
# Copy certificate to server
sudo cp your-certificate.crt /etc/ssl/certs/kumomta.crt

# Copy intermediate certificates (if provided)
sudo cp intermediate.crt /etc/ssl/certs/kumomta-intermediate.crt

# Create full chain
sudo cat /etc/ssl/certs/kumomta.crt \
         /etc/ssl/certs/kumomta-intermediate.crt \
         > /etc/ssl/certs/kumomta-fullchain.crt

# Set permissions
sudo chmod 600 /etc/ssl/private/kumomta.key
sudo chmod 644 /etc/ssl/certs/kumomta-fullchain.crt
```

---

## Nginx SSL Configuration

### Hardened SSL Configuration

Edit `/etc/nginx/sites-available/kumomta-ui`:

```nginx
# HTTP server - redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;

    # ACME challenge for Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all other HTTP to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Certificate paths
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/your-domain.com/chain.pem;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;

    # SSL session settings
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Application configuration
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # ... rest of your configuration
}
```

### Test and Reload

```bash
# Test configuration
sudo nginx -t

# If test passes, reload
sudo systemctl reload nginx
```

---

## Testing and Verification

### 1. Basic Certificate Check

```bash
# Check certificate details
echo | openssl s_client -servername your-domain.com \
  -connect your-domain.com:443 2>/dev/null | \
  openssl x509 -noout -text
```

### 2. Certificate Expiration Date

```bash
echo | openssl s_client -servername your-domain.com \
  -connect your-domain.com:443 2>/dev/null | \
  openssl x509 -noout -dates
```

### 3. SSL Labs Test (Comprehensive)

Visit: https://www.ssllabs.com/ssltest/

Enter your domain and click "Submit"

**Target Grade:** A or A+

### 4. Command Line SSL Test

```bash
# Install testssl.sh
git clone --depth 1 https://github.com/drwetter/testssl.sh.git
cd testssl.sh

# Run test
./testssl.sh your-domain.com
```

### 5. Browser Test

1. Visit `https://your-domain.com`
2. Click the padlock icon
3. Verify:
   - ✅ Connection is secure
   - ✅ Certificate is valid
   - ✅ No warnings or errors

### 6. HSTS Preload Test

Visit: https://hstspreload.org/

Check if your domain is preload-ready.

---

## Certificate Renewal

### Let's Encrypt Auto-Renewal

```bash
# Check renewal status
sudo certbot renew --dry-run

# Force renewal (if needed)
sudo certbot renew --force-renewal

# View certificate expiration
sudo certbot certificates
```

### Manual Renewal Monitoring

Set up certificate expiration monitoring:

```bash
# Create monitoring script
sudo nano /usr/local/bin/check-ssl-expiry.sh
```

Add:
```bash
#!/bin/bash
DOMAIN="your-domain.com"
DAYS_THRESHOLD=30

EXPIRY=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | \
         openssl x509 -noout -enddate | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
NOW_EPOCH=$(date +%s)
DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))

if [ $DAYS_LEFT -lt $DAYS_THRESHOLD ]; then
    echo "WARNING: SSL certificate for $DOMAIN expires in $DAYS_LEFT days!"
    # Send alert (email, Slack, etc.)
fi
```

Make executable and add to cron:
```bash
sudo chmod +x /usr/local/bin/check-ssl-expiry.sh

# Add to crontab (daily check)
sudo crontab -e
# Add: 0 9 * * * /usr/local/bin/check-ssl-expiry.sh
```

---

## Troubleshooting

### Certificate Validation Errors

**Problem:** "SSL certificate problem: unable to get local issuer certificate"

**Solution:**
```bash
# Ensure intermediate certificates are included
sudo cat /etc/letsencrypt/live/your-domain.com/fullchain.pem
# Should contain both server cert and intermediate certs
```

### Port 80 Required Error

**Problem:** "Port 80 is required for Let's Encrypt validation"

**Solution:**
```bash
# Temporarily allow port 80
sudo ufw allow 80/tcp

# Or use DNS validation instead
sudo certbot certonly --manual --preferred-challenges dns -d your-domain.com
```

### OCSP Stapling Errors

**Problem:** "ssl_stapling" directive is ignored

**Solution:**
```bash
# Ensure ssl_trusted_certificate is set
ssl_trusted_certificate /etc/letsencrypt/live/your-domain.com/chain.pem;

# Test OCSP
openssl s_client -connect your-domain.com:443 -status -servername your-domain.com
```

### Mixed Content Warnings

**Problem:** Browser shows "Not Secure" despite valid certificate

**Solution:**
```bash
# Ensure all resources use HTTPS
# Check browser console for mixed content warnings
# Update all HTTP:// references to HTTPS:// or use protocol-relative URLs (//)
```

### Certificate Chain Issues

**Problem:** "Certificate chain incomplete"

**Solution:**
```bash
# Verify chain order
openssl s_client -connect your-domain.com:443 -showcerts

# Rebuild chain (if needed)
cat server.crt intermediate.crt root.crt > fullchain.pem
```

---

## Best Practices

### 1. Security

✅ **DO:**
- Use TLS 1.2 and 1.3 only
- Enable HSTS with long max-age
- Enable OCSP stapling
- Use strong cipher suites
- Keep certificates up to date
- Monitor expiration dates
- Use automated renewal

❌ **DON'T:**
- Use TLS 1.0 or 1.1
- Use weak ciphers (RC4, DES, 3DES)
- Commit private keys to version control
- Share private keys
- Use same certificate for multiple unrelated domains

### 2. Performance

✅ **Optimize:**
- Enable HTTP/2
- Use session resumption
- Enable SSL session cache
- Implement OCSP stapling
- Use CDN for static assets

### 3. Monitoring

✅ **Monitor:**
- Certificate expiration (30 days before)
- SSL Labs score (monthly)
- Renewal failures (immediately)
- Certificate revocation status

### 4. Backup

✅ **Backup:**
```bash
# Backup Let's Encrypt certificates
sudo tar -czf letsencrypt-backup-$(date +%Y%m%d).tar.gz \
  /etc/letsencrypt

# Store securely offsite
```

### 5. Cipher Suite Recommendations

**Modern (Recommended):**
```
ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384
```

**Intermediate (Broader compatibility):**
```
ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-SHA256:DHE-RSA-AES256-SHA256
```

---

## Quick Reference

### Certificate Locations

**Let's Encrypt:**
```
Certificate: /etc/letsencrypt/live/[domain]/fullchain.pem
Private Key: /etc/letsencrypt/live/[domain]/privkey.pem
Chain: /etc/letsencrypt/live/[domain]/chain.pem
```

**Self-Signed:**
```
Certificate: /etc/ssl/certs/kumomta-selfsigned.crt
Private Key: /etc/ssl/private/kumomta-selfsigned.key
```

### Common Commands

```bash
# Test Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Check certificate expiry
echo | openssl s_client -servername your-domain.com -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates

# Test renewal
sudo certbot renew --dry-run

# List certificates
sudo certbot certificates

# Revoke certificate
sudo certbot revoke --cert-path /etc/letsencrypt/live/your-domain.com/cert.pem
```

---

## Additional Resources

- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [SSL Labs Best Practices](https://github.com/ssllabs/research/wiki/SSL-and-TLS-Deployment-Best-Practices)
- [OWASP Transport Layer Protection](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html)

---

**Last Updated:** 2025-10-25
**Version:** 1.0
**Maintained By:** Security Team
