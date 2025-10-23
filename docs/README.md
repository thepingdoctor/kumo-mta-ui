# KumoMTA UI Documentation

Welcome to the KumoMTA UI documentation. This directory contains comprehensive guides for developers, operators, and contributors.

## Documentation Index

### 📘 [API Documentation](./API.md)
Complete API reference for the KumoMTA UI REST interface.

**Contents:**
- Authentication and authorization
- Queue management endpoints
- Configuration management endpoints
- Error handling and rate limiting
- Usage examples

**Key Topics:**
- REST API endpoints and methods
- Request/response payloads
- Query parameters and filters
- Error codes and handling
- Rate limiting policies

---

### 🧩 [Component Documentation](./COMPONENTS.md)
Detailed component documentation and usage guidelines.

**Contents:**
- Component architecture overview
- Core components (Dashboard, Layout, ErrorBoundary)
- Queue management components
- Configuration components
- Custom hooks (useQueue)
- Type definitions
- State management (Zustand)

**Key Topics:**
- Component props and interfaces
- Usage examples
- State management patterns
- Custom hooks implementation
- TypeScript type definitions
- Styling guidelines with TailwindCSS

---

### 🚀 [Deployment Guide](./DEPLOYMENT.md)
Complete deployment guide for production environments.

**Contents:**
- Prerequisites and requirements
- Environment configuration
- Build process and optimization
- Deployment options (Static hosting, Web servers, Docker)
- Server configuration (Nginx, Apache)
- Security considerations
- Performance optimization
- Monitoring and logging

**Key Topics:**
- Production build process
- Nginx and Apache configuration
- Docker containerization
- SSL/TLS setup with Let's Encrypt
- Content Security Policy (CSP)
- CDN integration
- Health checks and monitoring

---

### 🔧 [Troubleshooting Guide](./TROUBLESHOOTING.md)
Common issues and solutions for development and deployment.

**Contents:**
- Installation issues
- Development server issues
- Build issues
- Runtime errors
- API connection issues
- Performance issues
- Browser compatibility
- Deployment issues

**Key Topics:**
- Common error messages and fixes
- Debugging techniques
- Performance optimization
- CORS configuration
- Memory leak prevention
- Browser compatibility
- Production deployment issues

---

## Quick Links

### Getting Started
1. **Installation**: See [main README](../README.md#installation)
2. **Configuration**: See [Deployment Guide](./DEPLOYMENT.md#environment-configuration)
3. **API Setup**: See [API Documentation](./API.md#base-configuration)

### Development
- **Components**: [Component Documentation](./COMPONENTS.md)
- **API Integration**: [API Documentation](./API.md)
- **Troubleshooting**: [Troubleshooting Guide](./TROUBLESHOOTING.md)

### Production
- **Deployment**: [Deployment Guide](./DEPLOYMENT.md)
- **Security**: [Deployment Guide - Security](./DEPLOYMENT.md#security-considerations)
- **Monitoring**: [Deployment Guide - Monitoring](./DEPLOYMENT.md#monitoring-and-logging)

---

## Architecture Overview

### Technology Stack

**Frontend:**
- React 18.3.1 with TypeScript 5.5
- TailwindCSS 3.4 for styling
- Vite 5.4 for build tooling
- TanStack Query 5.24 for data fetching
- Zustand 4.5 for state management
- React Hook Form 7.50 for forms
- Chart.js 4.4 for data visualization

**Development Tools:**
- ESLint for code quality
- TypeScript for type safety
- Vite for fast development

### Project Structure

```
kumo-mta-ui/
├── src/
│   ├── components/         # React components
│   │   ├── Dashboard.tsx
│   │   ├── Layout.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── queue/         # Queue management
│   │   └── config/        # Configuration
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API services
│   ├── store/             # State management
│   ├── types/             # TypeScript types
│   ├── utils/             # Utility functions
│   └── constants/         # Application constants
├── docs/                  # Documentation
├── public/                # Static assets
└── dist/                  # Build output
```

### Data Flow

```
User Action
    ↓
Component (React)
    ↓
Custom Hook (useQueue)
    ↓
TanStack Query
    ↓
API Service (axios)
    ↓
KumoMTA Server
    ↓
Response
    ↓
State Update (React Query Cache)
    ↓
Component Re-render
```

---

## API Integration

### Authentication

All API requests require Bearer token authentication:

```typescript
headers: {
  'Authorization': 'Bearer <token>'
}
```

### Base Configuration

```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});
```

### Key Endpoints

- **Queue**: `GET /queue`, `POST /queue`, `PUT /queue/:id/status`
- **Metrics**: `GET /queue/metrics`
- **Config**: `PUT /config/core`, `PUT /config/integration`, `PUT /config/performance`

See [API Documentation](./API.md) for complete reference.

---

## Configuration

### Environment Variables

Required environment variables:

```env
VITE_API_URL=http://your-kumomta-server:3000
```

Optional variables:

```env
VITE_API_TIMEOUT=10000
VITE_ENABLE_WEBSOCKET=true
VITE_ENABLE_ANALYTICS=false
```

### Configuration Sections

The application supports three configuration sections:

1. **Core Settings**: Server configuration, connections, ports
2. **Integration Settings**: API endpoints, webhooks, backups
3. **Performance Settings**: Cache, load balancing, resources

See [Component Documentation](./COMPONENTS.md#configeditor) for details.

---

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access at http://localhost:5173
```

### Building

```bash
# Production build
npm run build

# Preview build
npm run preview
```

### Code Quality

```bash
# Lint code
npm run lint

# Type checking
npm run typecheck
```

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Production build created (`npm run build`)
- [ ] Web server configured (Nginx/Apache)
- [ ] SSL certificates installed
- [ ] CORS configured on API server
- [ ] Error monitoring set up (Sentry)
- [ ] Performance monitoring configured
- [ ] Health checks enabled
- [ ] Backup strategy in place
- [ ] Documentation reviewed

See [Deployment Guide](./DEPLOYMENT.md) for detailed instructions.

---

## Common Tasks

### Adding a New Component

1. Create component file in `src/components/`
2. Define TypeScript interfaces for props
3. Implement component with proper typing
4. Add to routing if needed
5. Update documentation

### Adding a New API Endpoint

1. Update `src/services/api.ts`
2. Define TypeScript types in `src/types/`
3. Create or update custom hook
4. Use in component
5. Update API documentation

### Updating Configuration

1. Update types in `src/types/config.ts`
2. Update `src/components/config/configData.ts`
3. Update API service
4. Test configuration editor
5. Update documentation

---

## Performance Best Practices

### Code Splitting

```typescript
const Dashboard = lazy(() => import('./components/Dashboard'));

<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

### Memoization

```typescript
const expensiveValue = useMemo(() => compute(data), [data]);
const MemoizedComponent = memo(Component);
const handleClick = useCallback(() => {}, [deps]);
```

### Optimization

- Use TanStack Query for caching
- Implement virtual scrolling for large lists
- Optimize images and assets
- Enable gzip compression
- Use CDN for static assets

---

## Security Best Practices

### Environment Variables

- Never commit `.env` files
- Use different values for dev/prod
- Rotate secrets regularly

### API Security

- Use HTTPS only in production
- Implement rate limiting
- Validate all input
- Use Content Security Policy

### Authentication

- Store tokens securely
- Implement token refresh
- Handle 401 errors properly
- Clear tokens on logout

---

## Contributing

### Code Style

- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks
- Keep components focused and reusable
- Write meaningful comments

### Testing

- Write unit tests for hooks
- Write integration tests for components
- Test API integration
- Test error scenarios

### Documentation

- Update documentation with code changes
- Add JSDoc comments for complex functions
- Include usage examples
- Document breaking changes

---

## Support and Resources

### Internal Documentation
- [API Documentation](./API.md)
- [Component Documentation](./COMPONENTS.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

### External Resources
- [KumoMTA Official Documentation](https://kumomta.com/docs/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev/)

### Community
- GitHub Issues: Report bugs and request features
- GitHub Discussions: Ask questions and share ideas

---

## License

This project is licensed under the MIT License. See [LICENSE](../LICENSE) file for details.

---

## Changelog

### Recent Updates
- ✅ Complete API documentation
- ✅ Comprehensive component documentation
- ✅ Deployment guide with Docker support
- ✅ Troubleshooting guide
- ✅ Architecture overview
- ✅ Security best practices

### Upcoming
- WebSocket integration guide
- Advanced performance tuning
- Monitoring and alerting setup
- Multi-language support guide
