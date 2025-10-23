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
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  recipient: string;
  sender: string;
  serviceType: string;
  priority: number;
  status: 'waiting' | 'in-progress' | 'completed' | 'cancelled' | 'queued' | 'sending' | 'failed';
  notes: string;
  estimatedWaitTime: number; // in minutes
  actualWaitTime?: number; // in minutes
  timestamp: string;
  retries: number;
  createdAt: string;
  updatedAt: string;
  notificationsSent: NotificationRecord[];
}

export interface NotificationRecord {
  id: string;
  type: 'email' | 'sms';
  status: 'sent' | 'failed';
  timestamp: string;
}

export interface ServerStatus {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  activeConnections: number;
  queueSize: number;
}