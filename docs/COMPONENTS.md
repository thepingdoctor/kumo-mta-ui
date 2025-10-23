# KumoMTA UI - Component Documentation

## Overview

The KumoMTA UI is built with React 18, TypeScript, and TailwindCSS. Components follow a modular architecture with clear separation of concerns.

## Component Architecture

```
src/
├── components/
│   ├── Dashboard.tsx          # Main dashboard with metrics
│   ├── Layout.tsx             # Application layout wrapper
│   ├── ErrorBoundary.tsx      # Error handling component
│   ├── queue/
│   │   └── QueueManager.tsx   # Queue management interface
│   └── config/
│       ├── ConfigEditor.tsx   # Configuration editor
│       ├── ConfigSection.tsx  # Configuration section wrapper
│       └── configData.ts      # Configuration definitions
├── hooks/
│   └── useQueue.ts            # Queue data management hook
├── services/
│   └── api.ts                 # API service layer
├── store/
│   └── authStore.ts           # Authentication state
└── types/
    ├── index.ts               # Common types
    ├── config.ts              # Configuration types
    └── queue.ts               # Queue types
```

## Core Components

### Dashboard

**Path**: `src/components/Dashboard.tsx`

Main dashboard component displaying real-time email delivery metrics and server status.

**Props**: None

**Features**:
- Real-time metrics display (sent, bounced, delayed, throughput)
- Interactive chart for hourly throughput
- Server status indicator
- Responsive grid layout

**Usage**:
```tsx
import Dashboard from './components/Dashboard';

function App() {
  return <Dashboard />;
}
```

**State**:
- `metrics`: Email delivery statistics (memoized)
- `chartData`: Chart.js compatible data structure
- `chartOptions`: Chart configuration

**Dependencies**:
- `lucide-react`: Icons (Activity, Mail, AlertTriangle, Clock)
- `chart.js`: Charting library
- `react-chartjs-2`: React wrapper for Chart.js

---

### Layout

**Path**: `src/components/Layout.tsx`

Application layout wrapper providing navigation and structure.

**Props**:
```typescript
interface LayoutProps {
  children: React.ReactNode;
}
```

**Features**:
- Responsive navigation sidebar
- Main content area
- Breadcrumb navigation
- Mobile menu support

**Usage**:
```tsx
import Layout from './components/Layout';

function App() {
  return (
    <Layout>
      <YourContent />
    </Layout>
  );
}
```

---

### ErrorBoundary

**Path**: `src/components/ErrorBoundary.tsx`

Error boundary component for graceful error handling.

**Props**:
```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
```

**Features**:
- Catches React component errors
- Displays user-friendly error message
- Provides error details in development
- Optional custom fallback UI

**Usage**:
```tsx
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}
```

**State**:
- `hasError`: Boolean flag for error state
- `error`: Error object with details

---

### QueueManager

**Path**: `src/components/queue/QueueManager.tsx`

Queue management interface for monitoring and managing email queue.

**Props**: None

**Features**:
- Real-time queue monitoring
- Filter by service type, status, date range
- Search functionality
- Add customer to queue
- Update queue item status
- Priority-based display
- Wait time analytics

**Usage**:
```tsx
import QueueManager from './components/queue/QueueManager';

function App() {
  return <QueueManager />;
}
```

**State**:
- `filters`: QueueFilter object
- `isAddModalOpen`: Modal visibility flag

**Hooks**:
- `useQueue(filters)`: Custom hook for queue data management

**Methods**:
```typescript
handleAddCustomer(customerData: Partial<QueueItem>): Promise<void>
handleUpdateStatus(itemId: string, status: QueueItem['status']): Promise<void>
```

**Dependencies**:
- `useQueue` hook: Data fetching and mutations
- `lucide-react`: UI icons
- TanStack Query: Server state management

---

### ConfigEditor

**Path**: `src/components/config/ConfigEditor.tsx`

Visual configuration editor for KumoMTA server settings.

**Props**: None

**Features**:
- Three-section configuration (Core, Integration, Performance)
- Form validation with react-hook-form
- Dirty state tracking
- Auto-save prevention when unchanged
- Reset functionality
- Loading states

**Usage**:
```tsx
import ConfigEditor from './components/config/ConfigEditor';

function App() {
  return <ConfigEditor />;
}
```

**Form Management**:
```typescript
const {
  control,        // Form control object
  handleSubmit,   // Submit handler
  reset,          // Reset form to defaults
  formState: {
    isDirty,      // Has form changed?
    isSubmitting, // Is form submitting?
    errors        // Validation errors
  }
} = useForm<ConfigValues>();
```

**Configuration Sections**:
1. **Core Settings**: Server name, connections, ports, DNS
2. **Integration Settings**: API, webhooks, backups, failover
3. **Performance Settings**: Cache, load balancing, resources

**Methods**:
```typescript
onSubmit(data: ConfigValues): Promise<void>
```

---

### ConfigSection

**Path**: `src/components/config/ConfigSection.tsx`

Reusable configuration section wrapper component.

**Props**:
```typescript
interface ConfigSectionProps {
  section: ConfigSection;
  control: Control<ConfigValues>;
  errors: FieldErrors<ConfigValues>;
}
```

**Features**:
- Collapsible section header
- Field rendering based on type
- Validation error display
- Field descriptions and labels

**Usage**:
```tsx
import ConfigSection from './components/config/ConfigSection';

<ConfigSection
  section={section}
  control={control}
  errors={errors}
/>
```

**Supported Field Types**:
- `text`: Text input
- `number`: Number input
- `boolean`: Checkbox/toggle
- `select`: Dropdown selection
- `array`: Array input (comma-separated)

---

## Custom Hooks

### useQueue

**Path**: `src/hooks/useQueue.ts`

Custom hook for queue data management using TanStack Query.

**Parameters**:
```typescript
filters: QueueFilter
```

**Returns**:
```typescript
{
  data: QueueItem[];           // Queue items
  isLoading: boolean;          // Loading state
  error: Error | null;         // Error state
  updateStatus: UseMutationResult;  // Status mutation
  addCustomer: UseMutationResult;   // Add customer mutation
}
```

**Usage**:
```tsx
import { useQueue } from '../hooks/useQueue';

function MyComponent() {
  const {
    data: queueItems,
    isLoading,
    error,
    updateStatus,
    addCustomer
  } = useQueue({ status: 'waiting' });

  // Use updateStatus mutation
  const handleUpdate = async (id: string, status: string) => {
    await updateStatus.mutateAsync({ id, status });
  };

  // Use addCustomer mutation
  const handleAdd = async (data: Partial<QueueItem>) => {
    await addCustomer.mutateAsync(data);
  };
}
```

**Features**:
- Automatic refetching on filter changes
- Optimistic updates
- Cache invalidation on mutations
- Error handling

---

## State Management

### Auth Store (Zustand)

**Path**: `src/store/authStore.ts`

Global authentication state management using Zustand.

**Store Structure**:
```typescript
interface AuthStore {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}
```

**Usage**:
```tsx
import { useAuthStore } from '../store/authStore';

function MyComponent() {
  const { isAuthenticated, login, logout } = useAuthStore();

  const handleLogin = () => {
    login('token-123', { id: '1', name: 'User' });
  };

  const handleLogout = () => {
    logout();
  };
}
```

---

## Type Definitions

### Queue Types

**Path**: `src/types/queue.ts`

```typescript
interface QueueItem {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceType: string;
  priority: number;
  status: 'waiting' | 'in-progress' | 'completed' | 'cancelled';
  notes: string;
  estimatedWaitTime: number;
  actualWaitTime?: number;
  createdAt: string;
  updatedAt: string;
  notificationsSent: NotificationRecord[];
}

interface QueueFilter {
  serviceType?: string;
  status?: QueueItem['status'];
  searchQuery?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

interface QueueMetrics {
  totalWaiting: number;
  averageWaitTime: number;
  longestWaitTime: number;
  serviceUtilization: number;
  customersServedToday: number;
}
```

### Config Types

**Path**: `src/types/config.ts`

```typescript
interface CoreConfig {
  serverName: string;
  maxConcurrentConnections: number;
  defaultPort: number;
  ipv6Enabled: boolean;
  dnsResolvers: string[];
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  maxMessageSize: number;
  queueRetryInterval: number;
}

interface IntegrationConfig {
  apiEndpoint: string;
  apiVersion: string;
  apiKey: string;
  webhookUrl: string;
  syncInterval: number;
  backupEnabled: boolean;
  backupInterval: number;
  backupLocation: string;
  failoverEndpoint: string;
}

interface PerformanceConfig {
  cacheEnabled: boolean;
  cacheSize: number;
  cacheExpiration: number;
  loadBalancingStrategy: 'round-robin' | 'least-connections' | 'ip-hash';
  maxMemoryUsage: number;
  maxCpuUsage: number;
  connectionTimeout: number;
  readTimeout: number;
  writeTimeout: number;
  queueWorkers: number;
}
```

---

## Styling Guidelines

### TailwindCSS Classes

Common patterns used throughout the application:

**Layout**:
```css
.space-y-6          /* Vertical spacing */
.grid.grid-cols-4   /* Responsive grid */
.flex.items-center  /* Flexbox alignment */
```

**Cards**:
```css
.rounded-lg.bg-white.p-6.shadow
```

**Buttons**:
```css
.inline-flex.items-center.px-4.py-2.border.rounded-md
.bg-blue-600.hover:bg-blue-700  /* Primary */
.bg-white.hover:bg-gray-50      /* Secondary */
```

**Text**:
```css
.text-2xl.font-bold.text-gray-900  /* Headings */
.text-sm.text-gray-600             /* Body */
.text-red-600                      /* Error */
```

---

## Best Practices

1. **Component Organization**: Keep components focused and single-purpose
2. **Type Safety**: Always use TypeScript interfaces for props and state
3. **Error Handling**: Wrap API calls in try-catch blocks
4. **Loading States**: Show loading indicators during async operations
5. **Accessibility**: Use semantic HTML and ARIA labels
6. **Memoization**: Use `useMemo` for expensive calculations
7. **Code Splitting**: Lazy load routes and heavy components
8. **Testing**: Write unit tests for hooks and integration tests for components
