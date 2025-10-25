import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { OfflineIndicator } from '../../components/common/OfflineIndicator';

describe('OfflineIndicator', () => {
  const mockNavigator = {
    onLine: true,
  };

  beforeEach(() => {
    Object.defineProperty(window, 'navigator', {
      value: mockNavigator,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when online', () => {
    mockNavigator.onLine = true;
    const { container } = render(<OfflineIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('should render offline indicator when offline', async () => {
    mockNavigator.onLine = false;
    render(<OfflineIndicator />);

    await waitFor(() => {
      expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
    });
  });

  it('should show pending requests count when offline', async () => {
    mockNavigator.onLine = false;
    render(<OfflineIndicator />);

    // Simulate pending requests event
    const event = new CustomEvent('sw-pending-requests', {
      detail: { count: 5 },
    });
    window.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.getByText(/5 pending requests/i)).toBeInTheDocument();
    });
  });

  it('should show online toast when coming back online', async () => {
    mockNavigator.onLine = false;
    const { rerender } = render(<OfflineIndicator showOnlineNotification={true} />);

    // Simulate coming back online
    mockNavigator.onLine = true;
    const onlineEvent = new Event('online');
    window.dispatchEvent(onlineEvent);

    rerender(<OfflineIndicator showOnlineNotification={true} />);

    await waitFor(() => {
      expect(screen.getByText(/you're back online/i)).toBeInTheDocument();
    });
  });

  it('should not show online toast when showOnlineNotification is false', async () => {
    mockNavigator.onLine = false;
    render(<OfflineIndicator showOnlineNotification={false} />);

    // Simulate coming back online
    mockNavigator.onLine = true;
    const onlineEvent = new Event('online');
    window.dispatchEvent(onlineEvent);

    await waitFor(() => {
      expect(screen.queryByText(/you're back online/i)).not.toBeInTheDocument();
    });
  });

  it('should render at top position by default', async () => {
    mockNavigator.onLine = false;
    const { container } = render(<OfflineIndicator />);

    await waitFor(() => {
      const indicator = container.querySelector('[role="alert"]');
      expect(indicator?.className).toContain('top-16');
    });
  });

  it('should render at bottom position when specified', async () => {
    mockNavigator.onLine = false;
    const { container } = render(<OfflineIndicator position="bottom" />);

    await waitFor(() => {
      const indicator = container.querySelector('[role="alert"]');
      expect(indicator?.className).toContain('bottom-4');
    });
  });

  it('should have proper accessibility attributes', async () => {
    mockNavigator.onLine = false;
    render(<OfflineIndicator />);

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });
  });
});
