# KumoMTA Admin Dashboard

[![React](https://img.shields.io/badge/React-18.3-61dafb.svg?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178c6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg?logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

A modern, responsive web interface for managing [KumoMTA](https://kumomta.com) email servers. This dashboard provides comprehensive tools for real-time monitoring, queue management, server configuration, and email delivery infrastructure maintenance with enterprise-grade features.

## ✨ Features

### 🎯 Real-time Dashboard
- **Live Metrics Display**: Real-time email delivery statistics with 5-second auto-refresh
- **Interactive Charts**: 24-hour hourly throughput visualization using Chart.js
- **Server Health Monitoring**: Connection status, active connections, and queue size tracking
- **Key Performance Indicators**:
  - Total emails sent
  - Bounce rate tracking
  - Delayed message monitoring
  - Messages per minute throughput

### 📊 Advanced Queue Management
- **Real-time Queue Monitoring**: Live queue status updates with automatic refresh
- **Multi-Filter Search**: Search by customer name, email, recipient, or sender
- **Status Filtering**: Filter by waiting, in-progress, sending, completed, failed, or cancelled
- **Service Type Categorization**: Organize by transactional, marketing, or notification emails
- **Bulk Operations**: Update status for multiple queue items
- **CSV Export**: Export queue data with full metadata for analysis
- **Queue Statistics Dashboard**: Real-time counts for waiting, processing, and completed items

### 🔌 KumoMTA API Integration
- **Server Metrics**: Direct integration with KumoMTA metrics endpoint
- **Bounce Management**: View and manage bounce classifications
- **Queue Control Operations**:
  - Suspend/resume scheduled queues with optional duration
  - Suspend ready queues with reason tracking
  - Resume queue operations
- **Message Operations**:
  - Rebind messages by campaign, tenant, domain, or routing domain
  - Bounce messages with custom reason codes
- **Diagnostic Tools**:
  - SMTP server trace logging
  - Diagnostic log filter configuration
  - Real-time trace log viewing

### ⚙️ Configuration Management
- **Visual Configuration Editor**: Three-section configuration interface
- **Core Settings**:
  - Server name and hostname
  - Maximum connection limits
  - Port configuration
  - DNS resolver settings
- **Integration Settings**:
  - API endpoint configuration
  - Webhook URL management
  - Backup configuration
  - Failover settings
- **Performance Settings**:
  - Cache configuration (enable/disable, max size, TTL)
  - Load balancing options
  - Memory limits
  - CPU allocation
  - Queue worker configuration

### 🎨 User Experience Features
- **Error Boundary Protection**: Graceful error handling with fallback UI
- **Loading Skeletons**: Smooth loading states for better perceived performance
- **Toast Notifications**: Real-time feedback for user actions (success, error, warning, info)
- **Debounced Search**: Optimized search with 300ms debounce to reduce API calls
- **Responsive Design**: Mobile-first design that works on all screen sizes
- **Accessibility**: ARIA labels, semantic HTML, keyboard navigation support

## 🛠️ Technology Stack

### Frontend Framework
- **React 18.3**: Latest React with concurrent features
- **TypeScript 5.5**: Type-safe development with full type coverage
- **Vite 5.4**: Lightning-fast build tool and development server

### State Management & Data Fetching
- **TanStack Query 5.24**: Powerful async state management with automatic caching
  - Smart retry logic with exponential backoff
  - Query invalidation and refetching
  - 5-minute cache time with 5-second stale time
  - Window focus refetch disabled for performance
- **Zustand 4.5**: Lightweight state management for authentication
- **React Hook Form 7.50**: Performant form validation and management

### UI & Styling
- **TailwindCSS 3.4**: Utility-first CSS framework
- **Lucide React 0.344**: Beautiful, consistent icon library
- **Chart.js 4.4 + React-ChartJS-2 5.2**: Interactive data visualization

### HTTP Client
- **Axios 1.6**: Promise-based HTTP client with interceptors
  - Automatic authentication token injection
  - Request/response interceptors
  - 10-second timeout with retry logic
  - Global error handling

### Development Tools
- **ESLint 9.9**: Code quality and consistency
- **TypeScript ESLint 8.3**: TypeScript-specific linting rules
- **PostCSS 8.4 + Autoprefixer 10.4**: CSS processing and vendor prefixes

### Testing Suite
- **Vitest 1.6**: Fast unit testing framework
- **Testing Library 16.3**: User-centric component testing
- **Jest Axe 10.0**: Accessibility testing
- **MSW 2.11**: API mocking for tests
- **jsdom 24.0**: Browser environment simulation

## 📋 Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **KumoMTA Server**: Running instance with admin API enabled

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/thepingdoctor/kumo-mta-dashboard.git
cd kumo-mta-dashboard
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the project root:
```env
# Required: KumoMTA API endpoint
VITE_API_URL=http://your-kumomta-server:8000

# Optional: Environment
VITE_ENV=development

# Optional: API Request Timeout (milliseconds)
VITE_API_TIMEOUT=10000

# Optional: Enable debug logging
VITE_DEBUG=false
```

### 4. Start Development Server
```bash
npm run dev
```

The dashboard will be available at `http://localhost:5173`

## 📖 Usage

### Dashboard Overview

Access real-time email delivery metrics:

```typescript
// The dashboard automatically fetches metrics every 5 seconds
const metrics = {
  sent: emailMetrics.sent,
  bounced: emailMetrics.bounced,
  delayed: emailMetrics.delayed,
  throughput: emailMetrics.throughput
};
```

### Queue Management

Monitor and manage email queues with advanced filtering:

```typescript
// Filter queue items
const filters = {
  searchQuery: 'customer@example.com',
  status: 'waiting',
  serviceType: 'transactional'
};

// Update queue item status
await updateEmailStatus(itemId, 'completed');

// Export queue data to CSV
exportQueueData();
```

### KumoMTA Operations

Control KumoMTA server operations:

```typescript
// Suspend a queue
await suspendQueue({
  domain: 'example.com',
  reason: 'Maintenance',
  duration: 3600 // seconds
});

// Rebind messages
await rebindMessages({
  campaign: 'newsletter',
  routing_domain: 'new-provider.com'
});

// Bounce messages
await bounceMessages({
  domain: 'invalid-domain.com',
  reason: '550 Domain does not exist'
});
```

### Configuration Management

Update server configuration through the visual editor:

```typescript
// Update core configuration
const coreConfig = {
  serverName: 'mail.example.com',
  maxConnections: 1000,
  smtpPort: 25,
  dnsResolver: '8.8.8.8'
};

// Update performance settings
const perfConfig = {
  cacheConfig: {
    enabled: true,
    maxSize: 512, // MB
    ttl: 3600     // seconds
  },
  loadBalancing: 'round-robin',
  queueWorkers: 4
};
```

## 🏗️ Architecture Overview

### Project Structure
```
kumo-mta-ui/
├── src/
│   ├── components/       # React components
│   │   ├── common/       # Reusable UI components
│   │   ├── config/       # Configuration editor
│   │   └── queue/        # Queue management
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API service layer
│   ├── store/            # Zustand state stores
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   └── constants/        # App constants
├── tests/                # Test files
└── public/               # Static assets
```

### Key Design Patterns

**Custom Hooks Pattern**
- `useKumoMTA`: KumoMTA API operations
- `useQueue`: Queue management operations
- `useChartData`: Chart data fetching
- `useToast`: Toast notification system
- `useDebounce`: Input debouncing

**Service Layer**
- Centralized API client in `services/api.ts`
- Type-safe request/response handling
- Automatic authentication
- Global error handling

**Error Handling**
- React Error Boundaries for component errors
- Axios interceptors for API errors
- Toast notifications for user feedback
- Automatic retry with exponential backoff

## ⚙️ Configuration Options

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| VITE_API_URL | KumoMTA API endpoint | Yes | http://localhost:8000 |
| VITE_ENV | Environment name | No | development |
| VITE_API_TIMEOUT | Request timeout (ms) | No | 10000 |
| VITE_DEBUG | Enable debug logging | No | false |

### Performance Tuning

**Query Configuration**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      staleTime: 5000,
      cacheTime: 300000,
      refetchOnWindowFocus: false,
    },
  },
});
```

**Build Optimization**
```typescript
// Vite automatically code-splits vendor libraries:
{
  'react-vendor': ['react', 'react-dom', 'react-router-dom'],
  'query-vendor': ['@tanstack/react-query'],
  'chart-vendor': ['chart.js', 'react-chartjs-2'],
  'form-vendor': ['react-hook-form'],
  'ui-vendor': ['lucide-react']
}
```

## 🧪 Testing

### Run All Tests
```bash
npm run test
```

### Watch Mode (Development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### UI Test Runner
```bash
npm run test:ui
```

### Test Suite Features
- **Unit Tests**: Component and hook testing
- **Integration Tests**: API service testing with MSW
- **Accessibility Tests**: Automated a11y checks with jest-axe
- **User Event Testing**: Realistic user interaction simulation

## 🏭 Building for Production

### 1. Create Production Build
```bash
npm run build
```

This generates optimized files in the `dist` directory with:
- Code splitting and tree shaking
- Minified JavaScript and CSS
- Optimized assets
- Source maps for debugging

### 2. Preview Production Build
```bash
npm run preview
```

### 3. Build Output
```
dist/
├── assets/
│   ├── react-vendor.[hash].js
│   ├── query-vendor.[hash].js
│   ├── chart-vendor.[hash].js
│   └── index.[hash].js
├── index.html
└── favicon.ico
```

## 🚢 Deployment

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name dashboard.example.com;
    root /var/www/kumo-dashboard/dist;

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### Apache Configuration

```apache
<VirtualHost *:80>
    ServerName dashboard.example.com
    DocumentRoot /var/www/kumo-dashboard/dist

    <Directory /var/www/kumo-dashboard/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # SPA routing
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

### Docker Deployment

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🛠️ Development

### Code Style & Linting
```bash
npm run lint
```

### Type Checking
```bash
npx tsc --noEmit
```

### Code Formatting
The project uses ESLint with TypeScript support. Run linting before committing:
```bash
npm run lint
```

## 📚 API Documentation

### KumoMTA Endpoints

The dashboard integrates with the following KumoMTA API endpoints:

**Metrics**
- `GET /api/admin/metrics/v1` - Server metrics

**Queue Operations**
- `GET /api/admin/bounce-list/v1` - Scheduled queue details
- `POST /api/admin/suspend/v1` - Suspend queue
- `POST /api/admin/resume/v1` - Resume queue
- `POST /api/admin/suspend-ready-q/v1` - Suspend ready queue

**Message Operations**
- `POST /api/admin/rebind/v1` - Rebind messages
- `POST /api/admin/bounce/v1` - Bounce messages

**Diagnostics**
- `GET /api/admin/trace-smtp-server/v1` - Trace logs
- `POST /api/admin/set-diagnostic-log-filter/v1` - Set diagnostic filter

**Configuration**
- `GET/PUT /api/admin/config/core` - Core configuration
- `GET/PUT /api/admin/config/integration` - Integration settings
- `GET/PUT /api/admin/config/performance` - Performance settings

## 🐛 Troubleshooting

### Connection Issues

**Problem**: Dashboard cannot connect to KumoMTA server

**Solutions**:
1. Verify `VITE_API_URL` in `.env` file
2. Check KumoMTA server is running: `curl http://localhost:8000/api/admin/metrics/v1`
3. Verify firewall allows connections on port 8000
4. Check CORS settings on KumoMTA server

### Build Issues

**Problem**: Build fails with TypeScript errors

**Solutions**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run build
```

### Performance Issues

**Problem**: Dashboard is slow or unresponsive

**Solutions**:
1. Increase `staleTime` in query configuration
2. Reduce `refetchInterval` for less frequent updates
3. Enable React DevTools Profiler to identify bottlenecks
4. Check browser console for errors

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### 1. Fork the Repository
```bash
git clone https://github.com/YOUR_USERNAME/kumo-mta-dashboard.git
```

### 2. Create Feature Branch
```bash
git checkout -b feature/amazing-feature
```

### 3. Make Changes
- Write tests for new features
- Follow existing code style
- Update documentation
- Add TypeScript types

### 4. Run Tests
```bash
npm run test
npm run lint
```

### 5. Commit Changes
```bash
git commit -m 'feat: add amazing feature'
```

### 6. Push and Create PR
```bash
git push origin feature/amazing-feature
```

## 📝 Changelog

### [1.0.0] - 2025-01-19
**Added**
- Initial release with core dashboard functionality
- Real-time metrics display with auto-refresh
- Advanced queue management with filtering
- KumoMTA API integration
- Configuration editor (Core, Integration, Performance)
- Queue suspension/resume operations
- Message rebinding and bouncing
- Diagnostic logging and tracing
- CSV export functionality
- Toast notification system
- Error boundary protection
- Loading skeleton states
- Comprehensive test suite

**Features**
- Real-time dashboard with 5-second auto-refresh
- 24-hour throughput chart visualization
- Multi-filter queue search
- Queue status management
- Server health monitoring
- Responsive mobile-first design
- Accessibility compliance (WCAG 2.1)

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🔒 Security

### Reporting Security Issues

If you discover a security vulnerability, please email security@example.com instead of using the issue tracker.

### Security Features

- **Authentication**: Token-based authentication with automatic refresh
- **Authorization**: Role-based access control
- **HTTPS**: Enforce HTTPS in production
- **CORS**: Properly configured CORS headers
- **XSS Protection**: Content Security Policy headers
- **Input Validation**: Client and server-side validation

## 💬 Support

### Documentation
- [KumoMTA Documentation](https://kumomta.com/docs)
- [React Documentation](https://react.dev)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)

### Community
- [GitHub Issues](https://github.com/thepingdoctor/kumo-mta-dashboard/issues)
- [GitHub Discussions](https://github.com/thepingdoctor/kumo-mta-dashboard/discussions)

### Commercial Support
For enterprise support, please contact support@example.com

## 🙏 Acknowledgments

### Core Technologies
- [React](https://reactjs.org/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool
- [TailwindCSS](https://tailwindcss.com/) - Styling framework
- [TanStack Query](https://tanstack.com/query) - Data fetching
- [Chart.js](https://www.chartjs.org/) - Data visualization
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [Lucide Icons](https://lucide.dev/) - Icon library
- [Axios](https://axios-http.com/) - HTTP client

### Contributors
- [Adam Blackington](https://adbl.contact) - Project Lead

### Special Thanks
- KumoMTA team for their excellent email server
- Open source community for amazing tools
- All contributors and testers

---

**Made with ❤️ for the email infrastructure community**
