"use client";

import { useState, useEffect } from "react";

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ("Notification" in window && "serviceWorker" in navigator) {
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
        // Here you would typically:
        // 1. Get the service worker registration
        // const registration = await navigator.serviceWorker.ready;
        // 2. Subscribe to push manager with your VAPID key or get FCM Token
        // const subscription = await registration.pushManager.subscribe({ ... })
        // 3. Send subscription to your backend
        
        console.log("Notification permission granted.");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  };

  return {
    permission,
    isSupported,
    requestPermission,
  };
}
