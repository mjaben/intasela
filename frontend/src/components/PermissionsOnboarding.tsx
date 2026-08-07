"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Camera, X } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function PermissionsOnboarding() {
  const [show, setShow] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);
  const { requestPermission, permission } = usePushNotifications();
  const [cameraGranted, setCameraGranted] = useState(false);

  useEffect(() => {
    // Only show if they haven't dismissed it this session, and they haven't granted push yet
    const dismissed = localStorage.getItem("intasela_permissions_dismissed");
    if (dismissed) {
      setHasDismissed(true);
      return;
    }

    if (permission === "default") {
      // Delay showing the prompt slightly so it's not jarring
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [permission]);

  const handleRequestPush = async () => {
    await requestPermission();
  };

  const handleRequestCamera = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraGranted(true);
    } catch (err) {
      console.error("Camera permission denied:", err);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    setHasDismissed(true);
    localStorage.setItem("intasela_permissions_dismissed", "true");
  };

  if (hasDismissed) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-card w-full max-w-md rounded-3xl border border-border shadow-2xl overflow-hidden"
          >
            <div className="p-6 text-center space-y-2">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl mx-auto flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Stay Updated</h2>
              <p className="text-muted-foreground text-sm">
                Enable notifications and camera access to get the most out of Intasela. You'll never miss a Sela or a message.
              </p>
            </div>

            <div className="px-6 pb-6 space-y-4">
              {/* Push Notifications */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center shadow-sm">
                    <Bell className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">Push Notifications</p>
                    <p className="text-xs text-muted-foreground">Get instant alerts.</p>
                  </div>
                </div>
                <button
                  onClick={handleRequestPush}
                  disabled={permission !== "default"}
                  className="px-4 py-1.5 bg-primary text-primary-foreground text-sm font-bold rounded-full disabled:opacity-50"
                >
                  {permission === "granted" ? "Enabled" : "Allow"}
                </button>
              </div>

              {/* Camera */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center shadow-sm">
                    <Camera className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">Camera Access</p>
                    <p className="text-xs text-muted-foreground">To capture Selas.</p>
                  </div>
                </div>
                <button
                  onClick={handleRequestCamera}
                  disabled={cameraGranted}
                  className="px-4 py-1.5 bg-primary text-primary-foreground text-sm font-bold rounded-full disabled:opacity-50"
                >
                  {cameraGranted ? "Enabled" : "Allow"}
                </button>
              </div>
            </div>

            <div className="p-4 bg-muted/30 border-t border-border flex justify-center">
              <button
                onClick={handleDismiss}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
