export interface CoreConfig {
  serverName: string;
  maxConcurrentConnections: number;
  defaultPort: number;
  ipv6Enabled: boolean;
  dnsResolvers: string[];
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  maxMessageSize: number;
  queueRetryInterval: number;
}

export interface IntegrationConfig {
  apiEndpoint: string;
  apiVersion: string;
  apiKey: string;
  webhookUrl: string;
  syncInterval: number;
  backupEnabled: boolean;
  backupInterval: number;
  backupLocation: string;
  failoverEndpoint: string;
}

export interface PerformanceConfig {
  cacheEnabled: boolean;
  cacheSize: number;
  cacheExpiration: number;
  loadBalancingStrategy: 'round-robin' | 'least-connections' | 'ip-hash';
  maxMemoryUsage: number;
  maxCpuUsage: number;
  connectionTimeout: number;
  readTimeout: number;
  writeTimeout: number;
  queueWorkers: number;
}

export interface ConfigSection {
  id: string;
  title: string;
  description: string;
  fields: ConfigField[];
}

export interface ConfigField {
  id: string;
  label: string;
  description: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'array';
  defaultValue: any;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
  error?: string;
}