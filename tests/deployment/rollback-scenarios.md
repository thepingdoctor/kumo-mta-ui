# Deployment Rollback Scenarios & Procedures

## Overview

This document outlines rollback scenarios, decision criteria, and step-by-step procedures for reverting deployments when issues are detected.

## Rollback Decision Matrix

| Severity | Condition | Action | Timeline |
|----------|-----------|--------|----------|
| **P0 - Critical** | Complete site outage, data loss risk | Immediate rollback | < 5 minutes |
| **P1 - High** | Core functionality broken, >50% error rate | Rollback after quick fix attempt | < 15 minutes |
| **P2 - Medium** | Partial functionality broken, <50% error rate | Fix forward or rollback | < 30 minutes |
| **P3 - Low** | Minor issues, cosmetic bugs | Fix forward | Next deployment |

## Automatic Rollback Triggers

### Performance Degradation
```yaml
triggers:
  lcp_threshold:
    value: 3000ms  # 20% above baseline
    action: rollback

  error_rate:
    value: 5%  # >5% error rate
    action: rollback

  bundle_size:
    value: 350KB  # 40% above limit
    action: alert  # Review required

  availability:
    value: 95%  # <95% uptime
    action: rollback
```

### Health Check Failures
```yaml
health_checks:
  smoke_tests:
    failures: 1
    action: rollback

  web_vitals:
    failures: 3  # 3 consecutive failures
    action: rollback

  security_headers:
    failures: 0
    action: alert
```

## Rollback Procedures

### 1. Immediate Rollback (P0/P1)

**When to use**: Critical outages, complete site failure

**Steps**:
```bash
# 1. Initiate rollback
cd /path/to/deployment
./scripts/rollback.sh --immediate --version=$PREVIOUS_VERSION

# 2. Verify rollback
curl -I https://your-domain.com
# Check version header

# 3. Run smoke tests
npm run test:smoke -- --url=https://your-domain.com

# 4. Monitor health
npm run monitor:health -- --duration=5m

# 5. Notify team
./scripts/notify.sh --type=rollback --reason="[reason]"
```

**Expected Timeline**: 2-5 minutes

### 2. Conditional Rollback (P2)

**When to use**: Partial failures, attempt quick fix first

**Steps**:
```bash
# 1. Assess issue severity
npm run test:smoke
npm run test:performance

# 2. Attempt hot-fix (5-minute window)
git checkout -b hotfix/urgent-fix
# Make minimal fix
git commit -m "hotfix: [description]"
npm run build
npm run deploy -- --hotfix

# 3. If fix fails, rollback
./scripts/rollback.sh --conditional --previous=$PREVIOUS_VERSION

# 4. Validate rollback
npm run test:deployment:validate
```

**Expected Timeline**: 15-30 minutes

### 3. Staged Rollback (Canary/Blue-Green)

**When to use**: Partial traffic routing issues

**Steps**:
```bash
# 1. Route traffic away from failed version
./scripts/traffic-shift.sh --to=previous --percentage=100

# 2. Verify traffic shift
./scripts/monitor-traffic.sh

# 3. Complete rollback
./scripts/rollback.sh --staged

# 4. Clean up failed deployment
./scripts/cleanup.sh --version=$FAILED_VERSION
```

**Expected Timeline**: 10-20 minutes

## Scenario Playbooks

### Scenario 1: Performance Regression Detected

**Indicators**:
- LCP > 3000ms
- Bundle size > 350KB
- User reports of slowness

**Procedure**:
```bash
# 1. Confirm metrics
npm run test:performance:baseline-compare

# 2. Check bundle size
npm run test:bundle:validate

# 3. Rollback decision
if [ $DEGRADATION -gt 30 ]; then
  ./scripts/rollback.sh --reason="performance-regression"
else
  # Monitor and fix forward
  ./scripts/alert.sh --team=performance
fi

# 4. Post-rollback validation
npm run test:web-vitals
```

### Scenario 2: JavaScript Errors Spike

**Indicators**:
- Error rate > 5%
- Console errors in monitoring
- User interaction failures

**Procedure**:
```bash
# 1. Check error logs
./scripts/get-errors.sh --since=deployment --count=100

# 2. Assess impact
ERROR_RATE=$(./scripts/calculate-error-rate.sh)

# 3. Immediate rollback if critical
if [ $ERROR_RATE -gt 5 ]; then
  ./scripts/rollback.sh --immediate --reason="error-spike"

  # 4. Verify errors cleared
  sleep 60
  ./scripts/get-errors.sh --since=rollback --count=10
fi

# 5. Root cause analysis
./scripts/analyze-errors.sh --deployment=$FAILED_VERSION
```

### Scenario 3: Bundle Size Violation

**Indicators**:
- Bundle > 250KB limit
- Load time degradation
- Bandwidth concerns

**Procedure**:
```bash
# 1. Verify bundle size
npm run test:bundle:validate

# 2. Analyze regression
npm run build -- --analyze

# 3. Assess severity
SIZE_KB=$(du -sk dist | cut -f1)
REGRESSION=$(( ($SIZE_KB - 250) * 100 / 250 ))

# 4. Decision point
if [ $REGRESSION -gt 40 ]; then
  # >40% regression - rollback
  ./scripts/rollback.sh --reason="bundle-size-violation"
elif [ $REGRESSION -gt 20 ]; then
  # 20-40% - alert and monitor
  ./scripts/alert.sh --severity=high --reason="bundle-regression"
fi

# 5. Post-action
npm run report:bundle-analysis
```

### Scenario 4: Security Header Missing

**Indicators**:
- Security scan failures
- Missing CSP/HSTS headers
- Vulnerability reports

**Procedure**:
```bash
# 1. Verify security headers
npm run test:security:headers

# 2. Assess risk
RISK_LEVEL=$(./scripts/assess-security-risk.sh)

# 3. Immediate action for critical
if [ "$RISK_LEVEL" = "critical" ]; then
  ./scripts/rollback.sh --immediate --reason="security-headers"
else
  # Deploy hotfix
  ./scripts/hotfix-security.sh
fi

# 4. Validate fix
npm run test:security:validate
```

### Scenario 5: CDN/Deployment Failure

**Indicators**:
- Assets not loading
- 404 errors on static files
- CDN cache issues

**Procedure**:
```bash
# 1. Check deployment status
./scripts/check-deployment-status.sh

# 2. Verify CDN
curl -I https://cdn.your-domain.com/assets/main.js

# 3. Invalidate cache if needed
./scripts/invalidate-cdn-cache.sh

# 4. If CDN failed, rollback
if [ $CDN_STATUS != "healthy" ]; then
  ./scripts/rollback.sh --cdn-restore
fi

# 5. Verify assets
npm run test:smoke -- --check-assets
```

## Rollback Validation Checklist

After any rollback, verify:

- [ ] Site is accessible (HTTP 200)
- [ ] Version matches expected previous version
- [ ] No console errors
- [ ] Performance metrics within baseline
- [ ] All critical user flows working
- [ ] Analytics tracking functional
- [ ] CDN serving correct assets
- [ ] No security warnings
- [ ] Database connections healthy
- [ ] API endpoints responding

## Post-Rollback Actions

### 1. Immediate (< 5 minutes)
- [ ] Confirm rollback success
- [ ] Notify stakeholders
- [ ] Update status page
- [ ] Begin incident log

### 2. Short-term (< 1 hour)
- [ ] Root cause analysis
- [ ] Document failure
- [ ] Fix preparation
- [ ] Team debrief

### 3. Long-term (< 24 hours)
- [ ] Comprehensive postmortem
- [ ] Update rollback procedures
- [ ] Improve monitoring
- [ ] Add regression tests
- [ ] Plan re-deployment

## Monitoring During Rollback

```bash
# Terminal 1: Health monitoring
npm run monitor:health -- --interval=10s

# Terminal 2: Error tracking
npm run monitor:errors -- --realtime

# Terminal 3: Performance metrics
npm run monitor:performance -- --web-vitals

# Terminal 4: Traffic analysis
npm run monitor:traffic -- --breakdown
```

## Communication Templates

### Rollback Initiated
```
🚨 ROLLBACK INITIATED

Deployment: [version]
Reason: [specific reason]
Initiated by: [name]
Expected duration: [X] minutes
Status updates: Every 5 minutes
```

### Rollback Completed
```
✅ ROLLBACK COMPLETED

Previous version: [version]
Rollback duration: [X] minutes
Validation: PASSED ✓
Next steps: [action plan]
Postmortem: [link/time]
```

### Rollback Failed
```
❌ ROLLBACK FAILED

Attempted version: [version]
Error: [description]
Current status: [degraded/outage]
Escalation: [team/person]
Alternative action: [manual intervention/other]
```

## Tools & Scripts

### Required Scripts
- `scripts/rollback.sh` - Main rollback orchestration
- `scripts/traffic-shift.sh` - Traffic routing control
- `scripts/monitor-health.sh` - Health monitoring
- `scripts/validate-deployment.sh` - Deployment validation
- `scripts/notify.sh` - Team notification

### Monitoring Dashboards
- Performance metrics (Grafana/DataDog)
- Error tracking (Sentry)
- Uptime monitoring (Pingdom)
- User analytics (GA/Plausible)

## Prevention Strategies

### Before Deployment
- [ ] Run full test suite
- [ ] Validate bundle size
- [ ] Performance benchmarking
- [ ] Security scanning
- [ ] Staging environment validation

### During Deployment
- [ ] Canary deployment (10% → 50% → 100%)
- [ ] Real-time monitoring
- [ ] Automated smoke tests
- [ ] Error rate tracking
- [ ] Performance monitoring

### After Deployment
- [ ] Extended monitoring (24h)
- [ ] User feedback collection
- [ ] Performance trending
- [ ] Error pattern analysis
- [ ] Success criteria validation

## Escalation Path

```
L1: Automated rollback (< 5 min)
  ↓ (if automation fails)
L2: On-call engineer (< 10 min)
  ↓ (if unresolved)
L3: Team lead (< 20 min)
  ↓ (if critical)
L4: Engineering director (< 30 min)
```

## Contact Information

**On-Call Engineer**: [contact]
**Team Lead**: [contact]
**DevOps Team**: [contact]
**Status Page**: [URL]
**Incident Channel**: [Slack/Teams channel]

---

## Appendix: Rollback Script Examples

### Basic Rollback Script
```bash
#!/bin/bash
# scripts/rollback.sh

PREVIOUS_VERSION=${1:-$(cat .previous-version)}
DEPLOYMENT_DIR="./dist"
BACKUP_DIR="./backups/${PREVIOUS_VERSION}"

echo "🔄 Rolling back to version: $PREVIOUS_VERSION"

# Stop current deployment
npm run stop

# Restore previous version
cp -r "$BACKUP_DIR"/* "$DEPLOYMENT_DIR/"

# Restart
npm run start

# Validate
npm run test:smoke

echo "✅ Rollback complete"
```

### Advanced Rollback with Validation
```bash
#!/bin/bash
# scripts/rollback-advanced.sh

set -e

VERSION=$1
REASON=$2

# Pre-rollback validation
./scripts/validate-version.sh "$VERSION"

# Traffic shift to previous
./scripts/traffic-shift.sh --version="$VERSION" --percentage=100

# Wait for traffic to stabilize
sleep 30

# Run smoke tests
if ! npm run test:smoke; then
  echo "❌ Smoke tests failed after rollback"
  exit 1
fi

# Verify metrics
if ! ./scripts/verify-metrics.sh; then
  echo "❌ Metrics validation failed"
  exit 1
fi

# Log rollback
./scripts/log-deployment.sh --action=rollback --version="$VERSION" --reason="$REASON"

# Notify team
./scripts/notify.sh --type=rollback-success --version="$VERSION"

echo "✅ Rollback validated and complete"
```
