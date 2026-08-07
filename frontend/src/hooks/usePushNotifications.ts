"use client";

import { useState, useEffect } from "react";
import { messaging } from "@/lib/firebase";
import { getToken } from "firebase/messaging";

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) return null;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === "granted") {
        const msg = await messaging();
        if (msg) {
          // Replace with the VAPID key from Firebase Console -> Cloud Messaging -> Web Push certificates
          const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "YOUR_VAPID_KEY_HERE"; 
          
          try {
            const token = await getToken(msg, { vapidKey });
            if (token) {
              console.log("FCM Token:", token);
              setFcmToken(token);
              // TODO: Send this token to your backend to save it for this user
              return token;
            } else {
              console.log("No registration token available. Request permission to generate one.");
            }
          } catch (e) {
            console.error("An error occurred while retrieving token. ", e);
          }
        }
        return null;
      }
      return null;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return null;
    }
  };

  return {
    permission,
    isSupported,
    fcmToken,
    requestPermission,
  };
}
