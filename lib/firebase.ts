import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  Messaging,
  MessagePayload,
} from "firebase/messaging";

// Firebase client configuration
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "khatabook-d0342.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "khatabook-d0342",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "khatabook-d0342.appspot.com",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1035354530779",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

export const FIREBASE_VAPID_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || undefined;

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
      console.warn("Firebase Messaging is not supported in this browser environment.");
      return null;
    }
    const app = getFirebaseApp();
    return getMessaging(app);
  } catch (error) {
    console.warn("Failed to initialize Firebase Messaging:", error);
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
    console.warn("This browser does not support desktop notifications.");
    return null;
  }

  if (!("serviceWorker" in navigator)) {
    console.warn("This browser does not support Service Workers.");
    return null;
  }

  try {
    // Check or request permission
    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      console.log("Notification permission was not granted:", permission);
      return null;
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    // Register service worker with configuration query parameters for reliability
    const swParams = new URLSearchParams({
      apiKey: firebaseConfig.apiKey || "",
      appId: firebaseConfig.appId || "",
      projectId: firebaseConfig.projectId || "",
      messagingSenderId: firebaseConfig.messagingSenderId || "",
      authDomain: firebaseConfig.authDomain || "",
      storageBucket: firebaseConfig.storageBucket || "",
    });

    const swUrl = `/firebase-messaging-sw.js?${swParams.toString()}`;

    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: "/",
    });

    await navigator.serviceWorker.ready;

    // Fetch FCM registration token
    const tokenOptions: { serviceWorkerRegistration: ServiceWorkerRegistration; vapidKey?: string } = {
      serviceWorkerRegistration: registration,
    };

    if (FIREBASE_VAPID_KEY) {
      tokenOptions.vapidKey = FIREBASE_VAPID_KEY;
    }

    const currentToken = await getToken(messaging, tokenOptions);

    if (currentToken) {
      console.log("FCM Registration Token received successfully");
      return currentToken;
    } else {
      console.warn("No registration token available. Request permission to generate one.");
      return null;
    }
  } catch (error) {
    console.error("An error occurred while retrieving FCM token:", error);
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
