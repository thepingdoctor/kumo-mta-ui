/**
 * @deprecated These utilities are deprecated. Use Zustand authStore instead.
 *
 * Migration guide:
 * - Replace getAuthToken() with useAuthStore.getState().token
 * - Replace setAuthToken() with useAuthStore.getState().login()
 * - Replace removeAuthToken() with useAuthStore.getState().logout()
 *
 * This file is kept for backward compatibility and will be removed in v2.0
 */

/**
 * @deprecated Use useAuthStore.getState().token instead
 */
export const getAuthToken = (): string | null => {
  console.warn('getAuthToken() is deprecated. Use useAuthStore.getState().token instead.');
  return localStorage.getItem('auth_token');
};

/**
 * @deprecated Use useAuthStore.getState().login() instead
 */
export const setAuthToken = (token: string): void => {
  console.warn('setAuthToken() is deprecated. Use useAuthStore.getState().login() instead.');
  localStorage.setItem('auth_token', token);
};

/**
 * @deprecated Use useAuthStore.getState().logout() instead
 */
export const removeAuthToken = (): void => {
  console.warn('removeAuthToken() is deprecated. Use useAuthStore.getState().logout() instead.');
  localStorage.removeItem('auth_token');
};