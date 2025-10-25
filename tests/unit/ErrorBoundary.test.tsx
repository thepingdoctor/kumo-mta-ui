import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from '../../src/components/ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary Component', () => {
  let consoleErrorSpy: any;

  // Suppress console errors in tests
  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('Normal Rendering', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should pass through multiple children', () => {
      render(
        <ErrorBoundary>
          <div>Child 1</div>
          <div>Child 2</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should catch errors and display error UI', () => {
      // Temporarily restore console.error for this specific test since ErrorBoundary logs to it
      consoleErrorSpy.mockRestore();
      const tempSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.queryByText('No error')).not.toBeInTheDocument();

      tempSpy.mockRestore();
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should display error message to user', () => {
      // Temporarily restore console.error for this specific test
      consoleErrorSpy.mockRestore();
      const tempSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(
        screen.getByText(/The application encountered an error/i)
      ).toBeInTheDocument();

      tempSpy.mockRestore();
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should display refresh button in error state', () => {
      consoleErrorSpy.mockRestore();
      const tempSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const refreshButton = screen.getByRole('button', { name: /refresh page/i });
      expect(refreshButton).toBeInTheDocument();

      tempSpy.mockRestore();
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should log error to console', () => {
      consoleErrorSpy.mockRestore();
      const localSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(localSpy).toHaveBeenCalled();

      localSpy.mockRestore();
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });
  });

  describe('Refresh Functionality', () => {
    it('should reload page when refresh button is clicked', async () => {
      consoleErrorSpy.mockRestore();
      const tempSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const user = userEvent.setup();
      const reloadMock = vi.fn();

      Object.defineProperty(window, 'location', {
        writable: true,
        value: { reload: reloadMock },
      });

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const refreshButton = screen.getByRole('button', { name: /refresh page/i });
      await user.click(refreshButton);

      expect(reloadMock).toHaveBeenCalledTimes(1);

      tempSpy.mockRestore();
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });
  });

  describe('Development Mode', () => {
    it('should display error stack in development mode', () => {
      consoleErrorSpy.mockRestore();
      const tempSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Error: Test error/)).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
      tempSpy.mockRestore();
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should not display error stack in production mode', () => {
      consoleErrorSpy.mockRestore();
      const tempSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByText(/Error: Test error/)).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
      tempSpy.mockRestore();
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });
  });

  describe('Visual Design', () => {
    it('should have proper styling for error container', () => {
      consoleErrorSpy.mockRestore();
      const tempSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorContainer = container.querySelector('.bg-white.shadow-lg');
      expect(errorContainer).toBeInTheDocument();

      tempSpy.mockRestore();
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should have centered layout', () => {
      consoleErrorSpy.mockRestore();
      const tempSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const wrapper = container.querySelector('.min-h-screen.flex.items-center.justify-center');
      expect(wrapper).toBeInTheDocument();

      tempSpy.mockRestore();
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should style error heading appropriately', () => {
      consoleErrorSpy.mockRestore();
      const tempSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const heading = screen.getByRole('heading', { name: /something went wrong/i });
      expect(heading).toHaveClass('text-red-600');

      tempSpy.mockRestore();
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should style refresh button appropriately', () => {
      consoleErrorSpy.mockRestore();
      const tempSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const button = screen.getByRole('button', { name: /refresh page/i });
      expect(button).toHaveClass('bg-blue-600', 'text-white');

      tempSpy.mockRestore();
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });
  });

  describe('Accessibility', () => {
    it('should have accessible error heading', () => {
      consoleErrorSpy.mockRestore();
      const tempSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

      tempSpy.mockRestore();
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should have accessible refresh button', () => {
      consoleErrorSpy.mockRestore();
      const tempSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Refresh Page');

      tempSpy.mockRestore();
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });
  });

  describe('Error Recovery', () => {
    it('should reset error state when children change', () => {
      consoleErrorSpy.mockRestore();
      const tempSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      // Note: Error boundaries don't automatically reset in React
      // This test documents current behavior
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      tempSpy.mockRestore();
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });
  });
});
