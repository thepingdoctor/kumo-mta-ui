import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  refreshToken: (newToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => {
        set({ user, token, isAuthenticated: true });
        // Token is persisted via Zustand middleware - no need for duplicate localStorage
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        // Zustand persist middleware handles removal
      },
      refreshToken: (newToken) => {
        set({ token: newToken });
        // Zustand persist middleware handles update
      },
    }),
    {
      name: 'kumomta-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
