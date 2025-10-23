# KumoMTA UI - Troubleshooting Guide

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Development Server Issues](#development-server-issues)
3. [Build Issues](#build-issues)
4. [Runtime Errors](#runtime-errors)
5. [API Connection Issues](#api-connection-issues)
6. [Performance Issues](#performance-issues)
7. [Browser Compatibility](#browser-compatibility)
8. [Deployment Issues](#deployment-issues)

---

## Installation Issues

### npm install fails

**Problem**: Dependency installation errors

**Solutions**:

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install

# Use specific npm version
npm install -g npm@9.8.1
npm install
```

### Node version mismatch

**Problem**: `The engine "node" is incompatible with this module`

**Solutions**:

```bash
# Check current Node version
node -v

# Install correct version using nvm
nvm install 18
nvm use 18

# Or using n
npm install -g n
n 18
```

### Package conflicts

**Problem**: Peer dependency warnings or conflicts

**Solutions**:

```bash
# Use legacy peer deps flag
npm install --legacy-peer-deps

# Force installation
npm install --force

# Update package.json if necessary
npm update
```

---

## Development Server Issues

### Port already in use

**Problem**: `Error: listen EADDRINUSE: address already in use :::5173`

**Solutions**:

```bash
# Find process using port 5173
lsof -i :5173

# Kill the process
kill -9 <PID>

# Or use different port
npm run dev -- --port 3001
```

### Hot reload not working

**Problem**: Changes not reflected in browser

**Solutions**:

1. **Check file watcher limits** (Linux):
```bash
# Increase file watcher limit
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

2. **Hard refresh browser**: `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)

3. **Restart development server**:
```bash
# Stop server (Ctrl + C)
# Clear Vite cache
rm -rf node_modules/.vite

# Restart
npm run dev
```

### Module resolution errors

**Problem**: `Cannot find module 'xyz'`

**Solutions**:

```bash
# Verify import paths are correct
# Use absolute imports from src/

# Check tsconfig.json paths configuration
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}

# Restart TypeScript server in IDE
# VS Code: Ctrl+Shift+P > TypeScript: Restart TS Server
```

---

## Build Issues

### Build fails with memory error

**Problem**: `FATAL ERROR: Reached heap limit Allocation failed`

**Solutions**:

```bash
# Increase Node.js memory limit
NODE_OPTIONS=--max-old-space-size=4096 npm run build

# Or set in package.json
{
  "scripts": {
    "build": "NODE_OPTIONS=--max-old-space-size=4096 vite build"
  }
}
```

### TypeScript compilation errors

**Problem**: Type errors during build

**Solutions**:

```bash
# Run type checking separately
npm run typecheck

# Fix type errors or add type assertions
const value = data as MyType;

# Skip type checking (not recommended for production)
vite build --mode production --no-typecheck
```

### Missing environment variables

**Problem**: `ReferenceError: import.meta.env.VITE_API_URL is undefined`

**Solutions**:

1. Create `.env` file:
```env
VITE_API_URL=http://localhost:3000
```

2. Verify variable prefix is `VITE_`:
```typescript
// ✅ Correct
import.meta.env.VITE_API_URL

// ❌ Incorrect
import.meta.env.API_URL
```

3. Restart build after adding variables

### Asset optimization errors

**Problem**: Image or asset processing failures

**Solutions**:

```bash
# Check asset file sizes
du -h src/assets/*

# Optimize images before import
# Use tools like imagemin

# Adjust Vite config
// vite.config.ts
export default defineConfig({
  build: {
    assetsInlineLimit: 4096, // 4kb
    chunkSizeWarningLimit: 1000
  }
});
```

---

## Runtime Errors

### Blank page after deployment

**Problem**: Application loads but shows blank page

**Solutions**:

1. **Check browser console**:
   - Open DevTools (F12)
   - Look for JavaScript errors
   - Check Network tab for failed requests

2. **Verify base path**:
```typescript
// vite.config.ts
export default defineConfig({
  base: '/', // or '/subdirectory/' if deployed to subdirectory
});
```

3. **Check build output**:
```bash
# Preview production build locally
npm run preview
```

### React component errors

**Problem**: `Error: Rendered fewer hooks than expected`

**Solutions**:

```typescript
// ❌ Conditional hooks
function MyComponent() {
  if (condition) {
    const [state, setState] = useState(0); // Wrong!
  }
}

// ✅ Hooks at top level
function MyComponent() {
  const [state, setState] = useState(0);

  if (condition) {
    // Use state here
  }
}
```

### ErrorBoundary catching errors

**Problem**: Error boundary displays error message

**Solutions**:

1. **Check component stack trace** in console
2. **Common causes**:
   - Undefined data access: `data.field` when `data` is undefined
   - Missing props: Component expects props but none provided
   - Async data not loaded: Check loading states

```typescript
// ✅ Safe data access
const value = data?.field ?? 'default';

// ✅ Loading state
if (isLoading) return <Loading />;
if (error) return <Error />;
return <Component data={data} />;
```

### Chart.js errors

**Problem**: `Category is not a registered scale`

**Solutions**:

```typescript
import {
  Chart as ChartJS,
  CategoryScale, // ← Must register
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale, // ← Must register
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);
```

---

## API Connection Issues

### CORS errors

**Problem**: `Access to XMLHttpRequest blocked by CORS policy`

**Solutions**:

1. **Configure CORS on KumoMTA server**:
```javascript
// Express.js example
app.use(cors({
  origin: 'https://dashboard.example.com',
  credentials: true
}));
```

2. **Use Vite proxy** (development only):
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});
```

### 401 Unauthorized errors

**Problem**: API requests fail with 401 status

**Solutions**:

1. **Check authentication token**:
```typescript
// Check if token exists
const token = getAuthToken();
console.log('Token:', token);

// Verify token is being sent
api.interceptors.request.use(config => {
  console.log('Auth header:', config.headers.Authorization);
  return config;
});
```

2. **Token expired**:
```typescript
// Implement token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Refresh token logic
      // Or redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Network timeout errors

**Problem**: `timeout of 10000ms exceeded`

**Solutions**:

```typescript
// Increase timeout
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000, // 30 seconds
});

// Add retry logic
import axiosRetry from 'axios-retry';

axiosRetry(api, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay
});
```

### API endpoint not found

**Problem**: 404 errors on API calls

**Solutions**:

1. **Verify API URL**:
```bash
# Check environment variable
echo $VITE_API_URL

# Test endpoint manually
curl http://localhost:3000/queue
```

2. **Check endpoint paths**:
```typescript
// Ensure paths match server routes
apiService.queue.getItems(filters) // GET /queue
```

3. **Enable request logging**:
```typescript
api.interceptors.request.use(request => {
  console.log('Request:', request.method, request.url);
  return request;
});
```

---

## Performance Issues

### Slow page load

**Problem**: Application takes too long to load

**Solutions**:

1. **Enable code splitting**:
```typescript
// Use lazy loading
const Dashboard = lazy(() => import('./components/Dashboard'));
const QueueManager = lazy(() => import('./components/queue/QueueManager'));

// Wrap in Suspense
<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

2. **Optimize bundle size**:
```bash
# Analyze bundle
npm run build
npx vite-bundle-visualizer

# Remove unused dependencies
npm uninstall <package>
```

3. **Enable compression**:
```nginx
# Nginx gzip
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

### Memory leaks

**Problem**: Browser memory usage increases over time

**Solutions**:

```typescript
// Clean up subscriptions
useEffect(() => {
  const subscription = api.subscribe();

  return () => {
    subscription.unsubscribe(); // Cleanup
  };
}, []);

// Clean up timers
useEffect(() => {
  const timer = setInterval(() => {}, 1000);

  return () => {
    clearInterval(timer); // Cleanup
  };
}, []);
```

### Slow rendering

**Problem**: UI updates are sluggish

**Solutions**:

```typescript
// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Memoize components
const MemoizedComponent = memo(Component);

// Use useCallback for functions
const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);
```

---

## Browser Compatibility

### IE11 not supported

**Problem**: Application doesn't work in older browsers

**Solution**: Modern browsers only (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

Add polyfills if needed:
```bash
npm install core-js regenerator-runtime
```

```typescript
// main.tsx
import 'core-js/stable';
import 'regenerator-runtime/runtime';
```

### Safari-specific issues

**Problem**: Features work in Chrome but not Safari

**Solutions**:

1. **Check CSS compatibility**: Use autoprefixer (already configured)
2. **Test flexbox/grid**: Safari has different implementations
3. **Check date handling**: Safari strict with date formats

```typescript
// Use date-fns for consistent date handling
import { parseISO, format } from 'date-fns';

const date = parseISO('2025-01-19T10:00:00Z');
```

---

## Deployment Issues

### 404 on page refresh

**Problem**: Direct URL access or refresh returns 404

**Solutions**:

**Nginx**:
```nginx
location / {
    try_files $uri $uri/ /index.html; # SPA routing
}
```

**Apache** (`.htaccess`):
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### Environment variables not working in production

**Problem**: `import.meta.env.VITE_API_URL` is undefined in production

**Solutions**:

1. **Build with environment variables**:
```bash
VITE_API_URL=https://api.example.com npm run build
```

2. **Use `.env.production` file**:
```env
VITE_API_URL=https://api.example.com
```

3. **Docker environment variables**:
```bash
docker run -e VITE_API_URL=https://api.example.com kumomta-ui
```

### SSL certificate errors

**Problem**: Mixed content warnings (HTTP resources on HTTPS page)

**Solutions**:

1. **Ensure all resources use HTTPS**:
```typescript
const API_URL = import.meta.env.VITE_API_URL.replace('http:', 'https:');
```

2. **Update Content Security Policy**:
```nginx
add_header Content-Security-Policy "upgrade-insecure-requests;" always;
```

---

## Getting Help

### Debug mode

Enable verbose logging:

```typescript
// src/services/api.ts
api.interceptors.request.use(request => {
  if (import.meta.env.DEV) {
    console.log('Request:', request);
  }
  return request;
});

api.interceptors.response.use(
  response => {
    if (import.meta.env.DEV) {
      console.log('Response:', response);
    }
    return response;
  },
  error => {
    console.error('API Error:', error.response || error);
    return Promise.reject(error);
  }
);
```

### Collect diagnostic information

```bash
# System info
node -v
npm -v
cat package.json | grep version

# Build info
npm run build 2>&1 | tee build.log

# Browser console logs
# Copy from DevTools Console tab
```

### Report issues

When reporting issues, include:
1. Steps to reproduce
2. Expected vs actual behavior
3. Browser and version
4. Console errors (screenshots)
5. Network tab (failed requests)
6. Environment variables (redact sensitive data)

---

## Additional Resources

- [Vite Troubleshooting](https://vitejs.dev/guide/troubleshooting.html)
- [React Error Decoder](https://reactjs.org/docs/error-decoder.html)
- [MDN Web Docs](https://developer.mozilla.org/)
- [KumoMTA Documentation](https://kumomta.com/docs/)
