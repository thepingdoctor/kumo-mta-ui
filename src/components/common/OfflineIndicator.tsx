import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, AlertCircle } from 'lucide-react';

interface OfflineIndicatorProps {
  showOnlineNotification?: boolean;
  position?: 'top' | 'bottom';
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  showOnlineNotification = true,
  position = 'top',
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOnlineToast, setShowOnlineToast] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (showOnlineNotification) {
        setShowOnlineToast(true);
        setTimeout(() => setShowOnlineToast(false), 3000);
      }
      // Trigger sync when coming back online
      if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration) => {
          return registration.sync.register('sync-queued-requests');
        }).catch((error) => {
          console.error('Background sync registration failed:', error);
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOnlineToast(false);
    };

    // Listen to custom events from service worker
    const handlePendingRequests = (event: Event) => {
      const customEvent = event as CustomEvent;
      setPendingRequests(customEvent.detail?.count || 0);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('sw-pending-requests', handlePendingRequests);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sw-pending-requests', handlePendingRequests);
    };
  }, [showOnlineNotification]);

  const positionClasses = position === 'top' ? 'top-16' : 'bottom-4';

  if (isOnline && !showOnlineToast) {
    return null;
  }

  return (
    <>
      {/* Offline Banner */}
      {!isOnline && (
        <div
          className={`fixed ${positionClasses} left-1/2 transform -translate-x-1/2 z-50 animate-slide-down`}
          role="alert"
          aria-live="assertive"
        >
          <div className="bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 max-w-md">
            <WifiOff className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">You're offline</p>
              <p className="text-sm">
                Some features may be limited. Data will sync when you reconnect.
              </p>
              {pendingRequests > 0 && (
                <p className="text-xs mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {pendingRequests} pending {pendingRequests === 1 ? 'request' : 'requests'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Online Toast */}
      {isOnline && showOnlineToast && (
        <div
          className={`fixed ${positionClasses} left-1/2 transform -translate-x-1/2 z-50 animate-slide-down`}
          role="status"
          aria-live="polite"
        >
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3">
            <Wifi className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">You're back online</p>
              {pendingRequests > 0 && (
                <p className="text-sm">Syncing {pendingRequests} pending {pendingRequests === 1 ? 'request' : 'requests'}...</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OfflineIndicator;
