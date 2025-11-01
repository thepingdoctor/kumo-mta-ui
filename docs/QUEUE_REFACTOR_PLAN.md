# Queue Interface Refactoring Plan

## Executive Summary

The current `QueueItem` interface mixes **customer service queue concepts** (customer management, service types, wait times) with **MTA-specific email queue fields** (recipient, sender, retries). This refactoring plan documents the complete transition from customer service model to pure email MTA queue model.

**Impact**: HIGH - Affects 7 source files, 2 test files, and all queue-related components.

---

## 1. File Inventory

### Source Files Requiring Updates

| File | Type | Lines | Priority | Complexity |
|------|------|-------|----------|------------|
| `/src/types/queue.ts` | Type Definition | 61 | CRITICAL | LOW |
| `/src/types/index.ts` | Type Export | 80 | CRITICAL | LOW |
| `/src/components/queue/QueueManager.tsx` | React Component | 292 | HIGH | MEDIUM |
| `/src/components/queue/QueueTable.tsx` | React Component | 277 | HIGH | MEDIUM |
| `/src/components/queue/VirtualQueueTable.tsx` | React Component | 164 | HIGH | MEDIUM |
| `/src/hooks/useQueue.ts` | React Hook | 163 | HIGH | LOW |
| `/src/services/api.ts` | API Service | 145 | HIGH | MEDIUM |
| `/src/utils/exportUtils.ts` | Export Utilities | 443 | MEDIUM | LOW |

### Test Files Requiring Updates

| File | Type | Lines | Priority | Test Count |
|------|------|-------|----------|------------|
| `/tests/e2e/queue-manager.spec.ts` | E2E Tests | 93 | HIGH | 10 tests |
| `/tests/unit/components/VirtualQueueTable.test.tsx` | Unit Tests | TBD | MEDIUM | TBD |

### Documentation Files

| File | Purpose |
|------|---------|
| `/docs/PHASE_1_SUMMARY.md` | Phase 1 documentation |
| `/docs/HIVE_MIND_EXECUTIVE_SUMMARY.md` | Executive summary |
| `/tests/IMPLEMENTATION_GUIDE.md` | Test implementation guide |

---

## 2. Current Interface Analysis

### 2.1 Current QueueItem Interface (in `/src/types/queue.ts`)

```typescript
export interface QueueItem {
  // Customer Service Fields (TO BE REMOVED)
  customerId: string;           // ❌ Customer service concept
  customerName: string;          // ❌ Customer service concept
  customerEmail: string;         // ❌ Customer service concept
  customerPhone: string;         // ❌ Customer service concept
  serviceType: string;           // ❌ Generic service type
  notes: string;                 // ❌ Customer service notes
  estimatedWaitTime: number;     // ❌ Customer queue metric
  actualWaitTime?: number;       // ❌ Customer queue metric
  notificationsSent: NotificationRecord[]; // ❌ Customer notifications

  // Generic Fields (KEEP/MODIFY)
  id: string;                    // ✅ KEEP
  priority: number;              // ✅ KEEP
  status: 'waiting' | 'in-progress' | 'completed' | 'cancelled'; // ⚠️ EXTEND
  createdAt: string;             // ✅ KEEP
  updatedAt: string;             // ✅ KEEP
}
```

### 2.2 Duplicate Definition in `/src/types/index.ts`

```typescript
export interface QueueItem {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  recipient: string;             // ✅ MTA field (ALREADY EXISTS!)
  sender: string;                // ✅ MTA field (ALREADY EXISTS!)
  serviceType: string;
  priority: number;
  status: 'waiting' | 'in-progress' | 'completed' | 'cancelled' | 'queued' | 'sending' | 'failed';
  notes: string;
  estimatedWaitTime: number;
  actualWaitTime?: number;
  timestamp: string;
  retries: number;               // ✅ MTA field (ALREADY EXISTS!)
  createdAt: string;
  updatedAt: string;
  notificationsSent: NotificationRecord[];
}
```

**CRITICAL FINDING**: There are TWO different `QueueItem` definitions:
- `/src/types/queue.ts` - Customer service focused (missing MTA fields)
- `/src/types/index.ts` - Hybrid model (has both customer + MTA fields)

---

## 3. Field Usage Analysis

### 3.1 Fields Used in Components

#### QueueManager.tsx
- **Display**: `customerName`, `customerEmail`, `recipient`, `sender`, `status`, `serviceType`, `createdAt`
- **Filtering**: `status`, `serviceType`, `searchQuery` (searches customers/emails)
- **Export**: Uses both customer fields AND MTA fields (`recipient`, `sender`)
- **Statistics**: Counts by `status` (waiting, sending/in-progress, completed)

#### QueueTable.tsx
- **Display**: `customerName`, `customerEmail`, `recipient`, `sender`, `serviceType`, `status`, `estimatedWaitTime`, `createdAt`, `retries`
- **Actions**: `id`, `status` (for status updates)
- **Conditional**: `retries > 0` (shows retry count)

#### VirtualQueueTable.tsx
- **Display**: `customerName`, `customerEmail`, `recipient`, `sender`, `serviceType`, `status`, `createdAt`
- **Actions**: `id`, `status` (for status updates)

#### exportUtils.ts
- **PDF Export**: `customerName`, `customerEmail`, `recipient`, `sender`, `status`, `serviceType`, `createdAt`
- **Metadata**: Status counts (waiting, sending, in-progress, completed)

### 3.2 MTA-Specific Fields Usage

| Field | Used In | Purpose | Current Status |
|-------|---------|---------|----------------|
| `recipient` | QueueManager, QueueTable, VirtualQueueTable, exportUtils | Email recipient address | ✅ Already in use |
| `sender` | QueueManager, QueueTable, VirtualQueueTable, exportUtils | Email sender address | ✅ Already in use |
| `retries` | QueueTable | Retry attempt count | ✅ Already in use |

**FINDING**: Components are ALREADY using MTA fields (`recipient`, `sender`, `retries`) which exist in the hybrid definition in `/src/types/index.ts` but not in `/src/types/queue.ts`. This created confusion during refactoring planning.

---

## 4. Component Dependency Tree

```
QueueManager (Parent)
├── useQueue hook
│   └── apiService.queue
│       ├── getItems(filters)
│       └── updateStatus(id, status)
├── QueueTable (Child Component)
│   └── onStatusChange callback
├── VirtualQueueTable (Alternative Child)
│   └── onStatusChange callback
└── exportUtils
    ├── exportQueueToPDF
    └── exportToCSV
```

### Data Flow

1. **QueueManager** fetches data via `useQueue` hook
2. `useQueue` calls `apiService.queue.getItems(filters)`
3. API returns array of `QueueItem[]`
4. **QueueManager** passes items to **QueueTable** or **VirtualQueueTable**
5. User actions trigger `onStatusChange(id, status)`
6. Hook calls `apiService.queue.updateStatus(id, status)`
7. React Query invalidates and refetches data

---

## 5. Breaking Changes Analysis

### 5.1 Fields to Remove

| Field | Impact | Mitigation Strategy |
|-------|--------|---------------------|
| `customerId` | LOW - Not displayed, only in data model | Remove from interface |
| `customerName` | HIGH - Displayed in all tables | Map to sender/recipient or remove |
| `customerEmail` | HIGH - Displayed in all tables | Map to sender/recipient |
| `customerPhone` | LOW - Not used anywhere | Remove from interface |
| `serviceType` | MEDIUM - Used in filters and display | Map to `queue_name` or category |
| `notes` | LOW - Not displayed | Remove or map to metadata |
| `estimatedWaitTime` | LOW - Only in QueueTable | Remove or calculate from metrics |
| `actualWaitTime` | NONE - Never used | Remove |
| `notificationsSent` | NONE - Never used | Remove |

### 5.2 Fields to Add (MTA-Specific)

| Field | Type | Purpose | Priority |
|-------|------|---------|----------|
| `message_id` | string | Unique message identifier | HIGH |
| `domain` | string | Recipient domain | HIGH |
| `queue_name` | string | Queue identifier | HIGH |
| `size` | number | Message size in bytes | MEDIUM |
| `age` | number | Time in queue (seconds) | MEDIUM |
| `scheduled_time` | string? | When message should be sent | MEDIUM |
| `last_attempt` | string? | Last delivery attempt | LOW |
| `next_attempt` | string? | Next retry scheduled | LOW |
| `bounce_classification` | string? | Bounce category | LOW |

### 5.3 Fields to Modify

| Field | Current | New | Reason |
|-------|---------|-----|--------|
| `status` | 4 values | 7 values | Add MTA statuses |
| `priority` | number | number | Keep as-is |
| `timestamp` | - | string | Add for queue entry time |
| `retries` | - | number | Already exists in index.ts |

### 5.4 Status Value Changes

**Current** (Customer Service):
- `waiting`
- `in-progress`
- `completed`
- `cancelled`

**New** (Email MTA):
- `queued` - Message in queue
- `sending` - Currently being sent
- `completed` - Successfully delivered
- `failed` - Delivery failed
- `bounced` - Hard/soft bounce
- `deferred` - Temporarily delayed
- `cancelled` - Manually cancelled

**Migration Path**:
- `waiting` → `queued`
- `in-progress` → `sending`
- `completed` → `completed` (no change)
- `cancelled` → `cancelled` (no change)

---

## 6. Step-by-Step Refactoring Plan

### Phase 1: Preparation (No Breaking Changes)

**Goal**: Set up foundation without breaking existing code

#### Step 1.1: Create New MTA Interface (Parallel Implementation)
- **File**: `/src/types/queue.ts`
- **Action**: Create `EmailQueueItem` interface alongside existing `QueueItem`
- **Testing**: No impact, new interface not yet used

```typescript
// Add to queue.ts
export interface EmailQueueItem {
  id: string;
  message_id: string;
  recipient: string;
  sender: string;
  domain: string;
  queue_name: string;
  size: number;
  age: number;
  priority: number;
  status: EmailQueueStatus;
  retries: number;
  scheduled_time?: string;
  last_attempt?: string;
  next_attempt?: string;
  bounce_classification?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type EmailQueueStatus =
  | 'queued'
  | 'sending'
  | 'completed'
  | 'failed'
  | 'bounced'
  | 'deferred'
  | 'cancelled';
```

#### Step 1.2: Update Type Exports
- **File**: `/src/types/index.ts`
- **Action**: Export both `QueueItem` and `EmailQueueItem`
- **Testing**: Verify no compilation errors

#### Step 1.3: Create Adapter Utilities
- **File**: `/src/utils/queueAdapters.ts` (NEW)
- **Action**: Create conversion functions
- **Testing**: Unit tests for adapters

```typescript
// Convert customer service model to MTA model
export function customerToEmailQueue(item: QueueItem): EmailQueueItem {
  return {
    id: item.id,
    message_id: item.id, // Temporary mapping
    recipient: item.recipient || item.customerEmail,
    sender: item.sender || 'noreply@example.com',
    domain: extractDomain(item.recipient || item.customerEmail),
    queue_name: item.serviceType || 'default',
    size: 0, // Placeholder
    age: Date.now() - new Date(item.createdAt).getTime(),
    priority: item.priority,
    status: mapCustomerStatusToMTA(item.status),
    retries: item.retries || 0,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function mapCustomerStatusToMTA(status: QueueItem['status']): EmailQueueStatus {
  const mapping = {
    'waiting': 'queued',
    'in-progress': 'sending',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'queued': 'queued',
    'sending': 'sending',
    'failed': 'failed',
  } as const;
  return mapping[status] || 'queued';
}
```

### Phase 2: Component Updates (Gradual Migration)

**Goal**: Update components one at a time with backward compatibility

#### Step 2.1: Update API Service
- **File**: `/src/services/api.ts`
- **Action**:
  - Keep existing endpoints
  - Add new MTA-specific endpoints
  - Update return types to use `EmailQueueItem`
  - Add adapter layer for backward compatibility
- **Testing**: API integration tests

```typescript
queue: {
  // Legacy endpoints (keep for backward compatibility)
  getItems: (filters: QueueFilter) =>
    api.get<QueueItem[]>('/api/admin/queue/list', { params: filters }),

  // New MTA endpoints
  getEmailQueue: (filters: EmailQueueFilter) =>
    api.get<EmailQueueItem[]>('/api/admin/email-queue', { params: filters })
      .then(response => ({
        ...response,
        data: response.data.map(customerToEmailQueue) // Adapter
      })),

  updateEmailStatus: (id: string, status: EmailQueueStatus) =>
    api.put(`/api/admin/email-queue/${id}/status`, { status }),
}
```

#### Step 2.2: Update useQueue Hook
- **File**: `/src/hooks/useQueue.ts`
- **Action**:
  - Support both `QueueItem` and `EmailQueueItem`
  - Add generic type parameter
  - Maintain backward compatibility
- **Testing**: Hook unit tests

```typescript
export const useQueue = <T extends QueueItem | EmailQueueItem = EmailQueueItem>(
  filters: QueueFilter | EmailQueueFilter,
  options?: { useLegacy?: boolean }
) => {
  const queryClient = useQueryClient();
  const useLegacy = options?.useLegacy ?? false;

  const query = useQuery({
    queryKey: ['queue', filters, useLegacy],
    queryFn: async () => {
      if (useLegacy) {
        return apiService.queue.getItems(filters as QueueFilter);
      }
      return apiService.queue.getEmailQueue(filters as EmailQueueFilter);
    }
  });

  // ... rest of hook
};
```

#### Step 2.3: Update QueueTable Component
- **File**: `/src/components/queue/QueueTable.tsx`
- **Action**:
  - Update to use `EmailQueueItem`
  - Remove customer service fields
  - Update display logic
  - Maintain same visual layout
- **Testing**: Component unit tests

```typescript
interface QueueTableProps {
  items: EmailQueueItem[];
  onStatusChange: (id: string, status: EmailQueueStatus) => void;
  isLoading?: boolean;
}

// Update display fields:
// customerName → sender/recipient display
// customerEmail → recipient
// serviceType → queue_name
// estimatedWaitTime → age (calculated)
// retries → retries (already exists)
```

#### Step 2.4: Update VirtualQueueTable Component
- **File**: `/src/components/queue/VirtualQueueTable.tsx`
- **Action**: Same as QueueTable
- **Testing**: Component unit tests

#### Step 2.5: Update QueueManager Component
- **File**: `/src/components/queue/QueueManager.tsx`
- **Action**:
  - Update type imports
  - Update filter logic
  - Update statistics calculations
  - Update export columns
- **Testing**: Integration tests

```typescript
// Update filter dropdowns
<select value={statusFilter} onChange={...}>
  <option value="">All Statuses</option>
  <option value="queued">Queued</option>
  <option value="sending">Sending</option>
  <option value="completed">Completed</option>
  <option value="failed">Failed</option>
  <option value="bounced">Bounced</option>
  <option value="deferred">Deferred</option>
  <option value="cancelled">Cancelled</option>
</select>

// Update service filter to queue name
<select value={queueFilter} onChange={...}>
  <option value="">All Queues</option>
  <option value="default">Default</option>
  <option value="high-priority">High Priority</option>
  <option value="bulk">Bulk</option>
</select>

// Update statistics
{queueItems.filter(i => i.status === 'queued').length}
{queueItems.filter(i => i.status === 'sending').length}
```

#### Step 2.6: Update Export Utilities
- **File**: `/src/utils/exportUtils.ts`
- **Action**:
  - Update `exportQueueToPDF` to use `EmailQueueItem`
  - Update column mappings
  - Update metadata calculations
- **Testing**: Export function tests

```typescript
export const exportEmailQueueToPDF = (queueItems: EmailQueueItem[]): void => {
  const columns: TableColumn[] = [
    { header: 'Message ID', dataKey: 'message_id' },
    { header: 'Recipient', dataKey: 'recipient' },
    { header: 'Sender', dataKey: 'sender' },
    { header: 'Domain', dataKey: 'domain' },
    { header: 'Queue', dataKey: 'queue_name' },
    { header: 'Status', dataKey: 'status' },
    { header: 'Retries', dataKey: 'retries' },
    { header: 'Age', dataKey: 'age' },
    { header: 'Created', dataKey: 'createdAt' },
  ];

  const metadata = {
    'Total Items': queueItems.length.toString(),
    'Queued': queueItems.filter(i => i.status === 'queued').length.toString(),
    'Sending': queueItems.filter(i => i.status === 'sending').length.toString(),
    'Failed': queueItems.filter(i => i.status === 'failed').length.toString(),
    'Completed': queueItems.filter(i => i.status === 'completed').length.toString(),
  };

  exportToPDF(queueItems, `email-queue-export-${Date.now()}.pdf`, columns, {
    title: 'Email Queue Report',
    orientation: 'landscape',
    includeDate: true,
    includeMetadata: true,
    metadata,
  });
};
```

### Phase 3: Testing Updates

**Goal**: Ensure all tests pass with new interface

#### Step 3.1: Update E2E Tests
- **File**: `/tests/e2e/queue-manager.spec.ts`
- **Action**:
  - Update status filter options
  - Update service filter to queue filter
  - Update expected text and labels
  - Verify new status values
- **Testing**: Run E2E suite

```typescript
test('should have status filter dropdown', async ({ page }) => {
  const statusFilter = page.getByLabel('Filter by status');

  // Should have new status options
  await statusFilter.selectOption('queued');
  await expect(statusFilter).toHaveValue('queued');

  await statusFilter.selectOption('sending');
  await expect(statusFilter).toHaveValue('sending');
});

test('should have queue filter dropdown', async ({ page }) => {
  const queueFilter = page.getByLabel('Filter by queue');
  await expect(queueFilter).toBeVisible();

  await expect(queueFilter).toContainText('All Queues');
  await expect(queueFilter).toContainText('Default');
  await expect(queueFilter).toContainText('High Priority');
});
```

#### Step 3.2: Update Unit Tests
- **File**: `/tests/unit/components/VirtualQueueTable.test.tsx`
- **Action**:
  - Update mock data to use `EmailQueueItem`
  - Update assertions for new fields
  - Remove customer service field tests
- **Testing**: Run unit test suite

#### Step 3.3: Add New Test Cases
- **Files**: New test files as needed
- **Action**:
  - Test adapter functions
  - Test status mapping
  - Test field display
  - Test export with new format
- **Testing**: Achieve >80% coverage

### Phase 4: Cleanup and Documentation

**Goal**: Remove legacy code and update documentation

#### Step 4.1: Remove Legacy Interfaces
- **File**: `/src/types/queue.ts`
- **Action**:
  - Remove old `QueueItem` interface
  - Rename `EmailQueueItem` to `QueueItem`
  - Remove unused types
- **Testing**: Full regression test

#### Step 4.2: Remove Legacy API Endpoints
- **File**: `/src/services/api.ts`
- **Action**:
  - Remove old queue endpoints
  - Rename new endpoints
  - Update all callers
- **Testing**: API integration tests

#### Step 4.3: Update Documentation
- **Files**:
  - `/docs/COMPONENTS.md`
  - `/docs/architecture/ARCHITECTURE.md`
  - `/README.md`
- **Action**:
  - Document new queue interface
  - Update API documentation
  - Update component examples
  - Add migration guide

#### Step 4.4: Update Mock Data
- **File**: `/tests/mocks/MOCK_STRATEGY.md`
- **Action**:
  - Document new mock data structure
  - Update mock generators
  - Provide examples

---

## 7. Risk Assessment

### High Risk Areas

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Breaking existing integrations | HIGH | HIGH | Parallel implementation, adapter layer |
| Data migration issues | HIGH | MEDIUM | Backend must support both formats |
| Test coverage gaps | MEDIUM | MEDIUM | Comprehensive test updates first |
| User confusion with new UI | MEDIUM | LOW | Similar layout, gradual rollout |

### Testing Strategy

1. **Unit Tests**: Update all component and hook tests
2. **Integration Tests**: Test API service with both formats
3. **E2E Tests**: Update Playwright tests for new UI
4. **Visual Regression**: Screenshot comparison
5. **Manual Testing**: QA checklist for all queue features

---

## 8. Rollback Plan

### Rollback Triggers
- >5% error rate in production
- Critical bug preventing queue operations
- Major performance degradation
- Failed smoke tests

### Rollback Steps
1. Revert API endpoints to legacy format
2. Switch hook to use `useLegacy: true`
3. Keep component updates (they work with both)
4. Monitor metrics for 24 hours
5. Post-mortem and re-plan

---

## 9. Success Metrics

### Technical Metrics
- ✅ All tests passing (unit, integration, E2E)
- ✅ No TypeScript compilation errors
- ✅ No runtime errors in production
- ✅ API response time <200ms
- ✅ Component render time <50ms

### Business Metrics
- ✅ Queue operations successful >99.9%
- ✅ Export functionality working
- ✅ Status updates accurate
- ✅ Filtering and search functional

---

## 10. Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Preparation | 4 hours | None |
| Phase 2: Component Updates | 8 hours | Phase 1 complete |
| Phase 3: Testing Updates | 4 hours | Phase 2 complete |
| Phase 4: Cleanup | 2 hours | Phase 3 complete |
| **Total** | **18 hours** | - |

**Recommended Sprint**: 2 sprints (1 week per sprint)
- Sprint 1: Phases 1-2
- Sprint 2: Phases 3-4

---

## 11. Checklist

### Phase 1: Preparation
- [ ] Create `EmailQueueItem` interface in `/src/types/queue.ts`
- [ ] Export new types from `/src/types/index.ts`
- [ ] Create adapter utilities in `/src/utils/queueAdapters.ts`
- [ ] Write adapter unit tests
- [ ] Verify no compilation errors

### Phase 2: Component Updates
- [ ] Update API service with new endpoints
- [ ] Update `useQueue` hook
- [ ] Update `QueueTable` component
- [ ] Update `VirtualQueueTable` component
- [ ] Update `QueueManager` component
- [ ] Update export utilities
- [ ] Test each component individually

### Phase 3: Testing Updates
- [ ] Update E2E tests
- [ ] Update unit tests
- [ ] Add new test cases
- [ ] Achieve >80% code coverage
- [ ] Run full test suite

### Phase 4: Cleanup
- [ ] Remove legacy `QueueItem` interface
- [ ] Remove legacy API endpoints
- [ ] Remove adapter utilities (if no longer needed)
- [ ] Update documentation
- [ ] Update mock data
- [ ] Final regression testing

---

## 12. Open Questions

1. **Backend Support**: Does the KumoMTA API already return MTA-specific fields?
2. **Data Migration**: How do we handle existing queue data in customer service format?
3. **Feature Flag**: Should we use a feature flag for gradual rollout?
4. **Analytics**: Do we need to track queue metrics separately during migration?
5. **Performance**: What's the expected queue size (100s? 1000s? 10000s+)?

---

## Appendix A: Field Mapping Reference

| Old Field | New Field | Transformation |
|-----------|-----------|----------------|
| `customerId` | - | REMOVE |
| `customerName` | `sender` or `recipient` | Display sender for "from", recipient for "to" |
| `customerEmail` | `recipient` | Direct mapping |
| `customerPhone` | - | REMOVE |
| `recipient` | `recipient` | KEEP (already exists) |
| `sender` | `sender` | KEEP (already exists) |
| `serviceType` | `queue_name` | Direct mapping |
| `priority` | `priority` | KEEP |
| `status` | `status` | Map values (see status mapping) |
| `notes` | `metadata.notes` | Optional field |
| `estimatedWaitTime` | `age` | Calculate from createdAt |
| `actualWaitTime` | - | REMOVE or calculate from metrics |
| `retries` | `retries` | KEEP (already exists) |
| `notificationsSent` | - | REMOVE |
| `createdAt` | `createdAt` | KEEP |
| `updatedAt` | `updatedAt` | KEEP |
| - | `message_id` | NEW (from backend) |
| - | `domain` | NEW (extract from recipient) |
| - | `size` | NEW (from backend) |
| - | `scheduled_time` | NEW (optional) |
| - | `last_attempt` | NEW (optional) |
| - | `next_attempt` | NEW (optional) |
| - | `bounce_classification` | NEW (optional) |

---

## Appendix B: Component Visual Changes

### Before (Customer Service Model)
```
Customer        | Service Type | Status      | Wait Time | Actions
--------------- | ------------ | ----------- | --------- | -------
John Doe        | Support      | waiting     | 15 min    | [Dropdown]
john@example.com|              |             |           |
```

### After (Email MTA Model)
```
Recipient         | Sender          | Queue    | Status  | Age    | Retries | Actions
----------------- | --------------- | -------- | ------- | ------ | ------- | -------
user@domain.com   | noreply@app.com | default  | queued  | 2m 15s | 0       | [Dropdown]
```

---

*End of Queue Refactoring Plan*
*Generated: 2025-11-01*
*Version: 1.0*
