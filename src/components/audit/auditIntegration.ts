/**
 * Audit Integration Utilities
 * Helper functions to integrate audit logging throughout the application
 */

import { auditService } from '../../services/auditService';
import {
  AuditEventCategory,
  AuditAction,
  AuditSeverity,
  type AuditEventDetails,
} from '../../types/audit';

/**
 * Log authentication events
 */
export const auditAuth = {
  login: async (username: string, success: boolean, details?: AuditEventDetails) => {
    await auditService.logEvent(
      AuditEventCategory.AUTH,
      AuditAction.LOGIN,
      success ? AuditSeverity.INFO : AuditSeverity.WARNING,
      {
        ...details,
        timestamp: new Date().toISOString(),
      },
      { success }
    );
  },

  logout: async (username: string) => {
    await auditService.logEvent(
      AuditEventCategory.AUTH,
      AuditAction.LOGOUT,
      AuditSeverity.INFO,
      {
        timestamp: new Date().toISOString(),
      }
    );
  },

  loginFailed: async (username: string, reason: string) => {
    await auditService.logEvent(
      AuditEventCategory.AUTH,
      AuditAction.LOGIN_FAILED,
      AuditSeverity.WARNING,
      {
        reason,
        attemptedUsername: username,
        timestamp: new Date().toISOString(),
      },
      { success: false, errorMessage: reason }
    );
  },

  passwordChange: async (username: string, success: boolean) => {
    await auditService.logEvent(
      AuditEventCategory.AUTH,
      AuditAction.PASSWORD_CHANGE,
      AuditSeverity.INFO,
      {
        timestamp: new Date().toISOString(),
      },
      { success }
    );
  },

  sessionExpired: async (username: string, sessionId: string) => {
    await auditService.logEvent(
      AuditEventCategory.AUTH,
      AuditAction.SESSION_EXPIRED,
      AuditSeverity.INFO,
      {
        sessionId,
        timestamp: new Date().toISOString(),
      }
    );
  },
};

/**
 * Log configuration events
 */
export const auditConfig = {
  update: async (
    configType: string,
    previousValue: unknown,
    newValue: unknown,
    success: boolean
  ) => {
    await auditService.logEvent(
      AuditEventCategory.CONFIG,
      AuditAction.CONFIG_UPDATE,
      success ? AuditSeverity.INFO : AuditSeverity.ERROR,
      {
        configType,
        previousValue,
        newValue,
        timestamp: new Date().toISOString(),
      },
      {
        resourceType: 'configuration',
        resourceId: configType,
        success,
      }
    );
  },

  view: async (configType: string) => {
    await auditService.logEvent(
      AuditEventCategory.CONFIG,
      AuditAction.CONFIG_VIEW,
      AuditSeverity.INFO,
      {
        configType,
        timestamp: new Date().toISOString(),
      },
      {
        resourceType: 'configuration',
        resourceId: configType,
      }
    );
  },

  export: async (configType: string, format: string) => {
    await auditService.logEvent(
      AuditEventCategory.CONFIG,
      AuditAction.CONFIG_EXPORT,
      AuditSeverity.INFO,
      {
        configType,
        format,
        timestamp: new Date().toISOString(),
      },
      {
        resourceType: 'configuration',
        resourceId: configType,
      }
    );
  },

  import: async (configType: string, success: boolean, itemsImported?: number) => {
    await auditService.logEvent(
      AuditEventCategory.CONFIG,
      AuditAction.CONFIG_IMPORT,
      success ? AuditSeverity.INFO : AuditSeverity.ERROR,
      {
        configType,
        itemsImported,
        timestamp: new Date().toISOString(),
      },
      {
        resourceType: 'configuration',
        resourceId: configType,
        success,
      }
    );
  },
};

/**
 * Log queue operations
 */
export const auditQueue = {
  suspend: async (queueName: string, reason: string, duration?: number) => {
    await auditService.logEvent(
      AuditEventCategory.QUEUE,
      AuditAction.QUEUE_SUSPEND,
      AuditSeverity.WARNING,
      {
        queueName,
        reason,
        duration,
        timestamp: new Date().toISOString(),
      },
      {
        resourceType: 'queue',
        resourceId: queueName,
        resourceName: queueName,
      }
    );
  },

  resume: async (queueName: string) => {
    await auditService.logEvent(
      AuditEventCategory.QUEUE,
      AuditAction.QUEUE_RESUME,
      AuditSeverity.INFO,
      {
        queueName,
        timestamp: new Date().toISOString(),
      },
      {
        resourceType: 'queue',
        resourceId: queueName,
        resourceName: queueName,
      }
    );
  },

  bounce: async (messageId: string, reason: string, count: number) => {
    await auditService.logEvent(
      AuditEventCategory.QUEUE,
      AuditAction.MESSAGE_BOUNCE,
      AuditSeverity.WARNING,
      {
        messageId,
        reason,
        affectedCount: count,
        timestamp: new Date().toISOString(),
      },
      {
        resourceType: 'message',
        resourceId: messageId,
      }
    );
  },

  rebind: async (messageId: string, newDomain: string, count: number) => {
    await auditService.logEvent(
      AuditEventCategory.QUEUE,
      AuditAction.MESSAGE_REBIND,
      AuditSeverity.INFO,
      {
        messageId,
        newDomain,
        affectedCount: count,
        timestamp: new Date().toISOString(),
      },
      {
        resourceType: 'message',
        resourceId: messageId,
      }
    );
  },

  purge: async (queueName: string, count: number) => {
    await auditService.logEvent(
      AuditEventCategory.QUEUE,
      AuditAction.QUEUE_PURGE,
      AuditSeverity.WARNING,
      {
        queueName,
        purgedCount: count,
        timestamp: new Date().toISOString(),
      },
      {
        resourceType: 'queue',
        resourceId: queueName,
        resourceName: queueName,
      }
    );
  },
};

/**
 * Log security events
 */
export const auditSecurity = {
  permissionChange: async (
    userId: string,
    previousPermissions: string[],
    newPermissions: string[]
  ) => {
    await auditService.logEvent(
      AuditEventCategory.SECURITY,
      AuditAction.PERMISSION_CHANGE,
      AuditSeverity.WARNING,
      {
        targetUserId: userId,
        previousPermissions,
        newPermissions,
        timestamp: new Date().toISOString(),
      },
      {
        resourceType: 'user',
        resourceId: userId,
      }
    );
  },

  roleChange: async (userId: string, previousRole: string, newRole: string) => {
    await auditService.logEvent(
      AuditEventCategory.SECURITY,
      AuditAction.ROLE_CHANGE,
      AuditSeverity.WARNING,
      {
        targetUserId: userId,
        previousValue: previousRole,
        newValue: newRole,
        timestamp: new Date().toISOString(),
      },
      {
        resourceType: 'user',
        resourceId: userId,
      }
    );
  },

  securitySettingChange: async (setting: string, previousValue: unknown, newValue: unknown) => {
    await auditService.logEvent(
      AuditEventCategory.SECURITY,
      AuditAction.SECURITY_SETTING_CHANGE,
      AuditSeverity.WARNING,
      {
        setting,
        previousValue,
        newValue,
        timestamp: new Date().toISOString(),
      },
      {
        resourceType: 'security_setting',
        resourceId: setting,
      }
    );
  },

  apiKeyCreate: async (keyId: string, scope: string[]) => {
    await auditService.logEvent(
      AuditEventCategory.SECURITY,
      AuditAction.API_KEY_CREATE,
      AuditSeverity.INFO,
      {
        keyId,
        scope,
        timestamp: new Date().toISOString(),
      },
      {
        resourceType: 'api_key',
        resourceId: keyId,
      }
    );
  },

  apiKeyRevoke: async (keyId: string, reason: string) => {
    await auditService.logEvent(
      AuditEventCategory.SECURITY,
      AuditAction.API_KEY_REVOKE,
      AuditSeverity.WARNING,
      {
        keyId,
        reason,
        timestamp: new Date().toISOString(),
      },
      {
        resourceType: 'api_key',
        resourceId: keyId,
      }
    );
  },
};

/**
 * Log user management events
 */
export const auditUser = {
  create: async (userId: string, username: string, role: string) => {
    await auditService.logEvent(
      AuditEventCategory.USER,
      AuditAction.USER_CREATE,
      AuditSeverity.INFO,
      {
        targetUserId: userId,
        username,
        role,
        timestamp: new Date().toISOString(),
      },
      {
        resourceType: 'user',
        resourceId: userId,
        resourceName: username,
      }
    );
  },

  update: async (userId: string, changes: Record<string, unknown>) => {
    await auditService.logEvent(
      AuditEventCategory.USER,
      AuditAction.USER_UPDATE,
      AuditSeverity.INFO,
      {
        targetUserId: userId,
        changes,
        timestamp: new Date().toISOString(),
      },
      {
        resourceType: 'user',
        resourceId: userId,
      }
    );
  },

  delete: async (userId: string, username: string) => {
    await auditService.logEvent(
      AuditEventCategory.USER,
      AuditAction.USER_DELETE,
      AuditSeverity.WARNING,
      {
        targetUserId: userId,
        username,
        timestamp: new Date().toISOString(),
      },
      {
        resourceType: 'user',
        resourceId: userId,
        resourceName: username,
      }
    );
  },

  disable: async (userId: string, reason: string) => {
    await auditService.logEvent(
      AuditEventCategory.USER,
      AuditAction.USER_DISABLE,
      AuditSeverity.WARNING,
      {
        targetUserId: userId,
        reason,
        timestamp: new Date().toISOString(),
      },
      {
        resourceType: 'user',
        resourceId: userId,
      }
    );
  },

  enable: async (userId: string) => {
    await auditService.logEvent(
      AuditEventCategory.USER,
      AuditAction.USER_ENABLE,
      AuditSeverity.INFO,
      {
        targetUserId: userId,
        timestamp: new Date().toISOString(),
      },
      {
        resourceType: 'user',
        resourceId: userId,
      }
    );
  },
};
