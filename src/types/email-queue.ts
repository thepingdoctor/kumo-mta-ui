/**
 * Email Queue Types for KumoMTA Integration
 *
 * This module defines the email message queue data model,
 * replacing the legacy customer service queue model.
 *
 * Based on Phase 2 design: docs/EMAIL_QUEUE_MODEL.md
 */

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
 * Bounce classification types
 */
export type BounceType =
  | 'hard'           // Permanent delivery failure
  | 'soft'           // Temporary delivery failure
  | 'block'          // Blocked by recipient server
  | 'complaint'      // Spam complaint
  | 'unknown';       // Unclassified bounce

/**
 * SMTP response from delivery attempt
 */
export interface SmtpResponse {
  code: number;                    // SMTP response code (e.g., 250, 421, 550)
  message: string;                 // Response message
  enhanced_code?: string;          // Enhanced status code (e.g., 5.1.1)
}

/**
 * Represents an individual email message in the KumoMTA queue
 * This is the primary data model for email queue management
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

/**
 * Email queue metrics for monitoring and analytics
 */
export interface EmailQueueMetrics {
  // Queue Depth Metrics
  total_messages: number;              // Total messages in queue
  scheduled_messages: number;          // Messages scheduled for future delivery
  ready_messages: number;              // Messages ready for immediate delivery
  suspended_messages: number;          // Messages with suspended delivery

  // Delivery Metrics
  delivery_rate: number;               // Messages delivered per minute
  bounce_rate: number;                 // Percentage of bounced messages
  deferral_rate: number;               // Percentage of deferred messages
  average_delivery_time: number;       // Average delivery time in seconds

  // Error Metrics
  hard_bounces: number;                // Count of hard bounces
  soft_bounces: number;                // Count of soft bounces
  blocks: number;                      // Count of blocked messages
  complaints: number;                  // Count of spam complaints

  // Performance Metrics
  messages_per_connection: number;     // Average messages per SMTP connection
  connection_rate: number;             // New connections per minute
  active_connections: number;          // Currently active SMTP connections

  // Domain-Specific Metrics
  domains_in_queue: number;            // Unique domains in queue
  top_domains: DomainMetric[];         // Top domains by message count

  // Time-based Metrics
  oldest_message_age: number;          // Age of oldest message in seconds
  average_queue_time: number;          // Average time messages spend in queue
}

/**
 * Domain-specific queue metrics
 */
export interface DomainMetric {
  domain: string;
  message_count: number;
  queue_state: QueueState;
  delivery_rate: number;
  bounce_rate: number;
}

/**
 * Filter options for email queue queries
 */
export interface EmailQueueFilter {
  // Status Filtering
  status?: MessageQueueStatus | MessageQueueStatus[];
  queue_state?: QueueState | QueueState[];

  // Domain & Campaign Filtering
  domain?: string;
  campaign_id?: string;
  tenant_id?: string;
  pool_name?: string;

  // Search
  search_query?: string;              // Search in recipient, sender, message_id

  // Time Range Filtering
  created_after?: string;             // ISO timestamp
  created_before?: string;            // ISO timestamp
  scheduled_after?: string;           // ISO timestamp
  scheduled_before?: string;          // ISO timestamp

  // Delivery Filtering
  min_attempts?: number;              // Minimum delivery attempts
  max_attempts?: number;              // Maximum delivery attempts
  has_bounces?: boolean;              // Only show bounced messages
  bounce_type?: BounceType;           // Filter by bounce type

  // Priority Filtering
  min_priority?: number;              // Minimum priority (0-10)
  max_priority?: number;              // Maximum priority (0-10)

  // Tags & Metadata
  tags?: string[];                    // Filter by tags (AND logic)
  metadata_key?: string;              // Filter by metadata key existence

  // Pagination
  limit?: number;                     // Results per page (default: 50)
  offset?: number;                    // Results to skip
  sort_by?: 'created_at' | 'priority' | 'num_attempts' | 'domain';
  sort_order?: 'asc' | 'desc';
}

/**
 * Queue operation results
 */
export interface QueueOperationResult {
  success: boolean;
  messages_affected: number;
  operation: string;
  timestamp: string;
  errors?: string[];
}
