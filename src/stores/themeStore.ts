import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  actualTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// Detect system theme preference
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Calculate actual theme based on preference
const calculateActualTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
};

// Apply theme to document
const applyTheme = (actualTheme: 'light' | 'dark') => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  if (actualTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => {
      // Listen for system theme changes
      if (typeof window !== 'undefined') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
          const { theme } = get();
          if (theme === 'system') {
            const newActualTheme = getSystemTheme();
            set({ actualTheme: newActualTheme });
            applyTheme(newActualTheme);
          }
        };

        // Modern browsers
        if (mediaQuery.addEventListener) {
          mediaQuery.addEventListener('change', handleChange);
        } else {
          // Fallback for older browsers
          mediaQuery.addListener(handleChange);
        }
      }

      return {
        theme: 'system',
        actualTheme: getSystemTheme(),

        setTheme: (theme: Theme) => {
          const actualTheme = calculateActualTheme(theme);
          set({ theme, actualTheme });
          applyTheme(actualTheme);
        },

        toggleTheme: () => {
          const { actualTheme } = get();
          const newTheme = actualTheme === 'light' ? 'dark' : 'light';
          set({ theme: newTheme, actualTheme: newTheme });
          applyTheme(newTheme);
        },
      };
    },
    {
      name: 'kumomta-theme-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
      }),
      onRehydrateStorage: () => (state) => {
        // Apply theme immediately after rehydration
        if (state) {
          const actualTheme = calculateActualTheme(state.theme);
          state.actualTheme = actualTheme;
          applyTheme(actualTheme);
        }
      },
    }
  )
);

// Initialize theme on module load
if (typeof document !== 'undefined') {
  const storedTheme = localStorage.getItem('kumomta-theme-storage');
  let theme: Theme = 'system';

  if (storedTheme) {
    try {
      const parsed = JSON.parse(storedTheme);
      theme = parsed.state?.theme || 'system';
    } catch {
      // Ignore parse errors, use default 'system' theme
    }
  }

  const actualTheme = calculateActualTheme(theme);
  applyTheme(actualTheme);
}
