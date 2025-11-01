# Email Queue Model Design - KumoMTA Integration

## Executive Summary

This document defines the new email queue data model for KumoMTA integration, replacing the existing customer service queue model with a purpose-built email message queue system.

**Migration Impact**: Breaking changes to existing queue interfaces
**Complexity**: Medium-High
**Recommended Approach**: Feature flag with gradual migration

---

## 1. Core Type Definitions

### 1.1 MessageQueueItem Interface

```typescript
/**
 * Represents an individual email message in the KumoMTA queue
 * Replaces the legacy QueueItem interface designed for customer service
 * Contains 31 fields for complete email queue modeling
 */
export interface MessageQueueItem {
  // Core Identifiers
  id: string;                          // Unique message identifier (UUID)
  message_id: string;                  // SMTP Message-ID header
  queue_name: string;                  // Queue identifier (domain-based or custom)

  // Message Routing
  recipient: string;                   // Recipient email address
  sender: string;                      // Sender email address (envelope from)
  domain: string;                      // Recipient domain (for queue grouping)
  routing_domain?: string;             // Override routing domain

  // Campaign & Organization
  campaign_id?: string;                // Campaign identifier
  tenant_id?: string;                  // Multi-tenant identifier
  pool_name?: string;                  // IP pool assignment

  // Queue State Management
  status: MessageQueueStatus;          // Current message status
  queue_state: QueueState;             // Queue-level state
  priority: number;                    // Delivery priority (0-10, higher = more urgent)

  // Delivery Metadata
  size_bytes: number;                  // Message size in bytes
  num_attempts: number;                // Delivery attempt count
  max_attempts: number;                // Maximum retry attempts (default: 20)
  last_attempt_at?: string;            // ISO timestamp of last delivery attempt
  next_attempt_at?: string;            // ISO timestamp of next scheduled attempt

  // Error Handling
  last_bounce_reason?: string;         // Bounce/error message from last attempt
  bounce_classification?: BounceType;  // Bounce type classification

  // Timestamps
  created_at: string;                  // ISO timestamp - message injection time
  scheduled_at?: string;               // ISO timestamp - scheduled delivery time
  delivered_at?: string;               // ISO timestamp - successful delivery
  expires_at?: string;                 // ISO timestamp - expiration/TTL

  // Response Tracking
  smtp_response?: SmtpResponse;        // Last SMTP server response
  delivery_protocol?: 'smtp' | 'http'; // Delivery protocol

  // Headers & Content References
  headers?: Record<string, string>;    // Key email headers (Subject, From, To, etc.)
  body_hash?: string;                  // SHA-256 hash of message body
  attachment_count?: number;           // Number of attachments

  // Custom Metadata
  tags?: string[];                     // Searchable tags
  metadata?: Record<string, unknown>;  // Custom key-value data
}
```

### 1.2 Queue Status States

```typescript
/**
 * Message-level status - represents the lifecycle state of an individual message
 */
export type MessageQueueStatus =
  | 'scheduled'      // Message scheduled for future delivery
  | 'ready'          // Ready for immediate delivery
  | 'in_delivery'    // Currently being delivered
  | 'suspended'      // Delivery suspended (manual or automatic)
  | 'deferred'       // Temporarily failed, will retry
  | 'bounced'        // Permanently failed (hard bounce)
  | 'delivered'      // Successfully delivered
  | 'expired'        // Exceeded TTL without delivery
  | 'cancelled';     // Manually cancelled

/**
 * Queue-level state - represents the operational state of the entire queue
 */
export type QueueState =
  | 'active'         // Queue accepting and processing messages
  | 'suspended'      // Queue temporarily paused
  | 'draining'       // Queue processing existing messages but not accepting new ones
  | 'disabled';      // Queue completely disabled

/**
 * Bounce type classification for bounce handling
 */
export type BounceType =
  | 'hard'           // Permanent failure (invalid address, domain doesn't exist)
  | 'soft'           // Temporary failure (mailbox full, server unavailable)
  | 'block'          // Blocked by recipient server (spam, policy)
  | 'complaint'      // Spam complaint from recipient
  | 'unknown';       // Unable to classify
```

### 1.3 SMTP Response

```typescript
/**
 * Structured SMTP server response
 */
export interface SmtpResponse {
  code: number;                        // SMTP status code (e.g., 250, 421, 550)
  message: string;                     // SMTP response message
  enhanced_code?: string;              // Enhanced status code (e.g., "5.1.1")
  timestamp: string;                   // ISO timestamp of response
}
```

---

## 2. Supporting Interfaces

### 2.1 Queue Metrics

```typescript
/**
 * Aggregated metrics for email queue monitoring and analytics
 * Replaces customer service metrics (averageWaitTime, serviceUtilization)
 */
export interface QueueMetrics {
  // Volume Metrics
  total_messages: number;              // Total messages in queue
  messages_by_status: Record<MessageQueueStatus, number>;

  // Performance Metrics
  average_queue_time: number;          // Average time in queue (seconds)
  average_delivery_time: number;       // Average time from creation to delivery (seconds)
  delivery_rate: number;               // Messages per hour

  // Queue Depth Analysis
  queue_depth: number;                 // Current queue size
  queue_depth_by_domain: Record<string, number>;
  queue_depth_by_campaign: Record<string, number>;

  // Retry & Error Metrics
  total_retries: number;               // Total retry attempts
  retry_rate: number;                  // Percentage of messages requiring retries
  bounce_rate: number;                 // Percentage of bounced messages
  bounces_by_type: Record<BounceType, number>;

  // Domain Reputation
  domain_health_scores: Record<string, DomainHealthScore>;

  // Time-based Aggregations
  messages_last_hour: number;
  messages_last_24h: number;
  messages_last_7d: number;

  // Resource Utilization
  total_size_bytes: number;            // Total size of queued messages
  oldest_message_age: number;          // Age of oldest message (seconds)
  newest_message_age: number;          // Age of newest message (seconds)
}

/**
 * Domain reputation and health scoring
 */
export interface DomainHealthScore {
  domain: string;
  score: number;                       // 0-100 health score
  bounce_rate: number;                 // Domain-specific bounce rate
  average_delivery_time: number;       // Average delivery time for domain
  last_successful_delivery?: string;   // ISO timestamp
  throttle_rate?: number;              // Messages per minute limit
}
```

### 2.2 Queue Filter

```typescript
/**
 * Filtering and search criteria for email queue queries
 * Replaces customer service filters (serviceType, customerName search)
 */
export interface QueueFilter {
  // Status Filters
  status?: MessageQueueStatus | MessageQueueStatus[];
  queue_state?: QueueState | QueueState[];

  // Routing Filters
  domain?: string;                     // Filter by recipient domain
  domains?: string[];                  // Multiple domains
  sender?: string;                     // Filter by sender address
  recipient?: string;                  // Filter by recipient address
  routing_domain?: string;             // Filter by routing domain

  // Organization Filters
  campaign_id?: string;                // Filter by campaign
  tenant_id?: string;                  // Filter by tenant
  pool_name?: string;                  // Filter by IP pool

  // Time Range Filters
  created_after?: string;              // ISO timestamp
  created_before?: string;             // ISO timestamp
  scheduled_after?: string;            // ISO timestamp
  scheduled_before?: string;           // ISO timestamp

  // Search & Tags
  search_query?: string;               // Full-text search (recipient, sender, subject)
  tags?: string[];                     // Filter by tags

  // Error & Retry Filters
  min_attempts?: number;               // Minimum retry attempts
  max_attempts?: number;               // Maximum retry attempts
  bounce_type?: BounceType;            // Filter by bounce classification

  // Performance Filters
  min_size_bytes?: number;             // Minimum message size
  max_size_bytes?: number;             // Maximum message size
  priority?: number;                   // Filter by priority level

  // Pagination
  limit?: number;                      // Results per page (default: 50)
  offset?: number;                     // Page offset
  sort_by?: QueueSortField;            // Sort field
  sort_order?: 'asc' | 'desc';         // Sort direction
}

export type QueueSortField =
  | 'created_at'
  | 'scheduled_at'
  | 'priority'
  | 'num_attempts'
  | 'size_bytes'
  | 'recipient'
  | 'domain';
```

### 2.3 Queue Operations

```typescript
/**
 * Available queue management operations
 */
export interface QueueOperation {
  operation: QueueOperationType;
  queue_name?: string;                 // Target queue (if operation is queue-scoped)
  message_ids?: string[];              // Target messages (if operation is message-scoped)
  reason?: string;                     // Reason for operation (for audit trail)
  metadata?: Record<string, unknown>;  // Additional operation parameters
}

export type QueueOperationType =
  | 'suspend'        // Pause delivery
  | 'resume'         // Resume delivery
  | 'rebind'         // Move messages to different queue
  | 'bounce'         // Force bounce messages
  | 'retry'          // Force immediate retry
  | 'cancel'         // Cancel pending messages
  | 'purge'          // Delete messages from queue
  | 'set_priority';  // Update message priority

/**
 * Result of a queue operation
 */
export interface QueueOperationResult {
  success: boolean;
  operation: QueueOperationType;
  affected_messages: number;
  affected_queues: string[];
  errors?: string[];
  timestamp: string;                   // ISO timestamp
}
```

---

## 3. Migration Mapping

### 3.1 Field Mapping: Old to New

| Old Field (QueueItem)       | New Field (MessageQueueItem) | Notes                                    |
|-----------------------------|------------------------------|------------------------------------------|
| `id`                        | `id`                         | Preserved                                |
| `customerId`                | `tenant_id`                  | Repurposed for multi-tenancy             |
| `customerName`              | _REMOVED_                    | Not applicable to email queues           |
| `customerEmail`             | `recipient`                  | Renamed for clarity                      |
| `customerPhone`             | _REMOVED_                    | Not applicable                           |
| `serviceType`               | `campaign_id` / `pool_name`  | Split into campaign and pool concepts    |
| `priority`                  | `priority`                   | Preserved (same semantics)               |
| `status`                    | `status`                     | Enum values changed (see status mapping) |
| `notes`                     | `metadata.notes`             | Moved to metadata object                 |
| `estimatedWaitTime`         | `next_attempt_at`            | Changed from duration to timestamp       |
| `actualWaitTime`            | _COMPUTED_                   | Computed from `delivered_at - created_at`|
| `createdAt`                 | `created_at`                 | Preserved (format unchanged)             |
| `updatedAt`                 | _REMOVED_                    | Not needed (use status timestamps)       |
| `notificationsSent`         | _REMOVED_                    | Email queues don't send notifications    |
| _NEW_                       | `message_id`                 | SMTP Message-ID                          |
| _NEW_                       | `sender`                     | Envelope sender                          |
| _NEW_                       | `domain`                     | Recipient domain                         |
| _NEW_                       | `num_attempts`               | Retry counter                            |
| _NEW_                       | `smtp_response`              | SMTP server response                     |
| _NEW_                       | `bounce_classification`      | Bounce type                              |

### 3.2 Status Enum Mapping

| Old Status (`QueueItem`)  | New Status (`MessageQueueItem`) | Migration Logic                          |
|---------------------------|---------------------------------|------------------------------------------|
| `waiting`                 | `ready`                         | Direct mapping                           |
| `in-progress`             | `in_delivery`                   | Direct mapping                           |
| `completed`               | `delivered`                     | Direct mapping                           |
| `cancelled`               | `cancelled`                     | Direct mapping                           |
| _NEW_                     | `scheduled`                     | N/A (new status)                         |
| _NEW_                     | `suspended`                     | N/A (new status)                         |
| _NEW_                     | `deferred`                      | N/A (new status)                         |
| _NEW_                     | `bounced`                       | N/A (new status)                         |
| _NEW_                     | `expired`                       | N/A (new status)                         |

### 3.3 QueueMetrics Mapping

| Old Metric                | New Metric                      | Notes                                    |
|---------------------------|---------------------------------|------------------------------------------|
| `totalWaiting`            | `messages_by_status.ready`      | Renamed for email context                |
| `averageWaitTime`         | `average_queue_time`            | Renamed, same concept                    |
| `longestWaitTime`         | `oldest_message_age`            | Renamed, same concept                    |
| `serviceUtilization`      | `delivery_rate`                 | Changed from % to messages/hour          |
| `customersServedToday`    | `messages_last_24h`             | Renamed for email context                |
| _NEW_                     | `bounce_rate`                   | N/A (new metric)                         |
| _NEW_                     | `retry_rate`                    | N/A (new metric)                         |
| _NEW_                     | `domain_health_scores`          | N/A (new metric)                         |

---

## 4. Breaking Changes

### 4.1 Critical Breaking Changes

1. **Interface Name Change**
   - `QueueItem` → `MessageQueueItem`
   - All imports must be updated

2. **Status Enum Values**
   - Old: `'waiting' | 'in-progress' | 'completed' | 'cancelled'`
   - New: `MessageQueueStatus` (9 possible values)
   - **Impact**: All status checks, filters, and UI components must be updated

3. **Removed Fields**
   - `customerName`, `customerPhone`, `notificationsSent`, `updatedAt`
   - **Impact**: Any component displaying these fields will break

4. **Field Renames**
   - `customerEmail` → `recipient`
   - `customerId` → `tenant_id`
   - **Impact**: All field references must be updated

5. **Metric Changes**
   - `QueueMetrics` structure completely redesigned
   - **Impact**: Dashboard widgets, analytics, and reporting must be refactored

### 4.2 Backward Compatibility Strategy

**Recommended Approach**: Adapter Pattern with Feature Flag

```typescript
/**
 * Adapter to support legacy QueueItem interface during migration
 * Enable via feature flag: ENABLE_LEGACY_QUEUE_ADAPTER
 */
export function adaptMessageToLegacyQueue(message: MessageQueueItem): Partial<QueueItem> {
  return {
    id: message.id,
    customerId: message.tenant_id || '',
    customerName: message.metadata?.customer_name as string || 'N/A',
    customerEmail: message.recipient,
    customerPhone: '',
    serviceType: message.campaign_id || 'email',
    priority: message.priority,
    status: adaptStatus(message.status),
    notes: message.metadata?.notes as string || '',
    estimatedWaitTime: message.next_attempt_at
      ? Math.ceil((new Date(message.next_attempt_at).getTime() - Date.now()) / 60000)
      : 0,
    createdAt: message.created_at,
    updatedAt: message.created_at, // Use created_at as fallback
    notificationsSent: [],
  };
}

function adaptStatus(status: MessageQueueStatus): QueueItem['status'] {
  switch (status) {
    case 'ready':
    case 'scheduled':
      return 'waiting';
    case 'in_delivery':
      return 'in-progress';
    case 'delivered':
      return 'completed';
    case 'cancelled':
    case 'bounced':
    case 'expired':
      return 'cancelled';
    default:
      return 'waiting';
  }
}
```

---

## 5. Migration Strategy

### Phase 1: Preparation (Week 1)
1. Create new type definitions in `/src/types/email-queue.ts`
2. Keep old types in `/src/types/queue.ts` (deprecated)
3. Add deprecation warnings to old types
4. Create adapter functions for backward compatibility

### Phase 2: Backend Integration (Week 2-3)
1. Update API endpoints to support both formats
2. Implement data transformation layer
3. Add feature flag: `ENABLE_EMAIL_QUEUE_MODEL`
4. Test with KumoMTA mock data

### Phase 3: Frontend Migration (Week 4-5)
1. Update `QueueManager` component to use `MessageQueueItem`
2. Refactor `QueueTable` for new status values
3. Update filters and search functionality
4. Migrate queue metrics dashboard

### Phase 4: Testing & Validation (Week 6)
1. E2E tests with new data model
2. Performance testing with large queues
3. User acceptance testing
4. Monitor error rates in staging

### Phase 5: Production Rollout (Week 7-8)
1. Enable feature flag for 10% of users
2. Monitor metrics and error rates
3. Gradual rollout to 100%
4. Remove adapter layer after 30 days

### Phase 6: Cleanup (Week 9)
1. Remove deprecated `QueueItem` interface
2. Remove adapter functions
3. Remove feature flags
4. Update documentation

---

## 6. Database Schema Considerations

### Recommended Table Structure

```sql
CREATE TABLE message_queue (
  id UUID PRIMARY KEY,
  message_id VARCHAR(255) NOT NULL,
  queue_name VARCHAR(255) NOT NULL,

  -- Routing
  recipient VARCHAR(255) NOT NULL,
  sender VARCHAR(255) NOT NULL,
  domain VARCHAR(255) NOT NULL,
  routing_domain VARCHAR(255),

  -- Organization
  campaign_id VARCHAR(100),
  tenant_id VARCHAR(100),
  pool_name VARCHAR(100),

  -- State
  status VARCHAR(50) NOT NULL,
  queue_state VARCHAR(50) NOT NULL DEFAULT 'active',
  priority INTEGER NOT NULL DEFAULT 5,

  -- Delivery
  size_bytes BIGINT NOT NULL,
  num_attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 20,
  last_attempt_at TIMESTAMP,
  next_attempt_at TIMESTAMP,

  -- Errors
  last_bounce_reason TEXT,
  bounce_classification VARCHAR(50),

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  scheduled_at TIMESTAMP,
  delivered_at TIMESTAMP,
  expires_at TIMESTAMP,

  -- SMTP
  smtp_response JSONB,
  delivery_protocol VARCHAR(10) DEFAULT 'smtp',

  -- Metadata
  headers JSONB,
  body_hash VARCHAR(64),
  attachment_count INTEGER DEFAULT 0,
  tags TEXT[],
  metadata JSONB,

  -- Indexes
  INDEX idx_queue_name (queue_name),
  INDEX idx_status (status),
  INDEX idx_domain (domain),
  INDEX idx_recipient (recipient),
  INDEX idx_campaign (campaign_id),
  INDEX idx_tenant (tenant_id),
  INDEX idx_created_at (created_at),
  INDEX idx_scheduled_at (scheduled_at),
  INDEX idx_next_attempt (next_attempt_at)
);
```

---

## 7. KumoMTA API Integration Points

### 7.1 Queue Query API

```typescript
// GET /api/admin/bounce/v1/list-scheduled-queues
interface KumoMTAQueueResponse {
  queues: Array<{
    name: string;
    message_count: number;
    state: 'active' | 'suspended';
  }>;
}

// GET /api/admin/bounce/v1/inspect-message/{message_id}
interface KumoMTAMessageDetails {
  id: string;
  queue: string;
  recipient: string;
  sender: string;
  size: number;
  attempts: number;
  next_attempt: string;
  last_response?: {
    code: number;
    message: string;
  };
}
```

### 7.2 Queue Operations API

```typescript
// POST /api/admin/suspend/v1/{domain}
// POST /api/admin/suspend-ready-queue/v1/{queue}
// POST /api/admin/resume-scheduled-queue/v1/{queue}
// POST /api/admin/rebind/v1
// POST /api/admin/bounce/v1
```

---

## 8. Testing Recommendations

### Unit Tests
- Type validation for all interfaces
- Status transition logic
- Adapter function accuracy
- Filter query builder

### Integration Tests
- KumoMTA API mock integration
- Database query performance
- Real-time metrics aggregation
- Queue operation side effects

### E2E Tests
- Queue manager UI with new data
- Status filter functionality
- Search across email fields
- Export functionality with new schema

### Performance Tests
- Query performance with 1M+ messages
- Metrics aggregation speed
- Filter query optimization
- Real-time update latency

---

## 9. Documentation Updates Required

1. **API Documentation**
   - Update queue endpoints documentation
   - Add new status enum documentation
   - Document migration endpoints

2. **UI Documentation**
   - Update queue manager screenshots
   - Document new filter options
   - Add bounce handling documentation

3. **Developer Guide**
   - Migration guide for developers
   - Type usage examples
   - Best practices for queue operations

4. **User Guide**
   - Explain new status meanings
   - Document queue operations
   - Troubleshooting guide

---

## 10. Risk Assessment

| Risk Category           | Severity | Probability | Mitigation                               |
|-------------------------|----------|-------------|------------------------------------------|
| Data Loss During Migration | High   | Low         | Comprehensive backup + rollback plan     |
| Breaking Existing UI    | High     | High        | Adapter pattern + feature flags          |
| Performance Degradation | Medium   | Medium      | Load testing + query optimization        |
| KumoMTA API Changes     | Medium   | Low         | Abstraction layer + version detection    |
| User Confusion          | Medium   | Medium      | Clear documentation + training           |
| Incomplete Migration    | Low      | Medium      | Automated migration validation scripts   |

---

## 11. Success Criteria

- [ ] Zero data loss during migration
- [ ] All E2E tests passing with new model
- [ ] Query performance within 10% of baseline
- [ ] Zero production incidents related to migration
- [ ] Full KumoMTA API integration working
- [ ] Documentation 100% updated
- [ ] Legacy adapter removed within 90 days

---

## Appendix A: Example Data

### Legacy QueueItem (Before)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "customerId": "CUST-123",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+1-555-0100",
  "serviceType": "technical-support",
  "priority": 8,
  "status": "waiting",
  "notes": "Needs urgent help",
  "estimatedWaitTime": 15,
  "createdAt": "2025-11-01T10:00:00Z",
  "updatedAt": "2025-11-01T10:05:00Z",
  "notificationsSent": []
}
```

### MessageQueueItem (After)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "message_id": "<20251101100000.abc123@mail.example.com>",
  "queue_name": "example.com",
  "recipient": "john@example.com",
  "sender": "newsletter@company.com",
  "domain": "example.com",
  "routing_domain": "mx.example.com",
  "campaign_id": "campaign-2025-11",
  "tenant_id": "TENANT-123",
  "pool_name": "marketing-pool",
  "status": "ready",
  "queue_state": "active",
  "priority": 8,
  "size_bytes": 45678,
  "num_attempts": 0,
  "max_attempts": 20,
  "created_at": "2025-11-01T10:00:00Z",
  "scheduled_at": "2025-11-01T10:15:00Z",
  "headers": {
    "Subject": "Weekly Newsletter",
    "From": "newsletter@company.com",
    "To": "john@example.com"
  },
  "tags": ["newsletter", "marketing"],
  "metadata": {
    "notes": "High-value customer",
    "customer_segment": "premium"
  }
}
```

---

## Document Metadata

- **Version**: 1.0.0
- **Last Updated**: 2025-11-01
- **Author**: Analyst Agent (Hive Mind Phase 2)
- **Status**: Draft for Review
- **Next Review**: Before Phase 3 implementation
