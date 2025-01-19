# KumoMTA Admin Dashboard

[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-blue.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

A modern, responsive web interface for managing KumoMTA email servers. This dashboard provides comprehensive tools for monitoring, configuring, and maintaining email delivery infrastructure.

## 🚀 Key Features

- **Real-time Dashboard**
  - Live email delivery metrics
  - Server health monitoring
  - Interactive throughput charts
  - System status indicators

- **Queue Management**
  - Real-time queue monitoring
  - Priority-based queue management
  - Customer service tracking
  - Wait time analytics

- **Configuration Management**
  - Visual configuration editor
  - Server settings management
  - Integration configuration
  - Performance tuning

- **Modern Tech Stack**
  - React 18 with TypeScript
  - TailwindCSS for styling
  - TanStack Query for data fetching
  - Zustand for state management

## 📋 Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- A running KumoMTA server instance

## 🛠 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/kumo-mta-dashboard.git
   cd kumo-mta-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```env
   VITE_API_URL=http://your-kumomta-server:3000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## 💻 Usage

### Dashboard Overview

The dashboard provides real-time monitoring of your email infrastructure:

```typescript
// Example: Accessing dashboard metrics
const metrics = {
  sent: emailMetrics.sent,
  bounced: emailMetrics.bounced,
  delayed: emailMetrics.delayed,
  throughput: emailMetrics.throughput
};
```

### Queue Management

Monitor and manage your email queue:

```typescript
// Example: Update email status
const updateEmailStatus = async (id: string, status: string) => {
  await apiService.queue.updateStatus(id, status);
};
```

### Configuration

The configuration editor supports three main sections:

1. Core Settings
   - Server name
   - Connection limits
   - Port configuration
   - DNS settings

2. Integration Settings
   - API endpoints
   - Webhooks
   - Backup settings
   - Failover configuration

3. Performance Settings
   - Cache configuration
   - Load balancing
   - Resource limits
   - Queue workers

## ⚙️ Configuration Options

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| VITE_API_URL | KumoMTA API endpoint | Yes | http://localhost:3000 |

### Performance Tuning

```typescript
// Example: Configure cache settings
const cacheConfig = {
  enabled: true,
  maxSize: 512, // MB
  ttl: 3600     // seconds
};
```

## 🧪 Testing

Run the test suite:

```bash
npm run test
```

For development with watch mode:

```bash
npm run test:watch
```

## 📦 Building for Production

1. Create production build:
   ```bash
   npm run build
   ```

2. Preview the build:
   ```bash
   npm run preview
   ```

The built files will be in the `dist` directory.

## 🚀 Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `dist` directory to your web server.

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name dashboard.example.com;
    root /var/www/kumo-dashboard/dist;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 🐛 Known Issues

- WebSocket reconnection needs improvement
- Mobile view optimization for complex tables
- Large dataset performance optimization

## 📝 Changelog

### [1.0.0] - 2024-03-XX
- Initial release
- Core dashboard functionality
- Queue management system
- Configuration editor
- Real-time monitoring

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Contributors

- [Adam Blackington](https://github.com/thepingdoctor) - Project Lead

## 📞 Support

For support, please:
1. Check the [GitHub Issues](https://github.com/yourusername/kumo-mta-dashboard/issues)
2. Create a new issue if needed
3. Join our [Discord community](https://discord.gg/kumomta)

## 🙏 Acknowledgments

- [React](https://reactjs.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [TanStack Query](https://tanstack.com/query)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Lucide Icons](https://lucide.dev/)
