# KumoMTA UI - System Architecture Documentation

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Authentication Flow](#authentication-flow)
3. [State Management Architecture](#state-management-architecture)
4. [Data Flow Diagram](#data-flow-diagram)
5. [Real-Time Data Architecture](#real-time-data-architecture)
6. [Queue Status State Machine](#queue-status-state-machine)
7. [Technology Stack](#technology-stack)

---

## System Architecture Overview

The KumoMTA UI follows a modern client-side architecture with clear separation of concerns between presentation, state management, and data fetching.

```mermaid
graph TB
    subgraph "Browser Client"
        UI[React UI Layer]
        Router[React Router]
        ErrorBoundary[Error Boundary]

        subgraph "State Management"
            AuthStore[Zustand Auth Store]
            QueryCache[TanStack Query Cache]
            IndexedDB[(IndexedDB)]
        end

        subgraph "Business Logic"
            Hooks[Custom Hooks]
            Services[API Services]
        end
    end

    subgraph "Network Layer"
        Axios[Axios Client]
        Interceptors[Request/Response Interceptors]
    end

    subgraph "Backend Services"
        Gateway[API Gateway/Middleware<br/>CUSTOM - Needs Implementation]
        KumoMTA[KumoMTA Server<br/>Native API]
        PostgreSQL[(PostgreSQL<br/>Audit Logs)]
    end

    subgraph "External Services"
        SMTP[SMTP Servers]
        DNS[DNS Resolvers]
        Webhooks[Webhook Endpoints]
    end

    UI --> Router
    Router --> ErrorBoundary
    ErrorBoundary --> Hooks
    Hooks --> Services
    Hooks --> AuthStore
    Hooks --> QueryCache
    QueryCache --> IndexedDB

    Services --> Axios
    Axios --> Interceptors
    Interceptors --> Gateway

    Gateway --> KumoMTA
    Gateway --> PostgreSQL

    KumoMTA --> SMTP
    KumoMTA --> DNS
    KumoMTA --> Webhooks

    style Gateway fill:#ff9999
    style PostgreSQL fill:#99ccff
    style KumoMTA fill:#99ff99
```

### Architecture Layers

#### 1. Presentation Layer (React Components)
- **Location**: `/src/components/`
- **Responsibility**: UI rendering, user interaction, visual feedback
- **Key Components**:
  - `Dashboard.tsx` - Real-time metrics display
  - `QueueManager.tsx` - Queue management interface
  - `ConfigEditor.tsx` - Server configuration
  - `LoginPage.tsx` - Authentication UI

#### 2. State Management Layer
- **Auth State**: Zustand store with localStorage persistence
- **Server State**: TanStack Query with automatic caching
- **Offline State**: IndexedDB for offline-first PWA support

#### 3. Business Logic Layer
- **Custom Hooks**: Encapsulate data fetching and business logic
- **API Services**: Centralized API communication

#### 4. Network Layer
- **Axios Client**: HTTP communication with interceptors
- **Request Interceptors**: Add authentication, CSRF tokens
- **Response Interceptors**: Error handling, token refresh, 401 redirect

#### 5. Backend Layer
- **KumoMTA Native API**: Email server operations (verified endpoints)
- **Custom Middleware**: Queue management, configuration (needs implementation)
- **PostgreSQL**: Audit logs and user management

---

## Authentication Flow

HTTP Basic Authentication with JWT-like token management using Zustand and localStorage persistence.

```mermaid
sequenceDiagram
    participant User
    participant LoginPage
    participant AuthStore
    participant LocalStorage
    participant AxiosClient
    participant Backend
    participant ProtectedRoute

    User->>LoginPage: Enter credentials + select role
    LoginPage->>LoginPage: Validate form (react-hook-form)
    LoginPage->>LoginPage: Create Base64 token<br/>btoa(email:password)

    Note over LoginPage,AuthStore: Mock validation (replace with real API)
    LoginPage->>AuthStore: login(user, token)
    AuthStore->>LocalStorage: Persist auth state
    AuthStore->>AuthStore: Set isAuthenticated=true

    AuthStore-->>LoginPage: Success
    LoginPage->>Router: navigate('/')

    Router->>ProtectedRoute: Check authentication
    ProtectedRoute->>AuthStore: Get auth state

    alt Authenticated
        ProtectedRoute-->>Router: Render protected content
    else Not Authenticated
        ProtectedRoute-->>Router: Redirect to /login
    end

    Note over User,Backend: Subsequent API Requests

    User->>AxiosClient: Make API request
    AxiosClient->>AuthStore: Get token
    AuthStore-->>AxiosClient: Return token
    AxiosClient->>AxiosClient: Add Authorization header<br/>Basic ${token}
    AxiosClient->>Backend: Request with auth header

    alt Success (200-299)
        Backend-->>AxiosClient: Response data
        AxiosClient-->>User: Display data
    else Unauthorized (401)
        Backend-->>AxiosClient: 401 Unauthorized
        AxiosClient->>AuthStore: logout()
        AuthStore->>LocalStorage: Clear auth state
        AxiosClient->>Router: Redirect to /login
    else Forbidden (403)
        Backend-->>AxiosClient: 403 Forbidden
        AxiosClient-->>User: Show error toast
    else Server Error (500+)
        Backend-->>AxiosClient: 5xx Server Error
        AxiosClient-->>User: Show error toast
    end
```

### Authentication Components

#### 1. Login Process
```typescript
// LoginPage.tsx - Line 34-60
const onSubmit = async (data: LoginFormData) => {
  // Create HTTP Basic Auth token
  const token = btoa(`${data.email}:${data.password}`);

  // Mock validation - REPLACE WITH REAL API CALL
  const user = {
    id: '1',
    email: data.email,
    name: data.email.split('@')[0],
    role: data.role,
  };

  login(user, token);
  navigate('/');
};
```

#### 2. Token Storage
```typescript
// authStore.ts - Line 16-51
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => {
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'kumomta-auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

#### 3. Request Authentication
```typescript
// api.ts - Line 16-38
api.interceptors.request.use(
  config => {
    const token = useAuthStore.getState().token;

    if (token) {
      // KumoMTA expects HTTP Basic Auth
      config.headers.Authorization = `Basic ${token}`;
    }

    // Add CSRF token if available
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }

    return config;
  }
);
```

#### 4. 401 Handling
```typescript
// api.ts - Line 41-66
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Security Features

1. **HTTP Basic Authentication**: Compatible with KumoMTA's native auth
2. **CSRF Protection**: Token injection from meta tag
3. **Automatic Logout**: On 401 responses
4. **Persistent Sessions**: localStorage with Zustand middleware
5. **Role-Based Access**: User roles stored in auth state

---

## State Management Architecture

A hybrid state management approach using Zustand for auth state and TanStack Query for server state.

```mermaid
graph TB
    subgraph "Application State"
        Component[React Components]
    end

    subgraph "Auth State - Zustand"
        AuthStore[Auth Store]
        LocalStorage[(localStorage)]

        AuthStore --> LocalStorage
        LocalStorage --> AuthStore
    end

    subgraph "Server State - TanStack Query"
        QueryClient[Query Client]
        QueryCache[(Query Cache)]

        subgraph "Query Keys"
            MetricsKey['kumomta-metrics']
            QueueKey['queue']
            BouncesKey['kumomta-bounces']
            ConfigKey['config']
        end

        QueryClient --> QueryCache
        QueryCache --> MetricsKey
        QueryCache --> QueueKey
        QueryCache --> BouncesKey
        QueryCache --> ConfigKey
    end

    subgraph "Offline State - IndexedDB"
        OfflineDB[(IndexedDB)]

        subgraph "Object Stores"
            DashboardStore[dashboard-data]
            QueueStore[queue-data]
            AnalyticsStore[analytics-data]
            ConfigStore[config-data]
            PendingStore[pending-requests]
        end

        OfflineDB --> DashboardStore
        OfflineDB --> QueueStore
        OfflineDB --> AnalyticsStore
        OfflineDB --> ConfigStore
        OfflineDB --> PendingStore
    end

    Component --> AuthStore
    Component --> QueryClient
    Component --> OfflineDB

    style AuthStore fill:#ffe6e6
    style QueryCache fill:#e6f3ff
    style OfflineDB fill:#e6ffe6
```

### State Management Decision Tree

```mermaid
graph TD
    Start{What type of data?}

    Start -->|User authentication| Auth[Use Zustand Auth Store]
    Start -->|Server data fetching| Server{Does it need caching?}
    Start -->|Offline support| Offline[Use IndexedDB]
    Start -->|UI state only| Local[Use React useState]

    Server -->|Yes - frequently accessed| Query[Use TanStack Query]
    Server -->|No - one-time fetch| Direct[Direct API call]

    Auth --> AuthExample[Example: user, token,<br/>isAuthenticated]
    Query --> QueryExample[Example: metrics, queue,<br/>bounces, config]
    Offline --> OfflineExample[Example: pending requests,<br/>cached dashboard data]
    Local --> LocalExample[Example: modal open/close,<br/>form inputs]

    style Auth fill:#ffcccc
    style Query fill:#ccddff
    style Offline fill:#ccffcc
    style Local fill:#ffffcc
```

### State Management Patterns

#### 1. Zustand for Auth State
**Use When:**
- Managing authentication state
- Persisting user sessions
- Storing user profile data

```typescript
// Usage Example
const { user, token, isAuthenticated, login, logout } = useAuthStore();
```

#### 2. TanStack Query for Server State
**Use When:**
- Fetching data from API
- Need automatic caching
- Want refetch/retry logic
- Need optimistic updates

```typescript
// Usage Example - useKumoMTA.ts
export const useKumoMetrics = (refetchInterval = 5000) => {
  return useQuery({
    queryKey: ['kumomta-metrics'],
    queryFn: async () => {
      const response = await apiService.kumomta.getMetrics();
      return response.data;
    },
    refetchInterval,
    retry: 3,
    staleTime: 3000,
  });
};
```

#### 3. IndexedDB for Offline Storage
**Use When:**
- Offline-first PWA features
- Storing large datasets
- Queuing offline requests
- Caching dashboard data

```typescript
// Usage Example - offlineStorage.ts
await offlineStorage.setItem('DASHBOARD', 'metrics', data, 30);
const cached = await offlineStorage.getItem('DASHBOARD', 'metrics');
```

#### 4. React useState for UI State
**Use When:**
- Component-specific state
- No need for persistence
- Simple toggle states
- Form inputs (with react-hook-form)

```typescript
// Usage Example
const [isModalOpen, setIsModalOpen] = useState(false);
```

### Query Configuration

```typescript
// App.tsx - Line 18-28
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5000,      // Data fresh for 5 seconds
      gcTime: 300000,       // Cache for 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});
```

---

## Data Flow Diagram

Complete request/response flow from UI component to backend and back.

```mermaid
sequenceDiagram
    participant Component
    participant Hook
    participant QueryCache
    participant APIService
    participant AxiosClient
    participant Interceptor
    participant Backend
    participant ErrorHandler
    participant ToastSystem

    Note over Component,Backend: Request Flow

    Component->>Hook: Call custom hook<br/>(useKumoMetrics)
    Hook->>QueryCache: Check cache

    alt Data in cache & fresh
        QueryCache-->>Hook: Return cached data
        Hook-->>Component: Render with cached data
    else Stale or no cache
        QueryCache->>APIService: Fetch data
        APIService->>AxiosClient: HTTP request
        AxiosClient->>Interceptor: Request interceptor
        Interceptor->>Interceptor: Add auth token
        Interceptor->>Interceptor: Add CSRF token
        Interceptor->>Backend: Authenticated request

        alt Success Response
            Backend-->>Interceptor: 200 OK + data
            Interceptor-->>AxiosClient: Pass response
            AxiosClient-->>APIService: Response data
            APIService-->>QueryCache: Cache response
            QueryCache-->>Hook: Return data
            Hook-->>Component: Update UI
        end

        alt Error Response
            Backend-->>Interceptor: Error status
            Interceptor->>ErrorHandler: Handle error

            alt 401 Unauthorized
                ErrorHandler->>AuthStore: logout()
                ErrorHandler->>Router: Redirect to /login
            else 403 Forbidden
                ErrorHandler->>ToastSystem: Show "Access forbidden"
            else 500+ Server Error
                ErrorHandler->>ToastSystem: Show "Server error"
            end

            ErrorHandler-->>Hook: Throw error
            Hook-->>Component: Show error UI
        end

        alt Network Error
            Backend-->>Interceptor: No response
            Interceptor->>ErrorHandler: Handle network error
            ErrorHandler->>ToastSystem: Show "Network error"
            ErrorHandler-->>Hook: Throw error
            Hook-->>Component: Show offline UI
        end
    end

    Note over Component,Backend: Optimistic Update Flow

    Component->>Hook: Call mutation<br/>(suspendQueue)
    Hook->>QueryCache: Optimistic update
    QueryCache-->>Component: Immediate UI update
    Hook->>APIService: Send request
    APIService->>Backend: POST request

    alt Success
        Backend-->>APIService: 200 OK
        APIService-->>QueryCache: Invalidate queries
        QueryCache->>Backend: Refetch data
        Backend-->>QueryCache: Fresh data
        QueryCache-->>Component: Update with real data
    else Failure
        Backend-->>APIService: Error
        APIService-->>QueryCache: Rollback optimistic update
        QueryCache-->>Component: Restore previous state
        APIService->>ToastSystem: Show error
    end
```

### Data Flow Layers

#### 1. Component Layer
- Triggers data requests via hooks
- Receives loading/error/success states
- Renders UI based on data state

#### 2. Hook Layer
- Encapsulates business logic
- Manages TanStack Query operations
- Provides clean API to components

```typescript
// useKumoMTA.ts - Line 52-85
export const useQueueControl = () => {
  const queryClient = useQueryClient();

  const suspendQueue = useMutation({
    mutationFn: ({ domain, reason, duration }) =>
      apiService.kumomta.suspendQueue(domain, reason, duration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kumomta-scheduled-queue'] });
      queryClient.invalidateQueries({ queryKey: ['kumomta-metrics'] });
    },
  });

  return { suspendQueue };
};
```

#### 3. Cache Layer
- Stores responses with stale-while-revalidate strategy
- Manages cache invalidation
- Handles refetch intervals

#### 4. API Service Layer
- Centralized endpoint definitions
- Type-safe request/response
- Consistent error handling

```typescript
// api.ts - Line 69-146
export const apiService = {
  kumomta: {
    getMetrics: () => api.get('/metrics.json'),
    suspendQueue: (domain, reason, duration) =>
      api.post('/api/admin/suspend/v1', { domain, reason, duration }),
  },
};
```

#### 5. Network Layer
- Axios instance with base configuration
- Request/response interceptors
- Authentication injection

#### 6. Error Handling Layer
- Response interceptor catches errors
- Maps status codes to actions
- Provides user feedback via toasts

---

## Real-Time Data Architecture

Dual strategy: HTTP polling (current) and WebSocket support (implemented but optional).

```mermaid
graph TB
    subgraph "Real-Time Data Strategies"
        Component[React Component]

        subgraph "Strategy 1: HTTP Polling - ACTIVE"
            PollingHook[useKumoMetrics]
            TanStackQuery[TanStack Query]
            RefetchInterval[refetchInterval: 5000ms]

            PollingHook --> TanStackQuery
            TanStackQuery --> RefetchInterval
        end

        subgraph "Strategy 2: WebSocket - IMPLEMENTED"
            WSHook[useWebSocket]
            WSClient[WebSocket Client]
            ReconnectLogic[Auto-reconnect<br/>Max 5 attempts<br/>3s interval]
            ConnectionPool[Connection Pool]

            WSHook --> WSClient
            WSClient --> ReconnectLogic
            WSClient --> ConnectionPool
        end

        Component --> PollingHook
        Component -.Optional.-> WSHook
    end

    subgraph "Backend"
        HTTPEndpoint[HTTP API<br/>/metrics.json]
        WSEndpoint[WebSocket Server<br/>ws://server:8000]
    end

    TanStackQuery --> HTTPEndpoint
    WSClient -.-> WSEndpoint

    style PollingHook fill:#90EE90
    style WSHook fill:#FFE4B5
```

### Polling Strategy (Current Implementation)

```mermaid
sequenceDiagram
    participant Component
    participant Hook
    participant QueryClient
    participant Backend

    Note over Component,Backend: Initial Load
    Component->>Hook: useKumoMetrics(5000)
    Hook->>QueryClient: Setup query with interval
    QueryClient->>Backend: Fetch /metrics.json
    Backend-->>QueryClient: Return data
    QueryClient-->>Hook: Return data
    Hook-->>Component: Render metrics

    Note over Component,Backend: Auto-refresh Loop
    loop Every 5 seconds
        QueryClient->>Backend: Refetch /metrics.json

        alt Data changed
            Backend-->>QueryClient: New data
            QueryClient->>Component: Trigger re-render
            Component->>Component: Update display
        else Data unchanged
            Backend-->>QueryClient: Same data
            QueryClient->>Component: No re-render
        end
    end

    Note over Component,Backend: Component Unmount
    Component->>Hook: Cleanup
    Hook->>QueryClient: Cancel interval
```

### WebSocket Strategy (Available but Optional)

```mermaid
stateDiagram-v2
    [*] --> Connecting: useWebSocket(url)

    Connecting --> Connected: onopen
    Connecting --> Error: onerror
    Connecting --> Reconnecting: Connection failed

    Connected --> ReceivingMessages: Listening
    Connected --> Disconnected: onclose

    ReceivingMessages --> Connected: Message received
    ReceivingMessages --> Disconnected: Connection lost

    Disconnected --> Reconnecting: Auto-reconnect enabled
    Disconnected --> [*]: Max attempts reached

    Reconnecting --> Connecting: Retry (3s delay)
    Reconnecting --> [*]: Max attempts (5) reached

    Error --> Reconnecting: Auto-reconnect enabled
    Error --> [*]: Auto-reconnect disabled

    note right of Reconnecting
        Exponential backoff
        Max 5 attempts
        3 second interval
    end note
```

### Real-Time Implementation

#### HTTP Polling
```typescript
// useKumoMTA.ts - Line 7-18
export const useKumoMetrics = (refetchInterval = 5000) => {
  return useQuery({
    queryKey: ['kumomta-metrics'],
    queryFn: async () => {
      const response = await apiService.kumomta.getMetrics();
      return response.data;
    },
    refetchInterval,  // Poll every 5 seconds
    retry: 3,
    staleTime: 3000,
  });
};
```

#### WebSocket Connection
```typescript
// useWebSocket.ts - Line 31-129
export const useWebSocket = (options: UseWebSocketOptions) => {
  const connect = useCallback(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
    };

    ws.onclose = () => {
      setIsConnected(false);

      // Auto-reconnect
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        setTimeout(connect, reconnectInterval);
      }
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setLastMessage(message);
      onMessage?.(message);
    };
  }, [url]);
};
```

### When to Use Each Strategy

| Feature | HTTP Polling | WebSocket |
|---------|-------------|-----------|
| **Latency** | 0-5 seconds | <100ms |
| **Server Load** | Higher | Lower |
| **Complexity** | Simple | Complex |
| **Reliability** | High | Moderate |
| **Offline Support** | Good | Poor |
| **Current Status** | ✅ Active | ⚠️ Available |

---

## Queue Status State Machine

Message lifecycle with 9 distinct states and valid transitions.

```mermaid
stateDiagram-v2
    [*] --> Queued: Message submitted

    Queued --> Scheduled: Message accepted
    Queued --> Failed: Validation error
    Queued --> Cancelled: User cancellation

    Scheduled --> Sending: Ready to send
    Scheduled --> Suspended: Queue suspended
    Scheduled --> Cancelled: User cancellation

    Sending --> Sent: Delivery success
    Sending --> Failed: Delivery error
    Sending --> Delayed: Temp failure / Retry

    Sent --> [*]: Final state

    Failed --> Bounced: Permanent failure
    Failed --> Queued: Manual retry

    Bounced --> [*]: Final state

    Delayed --> Scheduled: Retry scheduled
    Delayed --> Failed: Max retries

    Suspended --> Scheduled: Resume queue
    Suspended --> Cancelled: User cancellation

    Cancelled --> [*]: Final state

    note right of Queued
        Initial state
        Message in queue
        Awaiting validation
    end note

    note right of Scheduled
        Validated message
        Waiting for send
        Time/rate limited
    end note

    note right of Sending
        Active delivery
        Connection open
        SMTP handshake
    end note

    note right of Sent
        ✅ Success
        Message delivered
        Final state
    end note

    note right of Failed
        ❌ Error occurred
        Delivery failed
        May retry
    end note

    note right of Bounced
        ⛔ Permanent failure
        No retry
        Final state
    end note

    note right of Delayed
        ⏱️ Temporary failure
        Will retry
        Exponential backoff
    end note

    note right of Suspended
        ⏸️ Queue paused
        Admin action
        Can resume
    end note

    note right of Cancelled
        🚫 User cancelled
        Removed from queue
        Final state
    end note
```

### State Descriptions

#### Active States (Can Transition)

1. **Queued** (`waiting`)
   - Message submitted to queue
   - Awaiting validation and scheduling
   - **Transitions to**: Scheduled, Failed, Cancelled

2. **Scheduled** (`waiting`)
   - Message validated and scheduled
   - Waiting for rate limits / time slots
   - **Transitions to**: Sending, Suspended, Cancelled

3. **Sending** (`in-progress`)
   - Active SMTP delivery in progress
   - Connection open to recipient server
   - **Transitions to**: Sent, Failed, Delayed

4. **Delayed** (`waiting`)
   - Temporary delivery failure (4xx SMTP code)
   - Will retry with exponential backoff
   - **Transitions to**: Scheduled, Failed

5. **Suspended** (`waiting`)
   - Queue manually suspended by admin
   - Message held until resume
   - **Transitions to**: Scheduled, Cancelled

#### Terminal States (No Further Transitions)

6. **Sent** (`completed`)
   - ✅ Message successfully delivered
   - Final successful state

7. **Failed** (`failed`)
   - ❌ Delivery failed (network/server error)
   - May be manually retried

8. **Bounced** (`failed`)
   - ⛔ Permanent delivery failure (5xx SMTP code)
   - Invalid recipient / domain
   - No retry possible

9. **Cancelled** (`cancelled`)
   - 🚫 User or admin cancelled message
   - Removed from queue

### Transition Triggers

```mermaid
graph LR
    subgraph "User Actions"
        U1[Submit Message]
        U2[Cancel Message]
        U3[Manual Retry]
        U4[Suspend Queue]
        U5[Resume Queue]
    end

    subgraph "System Events"
        S1[Validation Complete]
        S2[Rate Limit Released]
        S3[SMTP Success 2xx]
        S4[SMTP Temp Error 4xx]
        S5[SMTP Perm Error 5xx]
        S6[Network Error]
        S7[Max Retries Reached]
    end

    subgraph "State Transitions"
        T1[Queued → Scheduled]
        T2[Scheduled → Sending]
        T3[Sending → Sent]
        T4[Sending → Delayed]
        T5[Sending → Failed]
        T6[Delayed → Scheduled]
        T7[Failed → Bounced]
        T8[Scheduled → Suspended]
        T9[Suspended → Scheduled]
        T10[Any → Cancelled]
    end

    U1 --> T1
    S1 --> T1

    S2 --> T2

    S3 --> T3

    S4 --> T4

    S5 --> T5
    S6 --> T5

    S4 --> T6

    S5 --> T7
    S7 --> T7

    U4 --> T8

    U5 --> T9

    U2 --> T10
```

### State Management in Code

```typescript
// queue.ts - Line 12-21
export interface QueueItem {
  id: string;
  status: 'waiting' | 'in-progress' | 'completed' | 'cancelled';
  // Maps to states:
  // waiting = Queued | Scheduled | Delayed | Suspended
  // in-progress = Sending
  // completed = Sent
  // cancelled = Cancelled | Failed | Bounced
}
```

---

## Technology Stack

### Frontend Technologies

```mermaid
graph TB
    subgraph "UI Layer"
        React[React 18.3<br/>UI Framework]
        Router[React Router 6.22<br/>Routing]
        Lucide[Lucide React 0.344<br/>Icons]
        Tailwind[TailwindCSS 3.4<br/>Styling]
    end

    subgraph "State Management"
        Query[TanStack Query 5.24<br/>Server State]
        Zustand[Zustand 4.5<br/>Auth State]
        RHF[React Hook Form 7.50<br/>Form State]
    end

    subgraph "Data & Network"
        Axios[Axios 1.6<br/>HTTP Client]
        ChartJS[Chart.js 4.4<br/>Visualization]
        DateFNS[date-fns 3.3<br/>Date Utils]
    end

    subgraph "Build & Dev"
        Vite[Vite 5.4<br/>Build Tool]
        TS[TypeScript 5.5<br/>Type Safety]
        ESLint[ESLint 9.9<br/>Linting]
    end

    subgraph "Testing"
        Vitest[Vitest 1.6<br/>Unit Tests]
        RTL[Testing Library 16.3<br/>Component Tests]
        Playwright[Playwright 1.56<br/>E2E Tests]
    end

    subgraph "PWA"
        VitePWA[Vite PWA Plugin<br/>Service Worker]
        Workbox[Workbox 7.3<br/>Caching]
        IndexedDB[(IndexedDB<br/>Offline Storage)]
    end
```

### Key Dependencies

| Category | Library | Version | Purpose |
|----------|---------|---------|---------|
| **Framework** | React | 18.3 | UI library with concurrent features |
| **Language** | TypeScript | 5.5 | Type-safe development |
| **Build** | Vite | 5.4 | Fast build tool and dev server |
| **Routing** | React Router | 6.22 | Client-side routing |
| **State** | TanStack Query | 5.24 | Async state management |
| **State** | Zustand | 4.5 | Lightweight state store |
| **HTTP** | Axios | 1.6 | Promise-based HTTP client |
| **Forms** | React Hook Form | 7.50 | Performant form handling |
| **Styling** | TailwindCSS | 3.4 | Utility-first CSS |
| **Charts** | Chart.js | 4.4 | Data visualization |
| **Icons** | Lucide React | 0.344 | Icon library |
| **Testing** | Vitest | 1.6 | Unit testing framework |
| **E2E** | Playwright | 1.56 | End-to-end testing |
| **PWA** | Vite PWA | 1.1 | Progressive web app |

---

## Backend Requirements

### Custom Middleware Needed

The following features require custom backend middleware implementation:

```mermaid
graph TB
    subgraph "Native KumoMTA API - ✅ Available"
        N1[GET /metrics.json<br/>Server metrics]
        N2[GET /api/admin/bounce-list/v1<br/>Scheduled queues]
        N3[POST /api/admin/suspend/v1<br/>Suspend queue]
        N4[POST /api/admin/resume/v1<br/>Resume queue]
        N5[POST /api/admin/rebind/v1<br/>Rebind messages]
        N6[POST /api/admin/bounce/v1<br/>Bounce messages]
    end

    subgraph "Custom Middleware Needed - ❌ Not Implemented"
        C1[GET /api/admin/queue/list<br/>Queue items with filters]
        C2[PUT /api/admin/queue/:id/status<br/>Update queue status]
        C3[POST /api/admin/queue/add<br/>Add customer to queue]
        C4[GET/PUT /api/admin/config/*<br/>Configuration management]
        C5[POST /api/admin/auth/login<br/>User authentication]
        C6[GET /api/admin/audit/logs<br/>Audit trail]
    end

    subgraph "Database Required - ❌ Not Implemented"
        DB1[(PostgreSQL<br/>User management)]
        DB2[(PostgreSQL<br/>Audit logs)]
        DB3[(PostgreSQL<br/>Queue state)]
    end

    C1 --> DB3
    C2 --> DB3
    C3 --> DB3
    C4 --> DB1
    C5 --> DB1
    C6 --> DB2

    style N1 fill:#90EE90
    style N2 fill:#90EE90
    style N3 fill:#90EE90
    style N4 fill:#90EE90
    style N5 fill:#90EE90
    style N6 fill:#90EE90

    style C1 fill:#FFB6C1
    style C2 fill:#FFB6C1
    style C3 fill:#FFB6C1
    style C4 fill:#FFB6C1
    style C5 fill:#FFB6C1
    style C6 fill:#FFB6C1
```

### Implementation Roadmap

1. **API Gateway/Middleware Layer**
   - Express.js or FastAPI server
   - Sits between UI and KumoMTA
   - Handles authentication, authorization
   - Manages custom queue operations

2. **PostgreSQL Database**
   - User authentication and roles
   - Audit log persistence
   - Queue state management
   - Configuration storage

3. **Authentication Service**
   - Replace mock login with real validation
   - JWT or session-based auth
   - Role-based access control (RBAC)
   - Password hashing (bcrypt)

4. **Queue Management Service**
   - CRUD operations for queue items
   - Status transition validation
   - Filter and search implementation
   - CSV export generation

---

## Performance Optimizations

### Query Optimization

```typescript
// Retry with exponential backoff
retry: 3,
retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),

// Smart caching
staleTime: 5000,    // Fresh for 5 seconds
gcTime: 300000,     // Cache for 5 minutes
refetchOnWindowFocus: false,
```

### Code Splitting

```typescript
// Vite automatically splits vendor bundles
{
  'react-vendor': ['react', 'react-dom', 'react-router-dom'],
  'query-vendor': ['@tanstack/react-query'],
  'chart-vendor': ['chart.js', 'react-chartjs-2'],
}
```

### Debouncing

```typescript
// useDebounce.ts - 300ms delay for search
const debouncedValue = useDebounce(searchQuery, 300);
```

---

## Security Considerations

1. **Authentication**: HTTP Basic Auth (replace with JWT in production)
2. **CSRF Protection**: Token injection in request headers
3. **401 Handling**: Automatic logout and redirect
4. **HTTPS**: Required in production
5. **Input Validation**: Client and server-side validation
6. **XSS Protection**: React automatically escapes content
7. **CORS**: Properly configured on backend

---

## Future Enhancements

1. **WebSocket Integration**: Switch from polling to real-time updates
2. **Advanced Caching**: Service Worker with Workbox
3. **Offline Queue**: Sync operations when back online
4. **Real-time Notifications**: Push notifications for critical events
5. **Advanced Analytics**: Historical trends and forecasting
6. **Multi-tenant Support**: Separate dashboards per organization
7. **API Rate Limiting**: Prevent abuse and ensure fair usage
