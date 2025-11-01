# Deployment Validation Checklist

## Pre-Deployment Checklist

### Build Validation
- [ ] `npm run build` completes successfully
- [ ] No build warnings or errors
- [ ] `dist/` directory created with expected files
- [ ] Source maps generated
- [ ] Bundle size within limits (< 250KB)

### Code Quality
- [ ] All unit tests passing (`npm run test:unit`)
- [ ] All component tests passing (`npm run test:components`)
- [ ] Linting passes (`npm run lint`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] No console errors or warnings

### Security
- [ ] `npm audit` shows no high/critical vulnerabilities
- [ ] Dependencies up to date
- [ ] Security headers configured
- [ ] No hardcoded secrets or API keys
- [ ] HTTPS enforced

### Performance
- [ ] Bundle size validated (`npm run test:bundle`)
- [ ] Performance benchmarks pass (`npm run test:performance`)
- [ ] Lighthouse score > 90
- [ ] Images optimized
- [ ] Code splitting implemented

### Documentation
- [ ] README updated
- [ ] CHANGELOG updated
- [ ] API documentation current
- [ ] Deployment notes added
- [ ] Version bumped appropriately

## Staging Deployment Checklist

### Deployment Process
- [ ] Backup current staging version
- [ ] Deploy to staging environment
- [ ] Verify deployment completed successfully
- [ ] Check deployment logs for errors
- [ ] Validate version number

### Smoke Tests (Staging)
- [ ] Homepage loads (`https://staging.example.com`)
- [ ] All navigation links work
- [ ] Forms submit correctly
- [ ] Authentication works (if applicable)
- [ ] API endpoints responding
- [ ] No console errors

### Performance Tests (Staging)
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] FCP < 1.8s
- [ ] TTFB < 600ms
- [ ] Bundle size < 250KB

### Integration Tests (Staging)
- [ ] Database connections working
- [ ] External API integrations functional
- [ ] File uploads working (if applicable)
- [ ] Email sending functional (if applicable)
- [ ] Payment processing (if applicable)

### Cross-Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible
- [ ] ARIA labels present

## Production Deployment Checklist

### Pre-Production
- [ ] All staging tests passed
- [ ] Stakeholder approval obtained
- [ ] Deployment window scheduled
- [ ] Team notified of deployment
- [ ] Rollback plan reviewed

### Deployment Configuration
- [ ] Environment variables configured
- [ ] CDN settings verified
- [ ] DNS settings correct
- [ ] SSL certificate valid
- [ ] Monitoring tools configured

### Canary Deployment (Optional)
- [ ] Deploy to 10% of users
- [ ] Monitor for 15 minutes
- [ ] Check error rates
- [ ] Validate metrics
- [ ] Scale to 50% if healthy
- [ ] Monitor for 15 minutes
- [ ] Scale to 100%

### Full Deployment
- [ ] Deploy to production
- [ ] Verify deployment status
- [ ] Check version number
- [ ] Review deployment logs
- [ ] Confirm CDN cache invalidated

### Post-Deployment Validation

#### Immediate (< 5 minutes)
- [ ] Run smoke tests (`npm run test:smoke -- --url=https://example.com`)
- [ ] Homepage loads correctly
- [ ] No 404 errors
- [ ] No 500 errors
- [ ] No console errors
- [ ] Assets loading from CDN

#### Short-term (< 30 minutes)
- [ ] Run performance tests
- [ ] Validate Web Vitals metrics
- [ ] Check error rate (< 1%)
- [ ] Monitor server resources
- [ ] Verify analytics tracking
- [ ] Test critical user flows

#### Extended (< 24 hours)
- [ ] Monitor error rates
- [ ] Track performance metrics
- [ ] Review user feedback
- [ ] Check conversion rates
- [ ] Monitor server health
- [ ] Review logs for anomalies

### Monitoring Setup
- [ ] Performance monitoring active
- [ ] Error tracking enabled
- [ ] Uptime monitoring configured
- [ ] Analytics reporting
- [ ] Alert notifications set up

### Rollback Readiness
- [ ] Previous version backed up
- [ ] Rollback script tested
- [ ] Database migrations reversible (if applicable)
- [ ] Rollback procedure documented
- [ ] Team aware of rollback process

## Post-Deployment Checklist

### Validation
- [ ] All smoke tests passing
- [ ] Performance metrics within thresholds
- [ ] No critical errors in logs
- [ ] User reports reviewed
- [ ] Conversion funnel healthy

### Communication
- [ ] Team notified of successful deployment
- [ ] Stakeholders updated
- [ ] Status page updated (if applicable)
- [ ] Release notes published
- [ ] Documentation updated

### Cleanup
- [ ] Old deployment artifacts removed
- [ ] Temporary files cleaned up
- [ ] Unused feature flags removed
- [ ] Debug logging disabled
- [ ] Development tools removed

### Documentation
- [ ] Deployment notes recorded
- [ ] Issues documented
- [ ] Metrics baseline updated
- [ ] Lessons learned captured
- [ ] Runbook updated

## Health Metrics to Monitor

### Performance
- **Target**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Alert**: > 10% degradation
- **Critical**: > 50% degradation

### Availability
- **Target**: 99.9% uptime
- **Alert**: < 99% uptime
- **Critical**: < 95% uptime

### Error Rate
- **Target**: < 0.1%
- **Alert**: > 1%
- **Critical**: > 5%

### Response Time
- **Target**: < 200ms (API), < 3s (page load)
- **Alert**: > 500ms (API), > 5s (page load)
- **Critical**: > 1s (API), > 10s (page load)

## Rollback Triggers

### Automatic Rollback
- Site returns 500 errors
- Error rate > 10%
- Complete feature failure
- Security breach detected

### Manual Rollback Decision
- Error rate 5-10%
- Performance degradation > 50%
- User complaints spike
- Data inconsistency detected

### Rollback Procedure
1. Execute: `./scripts/rollback.sh`
2. Validate: `npm run test:smoke`
3. Monitor: 15 minutes
4. Document: Incident report
5. Notify: Team and stakeholders

## Sign-off

### Pre-Deployment
- [ ] Developer: _________________
- [ ] QA Engineer: _________________
- [ ] DevOps: _________________
- [ ] Product Owner: _________________

### Post-Deployment
- [ ] Smoke tests verified: _________________
- [ ] Performance validated: _________________
- [ ] Monitoring confirmed: _________________
- [ ] Deployment complete: _________________

---

## Quick Reference

### Test Commands
```bash
# Pre-deployment tests
npm run test:all

# Smoke tests (staging)
npm run test:smoke -- --url=https://staging.example.com

# Performance tests
npm run test:performance -- --url=https://staging.example.com

# Bundle validation
npm run test:bundle

# Deployment validation
npm run test:deployment
```

### Deployment Commands
```bash
# Build production
npm run build

# Deploy to staging
npm run deploy:staging

# Deploy to production (canary)
npm run deploy:production -- --canary=10%

# Complete deployment
npm run deploy:complete

# Rollback
npm run rollback
```

### Monitoring Commands
```bash
# Health check
npm run monitor:health

# Performance monitoring
npm run monitor:performance

# Error tracking
npm run monitor:errors

# Real-time logs
npm run logs:tail
```

---

**Template Version**: 1.0.0
**Last Updated**: 2025-11-01
**Deployment Date**: _________________
**Deployment Version**: _________________
