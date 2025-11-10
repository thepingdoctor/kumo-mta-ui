/**
 * WebSocket reconnection logic with exponential backoff
 */

export interface ReconnectConfig {
  initialDelay: number;
  maxDelay: number;
  maxAttempts: number;
  backoffMultiplier: number;
}

export const DEFAULT_RECONNECT_CONFIG: ReconnectConfig = {
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  maxAttempts: 10,
  backoffMultiplier: 1.5,
};

export class WebSocketReconnectManager {
  private currentAttempt = 0;
  private currentDelay: number;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private config: ReconnectConfig;

  constructor(config: Partial<ReconnectConfig> = {}) {
    this.config = { ...DEFAULT_RECONNECT_CONFIG, ...config };
    this.currentDelay = this.config.initialDelay;
  }

  /**
   * Calculate next reconnect delay using exponential backoff with jitter
   */
  private calculateDelay(): number {
    const exponentialDelay = Math.min(
      this.config.initialDelay * Math.pow(this.config.backoffMultiplier, this.currentAttempt),
      this.config.maxDelay
    );

    // Add jitter (±20%) to prevent thundering herd
    const jitter = exponentialDelay * 0.2 * (Math.random() - 0.5);
    return Math.floor(exponentialDelay + jitter);
  }

  /**
   * Schedule next reconnection attempt
   */
  scheduleReconnect(callback: () => void): boolean {
    if (this.currentAttempt >= this.config.maxAttempts) {
      console.error(
        `[WebSocket] Max reconnection attempts (${this.config.maxAttempts}) reached`
      );
      return false;
    }

    this.currentAttempt++;
    this.currentDelay = this.calculateDelay();

    console.log(
      `[WebSocket] Scheduling reconnection attempt ${this.currentAttempt}/${this.config.maxAttempts} in ${this.currentDelay}ms`
    );

    this.reconnectTimeout = setTimeout(() => {
      callback();
    }, this.currentDelay);

    return true;
  }

  /**
   * Reset reconnection state after successful connection
   */
  reset(): void {
    this.currentAttempt = 0;
    this.currentDelay = this.config.initialDelay;
    this.cancelReconnect();
  }

  /**
   * Cancel pending reconnection
   */
  cancelReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * Get current reconnection state
   */
  getState() {
    return {
      currentAttempt: this.currentAttempt,
      maxAttempts: this.config.maxAttempts,
      currentDelay: this.currentDelay,
      isReconnecting: this.reconnectTimeout !== null,
    };
  }

  /**
   * Check if more reconnection attempts are available
   */
  canReconnect(): boolean {
    return this.currentAttempt < this.config.maxAttempts;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ReconnectConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
