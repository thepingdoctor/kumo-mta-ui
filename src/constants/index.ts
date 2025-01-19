export const QUEUE_STATUS = {
  WAITING: 'waiting',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export const ERROR_MESSAGES = {
  QUEUE_LOAD_FAILED: 'Failed to load queue data',
  UPDATE_STATUS_FAILED: 'Could not update status',
  INVALID_INPUT: 'Please check your input',
  AUTH_REQUIRED: 'Authentication required',
  SERVER_ERROR: 'Server error occurred',
  NETWORK_ERROR: 'Network connection error'
} as const;