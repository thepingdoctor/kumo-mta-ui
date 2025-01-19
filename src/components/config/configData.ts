import type { ConfigSection } from '../../types/config';

export const configSections: ConfigSection[] = [
  {
    id: 'core',
    title: 'Core Settings',
    description: 'Essential server configuration parameters',
    fields: [
      {
        id: 'serverName',
        label: 'Server Name',
        description: 'Unique identifier for this MTA server instance',
        type: 'text',
        defaultValue: 'kumo-mta-01',
        validation: {
          required: true,
          pattern: '^[a-zA-Z0-9-]+$'
        }
      },
      {
        id: 'maxConcurrentConnections',
        label: 'Max Concurrent Connections',
        description: 'Maximum number of simultaneous SMTP connections',
        type: 'number',
        defaultValue: 1000,
        validation: {
          required: true,
          min: 1,
          max: 10000
        }
      },
      {
        id: 'defaultPort',
        label: 'Default SMTP Port',
        description: 'Default port for incoming SMTP connections',
        type: 'number',
        defaultValue: 25,
        validation: {
          required: true,
          min: 1,
          max: 65535
        }
      },
      {
        id: 'ipv6Enabled',
        label: 'Enable IPv6',
        description: 'Enable IPv6 support for SMTP connections',
        type: 'boolean',
        defaultValue: true
      },
      {
        id: 'dnsResolvers',
        label: 'DNS Resolvers',
        description: 'List of DNS resolvers for MX lookups (comma-separated)',
        type: 'array',
        defaultValue: ['1.1.1.1', '8.8.8.8'],
        validation: {
          required: true
        }
      },
      {
        id: 'logLevel',
        label: 'Log Level',
        description: 'Logging verbosity level',
        type: 'select',
        defaultValue: 'info',
        validation: {
          required: true,
          options: ['debug', 'info', 'warn', 'error']
        }
      },
      {
        id: 'maxMessageSize',
        label: 'Max Message Size (MB)',
        description: 'Maximum size of incoming messages in megabytes',
        type: 'number',
        defaultValue: 25,
        validation: {
          required: true,
          min: 1,
          max: 100
        }
      },
      {
        id: 'queueRetryInterval',
        label: 'Queue Retry Interval (minutes)',
        description: 'Time between delivery attempts for failed messages',
        type: 'number',
        defaultValue: 15,
        validation: {
          required: true,
          min: 1,
          max: 1440
        }
      }
    ]
  },
  {
    id: 'integration',
    title: 'Integration Settings',
    description: 'External service connections and API configuration',
    fields: [
      {
        id: 'apiEndpoint',
        label: 'API Endpoint',
        description: 'Primary API endpoint URL',
        type: 'text',
        defaultValue: 'https://api.example.com/v1',
        validation: {
          required: true,
          pattern: '^https?://.+'
        }
      },
      {
        id: 'apiVersion',
        label: 'API Version',
        description: 'API version to use for requests',
        type: 'text',
        defaultValue: 'v1',
        validation: {
          required: true
        }
      },
      {
        id: 'apiKey',
        label: 'API Key',
        description: 'Authentication key for API access',
        type: 'text',
        defaultValue: '',
        validation: {
          required: true
        }
      },
      {
        id: 'webhookUrl',
        label: 'Webhook URL',
        description: 'Endpoint for receiving webhook notifications',
        type: 'text',
        defaultValue: '',
        validation: {
          pattern: '^https?://.+'
        }
      },
      {
        id: 'syncInterval',
        label: 'Sync Interval (minutes)',
        description: 'Frequency of data synchronization',
        type: 'number',
        defaultValue: 5,
        validation: {
          required: true,
          min: 1,
          max: 1440
        }
      },
      {
        id: 'backupEnabled',
        label: 'Enable Backups',
        description: 'Enable automated backups of configuration and data',
        type: 'boolean',
        defaultValue: true
      },
      {
        id: 'backupInterval',
        label: 'Backup Interval (hours)',
        description: 'Frequency of automated backups',
        type: 'number',
        defaultValue: 24,
        validation: {
          required: true,
          min: 1,
          max: 168
        }
      },
      {
        id: 'backupLocation',
        label: 'Backup Location',
        description: 'Storage location for backup files',
        type: 'text',
        defaultValue: '/var/backups/kumo-mta',
        validation: {
          required: true
        }
      },
      {
        id: 'failoverEndpoint',
        label: 'Failover Endpoint',
        description: 'Backup API endpoint for failover scenarios',
        type: 'text',
        defaultValue: '',
        validation: {
          pattern: '^https?://.+'
        }
      }
    ]
  },
  {
    id: 'performance',
    title: 'Performance Settings',
    description: 'Server performance and resource utilization configuration',
    fields: [
      {
        id: 'cacheEnabled',
        label: 'Enable Caching',
        description: 'Enable in-memory caching for improved performance',
        type: 'boolean',
        defaultValue: true
      },
      {
        id: 'cacheSize',
        label: 'Cache Size (MB)',
        description: 'Maximum memory allocation for cache',
        type: 'number',
        defaultValue: 512,
        validation: {
          required: true,
          min: 64,
          max: 4096
        }
      },
      {
        id: 'cacheExpiration',
        label: 'Cache Expiration (minutes)',
        description: 'Time before cached items expire',
        type: 'number',
        defaultValue: 60,
        validation: {
          required: true,
          min: 1,
          max: 1440
        }
      },
      {
        id: 'loadBalancingStrategy',
        label: 'Load Balancing Strategy',
        description: 'Algorithm for distributing incoming connections',
        type: 'select',
        defaultValue: 'round-robin',
        validation: {
          required: true,
          options: ['round-robin', 'least-connections', 'ip-hash']
        }
      },
      {
        id: 'maxMemoryUsage',
        label: 'Max Memory Usage (%)',
        description: 'Maximum system memory utilization',
        type: 'number',
        defaultValue: 80,
        validation: {
          required: true,
          min: 10,
          max: 95
        }
      },
      {
        id: 'maxCpuUsage',
        label: 'Max CPU Usage (%)',
        description: 'Maximum CPU utilization per core',
        type: 'number',
        defaultValue: 90,
        validation: {
          required: true,
          min: 10,
          max: 100
        }
      },
      {
        id: 'connectionTimeout',
        label: 'Connection Timeout (seconds)',
        description: 'Time before idle connections are closed',
        type: 'number',
        defaultValue: 30,
        validation: {
          required: true,
          min: 1,
          max: 300
        }
      },
      {
        id: 'readTimeout',
        label: 'Read Timeout (seconds)',
        description: 'Maximum time to wait for client data',
        type: 'number',
        defaultValue: 60,
        validation: {
          required: true,
          min: 1,
          max: 300
        }
      },
      {
        id: 'writeTimeout',
        label: 'Write Timeout (seconds)',
        description: 'Maximum time to wait for client response',
        type: 'number',
        defaultValue: 60,
        validation: {
          required: true,
          min: 1,
          max: 300
        }
      },
      {
        id: 'queueWorkers',
        label: 'Queue Workers',
        description: 'Number of concurrent queue processing workers',
        type: 'number',
        defaultValue: 4,
        validation: {
          required: true,
          min: 1,
          max: 32
        }
      }
    ]
  }
];