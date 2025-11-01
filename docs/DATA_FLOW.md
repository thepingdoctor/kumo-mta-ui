# Data Flow Documentation

Complete request/response flow, error propagation, cache invalidation, and optimistic updates in the KumoMTA UI.

## Table of Contents

1. [Request/Response Flow](#requestresponse-flow)
2. [Error Propagation](#error-propagation)
3. [Cache Invalidation](#cache-invalidation)
4. [Optimistic Updates](#optimistic-updates)
5. [Offline Data Synchronization](#offline-data-synchronization)

---

## Request/Response Flow

### Complete Request Lifecycle

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant Component
    participant Hook
    participant QueryClient
    participant APIService
    participant Axios
    participant ReqInterceptor as Request<br/>Interceptor
    participant RespInterceptor as Response<br/>Interceptor
    participant AuthStore
    participant Backend
    participant Cache

    User->>Component: Trigger action
    Component->>Hook: Call custom hook

    Note over Hook,Cache: Check Cache First
    Hook->>QueryClient: queryClient.getQueryData()
    QueryClient->>Cache: Check cache

    alt Data in cache AND fresh
        Cache-->>QueryClient: Return cached data
        QueryClient-->>Hook: Return data
        Hook-->>Component: Immediate render
        Component-->>User: Display (no loading state)
    end

    alt Data stale OR not in cache
        QueryClient-->>Hook: Initiate fetch
        Hook->>APIService: Call API method
        APIService->>Axios: HTTP request

        Note over Axios,ReqInterceptor: Request Preprocessing
        Axios->>ReqInterceptor: Intercept request
        ReqInterceptor->>AuthStore: Get auth token
        AuthStore-->>ReqInterceptor: Return token
        ReqInterceptor->>ReqInterceptor: Add Authorization header<br/>Basic ${token}
        ReqInterceptor->>ReqInterceptor: Add CSRF token
        ReqInterceptor->>ReqInterceptor: Set Content-Type
        ReqInterceptor-->>Axios: Modified config

        Axios->>Backend: Send authenticated request

        Note over Backend,RespInterceptor: Response Processing
        Backend-->>Axios: HTTP response
        Axios->>RespInterceptor: Intercept response

        alt Success (2xx)
            RespInterceptor-->>APIService: Pass response
            APIService-->>QueryClient: Return data
            QueryClient->>Cache: Update cache
            QueryClient-->>Hook: Return fresh data
            Hook-->>Component: Update state
            Component-->>User: Display new data
        end

        alt Error (4xx/5xx)
            Note over RespInterceptor: Error Handling Path
            RespInterceptor->>RespInterceptor: Detect error status
            alt 401 Unauthorized
                RespInterceptor->>AuthStore: logout()
                RespInterceptor->>Component: Redirect to /login
            else 403 Forbidden
                RespInterceptor->>Component: Show toast error
            else 500+ Server Error
                RespInterceptor->>Component: Show toast error
            end
            RespInterceptor-->>Hook: Throw error
            Hook-->>Component: Error state
            Component-->>User: Display error UI
        end

        alt Network Error
            Backend-->>Axios: No response (timeout/offline)
            Axios->>RespInterceptor: Request error
            RespInterceptor->>Component: Show network error
            RespInterceptor-->>Hook: Throw error
            Hook-->>Component: Error state
            Component-->>User: Display offline UI
        end
    end
```

### Data Flow Layers

#### 1. Presentation Layer (Component)

**Input**: User interaction (click, form submit, page load)
**Output**: UI state updates, loading indicators, error messages

```typescript
// Dashboard.tsx - Example
const { data: metrics, isLoading, error } = useKumoMetrics(5000);

if (isLoading) return <LoadingSkeleton />;
if (error) return <ErrorMessage error={error} />;
return <MetricsDisplay data={metrics} />;
```

#### 2. Business Logic Layer (Custom Hook)

**Input**: Component requests for data/operations
**Output**: Typed data, loading states, error states

```typescript
// useKumoMTA.ts - Line 7-18
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

#### 3. Query Management Layer (TanStack Query)

**Input**: Query function, cache key, configuration
**Output**: Cached data or fresh fetch

- **Cache Check**: `queryClient.getQueryData(['kumomta-metrics'])`
- **Stale Check**: `Date.now() - lastFetch > staleTime`
- **Fetch Decision**: Stale or missing → trigger fetch

#### 4. API Service Layer

**Input**: Structured API calls with parameters
**Output**: Axios promises with typed responses

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

#### 5. HTTP Client Layer (Axios)

**Input**: HTTP method, URL, config, data
**Output**: HTTP response or error

```typescript
// api.ts - Line 6-13
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});
```

#### 6. Request Interceptor

**Input**: Axios config object
**Output**: Modified config with auth headers

```typescript
// api.ts - Line 16-38
api.interceptors.request.use(
  config => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Basic ${token}`;
    }

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }

    return config;
  }
);
```

#### 7. Response Interceptor

**Input**: Axios response or error
**Output**: Passed response or transformed error

```typescript
// api.ts - Line 41-66
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      throw new Error('Access forbidden');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error');
    } else if (!error.response) {
      throw new Error('Network error');
    }
    return Promise.reject(error);
  }
);
```

---

## Error Propagation

### Error Types and Handling Strategies

```mermaid
graph TD
    Start[Error Occurs]

    Start --> Type{Error Type?}

    Type -->|Network Error| Network[No response received]
    Type -->|HTTP 401| Auth[Unauthorized]
    Type -->|HTTP 403| Forbidden[Access Denied]
    Type -->|HTTP 500+| Server[Server Error]
    Type -->|HTTP 400-499| Client[Client Error]

    Network --> OfflineCheck{Online?}
    OfflineCheck -->|No| OfflineUI[Show offline indicator]
    OfflineCheck -->|Yes| Retry[Retry with backoff]

    Auth --> Logout[Clear auth state]
    Logout --> Redirect[Redirect to /login]

    Forbidden --> Toast1[Show error toast]
    Toast1 --> Stay[Stay on page]

    Server --> Toast2[Show error toast]
    Toast2 --> RetryOption[Offer retry]

    Client --> Validate{Validation error?}
    Validate -->|Yes| FormError[Show field errors]
    Validate -->|No| Toast3[Show error toast]

    OfflineUI --> QueueRequest[Queue for sync]
    Retry --> MaxRetries{Max retries?}
    MaxRetries -->|No| Retry
    MaxRetries -->|Yes| GiveUp[Show error UI]

    style Network fill:#ffcccc
    style Auth fill:#ffeecc
    style Forbidden fill:#ffffcc
    style Server fill:#ffccff
    style Client fill:#ccffcc
```

### Error Handling Flow

```mermaid
sequenceDiagram
    participant Backend
    participant AxiosInterceptor
    participant ErrorHandler
    participant AuthStore
    participant Router
    participant ToastSystem
    participant Component
    participant User

    Note over Backend,User: Error Scenario 1: 401 Unauthorized
    Backend->>AxiosInterceptor: 401 response
    AxiosInterceptor->>ErrorHandler: Handle 401
    ErrorHandler->>AuthStore: logout()
    AuthStore->>AuthStore: Clear user/token
    AuthStore->>AuthStore: Set isAuthenticated=false
    ErrorHandler->>Router: window.location.href = '/login'
    Router->>User: Show login page

    Note over Backend,User: Error Scenario 2: 403 Forbidden
    Backend->>AxiosInterceptor: 403 response
    AxiosInterceptor->>ErrorHandler: Handle 403
    ErrorHandler->>ToastSystem: Show "Access forbidden" toast
    ToastSystem->>Component: Display error toast
    Component->>User: See error message

    Note over Backend,User: Error Scenario 3: 500 Server Error
    Backend->>AxiosInterceptor: 500 response
    AxiosInterceptor->>ErrorHandler: Handle 500
    ErrorHandler->>ToastSystem: Show "Server error" toast
    ErrorHandler->>Component: Set error state
    Component->>Component: Show error UI
    Component->>User: See error state + retry button

    Note over Backend,User: Error Scenario 4: Network Error
    Backend->>AxiosInterceptor: Request timeout/no response
    AxiosInterceptor->>ErrorHandler: Handle network error
    ErrorHandler->>ToastSystem: Show "Network error" toast
    ErrorHandler->>Component: Trigger offline mode
    Component->>Component: Show offline indicator
    Component->>User: See offline UI
```

### Error Propagation Code

#### Interceptor Level
```typescript
// api.ts - Line 41-66
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      } else if (status === 403) {
        throw new Error('Access forbidden: Insufficient permissions');
      } else if (status >= 500) {
        throw new Error(`Server error: ${error.response.data?.message}`);
      }
    } else if (error.request) {
      throw new Error('Network error: Unable to connect to server');
    }

    return Promise.reject(error);
  }
);
```

#### Hook Level
```typescript
// Component receives error from hook
const { data, error, isError } = useKumoMetrics();

if (isError) {
  // TanStack Query provides error object
  return <ErrorMessage error={error} />;
}
```

#### Component Level
```typescript
// ErrorBoundary.tsx - Catches React errors
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <FallbackUI />;
    }
    return this.props.children;
  }
}
```

### Retry Strategy

```mermaid
graph LR
    Error[Error Occurs]

    Error --> Attempt1[Attempt 1: Immediate]
    Attempt1 -->|Fail| Wait1[Wait 1s]
    Wait1 --> Attempt2[Attempt 2]
    Attempt2 -->|Fail| Wait2[Wait 2s]
    Wait2 --> Attempt3[Attempt 3]
    Attempt3 -->|Fail| Wait3[Wait 4s]
    Wait3 --> Attempt4[Attempt 4 - Final]
    Attempt4 -->|Fail| GiveUp[Give Up]

    Attempt1 -->|Success| Done[Done]
    Attempt2 -->|Success| Done
    Attempt3 -->|Success| Done
    Attempt4 -->|Success| Done

    GiveUp --> ShowError[Show Error UI]

    style Wait1 fill:#ffffcc
    style Wait2 fill:#ffee99
    style Wait3 fill:#ffdd66
```

```typescript
// App.tsx - Line 18-28
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Attempt 1: 1000ms
      // Attempt 2: 2000ms
      // Attempt 3: 4000ms
      // Max: 30000ms
    },
  },
});
```

---

## Cache Invalidation

### Cache Invalidation Strategies

```mermaid
graph TB
    subgraph "Invalidation Triggers"
        Mutation[Mutation Success]
        Time[Time-based Expiry]
        Manual[Manual Invalidation]
        Focus[Window Focus]
    end

    subgraph "Invalidation Types"
        Specific[Specific Query]
        Prefix[Query Prefix]
        All[All Queries]
    end

    subgraph "Refetch Behavior"
        Auto[Auto Refetch]
        OnDemand[On-Demand Refetch]
        Background[Background Refetch]
    end

    Mutation --> Specific
    Mutation --> Prefix

    Time --> Auto

    Manual --> All
    Manual --> Specific

    Focus --> Background

    Specific --> OnDemand
    Prefix --> Auto
    All --> Auto

    style Mutation fill:#90EE90
    style Time fill:#87CEEB
    style Manual fill:#FFB6C1
```

### Invalidation Flow

```mermaid
sequenceDiagram
    participant User
    participant Component
    participant Mutation
    participant QueryClient
    participant Backend
    participant Cache

    Note over User,Cache: User Triggers Mutation
    User->>Component: Click "Suspend Queue"
    Component->>Mutation: suspendQueue.mutate()

    Mutation->>Backend: POST /api/admin/suspend/v1
    Backend-->>Mutation: 200 OK

    Note over Mutation,Cache: Cache Invalidation
    Mutation->>QueryClient: invalidateQueries(['kumomta-scheduled-queue'])
    QueryClient->>Cache: Mark as stale

    Mutation->>QueryClient: invalidateQueries(['kumomta-metrics'])
    QueryClient->>Cache: Mark as stale

    Note over QueryClient,Cache: Auto Refetch
    QueryClient->>Backend: GET /api/admin/bounce-list/v1
    Backend-->>QueryClient: Fresh queue data
    QueryClient->>Cache: Update cache

    QueryClient->>Backend: GET /metrics.json
    Backend-->>QueryClient: Fresh metrics
    QueryClient->>Cache: Update cache

    Cache-->>Component: Trigger re-render
    Component-->>User: Display updated data
```

### Cache Invalidation Code

#### After Mutation Success
```typescript
// useKumoMTA.ts - Line 55-62
const suspendQueue = useMutation({
  mutationFn: ({ domain, reason, duration }) =>
    apiService.kumomta.suspendQueue(domain, reason, duration),
  onSuccess: () => {
    // Invalidate related queries
    queryClient.invalidateQueries({ queryKey: ['kumomta-scheduled-queue'] });
    queryClient.invalidateQueries({ queryKey: ['kumomta-metrics'] });
  },
});
```

#### Manual Invalidation
```typescript
// Manually invalidate from component
const queryClient = useQueryClient();

const handleRefresh = () => {
  queryClient.invalidateQueries({ queryKey: ['kumomta-metrics'] });
};
```

#### Time-based Invalidation
```typescript
// Automatic invalidation via staleTime
useQuery({
  queryKey: ['kumomta-metrics'],
  queryFn: fetchMetrics,
  staleTime: 5000,  // Data fresh for 5 seconds
  gcTime: 300000,   // Cache for 5 minutes
});
```

### Cache Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Fresh: Query success

    Fresh --> Stale: Time > staleTime
    Fresh --> Stale: Manual invalidation

    Stale --> Fetching: Component renders
    Stale --> Garbage: Time > gcTime

    Fetching --> Fresh: Fetch success
    Fetching --> Error: Fetch error

    Error --> Fetching: Retry
    Error --> Garbage: Time > gcTime

    Garbage --> [*]: Remove from memory

    note right of Fresh
        Data is fresh
        No refetch needed
        Use cached data
    end note

    note right of Stale
        Data is stale
        Show cached data
        Refetch in background
    end note

    note right of Fetching
        Fetching new data
        Show loading or stale data
    end note

    note right of Garbage
        No components using
        Memory cleanup
    end note
```

---

## Optimistic Updates

### Optimistic Update Flow

```mermaid
sequenceDiagram
    participant User
    participant Component
    participant Mutation
    participant QueryClient
    participant Cache
    participant Backend

    Note over User,Backend: Optimistic Update Pattern

    User->>Component: Click "Update Status"
    Component->>Mutation: updateStatus.mutate(data)

    Note over Mutation,Cache: Immediate UI Update
    Mutation->>QueryClient: Get current cache
    QueryClient->>Cache: getQueryData(['queue'])
    Cache-->>QueryClient: Current queue data

    Mutation->>QueryClient: setQueryData(['queue'], optimisticData)
    QueryClient->>Cache: Update cache immediately
    Cache-->>Component: Trigger re-render
    Component-->>User: See immediate change ✓

    Note over Mutation,Backend: Background API Call
    Mutation->>Backend: PUT /api/admin/queue/:id/status

    alt Success Response
        Backend-->>Mutation: 200 OK
        Mutation->>QueryClient: invalidateQueries(['queue'])
        QueryClient->>Backend: Refetch fresh data
        Backend-->>QueryClient: Confirmed data
        QueryClient->>Cache: Update with real data
        Cache-->>Component: Re-render (data matches)
        Component-->>User: Stays in sync ✓
    end

    alt Error Response
        Backend-->>Mutation: 4xx/5xx Error
        Mutation->>QueryClient: Rollback optimistic update
        QueryClient->>Cache: Restore previous data
        Cache-->>Component: Trigger re-render
        Component-->>User: See rollback + error message ✗
        Component->>Component: Show error toast
    end
```

### Optimistic Update Implementation

#### Basic Pattern
```typescript
const updateEmailStatus = useMutation({
  mutationFn: (data: { id: string; status: string }) =>
    apiService.queue.updateStatus(data.id, data.status),

  // Step 1: Before mutation runs
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['queue'] });

    // Snapshot current state
    const previousQueue = queryClient.getQueryData(['queue']);

    // Optimistically update cache
    queryClient.setQueryData(['queue'], (old) => {
      return old.map(item =>
        item.id === newData.id
          ? { ...item, status: newData.status }
          : item
      );
    });

    // Return context for rollback
    return { previousQueue };
  },

  // Step 2: On error, rollback
  onError: (err, newData, context) => {
    queryClient.setQueryData(['queue'], context.previousQueue);
  },

  // Step 3: Always refetch after
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['queue'] });
  },
});
```

### Optimistic Update Strategies

```mermaid
graph TD
    Start[User Action]

    Start --> Strategy{Update Strategy?}

    Strategy -->|Optimistic| Optimistic[Update UI Immediately]
    Strategy -->|Pessimistic| Pessimistic[Wait for Response]

    Optimistic --> OptSuccess{Backend Success?}
    OptSuccess -->|Yes| Confirm[Keep Optimistic Update]
    OptSuccess -->|No| Rollback[Rollback to Previous State]

    Pessimistic --> Loading[Show Loading Indicator]
    Loading --> PessSuccess{Backend Success?}
    PessSuccess -->|Yes| Update[Update UI with Response]
    PessSuccess -->|No| Error[Show Error Message]

    Confirm --> Done[✓ Done]
    Update --> Done
    Rollback --> ShowError[Show Error Toast]
    Error --> ShowError
    ShowError --> Done

    style Optimistic fill:#90EE90
    style Pessimistic fill:#87CEEB
```

### When to Use Optimistic Updates

| Scenario | Use Optimistic? | Reason |
|----------|----------------|--------|
| Queue status toggle | ✅ Yes | Fast, user expects immediate feedback |
| Message deletion | ✅ Yes | Clear intent, can rollback |
| Suspend queue | ⚠️ Maybe | Critical operation, consider confirmation |
| Configuration changes | ❌ No | Complex validation, wait for server |
| User authentication | ❌ No | Security-critical, must verify |
| Bulk operations | ❌ No | High chance of partial failure |

---

## Offline Data Synchronization

### Offline Queue Architecture

```mermaid
graph TB
    subgraph "Online State"
        OnlineComponent[Component]
        OnlineAPI[API Service]
        Backend[Backend Server]
    end

    subgraph "Offline Detection"
        Navigator[navigator.onLine]
        NetworkListener[Network Event Listener]
    end

    subgraph "Offline Storage"
        IndexedDB[(IndexedDB)]
        PendingQueue[Pending Requests Queue]
        CachedData[Cached Data Store]
    end

    subgraph "Sync Manager"
        SyncService[useOfflineSync Hook]
        RetryLogic[Retry Logic<br/>Max 3 attempts]
    end

    OnlineComponent --> NetworkListener
    NetworkListener --> Navigator

    Navigator -->|Online| OnlineAPI
    OnlineAPI --> Backend
    Backend --> OnlineAPI
    OnlineAPI --> OnlineComponent

    Navigator -->|Offline| PendingQueue
    OnlineComponent --> PendingQueue
    PendingQueue --> IndexedDB

    Navigator -->|Back Online| SyncService
    SyncService --> IndexedDB
    IndexedDB --> RetryLogic
    RetryLogic --> Backend
    Backend --> RetryLogic
    RetryLogic --> OnlineComponent

    OnlineAPI --> CachedData
    CachedData --> IndexedDB
    CachedData --> OnlineComponent
```

### Offline Sync Flow

```mermaid
sequenceDiagram
    participant User
    participant Component
    participant Navigator
    participant OfflineSync
    participant IndexedDB
    participant Backend

    Note over User,Backend: User Goes Offline
    User->>Component: Perform action
    Component->>Navigator: Check navigator.onLine
    Navigator-->>Component: false (offline)

    Component->>OfflineSync: queueRequest(url, method, data)
    OfflineSync->>IndexedDB: Store pending request
    IndexedDB-->>OfflineSync: Request ID
    OfflineSync->>Component: Show "Queued for sync" message
    Component-->>User: Visual feedback

    Note over User,Backend: User Comes Back Online
    Navigator->>OfflineSync: 'online' event
    OfflineSync->>IndexedDB: getPendingRequests()
    IndexedDB-->>OfflineSync: Array of pending requests

    loop For each pending request
        OfflineSync->>Backend: Retry request

        alt Success
            Backend-->>OfflineSync: 200 OK
            OfflineSync->>IndexedDB: removePendingRequest(id)
            OfflineSync->>Component: Invalidate queries
            Component->>Backend: Refetch fresh data
        end

        alt Failure (retriable)
            Backend-->>OfflineSync: 4xx/5xx Error
            OfflineSync->>IndexedDB: incrementRetryCount(id)

            alt Retry count < 3
                OfflineSync->>OfflineSync: Schedule retry
            else Max retries
                OfflineSync->>IndexedDB: removePendingRequest(id)
                OfflineSync->>Component: Show "Sync failed" error
            end
        end
    end

    OfflineSync->>Component: Dispatch 'sw-pending-requests' event
    Component-->>User: Update pending count badge
```

### Offline Sync Implementation

#### Queue Offline Request
```typescript
// useOfflineSync.ts - Line 77-110
const queueRequest = async (
  url: string,
  method: string,
  headers: Record<string, string> = {},
  body?: string
) => {
  const requestId = await offlineStorage.queueRequest({
    url,
    method,
    headers,
    body,
  });

  const pendingRequests = await offlineStorage.getPendingRequests();
  setSyncStatus((prev) => ({
    ...prev,
    pendingCount: pendingRequests.length,
  }));

  // Dispatch event for UI updates
  window.dispatchEvent(
    new CustomEvent('sw-pending-requests', {
      detail: { count: pendingRequests.length },
    })
  );

  return requestId;
};
```

#### Sync Pending Requests
```typescript
// useOfflineSync.ts - Line 19-76
const syncPendingRequests = async () => {
  if (!navigator.onLine) return;

  setSyncStatus((prev) => ({ ...prev, isSyncing: true }));

  const pendingRequests = await offlineStorage.getPendingRequests();

  for (const request of pendingRequests) {
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });

      if (response.ok) {
        await offlineStorage.removePendingRequest(request.id);
      } else if (request.retryCount < 3) {
        await offlineStorage.incrementRetryCount(request.id);
      } else {
        // Max retries reached
        await offlineStorage.removePendingRequest(request.id);
      }
    } catch (error) {
      if (request.retryCount < 3) {
        await offlineStorage.incrementRetryCount(request.id);
      }
    }
  }

  setSyncStatus({
    isSyncing: false,
    pendingCount: remainingRequests.length,
    lastSyncTime: Date.now(),
    error: null,
  });
};
```

#### Listen for Online Event
```typescript
// useOfflineSync.ts - Line 112-137
useEffect(() => {
  // Sync when coming back online
  const handleOnline = () => {
    syncPendingRequests();
  };

  window.addEventListener('online', handleOnline);

  // Periodic cleanup
  const cleanupInterval = setInterval(() => {
    offlineStorage.cleanupExpired();
  }, 60 * 60 * 1000); // Every hour

  return () => {
    window.removeEventListener('online', handleOnline);
    clearInterval(cleanupInterval);
  };
}, []);
```

### IndexedDB Schema

```mermaid
erDiagram
    DASHBOARD_DATA {
        string key PK
        any value
        number timestamp
        number expiresAt
    }

    QUEUE_DATA {
        string key PK
        any value
        number timestamp
        number expiresAt
    }

    ANALYTICS_DATA {
        string key PK
        any value
        number timestamp
        number expiresAt
    }

    CONFIG_DATA {
        string key PK
        any value
        number timestamp
        number expiresAt
    }

    PENDING_REQUESTS {
        string key PK
        string id
        string url
        string method
        object headers
        string body
        number timestamp
        number retryCount
    }

    PENDING_REQUESTS ||--o{ RETRY_ATTEMPTS : "has"
```

### Offline Indicator

```typescript
// OfflineIndicator.tsx - Shows when offline
const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    const handlePendingCount = (e) => {
      setPendingCount(e.detail.count);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('sw-pending-requests', handlePendingCount);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sw-pending-requests', handlePendingCount);
    };
  }, []);

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="offline-banner">
      {!isOnline && <span>You are offline</span>}
      {pendingCount > 0 && <span>{pendingCount} requests pending sync</span>}
    </div>
  );
};
```

---

## Summary

### Data Flow Best Practices

1. **Cache First**: Always check cache before fetching
2. **Optimistic Updates**: Use for fast, user-facing operations
3. **Error Handling**: Graceful degradation at every layer
4. **Retry Logic**: Exponential backoff for transient errors
5. **Offline Support**: Queue requests when offline, sync when online
6. **Cache Invalidation**: Invalidate related queries after mutations
7. **Type Safety**: TypeScript for request/response contracts

### Performance Optimizations

- **Debounced Search**: 300ms delay to reduce API calls
- **Smart Caching**: 5s stale time, 5min cache time
- **Lazy Queries**: Enabled only when needed
- **Background Refetch**: Stale-while-revalidate pattern
- **Request Deduplication**: TanStack Query prevents duplicate requests

### Security Considerations

- **Auth Token Injection**: Automatic via interceptors
- **CSRF Protection**: Token in request headers
- **401 Auto-Logout**: Immediate redirect to login
- **Error Sanitization**: Don't expose sensitive data in errors
