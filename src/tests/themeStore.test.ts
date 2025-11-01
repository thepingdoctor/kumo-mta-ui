import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useThemeStore } from '../stores/themeStore';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('useThemeStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    document.documentElement.classList.remove('dark');
  });

  it('should initialize with system theme', () => {
    const { result } = renderHook(() => useThemeStore());
    expect(result.current.theme).toBe('system');
  });

  it('should set theme to light', () => {
    const { result } = renderHook(() => useThemeStore());

    act(() => {
      result.current.setTheme('light');
    });

    expect(result.current.theme).toBe('light');
    expect(result.current.actualTheme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should set theme to dark', () => {
    const { result } = renderHook(() => useThemeStore());

    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.theme).toBe('dark');
    expect(result.current.actualTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should toggle theme from light to dark', () => {
    const { result } = renderHook(() => useThemeStore());

    act(() => {
      result.current.setTheme('light');
    });

    expect(result.current.actualTheme).toBe('light');

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('dark');
    expect(result.current.actualTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should toggle theme from dark to light', () => {
    const { result } = renderHook(() => useThemeStore());

    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.actualTheme).toBe('dark');

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('light');
    expect(result.current.actualTheme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should persist theme to localStorage', async () => {
    const { result } = renderHook(() => useThemeStore());

    act(() => {
      result.current.setTheme('dark');
    });

    // Wait for Zustand persist to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    const stored = localStorageMock.getItem('kumomta-theme-storage');
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored!);
    expect(parsed.state.theme).toBe('dark');
  });

  it('should restore theme from localStorage', () => {
    // Set initial theme in localStorage
    localStorageMock.setItem(
      'kumomta-theme-storage',
      JSON.stringify({
        state: { theme: 'dark' },
        version: 0,
      })
    );

    const { result } = renderHook(() => useThemeStore());

    // Theme should be restored from localStorage
    expect(result.current.theme).toBe('dark');
  });

  it('should handle system theme when set to system', () => {
    // Mock system preferring dark mode
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useThemeStore());

    act(() => {
      result.current.setTheme('system');
    });

    expect(result.current.theme).toBe('system');
    // actualTheme should reflect system preference (dark in this mock)
    expect(result.current.actualTheme).toBe('dark');
  });
});
