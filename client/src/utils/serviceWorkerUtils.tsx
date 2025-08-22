import React, { useState, useEffect } from 'react';
import { Snackbar, Button } from '@mui/material';
import { Workbox } from 'workbox-window';

/**
 * Interface for the props of the ServiceWorkerUpdateNotification component
 */
interface ServiceWorkerUpdateNotificationProps {
  onAccept: () => void;
  onDismiss: () => void;
}

/**
 * Component to show a notification when a service worker update is available
 */
export const ServiceWorkerUpdateNotification: React.FC<ServiceWorkerUpdateNotificationProps> = ({
  onAccept,
  onDismiss,
}) => {
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    onDismiss();
  };

  const handleAccept = () => {
    setOpen(false);
    onAccept();
  };

  return (
    <Snackbar
      open={open}
      message="A new version of the application is available!"
      action={
        <>
          <Button color="secondary" size="small" onClick={handleClose}>
            LATER
          </Button>
          <Button color="primary" size="small" onClick={handleAccept}>
            UPDATE
          </Button>
        </>
      }
    />
  );
};

/**
 * React hook to handle service worker updates
 * @returns Object with isUpdateAvailable flag and updateServiceWorker function
 */
export const useServiceWorkerUpdates = () => {
  const [waitingWorker, setWaitingWorker] = useState<any>(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  useEffect(() => {
    // Function to handle new content being available
    const onServiceWorkerUpdate = (registration: ServiceWorkerRegistration) => {
      setWaitingWorker(registration.waiting);
      setIsUpdateAvailable(true);
    };

    // Add the onUpdate callback to the service worker registration
    if ('serviceWorker' in navigator) {
      const serviceWorkerRegistration = require('../serviceWorker');
      serviceWorkerRegistration.register({
        onUpdate: onServiceWorkerUpdate,
      });
    }
  }, []);

  // Function to update the service worker
  const updateServiceWorker = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      waitingWorker.addEventListener('statechange', (e: any) => {
        if ((e.target as ServiceWorker).state === 'activated') {
          window.location.reload();
        }
      });
    }
  };

  return { isUpdateAvailable, updateServiceWorker };
};

/**
 * Request permission for push notifications
 * @returns Promise resolving to the permission status
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  return await Notification.requestPermission();
};

/**
 * Subscribe to push notifications
 * @param publicVapidKey - VAPID public key for push notifications
 * @returns Promise resolving to the subscription object or null if failed
 */
export const subscribeToPushNotifications = async (publicVapidKey: string) => {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
    });
    
    return subscription;
  } catch (_error) {
    console.error("Error:", _error);
    return null;
  }
};

/**
 * Convert base64 string to Uint8Array for push notification subscription
 * @param base64String - Base64 encoded string
 * @returns Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Check if service workers are supported
export const isServiceWorkerSupported = (): boolean => {
  return 'serviceWorker' in navigator;
};

// Check if the app is running in production mode
const isProd = process.env.NODE_ENV === 'production';

/**
 * Register the service worker for production environments
 * @returns A promise that resolves when the service worker is registered
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isServiceWorkerSupported()) {
    console.warn('Service workers are not supported in this browser');
    return null;
  }

  if (!isProd) {
    console.info('Service worker registration skipped in development mode');
    return null;
  }

  try {
    const wb = new Workbox('/service-worker.js');
    
    // Add listeners for various service worker states
    wb.addEventListener('installed', (event) => {
      if (event.isUpdate) {
        console.log('Service worker updated');
        // Optionally show a notification to the user
      } else {
        console.log('Service worker installed for the first time');
        // Optionally show a notification that the app is ready for offline use
      }
    });

    wb.addEventListener('activated', (event) => {
      if (event.isUpdate) {
        // When an update is found, automatically reload to ensure
        // the user gets the latest version
        window.location.reload();
      }
    });

    wb.addEventListener('waiting', () => {
      // A new service worker is waiting to be activated
      // Show a notification to the user asking them to reload
    });

    const registration = await wb.register();
    return registration || null;
  } catch (_error) {
    console.error("Error:", _error);
    return null;
  }
};

/**
 * Unregister all service workers
 * @returns A promise that resolves when all service workers are unregistered
 */
export const unregisterServiceWorker = async (): Promise<boolean> => {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.unregister();
      return true;
    }
    return false;
  } catch (_error) {
    console.error("Error:", _error);
    return false;
  }
};

/**
 * Update the service worker
 * @returns A promise that resolves when the service worker is updated
 */
export const updateServiceWorker = async (): Promise<void> => {
  if (!isServiceWorkerSupported()) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
    }
  } catch (_error) {
    console.error("Error:", _error);
  }
};

/**
 * Checks if the application is currently online
 * @returns True if the application is online, false otherwise
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Add online/offline event listeners
 * @param onOnline Function to call when the app goes online
 * @param onOffline Function to call when the app goes offline
 * @returns A cleanup function to remove the event listeners
 */
export const addConnectivityListeners = (
  onOnline: () => void,
  onOffline: () => void
): () => void => {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  // Return a cleanup function
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}; 