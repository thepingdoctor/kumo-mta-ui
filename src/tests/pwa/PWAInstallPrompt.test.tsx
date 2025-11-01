import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PWAInstallPrompt } from '../../components/common/PWAInstallPrompt';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

describe('PWAInstallPrompt', () => {
  let mockDeferredPrompt: BeforeInstallPromptEvent;

  beforeEach(() => {
    mockDeferredPrompt = {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    };

    // Clear localStorage
    localStorage.clear();

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
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should not render by default', () => {
    const { container } = render(<PWAInstallPrompt />);
    expect(container.firstChild).toBeNull();
  });

  it('should render when beforeinstallprompt event fires', async () => {
    render(<PWAInstallPrompt />);

    const event = new Event('beforeinstallprompt');
    Object.defineProperty(event, 'prompt', {
      value: mockDeferredPrompt.prompt,
    });
    Object.defineProperty(event, 'userChoice', {
      value: mockDeferredPrompt.userChoice,
    });

    window.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.getByText(/install kumomta dashboard/i)).toBeInTheDocument();
    });
  });

  it('should not render if previously dismissed within 7 days', async () => {
    const recentTime = Date.now() - (3 * 24 * 60 * 60 * 1000); // 3 days ago
    localStorage.setItem('pwa-install-dismissed', recentTime.toString());

    render(<PWAInstallPrompt />);

    const event = new Event('beforeinstallprompt');
    Object.defineProperty(event, 'prompt', {
      value: mockDeferredPrompt.prompt,
    });
    Object.defineProperty(event, 'userChoice', {
      value: mockDeferredPrompt.userChoice,
    });

    window.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.queryByText(/install kumomta dashboard/i)).not.toBeInTheDocument();
    });
  });

  it('should render if dismissed more than 7 days ago', async () => {
    const oldTime = Date.now() - (8 * 24 * 60 * 60 * 1000); // 8 days ago
    localStorage.setItem('pwa-install-dismissed', oldTime.toString());

    render(<PWAInstallPrompt />);

    const event = new Event('beforeinstallprompt');
    Object.defineProperty(event, 'prompt', {
      value: mockDeferredPrompt.prompt,
    });
    Object.defineProperty(event, 'userChoice', {
      value: mockDeferredPrompt.userChoice,
    });

    window.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.getByText(/install kumomta dashboard/i)).toBeInTheDocument();
    });
  });

  it('should call prompt when install button is clicked', async () => {
    render(<PWAInstallPrompt />);

    const event = new Event('beforeinstallprompt');
    Object.defineProperty(event, 'prompt', {
      value: mockDeferredPrompt.prompt,
    });
    Object.defineProperty(event, 'userChoice', {
      value: mockDeferredPrompt.userChoice,
    });

    window.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.getByText(/install kumomta dashboard/i)).toBeInTheDocument();
    });

    const installButton = screen.getByText('Install');
    fireEvent.click(installButton);

    await waitFor(() => {
      expect(mockDeferredPrompt.prompt).toHaveBeenCalled();
    });
  });

  it('should dismiss and store timestamp when not now is clicked', async () => {
    render(<PWAInstallPrompt />);

    const event = new Event('beforeinstallprompt');
    Object.defineProperty(event, 'prompt', {
      value: mockDeferredPrompt.prompt,
    });
    Object.defineProperty(event, 'userChoice', {
      value: mockDeferredPrompt.userChoice,
    });

    window.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.getByText(/install kumomta dashboard/i)).toBeInTheDocument();
    });

    const notNowButton = screen.getByText('Not now');
    fireEvent.click(notNowButton);

    await waitFor(() => {
      expect(localStorage.getItem('pwa-install-dismissed')).not.toBeNull();
      expect(screen.queryByText(/install kumomta dashboard/i)).not.toBeInTheDocument();
    });
  });

  it('should dismiss when close button is clicked', async () => {
    render(<PWAInstallPrompt />);

    const event = new Event('beforeinstallprompt');
    Object.defineProperty(event, 'prompt', {
      value: mockDeferredPrompt.prompt,
    });
    Object.defineProperty(event, 'userChoice', {
      value: mockDeferredPrompt.userChoice,
    });

    window.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.getByText(/install kumomta dashboard/i)).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText(/install kumomta dashboard/i)).not.toBeInTheDocument();
    });
  });

  it('should not render if app is in standalone mode', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(<PWAInstallPrompt />);

    const event = new Event('beforeinstallprompt');
    Object.defineProperty(event, 'prompt', {
      value: mockDeferredPrompt.prompt,
    });
    Object.defineProperty(event, 'userChoice', {
      value: mockDeferredPrompt.userChoice,
    });

    window.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.queryByText(/install kumomta dashboard/i)).not.toBeInTheDocument();
    });
  });
});
