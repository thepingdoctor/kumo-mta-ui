import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
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

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {
    // Mock unobserve
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {
    // Mock constructor
  }
  disconnect() {
    // Mock disconnect
  }
  observe() {
    // Mock observe
  }
  unobserve() {
    // Mock unobserve
  }
};

// Mock react-window's FixedSizeList for testing
vi.mock('react-window', async () => {
  const React = await import('react');

  interface FixedSizeListProps {
    children: (props: { index: number; style: Record<string, unknown>; data: unknown }) => React.ReactNode;
    itemData: unknown;
    itemCount: number;
  }

  return {
    FixedSizeList: ({ children, itemData, itemCount }: FixedSizeListProps) => {
      // Render all items in test mode (no virtualization)
      return React.createElement(
        'div',
        { 'data-testid': 'virtual-list' },
        Array.from({ length: itemCount }).map((_, index) =>
          children({ index, style: {}, data: itemData })
        )
      );
    },
  };
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
};
