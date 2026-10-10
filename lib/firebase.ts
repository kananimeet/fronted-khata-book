import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  Messaging,
  MessagePayload,
} from "firebase/messaging";

// Firebase client configuration with production fallbacks
export const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyDGtkmH7ccP5K8bwmsBwfyzBdcrsg6XthQ",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "khatabook-d0342.firebaseapp.com",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "khatabook-d0342",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "khatabook-d0342.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    "264149666504",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:264149666504:web:abe63be93e3ca3e9d0f3fd",
};

export const FIREBASE_VAPID_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ||
  "BD9mDtKSXR_a9f8ZKYnwb7stY0m_1qYcLkq4wINnZ_lwhGD2qV4oLEuBnzyO_-qA1uU44EmPKh2OK540zCj8Bik";

/**
 * Initializes and returns the Firebase app singleton.
 */
export function getFirebaseApp(): FirebaseApp {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

/**
 * Returns the Firebase Messaging instance if supported in current browser environment.
 */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;

  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn("[Firebase] Firebase Messaging is not supported in this browser.");
      return null;
    }
    const app = getFirebaseApp();
    return getMessaging(app);
  } catch (error) {
    console.warn("[Firebase] Failed to initialize Firebase Messaging:", error);
    return null;
  }
}

/**
 * Requests Notification permission and retrieves the FCM Web Push Token.
 * Automatically registers the service worker /firebase-messaging-sw.js.
 */
export async function requestFcmToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  if (!("Notification" in window)) {
    console.warn("[Firebase] This browser does not support desktop notifications.");
    return null;
  }

  if (!("serviceWorker" in navigator)) {
    console.warn("[Firebase] This browser does not support Service Workers.");
    return null;
  }

  try {
    // Check or request permission
    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      console.log("[Firebase] Notification permission was not granted:", permission);
      return null;
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      console.warn("[Firebase] Messaging instance unavailable.");
      return null;
    }

    // Register / update service worker
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/",
    });

    // Request immediate check for service worker update
    try {
      await registration.update();
    } catch {}

    await navigator.serviceWorker.ready;

    // Reset any stale subscription to avoid mismatched VAPID / 401 token errors
    try {
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
        console.log('[Firebase] Cleaning up stale push subscription...');
        await existingSub.unsubscribe();
      }
    } catch (subErr) {
      console.warn('[Firebase] Stale subscription cleanup:', subErr);
    }

    // Fetch FCM registration token
    const tokenOptions: { serviceWorkerRegistration: ServiceWorkerRegistration; vapidKey?: string } = {
      serviceWorkerRegistration: registration,
    };

    if (FIREBASE_VAPID_KEY) {
      tokenOptions.vapidKey = FIREBASE_VAPID_KEY;
    }

    const currentToken = await getToken(messaging, tokenOptions);

    if (currentToken) {
      console.log("[Firebase] FCM Registration Token generated successfully:", currentToken.slice(0, 15) + "...");
      return currentToken;
    } else {
      console.warn("[Firebase] No registration token returned. Permission might be required.");
      return null;
    }
  } catch (error) {
    console.error("[Firebase] An error occurred while retrieving FCM token:", error);
    return null;
  }
}

/**
 * Registers a foreground notification listener.
 * Runs callback whenever a push notification arrives while the web tab is open/active.
 */
export async function onForegroundMessage(
  callback: (payload: MessagePayload) => void
): Promise<(() => void) | null> {
  if (typeof window === "undefined") return null;

  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("[Firebase Foreground Message Received]:", payload);
      callback(payload);
    });

    return unsubscribe;
  } catch (error) {
    console.warn("Could not register onForegroundMessage listener:", error);
    return null;
  }
}
