# Performance Budgets

## Overview

This document defines the performance budgets for the KumoMTA Dashboard application. These budgets ensure fast load times, excellent user experience, and optimal Core Web Vitals scores.

## Bundle Size Budgets

### JavaScript (Gzipped)
- **Total JS**: < 500KB
- **Single Chunk**: < 250KB (~80KB gzipped)

### CSS (Gzipped)
- **Total CSS**: < 100KB

### HTML (Gzipped)
- **HTML Files**: < 50KB

## Core Web Vitals Targets

### Loading Performance
- **FCP (First Contentful Paint)**: < 1.8s (good), < 3.0s (needs improvement)
- **LCP (Largest Contentful Paint)**: < 2.5s (good), < 4.0s (needs improvement)
- **TTFB (Time to First Byte)**: < 800ms (good), < 1800ms (needs improvement)

### Interactivity
- **FID (First Input Delay)**: < 100ms (good), < 300ms (needs improvement)
- **INP (Interaction to Next Paint)**: < 200ms (good), < 500ms (needs improvement)

### Visual Stability
- **CLS (Cumulative Layout Shift)**: < 0.1 (good), < 0.25 (needs improvement)

## Monitoring

### Automated Checks

Run bundle size validation:
```bash
npm run check:bundle
```

Run build with automatic validation:
```bash
npm run build:check
```

### Web Vitals Tracking

Web Vitals are automatically tracked in production:
- Metrics are logged to console in development mode
- Poor performance metrics trigger console warnings
- All metrics can be sent to analytics services

Access Web Vitals data in your application:
```typescript
import { getWebVitalsEvents } from '@/utils/webVitals';

const events = getWebVitalsEvents();
console.table(events);
```

## Optimization Strategies

### Code Splitting
- Use dynamic imports for route-based splitting
- Lazy load heavy components and libraries
- Separate vendor chunks by size and usage

### Bundle Analysis
Analyze bundle composition:
```bash
npm run build -- --mode analyze
```

### Recommendations

If budgets are exceeded:

1. **Enable Code Splitting**
   - Split routes with React.lazy()
   - Use dynamic imports for large components

2. **Optimize Dependencies**
   - Review and remove unused dependencies
   - Use tree-shakeable imports
   - Consider lighter alternatives

3. **Lazy Loading**
   - Defer loading of non-critical features
   - Load heavy libraries on-demand
   - Implement intersection observer for images

4. **Compression**
   - Ensure gzip/brotli compression is enabled
   - Optimize image formats (WebP, AVIF)
   - Minify and compress assets

5. **Caching Strategy**
   - Implement proper cache headers
   - Use service worker for offline caching
   - Leverage browser caching

## CI/CD Integration

### GitHub Actions

Add to your CI pipeline:
```yaml
- name: Build and check bundle size
  run: npm run build:check
```

This will fail the build if any bundle exceeds the defined budgets.

## Performance Thresholds

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| FCP | < 1.8s | 1.8s - 3.0s | > 3.0s |
| LCP | < 2.5s | 2.5s - 4.0s | > 4.0s |
| FID | < 100ms | 100ms - 300ms | > 300ms |
| CLS | < 0.1 | 0.1 - 0.25 | > 0.25 |
| TTFB | < 800ms | 800ms - 1800ms | > 1800ms |
| INP | < 200ms | 200ms - 500ms | > 500ms |

## Resources

- [Web Vitals](https://web.dev/vitals/)
- [Chrome User Experience Report](https://developer.chrome.com/docs/crux/)
- [Performance Budgets](https://web.dev/performance-budgets-101/)
- [Bundle Size Optimization](https://web.dev/reduce-javascript-payloads-with-code-splitting/)

## Maintenance

Performance budgets should be reviewed quarterly and adjusted based on:
- User analytics and Core Web Vitals data
- New feature requirements
- Industry benchmarks
- Competitor analysis

Last updated: 2025-11-01
