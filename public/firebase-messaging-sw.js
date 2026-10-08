/* eslint-disable no-undef */
// Give the service worker access to Firebase Messaging.
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// Lifecycle management: immediately claim all clients on install/activation
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Extract config from query parameters or use exact Firebase project values
const urlParams = new URLSearchParams(self.location.search);

const firebaseConfig = {
  apiKey:
    urlParams.get('apiKey') ||
    'AIzaSyOGtkmM7cdF5K8bwmX0wFyzBdcszg4ktHQ',
  authDomain:
    urlParams.get('authDomain') ||
    'khatabook-d0342.firebaseapp.com',
  projectId:
    urlParams.get('projectId') ||
    'khatabook-d0342',
  storageBucket:
    urlParams.get('storageBucket') ||
    'khatabook-d0342.firebasestorage.app',
  messagingSenderId:
    urlParams.get('messagingSenderId') ||
    '264149666504',
  appId:
    urlParams.get('appId') ||
    '1:264149666504:web:abe63be93e3ca3e9d0f3fd',
};

// Deduplication cache to prevent duplicate notifications between push and onBackgroundMessage
const recentNotifications = new Map();

function displayPushNotification(title, options) {
  const tag = options.tag || `khata-${Date.now()}`;
  const now = Date.now();

  // If same tag showed within 5 seconds, suppress duplicate
  if (recentNotifications.has(tag)) {
    const prevTime = recentNotifications.get(tag);
    if (now - prevTime < 5000) {
      console.log('[firebase-messaging-sw.js] Suppressing duplicate notification for tag:', tag);
      return Promise.resolve();
    }
  }
  recentNotifications.set(tag, now);

  // Clean old entries
  if (recentNotifications.size > 50) {
    const oldestKey = recentNotifications.keys().next().value;
    recentNotifications.delete(oldestKey);
  }

  return self.registration.showNotification(title || 'Khata Book', options);
}

// Initialize Firebase Messaging
let messaging = null;
try {
  firebase.initializeApp(firebaseConfig);
  messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received onBackgroundMessage:', payload);

    const title =
      payload.notification?.title ||
      payload.data?.title ||
      'Khata Book';

    const body =
      payload.notification?.body ||
      payload.data?.body ||
      'New expense update available';

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

    const tag =
      payload.data?.type ||
      payload.notification?.tag ||
      `khatabook-${payload.data?.expense_id || Date.now()}`;

    const options = {
      body,
      icon,
      badge,
      data: {
        ...(payload.data || {}),
        link: clickAction,
      },
      vibrate: [300, 100, 300],
      tag,
      renotify: true,
      requireInteraction: true,
    };

    return displayPushNotification(title, options);
  });
} catch (e) {
  console.warn('[firebase-messaging-sw.js] Firebase compat init warning:', e);
}

// Native Web Push Event Listener
// CRITICAL: Ensures notifications appear when mobile screen is OFF or browser tab is CLOSED
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Native push event fired');

  let title = 'Khata Book';
  let body = 'You have a new update';
  let icon = '/icons/icon-192x192.png';
  let badge = '/icons/icon-192x192.png';
  let link = '/expenses';
  let tag = `khatabook-${Date.now()}`;
  let extraData = {};

  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('[firebase-messaging-sw.js] Push JSON data:', payload);

      const notif = payload.notification || {};
      const data = payload.data || {};

      title = notif.title || data.title || title;
      body = notif.body || data.body || body;
      icon = notif.icon || data.icon || icon;
      badge = notif.badge || data.badge || badge;
      link = data.link || data.url || payload.fcmOptions?.link || link;
      tag = data.type || notif.tag || `khatabook-${data.expense_id || Date.now()}`;
      extraData = data;
    } catch {
      // If data is plain text
      body = event.data.text() || body;
    }
  }

  const options = {
    body,
    icon,
    badge,
    data: {
      ...extraData,
      link,
    },
    vibrate: [300, 100, 300],
    tag,
    renotify: true,
    requireInteraction: true,
  };

  event.waitUntil(displayPushNotification(title, options));
});

// Notification Click Event Listener: Open or Focus App
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const clickAction = event.notification.data?.link || '/expenses';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open with the target URL, focus it
      for (const client of windowClients) {
        if (client.url.includes(clickAction) && 'focus' in client) {
          return client.focus();
        }
      }

      // If any KhataBook window is open, focus and navigate
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
