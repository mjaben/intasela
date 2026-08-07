// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyC5dm-qCebnPEL_i7iSgGrTIQ98r5JL1qM",
  authDomain: "intasela-social.firebaseapp.com",
  projectId: "intasela-social",
  storageBucket: "intasela-social.firebasestorage.app",
  messagingSenderId: "306273861829",
  appId: "1:306273861829:web:25aea8e9b7d9bfa5feb0ac",
  measurementId: "G-QSYKXCWEME"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Only initialize Analytics on the client side
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export const messaging = async () => {
  if (typeof window !== 'undefined') {
    const supported = await isSupported();
    if (supported) {
      return getMessaging(app);
    }
  }
  return null;
};

export { app, analytics };
