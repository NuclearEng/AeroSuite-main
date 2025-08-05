import { Snackbar, Button } from '@mui/material';
import React, { useState, useEffect } from 'react';
import { Workbox } from 'workbox-window';

/**
 * Component to show a notification when a service worker update is available
 */
export const ServiceWorkerUpdateNotification = ({
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
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  useEffect(() => {
    // Function to handle new content being available
    const onServiceWorkerUpdate = (registration) => {
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
      waitingWorker.addEventListener('statechange', (e) => {
        if (e.target.state === 'activated') {
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
export const requestNotificationPermission = async () => {
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
 * @param {string} publicVapidKey - VAPID public key for push notifications
 * @returns Promise resolving to the subscription object or null if failed
 */
export const subscribeToPushNotifications = async (publicVapidKey) => {
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
    console.error('Error subscribing to push notifications:', error);
    return null;
  }
};

/**
 * Convert base64 string to Uint8Array for push notification subscription
 * @param {string} base64String - Base64 encoded string
 * @returns {Uint8Array}
 */
function urlBase64ToUint8Array(base64String) {
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
export const isServiceWorkerSupported = () => {
  return 'serviceWorker' in navigator;
};

// Check if the app is running in production mode
const isProd = process.env.NODE_ENV === 'production';

/**
 * Register the service worker for production environments
 * @returns A promise that resolves when the service worker is registered
 */
export const registerServiceWorker = async () => {
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
    return registration;
  } catch (_error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
};

/**
 * Unregister all service workers
 * @returns A promise that resolves when all service workers are unregistered
 */
export const unregisterServiceWorker = async () => {
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
    console.error('Service worker unregistration failed:', error);
    return false;
  }
};

/**
 * Update the service worker
 * @returns A promise that resolves when the service worker is updated
 */
export const updateServiceWorker = async () => {
  if (!isServiceWorkerSupported()) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
    }
  } catch (_error) {
    console.error('Error updating service worker:', error);
  }
};

/**
 * Check if the user is online
 * @returns {boolean} True if online, false if offline
 */
export const isOnline = () => {
  return navigator.onLine;
};

/**
 * Add event listeners for online/offline events
 * @param {Function} onOnline - Callback when going online
 * @param {Function} onOffline - Callback when going offline
 * @returns {Function} Function to remove the listeners
 */
export const addConnectivityListeners = (onOnline, onOffline) => {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}; 