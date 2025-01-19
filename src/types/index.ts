export interface User {
  id: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
}

export interface EmailMetrics {
  sent: number;
  bounced: number;
  delayed: number;
  throughput: number;
}

export interface QueueItem {
  id: string;
  recipient: string;
  sender: string;
  status: 'queued' | 'sending' | 'failed';
  timestamp: string;
  retries: number;
}

export interface ServerStatus {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  activeConnections: number;
  queueSize: number;
}