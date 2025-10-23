import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../../../src/store/authStore';
import type { User } from '../../../src/types';

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({ user: null, token: null });
  });

  describe('Initial State', () => {
    it('should have null user initially', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
    });

    it('should have null token initially', () => {
      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
    });

    it('should provide login function', () => {
      const state = useAuthStore.getState();
      expect(typeof state.login).toBe('function');
    });

    it('should provide logout function', () => {
      const state = useAuthStore.getState();
      expect(typeof state.logout).toBe('function');
    });
  });

  describe('Login', () => {
    it('should set user and token on login', () => {
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
      };
      const mockToken = 'jwt-token-abc123';

      const { login } = useAuthStore.getState();
      login(mockUser, mockToken);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockToken);
    });

    it('should update state when login is called multiple times', () => {
      const { login } = useAuthStore.getState();

      const user1: User = {
        id: '1',
        email: 'user1@example.com',
        name: 'User One',
      };
      login(user1, 'token1');

      expect(useAuthStore.getState().user).toEqual(user1);

      const user2: User = {
        id: '2',
        email: 'user2@example.com',
        name: 'User Two',
      };
      login(user2, 'token2');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(user2);
      expect(state.token).toBe('token2');
    });

    it('should handle user with all properties', () => {
      const fullUser: User = {
        id: 'user-456',
        email: 'admin@example.com',
        name: 'Admin User',
      };
      const token = 'admin-token-xyz';

      const { login } = useAuthStore.getState();
      login(fullUser, token);

      const state = useAuthStore.getState();
      expect(state.user?.id).toBe('user-456');
      expect(state.user?.email).toBe('admin@example.com');
      expect(state.user?.name).toBe('Admin User');
      expect(state.token).toBe(token);
    });
  });

  describe('Logout', () => {
    it('should clear user and token on logout', () => {
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
      };
      const mockToken = 'jwt-token';

      const { login, logout } = useAuthStore.getState();

      // First login
      login(mockUser, mockToken);
      expect(useAuthStore.getState().user).not.toBeNull();

      // Then logout
      logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
    });

    it('should handle logout when already logged out', () => {
      const { logout } = useAuthStore.getState();

      // Logout without being logged in
      logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
    });

    it('should completely reset auth state', () => {
      const { login, logout } = useAuthStore.getState();

      login(
        {
          id: '1',
          email: 'test@example.com',
          name: 'Test',
        },
        'token123'
      );

      logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
    });
  });

  describe('Store Subscription', () => {
    it('should notify subscribers on state change', () => {
      let notificationCount = 0;

      const unsubscribe = useAuthStore.subscribe(() => {
        notificationCount++;
      });

      const { login } = useAuthStore.getState();
      login(
        {
          id: '1',
          email: 'test@example.com',
          name: 'Test',
        },
        'token'
      );

      expect(notificationCount).toBeGreaterThan(0);

      unsubscribe();
    });

    it('should allow multiple subscribers', () => {
      let count1 = 0;
      let count2 = 0;

      const unsub1 = useAuthStore.subscribe(() => count1++);
      const unsub2 = useAuthStore.subscribe(() => count2++);

      const { login } = useAuthStore.getState();
      login(
        {
          id: '1',
          email: 'test@example.com',
          name: 'Test',
        },
        'token'
      );

      expect(count1).toBeGreaterThan(0);
      expect(count2).toBeGreaterThan(0);

      unsub1();
      unsub2();
    });
  });

  describe('State Persistence', () => {
    it('should maintain state across multiple reads', () => {
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
      };

      const { login } = useAuthStore.getState();
      login(mockUser, 'token');

      // Read state multiple times
      const state1 = useAuthStore.getState();
      const state2 = useAuthStore.getState();

      expect(state1.user).toEqual(state2.user);
      expect(state1.token).toEqual(state2.token);
    });

    it('should preserve user object reference until changed', () => {
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
      };

      const { login } = useAuthStore.getState();
      login(mockUser, 'token');

      const user1 = useAuthStore.getState().user;
      const user2 = useAuthStore.getState().user;

      expect(user1).toBe(user2);
    });
  });

  describe('Type Safety', () => {
    it('should enforce User type for login', () => {
      const { login } = useAuthStore.getState();

      const validUser: User = {
        id: '1',
        email: 'valid@example.com',
        name: 'Valid User',
      };

      // This should compile without errors
      login(validUser, 'token');

      expect(useAuthStore.getState().user).toEqual(validUser);
    });

    it('should enforce string type for token', () => {
      const { login } = useAuthStore.getState();

      login(
        {
          id: '1',
          email: 'test@example.com',
          name: 'Test',
        },
        'string-token'
      );

      const token = useAuthStore.getState().token;
      expect(typeof token).toBe('string');
    });
  });
});
