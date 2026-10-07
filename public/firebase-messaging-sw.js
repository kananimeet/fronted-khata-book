/* eslint-disable no-undef */
// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here and need compat libraries.
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// Extract config from query parameters or fallback values
const urlParams = new URLSearchParams(self.location.search);
const apiKey =
  urlParams.get('apiKey') ||
  (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_FIREBASE_API_KEY) ||
  'YOUR_FIREBASE_API_KEY';

const authDomain =
  urlParams.get('authDomain') ||
  (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) ||
  'khatabook-d0342.firebaseapp.com';

const projectId =
  urlParams.get('projectId') ||
  (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) ||
  'khatabook-d0342';

const storageBucket =
  urlParams.get('storageBucket') ||
  (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) ||
  'khatabook-d0342.appspot.com';

const messagingSenderId =
  urlParams.get('messagingSenderId') ||
  (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) ||
  '1035354530779';

const appId =
  urlParams.get('appId') ||
  (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_FIREBASE_APP_ID) ||
  'YOUR_FIREBASE_APP_ID';

// Initialize the Firebase app in the service worker
try {
  firebase.initializeApp({
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  });

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background push:', payload);

    const title =
      payload.notification?.title ||
      payload.data?.title ||
      'Khata Book';

    const body =
      payload.notification?.body ||
      payload.data?.body ||
      'New update available';

    const icon =
      payload.notification?.icon ||
      payload.data?.icon ||
      '/icons/icon-192x192.png';

    const badge =
      payload.notification?.badge ||
      payload.data?.badge ||
      '/icons/icon-192x192.png';

    const clickAction =
      payload.data?.link ||
      payload.data?.url ||
      payload.fcmOptions?.link ||
      '/expenses';

    const options = {
      body,
      icon,
      badge,
      data: {
        ...(payload.data || {}),
        link: clickAction,
      },
      vibrate: [200, 100, 200],
      tag: payload.data?.id || `khatabook-${Date.now()}`,
      renotify: true,
      requireInteraction: true,
    };

    self.registration.showNotification(title, options);
  });
} catch (e) {
  console.warn('[firebase-messaging-sw.js] Firebase compat init warning:', e);
}

// Notification Click Event Listener
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const clickAction = event.notification.data?.link || '/expenses';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it and navigate
      for (const client of windowClients) {
        if (client.url.includes(clickAction) && 'focus' in client) {
          return client.focus();
        }
      }

      // Check if any app window is open
      for (const client of windowClients) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            return client.navigate(clickAction);
          }
          return client;
        }
      }

      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(clickAction);
      }
    })
  );
});
