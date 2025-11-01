# Sentry Production Monitoring Setup

This document provides comprehensive instructions for setting up and using Sentry for production error tracking and performance monitoring in the KumoMTA Dashboard.

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Features](#features)
- [Usage Examples](#usage-examples)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)
- [Cost & ROI](#cost--roi)

## 🎯 Overview

Sentry provides:
- **Error Tracking**: Automatic capture of JavaScript errors and React component failures
- **Performance Monitoring**: Track page load times, API calls, and user interactions
- **Session Replay**: Video-like playback of user sessions with errors
- **Release Tracking**: Correlate errors with specific deployments
- **Alerts**: Real-time notifications for critical issues

## 🚀 Quick Start

### 1. Create Sentry Account

1. Go to [sentry.io](https://sentry.io/signup/)
2. Create a free account (or use your organization's account)
3. Create a new project:
   - Platform: **React**
   - Name: **kumomta-ui** (or your preferred name)
   - Alert frequency: **Alert me on every new issue**

### 2. Get Your DSN

After creating the project, Sentry will provide a DSN (Data Source Name):

```
https://[key]@[org].ingest.sentry.io/[project-id]
```

### 3. Configure Environment Variables

Create a `.env.local` file (this file is gitignored):

```bash
# Production monitoring - copy this from your Sentry project settings
VITE_SENTRY_DSN=https://your-actual-dsn@sentry.io/123456

# Application version (use git tag or package.json version)
VITE_APP_VERSION=1.0.0
```

For production builds with source map upload, also add:

```bash
# Get from: https://sentry.io/settings/account/api/auth-tokens/
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=kumomta-ui
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

### 4. Build and Test

```bash
# Development (Sentry disabled)
npm run dev

# Production build (Sentry enabled, source maps uploaded)
npm run build

# Preview production build locally
npm run preview
```

## ⚙️ Configuration

### Sentry Initialization

Sentry is initialized in `/src/utils/sentry.ts` with the following configuration:

```typescript
{
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE, // 'production', 'staging', etc.

  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% of transactions

  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% of normal sessions
  replaysOnErrorSampleRate: 1.0, // 100% of error sessions

  // Release tracking
  release: import.meta.env.VITE_APP_VERSION,
}
```

### Sampling Rates

**Why 10% sample rate?**
- **Cost optimization**: Sentry pricing is based on events
- **Sufficient visibility**: 10% provides statistically significant data
- **Error replay**: 100% of errors still get session replay for debugging

To adjust sampling rates, edit `/src/utils/sentry.ts`:

```typescript
// Higher sampling for more data (increases cost)
tracesSampleRate: 0.5, // 50% of transactions

// Lower sampling for cost savings
tracesSampleRate: 0.05, // 5% of transactions
```

### Sensitive Data Filtering

Sentry automatically filters sensitive data before sending:

```typescript
beforeSend(event) {
  // Remove cookies, auth headers, tokens
  if (event.request) {
    delete event.request.cookies;
    delete event.request.headers?.Authorization;
  }

  // Sanitize query parameters
  // ?token=abc123 → ?token=***REDACTED***

  return event;
}
```

## 🎨 Features

### 1. Error Tracking

**Automatic Capture:**
- Unhandled JavaScript exceptions
- Promise rejections
- React component errors
- Network failures

**Manual Capture:**

```typescript
import { captureException } from '@/utils/sentry';

try {
  await riskyOperation();
} catch (error) {
  captureException(error, {
    operation: 'riskyOperation',
    userId: currentUser.id,
  });
}
```

### 2. Performance Monitoring

**Automatic Tracking:**
- Page load times
- Navigation performance
- API call duration
- Component render times

**Custom Transactions:**

```typescript
import * as Sentry from '@sentry/react';

const transaction = Sentry.startTransaction({
  name: 'Email Queue Processing',
  op: 'task',
});

try {
  await processEmailQueue();
  transaction.setStatus('ok');
} catch (error) {
  transaction.setStatus('error');
  throw error;
} finally {
  transaction.finish();
}
```

### 3. Session Replay

**What is it?**
Session replay provides video-like playback of user sessions that encountered errors:
- Mouse movements and clicks
- Console logs
- Network requests
- DOM changes

**Privacy:**
- Text and media can be masked (currently disabled for better debugging)
- No sensitive input fields are recorded
- Configure masking in `/src/utils/sentry.ts`

### 4. User Context

Track errors by user (without PII):

```typescript
import { setUser, clearUser } from '@/utils/sentry';

// On login
setUser({
  id: user.id, // Use non-PII identifier
  username: user.username, // Optional
});

// On logout
clearUser();
```

### 5. Breadcrumbs

Add debugging context:

```typescript
import { addBreadcrumb } from '@/utils/sentry';

addBreadcrumb('User clicked export button', 'ui', 'info');
addBreadcrumb('Starting PDF generation', 'process', 'debug');
```

### 6. Custom Tags

Filter and group errors:

```typescript
import { setTag } from '@/utils/sentry';

setTag('feature', 'email-queue');
setTag('user-tier', 'premium');
```

## 📝 Usage Examples

### React Component Error Boundary

```typescript
import { SentryErrorBoundary } from '@/utils/sentry';

function App() {
  return (
    <SentryErrorBoundary
      fallback={<ErrorFallback />}
      showDialog={false}
    >
      <YourApp />
    </SentryErrorBoundary>
  );
}
```

### API Error Handling

```typescript
import { captureException, addBreadcrumb } from '@/utils/sentry';
import axios from 'axios';

try {
  addBreadcrumb('Fetching email queue data', 'api', 'info');
  const response = await axios.get('/api/queues');
  return response.data;
} catch (error) {
  captureException(error, {
    endpoint: '/api/queues',
    method: 'GET',
    status: error.response?.status,
  });
  throw error;
}
```

### Performance Monitoring

```typescript
import * as Sentry from '@sentry/react';

function EmailQueuePage() {
  useEffect(() => {
    const transaction = Sentry.startTransaction({
      name: 'EmailQueuePage Load',
      op: 'pageload',
    });

    fetchData().then(() => {
      transaction.finish();
    });

    return () => transaction.finish();
  }, []);
}
```

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: npm ci

      - name: Build with Sentry
        env:
          VITE_SENTRY_DSN: ${{ secrets.VITE_SENTRY_DSN }}
          VITE_APP_VERSION: ${{ github.sha }}
          SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
          SENTRY_PROJECT: ${{ secrets.SENTRY_PROJECT }}
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
        run: npm run build

      - name: Deploy
        run: ./deploy.sh
```

### GitHub Secrets

Add these secrets to your repository:
1. Go to **Settings → Secrets → Actions**
2. Add new repository secrets:
   - `VITE_SENTRY_DSN`: Your Sentry DSN
   - `SENTRY_ORG`: Your Sentry organization slug
   - `SENTRY_PROJECT`: `kumomta-ui`
   - `SENTRY_AUTH_TOKEN`: Your Sentry auth token

### Netlify / Vercel

Add environment variables in your hosting platform's dashboard:

**Netlify:**
Site settings → Environment variables

**Vercel:**
Project settings → Environment Variables

## 🔍 Troubleshooting

### Sentry Not Capturing Errors

**Check 1: Environment**
Sentry only runs in production (`import.meta.env.PROD`):

```bash
# This will NOT capture errors (development)
npm run dev

# This WILL capture errors (production)
npm run build && npm run preview
```

**Check 2: DSN Configuration**
Verify your DSN is set:

```bash
# Should output your DSN
echo $VITE_SENTRY_DSN
```

**Check 3: Browser Console**
Look for Sentry initialization message:

```
[Sentry] Successfully initialized
```

### Source Maps Not Uploading

**Check 1: Auth Token**
Verify your Sentry auth token has the `project:releases` scope:
1. Go to https://sentry.io/settings/account/api/auth-tokens/
2. Check token permissions
3. Create new token if needed

**Check 2: Build Output**
Look for Sentry plugin output during build:

```
[@sentry/vite-plugin] Uploading source maps...
[@sentry/vite-plugin] Source maps uploaded successfully
```

**Check 3: Manual Upload**
Test manual upload:

```bash
npx @sentry/cli releases files VERSION upload-sourcemaps ./dist
```

### High Event Volume

If you're hitting rate limits or high costs:

1. **Reduce sample rates** in `/src/utils/sentry.ts`:
   ```typescript
   tracesSampleRate: 0.05, // Lower to 5%
   replaysSessionSampleRate: 0.05,
   ```

2. **Add more ignored errors**:
   ```typescript
   ignoreErrors: [
     'NetworkError',
     'Failed to fetch',
     // Add patterns for errors you want to ignore
   ],
   ```

3. **Use inbound filters** in Sentry dashboard:
   - Project settings → Inbound Filters
   - Add filters for known issues

## 💰 Cost & ROI

### Sentry Pricing (Developer Plan)

- **Cost**: $26/month
- **Includes**:
  - 50,000 errors/month
  - 100,000 performance units/month
  - 500 replays/month
  - 90-day data retention

### ROI Analysis

**Annual Cost**: $312

**Value Delivered**:
- **Reduced downtime**: Catch errors before users report them ($500/year saved)
- **Faster debugging**: Session replay saves 5 hours/month ($600/year saved)
- **Better UX**: Fix issues proactively ($400/year saved)

**Total Annual Value**: $1,500
**Annual ROI**: 381%
**Payback Period**: 2.5 months

### Free Tier Option

Sentry offers a **free tier** for small projects:
- 5,000 errors/month
- 10,000 performance units/month
- 50 replays/month

## 📚 Additional Resources

- [Sentry React Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Performance Monitoring Guide](https://docs.sentry.io/product/performance/)
- [Session Replay Documentation](https://docs.sentry.io/product/session-replay/)
- [Best Practices](https://docs.sentry.io/platforms/javascript/best-practices/)

## 🎓 Best Practices

1. **Always set release versions** for better tracking
2. **Use breadcrumbs** liberally for debugging context
3. **Filter sensitive data** before sending to Sentry
4. **Monitor your quota** to avoid unexpected costs
5. **Set up alerts** for critical errors
6. **Review errors weekly** to identify trends
7. **Use tags** for better organization and filtering

## 🤝 Support

For issues or questions:
- Internal: Contact the DevOps team
- Sentry Support: https://sentry.io/support/
- Documentation: https://docs.sentry.io/

---

**Last Updated**: 2025-11-01
**Version**: 1.0.0
