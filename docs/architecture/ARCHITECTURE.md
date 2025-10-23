# KumoMTA UI - System Architecture

## Architecture Overview

This document describes the comprehensive system architecture for the KumoMTA UI dashboard.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Common     │  │   Layout     │  │   Features   │      │
│  │  Components  │  │  Components  │  │  Components  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    State Management Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Zustand    │  │   TanStack   │  │     URL      │      │
│  │  (Client)    │  │    Query     │  │    State     │      │
│  │              │  │  (Server)    │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Domain     │  │    Cache     │  │  Validators  │      │
│  │  Services    │  │   Manager    │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  API Client  │  │  WebSocket   │  │   Storage    │      │
│  │              │  │   Client     │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      External Services                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  KumoMTA     │  │  WebSocket   │  │   Browser    │      │
│  │     API      │  │    Server    │  │   Storage    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Feature-Based Organization

```
src/components/
├── common/                 # Shared UI Components
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.types.ts
│   │   └── index.ts
│   ├── Card/
│   ├── Input/
│   ├── Modal/
│   ├── Table/
│   └── Chart/
│
├── layout/                 # Layout Components
│   ├── Layout/
│   ├── Header/
│   ├── Sidebar/
│   └── ErrorBoundary/
│
└── features/               # Feature Components
    ├── dashboard/
    │   ├── MetricsCard/
    │   ├── ThroughputChart/
    │   └── ServerStatus/
    ├── queue/
    │   ├── QueueTable/
    │   ├── QueueFilters/
    │   └── AddCustomerModal/
    └── config/
        ├── ConfigForm/
        └── ConfigSection/
```

## State Management Strategy

### Server State (TanStack Query)
- Dashboard metrics
- Queue items
- Server status
- Configuration data
- Real-time updates

### Client State (Zustand)
- Authentication
- UI preferences (theme, sidebar)
- Active filters
- Modal state
- Notifications

### Persistent State
- Auth tokens (localStorage)
- User preferences (localStorage)
- Session data (sessionStorage)

## Data Flow

### Read Operations
```
Component
  ↓
Custom Hook (useQueue, useDashboard)
  ↓
TanStack Query
  ↓
Domain Service (queueService)
  ↓
Cache Manager (check cache)
  ↓ (if miss)
API Client
  ↓
KumoMTA API
  ↓
Transform & Cache
  ↓
Return to Component
```

### Write Operations
```
Component (User Action)
  ↓
Mutation Hook (useUpdateQueue)
  ↓
Domain Service
  ↓
Validator (validate data)
  ↓
API Client
  ↓
KumoMTA API
  ↓
Invalidate Cache
  ↓
Emit Event (EventBus)
  ↓
Update UI (optimistic or refetch)
```

## Error Handling Flow

```
Error Occurs
  ↓
ErrorHandler.handle(error)
  ↓
Normalize to AppError
  ↓
┌─────────────────┐
│ Log to Service  │ (Sentry, LogRocket)
│ Add to Queue    │
│ Show Notification│
│ Attempt Recovery│
└─────────────────┘
  ↓
Error Boundary (if critical)
  ↓
Show Fallback UI
```

## Type System Hierarchy

```
types/
├── common/
│   ├── api.ts          # ApiResponse<T>, ApiError, PaginatedResponse<T>
│   ├── pagination.ts   # PaginationParams
│   └── filters.ts      # FilterParams
│
├── models/             # Business Domain Models
│   ├── user.ts         # User, UserRole, Permission
│   ├── queue.ts        # QueueItem, QueueStatus, QueuePriority
│   ├── email.ts        # EmailMessage, EmailStatus, EmailAddress
│   └── server.ts       # ServerHealth, ServerStatus
│
├── dto/                # Data Transfer Objects
│   ├── queue.dto.ts    # CreateQueueItemDto, UpdateQueueItemDto
│   └── config.dto.ts   # UpdateConfigDto
│
├── enums/              # Type-Safe Enumerations
│   ├── status.ts
│   └── roles.ts
│
└── utilities/          # Utility Types
    └── helpers.ts      # DeepPartial, DeepReadonly, Brand<T, B>
```

## Service Layer Architecture

### Domain Services
```typescript
class QueueService {
  // Business logic
  calculateWaitTime()
  transformQueueItems()
  validateQueueItem()

  // Data operations
  getItems()
  createItem()
  updateStatus()

  // Cache management
  invalidateCache()

  // Event emission
  emitUpdate()
}
```

### API Client
```typescript
class ApiClient {
  // HTTP methods
  get<T>(url, config)
  post<T>(url, data, config)
  put<T>(url, data, config)
  delete<T>(url, config)

  // Request management
  cancelRequest(id)
  cancelAllRequests()
}
```

### Cache Manager
```typescript
class CacheManager {
  get<T>(key): T | null
  set<T>(key, data, ttl)
  invalidate(pattern)
  clear()
  getStats()
}
```

## Integration Points

### Real-time Updates (WebSocket)
```
WebSocket Server
  ↓
WebSocket Client
  ↓
Message Handler
  ↓
Event Bus
  ↓
TanStack Query Invalidation
  ↓
Component Re-render
```

### External Services
- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **Google Analytics**: Usage analytics

## Security Considerations

1. **Authentication**: JWT tokens with secure storage
2. **Authorization**: Role-based access control
3. **Input Validation**: Client and server-side validation
4. **XSS Protection**: React's built-in escaping
5. **CSRF Protection**: Token-based protection
6. **Secure Communication**: HTTPS only

## Performance Optimizations

1. **Code Splitting**: Route-based lazy loading
2. **Caching**: Intelligent cache with TTL
3. **Memoization**: React.memo, useMemo, useCallback
4. **Virtual Scrolling**: For large tables
5. **Debouncing**: For search and filters
6. **Bundle Optimization**: Tree shaking, minification

## Testing Strategy

### Unit Tests
- Service layer functions
- Utility functions
- Custom hooks
- Validators

### Integration Tests
- API integration
- State management
- Component interactions

### E2E Tests
- Critical user flows
- Dashboard loading
- Queue management
- Configuration updates

## Deployment Architecture

```
┌──────────────────┐
│   Load Balancer  │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼───┐
│ Web  │  │ Web  │
│Server│  │Server│
│  1   │  │  2   │
└───┬──┘  └──┬───┘
    │         │
    └────┬────┘
         │
    ┌────▼─────┐
    │ KumoMTA  │
    │   API    │
    └──────────┘
```

## Migration Strategy

### Phase 1: Foundation
- Type definitions
- Error handling
- API client

### Phase 2: Services
- Domain services
- Cache manager
- Validators

### Phase 3: State
- Zustand stores
- TanStack Query hooks

### Phase 4: Components
- Common components
- Feature components
- Layout refactoring

### Phase 5: Integration
- WebSocket
- Real-time updates
- Testing

### Phase 6: Polish
- Performance optimization
- Documentation
- Monitoring

## Development Guidelines

### Code Organization
- Feature-based structure
- Consistent naming conventions
- Clear separation of concerns

### TypeScript
- Strict mode enabled
- No implicit any
- Comprehensive type coverage

### Component Design
- Single responsibility
- Props typing
- Error boundaries
- Loading states

### State Management
- Server state in TanStack Query
- Client state in Zustand
- Minimal prop drilling
- Immutable updates

### API Integration
- Type-safe calls
- Error handling
- Request cancellation
- Retry logic

## References

- [Component Structure Details](./component-structure.md)
- [State Management Details](./state-management.md)
- [API Layer Details](./api-layer.md)
- [Error Handling Details](./error-handling.md)
- [Type System Details](./type-system.md)
- [Service Layer Details](./service-layer.md)

---

**Last Updated**: 2025-10-23
**Version**: 1.0.0
**Status**: Design Phase
