/**
 * PWA Service Worker Registration with Update Detection
 */

import { registerSW } from 'virtual:pwa-register';

interface PWAUpdateInfo {
  hasUpdate: boolean;
  registration?: ServiceWorkerRegistration;
}

let updateCallback: (() => void) | null = null;

export const registerPWA = () => {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // Show update available notification
      const event = new CustomEvent('pwa-update-available');
      window.dispatchEvent(event);

      if (updateCallback) {
        updateCallback();
      }
    },
    onOfflineReady() {
      // Show offline ready notification
      const event = new CustomEvent('pwa-offline-ready');
      window.dispatchEvent(event);

      console.log('App is ready to work offline');
    },
    onRegistered(registration) {
      // Check for updates every hour
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // 1 hour
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  return {
    updateServiceWorker: updateSW,
    setUpdateCallback: (callback: () => void) => {
      updateCallback = callback;
    },
  };
};

export const checkForUpdates = async (): Promise<PWAUpdateInfo> => {
  if (!('serviceWorker' in navigator)) {
    return { hasUpdate: false };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return { hasUpdate: false };
    }

    await registration.update();

    const hasUpdate = registration.waiting !== null || registration.installing !== null;

    return {
      hasUpdate,
      registration,
    };
  } catch (error) {
    console.error('Error checking for updates:', error);
    return { hasUpdate: false };
  }
};

export const skipWaiting = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    });
  }
};
