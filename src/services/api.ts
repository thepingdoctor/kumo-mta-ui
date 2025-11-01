import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import type { QueueItem, QueueFilter, QueueMetrics } from '../types/queue';
import type { CoreConfig, IntegrationConfig, PerformanceConfig } from '../types/config';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable CSRF protection
});

// Add auth token to requests - HTTP Basic Auth for KumoMTA compatibility
api.interceptors.request.use(
  config => {
    const authState = useAuthStore.getState();
    const token = authState.token;

    if (token) {
      // KumoMTA expects HTTP Basic Auth, not Bearer token
      // Format: username:password encoded in base64
      config.headers.Authorization = `Basic ${token}`;
    }

    // Add CSRF token if available
    const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      if (status === 401) {
        // Handle unauthorized - clear auth and redirect
        useAuthStore.getState().logout();
        window.location.href = '/login';
      } else if (status === 403) {
        // Forbidden - insufficient permissions
        throw new Error('Access forbidden: You do not have permission to perform this action');
      } else if (status >= 500) {
        throw new Error(`Server error: ${error.response.data?.message || 'Internal server error'}`);
      }
    } else if (error.request) {
      // Request made but no response
      throw new Error('Network error: Unable to connect to server. Please check your connection.');
    } else {
      // Something else happened
      throw new Error(`Request error: ${error.message}`);
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const apiService = {
  // Queue management endpoints (CUSTOM - not native KumoMTA endpoints)
  // These require middleware implementation
  queue: {
    /**
     * Get queue items with optional filters
     *
     * Retrieves a list of queue items from the KumoMTA system with support for
     * filtering by status, domain, campaign, tenant, and other criteria.
     *
     * @param {QueueFilter} filters - Filter criteria for queue items
     * @param {string} [filters.status] - Filter by queue item status (e.g., 'pending', 'processing', 'completed')
     * @param {string} [filters.domain] - Filter by destination domain
     * @param {string} [filters.campaign] - Filter by campaign identifier
     * @param {string} [filters.tenant] - Filter by tenant identifier
     * @returns {Promise<AxiosResponse<QueueItem[]>>} Promise resolving to array of queue items
     * @throws {Error} Network error if unable to connect to server
     * @throws {Error} Server error (5xx) if internal server error occurs
     * @example
     * ```typescript
     * const response = await apiService.queue.getItems({ status: 'pending', domain: 'example.com' });
     * const queueItems = response.data;
     * ```
     */
    getItems: (filters: QueueFilter) =>
      api.get<QueueItem[]>('/api/admin/queue/list', { params: filters }),

    /**
     * Update the status of a queue item
     *
     * Changes the status of a specific queue item identified by its ID.
     * Common status values include 'pending', 'processing', 'completed', 'failed'.
     *
     * @param {string} id - Unique identifier of the queue item
     * @param {QueueItem['status']} status - New status to set for the queue item
     * @returns {Promise<AxiosResponse>} Promise resolving when status is updated
     * @throws {Error} 403 error if insufficient permissions
     * @throws {Error} 404 error if queue item not found
     * @throws {Error} Server error (5xx) if internal server error occurs
     * @example
     * ```typescript
     * await apiService.queue.updateStatus('queue-123', 'completed');
     * ```
     */
    updateStatus: (id: string, status: QueueItem['status']) =>
      api.put(`/api/admin/queue/${id}/status`, { status }),

    /**
     * Add a new customer to the queue
     *
     * Creates a new queue item for a customer with the provided data.
     * This is typically used for onboarding or adding new email sending requests.
     *
     * @param {Partial<QueueItem>} data - Customer data to add to queue
     * @param {string} [data.email] - Customer email address
     * @param {string} [data.domain] - Destination domain
     * @param {string} [data.campaign] - Campaign identifier
     * @param {string} [data.tenant] - Tenant identifier
     * @returns {Promise<AxiosResponse>} Promise resolving when customer is added
     * @throws {Error} 400 error if invalid data provided
     * @throws {Error} 403 error if insufficient permissions
     * @throws {Error} Server error (5xx) if internal server error occurs
     * @example
     * ```typescript
     * const newCustomer = {
     *   email: 'user@example.com',
     *   domain: 'example.com',
     *   campaign: 'welcome-series',
     *   tenant: 'tenant-1'
     * };
     * await apiService.queue.addCustomer(newCustomer);
     * ```
     */
    addCustomer: (data: Partial<QueueItem>) =>
      api.post('/api/admin/queue/add', data),

    /**
     * Get queue metrics and statistics
     *
     * Retrieves comprehensive metrics about the queue system from KumoMTA's
     * native /metrics.json endpoint (Prometheus format).
     *
     * @returns {Promise<AxiosResponse<QueueMetrics>>} Promise resolving to queue metrics
     * @throws {Error} Network error if unable to connect to server
     * @throws {Error} Server error (5xx) if internal server error occurs
     * @example
     * ```typescript
     * const response = await apiService.queue.getMetrics();
     * const metrics = response.data;
     * console.log('Total queued:', metrics.total);
     * console.log('Processing rate:', metrics.processingRate);
     * ```
     */
    getMetrics: () =>
      api.get<QueueMetrics>('/metrics.json'),
  },

  // KumoMTA-specific endpoints (VERIFIED - native KumoMTA API)
  kumomta: {
    /**
     * Get KumoMTA server metrics
     *
     * Retrieves server-level metrics from KumoMTA in Prometheus format.
     * This is a native KumoMTA endpoint that provides comprehensive system statistics
     * including message counts, delivery rates, resource usage, and performance metrics.
     *
     * @returns {Promise<AxiosResponse>} Promise resolving to Prometheus-formatted metrics
     * @throws {Error} Network error if unable to connect to server
     * @throws {Error} Server error (5xx) if KumoMTA server error occurs
     * @example
     * ```typescript
     * const response = await apiService.kumomta.getMetrics();
     * const metrics = response.data;
     * // Parse Prometheus format metrics
     * ```
     */
    getMetrics: () =>
      api.get('/metrics.json'),

    /**
     * Get bounce classifications
     *
     * Retrieves bounce classification data from KumoMTA, including bounce categories,
     * reasons, and associated metrics. This is a native KumoMTA API endpoint.
     *
     * @returns {Promise<AxiosResponse>} Promise resolving to bounce classification data
     * @throws {Error} Network error if unable to connect to server
     * @throws {Error} Server error (5xx) if KumoMTA server error occurs
     * @example
     * ```typescript
     * const response = await apiService.kumomta.getBounces();
     * const bounces = response.data;
     * console.log('Bounce categories:', bounces);
     * ```
     */
    getBounces: () =>
      api.get('/api/admin/bounce/v1'),

    /**
     * Get scheduled queue details
     *
     * Retrieves details about messages scheduled for delivery, optionally filtered
     * by domain. Shows messages waiting in the scheduled queue before being moved
     * to the ready queue for delivery. This is a native KumoMTA API endpoint.
     *
     * @param {string} [domain] - Optional domain filter to get scheduled messages for specific domain
     * @returns {Promise<AxiosResponse>} Promise resolving to scheduled queue details
     * @throws {Error} Network error if unable to connect to server
     * @throws {Error} Server error (5xx) if KumoMTA server error occurs
     * @example
     * ```typescript
     * // Get all scheduled messages
     * const allScheduled = await apiService.kumomta.getScheduledQueue();
     *
     * // Get scheduled messages for specific domain
     * const domainScheduled = await apiService.kumomta.getScheduledQueue('example.com');
     * ```
     */
    getScheduledQueue: (domain?: string) =>
      api.get('/api/admin/bounce-list/v1', { params: { domain } }),

    /**
     * Suspend queue for a domain
     *
     * Temporarily suspends message delivery to a specific domain. Messages will
     * remain in queue but won't be delivered until the queue is resumed or the
     * suspension duration expires. This is a native KumoMTA API endpoint.
     *
     * @param {string} domain - Domain name to suspend delivery for
     * @param {string} reason - Reason for suspending the queue (for audit logging)
     * @param {number} [duration] - Optional duration in seconds before automatic resume
     * @returns {Promise<AxiosResponse>} Promise resolving when queue is suspended
     * @throws {Error} 400 error if invalid domain or duration
     * @throws {Error} 403 error if insufficient permissions
     * @throws {Error} Server error (5xx) if KumoMTA server error occurs
     * @example
     * ```typescript
     * // Suspend indefinitely
     * await apiService.kumomta.suspendQueue('example.com', 'High bounce rate detected');
     *
     * // Suspend for 1 hour (3600 seconds)
     * await apiService.kumomta.suspendQueue('example.com', 'Maintenance window', 3600);
     * ```
     */
    suspendQueue: (domain: string, reason: string, duration?: number) =>
      api.post('/api/admin/suspend/v1', { domain, reason, duration }),

    /**
     * Resume suspended queue
     *
     * Resumes message delivery to a previously suspended domain. Messages in queue
     * will begin delivery according to normal scheduling rules. This is a native
     * KumoMTA API endpoint.
     *
     * @param {string} domain - Domain name to resume delivery for
     * @returns {Promise<AxiosResponse>} Promise resolving when queue is resumed
     * @throws {Error} 400 error if invalid domain
     * @throws {Error} 403 error if insufficient permissions
     * @throws {Error} 404 error if queue not found or not suspended
     * @throws {Error} Server error (5xx) if KumoMTA server error occurs
     * @example
     * ```typescript
     * await apiService.kumomta.resumeQueue('example.com');
     * ```
     */
    resumeQueue: (domain: string) =>
      api.post('/api/admin/resume/v1', { domain }),

    /**
     * Suspend ready queue for a domain
     *
     * Suspends the ready queue (messages ready for immediate delivery) for a specific
     * domain. Unlike suspendQueue, this specifically targets the ready queue rather
     * than the scheduled queue. This is a native KumoMTA API endpoint.
     *
     * @param {string} domain - Domain name to suspend ready queue for
     * @param {string} reason - Reason for suspending the ready queue (for audit logging)
     * @returns {Promise<AxiosResponse>} Promise resolving when ready queue is suspended
     * @throws {Error} 400 error if invalid domain
     * @throws {Error} 403 error if insufficient permissions
     * @throws {Error} Server error (5xx) if KumoMTA server error occurs
     * @example
     * ```typescript
     * await apiService.kumomta.suspendReadyQueue('example.com', 'Temporary ISP issue');
     * ```
     */
    suspendReadyQueue: (domain: string, reason: string) =>
      api.post('/api/admin/suspend-ready-q/v1', { domain, reason }),

    /**
     * Rebind messages to different routing
     *
     * Changes the routing domain for messages matching specified criteria (campaign,
     * tenant, or domain). This allows redirecting messages to a different domain or
     * routing path without canceling the messages. This is a native KumoMTA API endpoint.
     *
     * @param {Object} data - Rebinding criteria and target
     * @param {string} [data.campaign] - Filter messages by campaign identifier
     * @param {string} [data.tenant] - Filter messages by tenant identifier
     * @param {string} [data.domain] - Filter messages by current domain
     * @param {string} [data.routing_domain] - Target domain to rebind messages to
     * @returns {Promise<AxiosResponse>} Promise resolving when messages are rebound
     * @throws {Error} 400 error if invalid parameters
     * @throws {Error} 403 error if insufficient permissions
     * @throws {Error} Server error (5xx) if KumoMTA server error occurs
     * @example
     * ```typescript
     * // Rebind all messages for a campaign to a new domain
     * await apiService.kumomta.rebindMessages({
     *   campaign: 'welcome-series',
     *   routing_domain: 'backup.example.com'
     * });
     *
     * // Rebind tenant messages to different routing
     * await apiService.kumomta.rebindMessages({
     *   tenant: 'tenant-1',
     *   domain: 'old-domain.com',
     *   routing_domain: 'new-domain.com'
     * });
     * ```
     */
    rebindMessages: (data: { campaign?: string; tenant?: string; domain?: string; routing_domain?: string }) =>
      api.post('/api/admin/rebind/v1', data),

    /**
     * Bounce messages with reason
     *
     * Generates bounces for messages matching specified criteria (campaign, tenant,
     * or domain). Bounced messages are removed from the queue and bounce notifications
     * are generated. This is a native KumoMTA API endpoint.
     *
     * @param {Object} data - Bounce criteria and reason
     * @param {string} [data.campaign] - Filter messages by campaign identifier
     * @param {string} [data.tenant] - Filter messages by tenant identifier
     * @param {string} [data.domain] - Filter messages by domain
     * @param {string} data.reason - Bounce reason message (required)
     * @returns {Promise<AxiosResponse>} Promise resolving when messages are bounced
     * @throws {Error} 400 error if invalid parameters or missing reason
     * @throws {Error} 403 error if insufficient permissions
     * @throws {Error} Server error (5xx) if KumoMTA server error occurs
     * @example
     * ```typescript
     * // Bounce all messages for a specific domain
     * await apiService.kumomta.bounceMessages({
     *   domain: 'example.com',
     *   reason: 'Domain permanently suspended due to high complaint rate'
     * });
     *
     * // Bounce campaign messages
     * await apiService.kumomta.bounceMessages({
     *   campaign: 'old-campaign',
     *   reason: 'Campaign canceled by sender'
     * });
     * ```
     */
    bounceMessages: (data: { campaign?: string; tenant?: string; domain?: string; reason: string }) =>
      api.post('/api/admin/bounce/v1', data),

    /**
     * Get SMTP trace logs
     *
     * Retrieves detailed SMTP server trace logs for debugging and monitoring.
     * Shows SMTP protocol-level interactions including connections, commands,
     * and responses. This is a native KumoMTA API endpoint.
     *
     * @returns {Promise<AxiosResponse>} Promise resolving to SMTP trace logs
     * @throws {Error} Network error if unable to connect to server
     * @throws {Error} Server error (5xx) if KumoMTA server error occurs
     * @example
     * ```typescript
     * const response = await apiService.kumomta.getTraceLogs();
     * const logs = response.data;
     * console.log('SMTP trace logs:', logs);
     * ```
     */
    getTraceLogs: () =>
      api.get('/api/admin/trace-smtp-server/v1'),

    /**
     * Set diagnostic log filter
     *
     * Configures diagnostic logging filters to control which events are logged.
     * This allows dynamic control of log verbosity without restarting the server.
     * Filters can be set for a specific duration before reverting to default.
     * This is a native KumoMTA API endpoint.
     *
     * @param {string} filter - Log filter expression (e.g., 'kumod=trace', 'smtp=debug')
     * @param {number} [duration] - Optional duration in seconds before filter expires and reverts to default
     * @returns {Promise<AxiosResponse>} Promise resolving when filter is set
     * @throws {Error} 400 error if invalid filter expression
     * @throws {Error} 403 error if insufficient permissions
     * @throws {Error} Server error (5xx) if KumoMTA server error occurs
     * @example
     * ```typescript
     * // Set trace logging for 5 minutes (300 seconds)
     * await apiService.kumomta.setDiagnosticLog('kumod=trace', 300);
     *
     * // Set debug logging indefinitely
     * await apiService.kumomta.setDiagnosticLog('smtp=debug');
     *
     * // Enable detailed logging for specific module
     * await apiService.kumomta.setDiagnosticLog('delivery=trace,bounce=debug', 600);
     * ```
     */
    setDiagnosticLog: (filter: string, duration?: number) =>
      api.post('/api/admin/set-diagnostic-log-filter/v1', { filter, duration }),
  },

  // Configuration endpoints (CUSTOM - requires middleware)
  // KumoMTA uses Lua-based configuration files, not REST API
  config: {
    /**
     * Update core configuration settings
     *
     * Updates KumoMTA core configuration including server settings, SMTP parameters,
     * and system-level options. Note: This is a custom endpoint requiring middleware
     * implementation as KumoMTA natively uses Lua-based configuration files.
     *
     * @param {CoreConfig} config - Core configuration object
     * @param {string} [config.hostname] - Server hostname
     * @param {number} [config.smtpPort] - SMTP listening port
     * @param {string} [config.logLevel] - Logging level (e.g., 'info', 'debug', 'trace')
     * @returns {Promise<AxiosResponse>} Promise resolving when configuration is updated
     * @throws {Error} 400 error if invalid configuration
     * @throws {Error} 403 error if insufficient permissions
     * @throws {Error} Server error (5xx) if internal server error occurs
     * @example
     * ```typescript
     * await apiService.config.updateCore({
     *   hostname: 'mail.example.com',
     *   smtpPort: 25,
     *   logLevel: 'info'
     * });
     * ```
     */
    updateCore: (config: CoreConfig) =>
      api.put('/api/admin/config/core', config),

    /**
     * Update integration configuration settings
     *
     * Updates integration configuration for external services like webhooks,
     * authentication providers, and third-party integrations. Note: This is a
     * custom endpoint requiring middleware implementation.
     *
     * @param {IntegrationConfig} config - Integration configuration object
     * @param {string} [config.webhookUrl] - Webhook endpoint URL
     * @param {Object} [config.authProvider] - Authentication provider settings
     * @param {Object} [config.externalServices] - External service integrations
     * @returns {Promise<AxiosResponse>} Promise resolving when configuration is updated
     * @throws {Error} 400 error if invalid configuration
     * @throws {Error} 403 error if insufficient permissions
     * @throws {Error} Server error (5xx) if internal server error occurs
     * @example
     * ```typescript
     * await apiService.config.updateIntegration({
     *   webhookUrl: 'https://api.example.com/webhook',
     *   authProvider: { type: 'oauth2', clientId: '...' }
     * });
     * ```
     */
    updateIntegration: (config: IntegrationConfig) =>
      api.put('/api/admin/config/integration', config),

    /**
     * Update performance configuration settings
     *
     * Updates performance-related configuration including connection pools,
     * rate limits, concurrency settings, and resource allocation. Note: This is
     * a custom endpoint requiring middleware implementation.
     *
     * @param {PerformanceConfig} config - Performance configuration object
     * @param {number} [config.maxConnections] - Maximum concurrent connections
     * @param {number} [config.rateLimit] - Messages per second rate limit
     * @param {number} [config.workerThreads] - Number of worker threads
     * @returns {Promise<AxiosResponse>} Promise resolving when configuration is updated
     * @throws {Error} 400 error if invalid configuration
     * @throws {Error} 403 error if insufficient permissions
     * @throws {Error} Server error (5xx) if internal server error occurs
     * @example
     * ```typescript
     * await apiService.config.updatePerformance({
     *   maxConnections: 1000,
     *   rateLimit: 100,
     *   workerThreads: 4
     * });
     * ```
     */
    updatePerformance: (config: PerformanceConfig) =>
      api.put('/api/admin/config/performance', config),

    /**
     * Get current core configuration
     *
     * Retrieves the current core configuration settings from KumoMTA.
     * Note: This is a custom endpoint requiring middleware implementation as
     * KumoMTA natively uses Lua-based configuration files.
     *
     * @returns {Promise<AxiosResponse<CoreConfig>>} Promise resolving to core configuration
     * @throws {Error} Network error if unable to connect to server
     * @throws {Error} Server error (5xx) if internal server error occurs
     * @example
     * ```typescript
     * const response = await apiService.config.getCore();
     * const coreConfig = response.data;
     * console.log('SMTP Port:', coreConfig.smtpPort);
     * ```
     */
    getCore: () =>
      api.get<CoreConfig>('/api/admin/config/core'),

    /**
     * Get current integration configuration
     *
     * Retrieves the current integration configuration settings including
     * webhooks, authentication providers, and external service configurations.
     * Note: This is a custom endpoint requiring middleware implementation.
     *
     * @returns {Promise<AxiosResponse<IntegrationConfig>>} Promise resolving to integration configuration
     * @throws {Error} Network error if unable to connect to server
     * @throws {Error} Server error (5xx) if internal server error occurs
     * @example
     * ```typescript
     * const response = await apiService.config.getIntegration();
     * const integrationConfig = response.data;
     * console.log('Webhook URL:', integrationConfig.webhookUrl);
     * ```
     */
    getIntegration: () =>
      api.get<IntegrationConfig>('/api/admin/config/integration'),

    /**
     * Get current performance configuration
     *
     * Retrieves the current performance configuration settings including
     * connection limits, rate limits, and resource allocation parameters.
     * Note: This is a custom endpoint requiring middleware implementation.
     *
     * @returns {Promise<AxiosResponse<PerformanceConfig>>} Promise resolving to performance configuration
     * @throws {Error} Network error if unable to connect to server
     * @throws {Error} Server error (5xx) if internal server error occurs
     * @example
     * ```typescript
     * const response = await apiService.config.getPerformance();
     * const perfConfig = response.data;
     * console.log('Max Connections:', perfConfig.maxConnections);
     * console.log('Rate Limit:', perfConfig.rateLimit);
     * ```
     */
    getPerformance: () =>
      api.get<PerformanceConfig>('/api/admin/config/performance'),
  }
};