"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Camera } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** Returns true if the stored timestamp is older than 7 days (i.e. time to re-ask) */
function isDenialExpired(storageKey: string): boolean {
  const stored = localStorage.getItem(storageKey);
  if (!stored) return true; // never asked → should ask
  if (stored === "granted") return false; // already granted → don't re-ask
  // stored is a denial timestamp (ms)
  const deniedAt = parseInt(stored, 10);
  if (isNaN(deniedAt)) return true;
  return Date.now() - deniedAt >= SEVEN_DAYS_MS;
}

export default function PermissionsOnboarding() {
  const [show, setShow] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);
  const { requestPermission, permission } = usePushNotifications();
  const [cameraGranted, setCameraGranted] = useState(false);
  const [cameraDenied, setCameraDenied] = useState(false);

  // On mount: read real browser permission state + localStorage with 7-day decay
  useEffect(() => {
    // Check if "Maybe Later" was clicked AND 7 days haven't passed
    const dismissedAt = localStorage.getItem("intasela_permissions_dismissed");
    if (dismissedAt && dismissedAt !== "permanent") {
      const ts = parseInt(dismissedAt, 10);
      if (!isNaN(ts) && Date.now() - ts < SEVEN_DAYS_MS) {
        setHasDismissed(true);
        return;
      }
      // 7 days passed — clear it so we re-ask
      localStorage.removeItem("intasela_permissions_dismissed");
    } else if (dismissedAt === "permanent") {
      // Both granted — never ask again
      setHasDismissed(true);
      return;
    }

    // Check camera permission via browser Permissions API (silent, no prompt)
    const checkCamera = async () => {
      try {
        const result = await navigator.permissions.query({ name: "camera" as PermissionName });
        if (result.state === "granted") {
          setCameraGranted(true);
          localStorage.setItem("intasela_camera_ts", "granted");
        } else if (result.state === "denied") {
          // Check if 7 days have passed since denial
          if (!isDenialExpired("intasela_camera_ts")) {
            setCameraDenied(true); // still within 7-day window — don't re-ask
          } else {
            // Expired — clear so we try again
            localStorage.removeItem("intasela_camera_ts");
          }
        }
      } catch {
        // Permissions API not supported for camera — fall back to localStorage
        const stored = localStorage.getItem("intasela_camera_ts");
        if (stored === "granted") {
          setCameraGranted(true);
        } else if (stored && stored !== "granted" && !isDenialExpired("intasela_camera_ts")) {
          setCameraDenied(true);
        }
      }
    };

    if (navigator?.permissions) {
      checkCamera();
    } else {
      const stored = localStorage.getItem("intasela_camera_ts");
      if (stored === "granted") setCameraGranted(true);
      else if (stored && !isDenialExpired("intasela_camera_ts")) setCameraDenied(true);
    }
  }, []);

  // Decide whether to show the modal
  useEffect(() => {
    if (hasDismissed) return;

    const pushGranted = permission === "granted";
    // Push is "done" if granted, or if denied within the 7-day window
    const pushDeniedRecently = permission === "denied" && !isDenialExpired("intasela_push_ts");
    const pushDone = pushGranted || pushDeniedRecently;
    const camDone = cameraGranted || cameraDenied;

    // Both genuinely granted — never show again
    if (pushGranted && cameraGranted) {
      localStorage.setItem("intasela_permissions_dismissed", "permanent");
      setHasDismissed(true);
      return;
    }

    // Both handled (granted or denied-within-7d) — hide for now
    if (pushDone && camDone) {
      setShow(false);
      return;
    }

    // Something still needs asking — show after a short delay
    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, [permission, cameraGranted, cameraDenied, hasDismissed]);

  const handleRequestPush = async () => {
    await requestPermission();
    // After requesting, the `permission` state from usePushNotifications will update.
    // If denied, record the timestamp for the 7-day retry.
    // We read the new value from Notification.permission directly.
    setTimeout(() => {
      if (Notification.permission === "denied") {
        localStorage.setItem("intasela_push_ts", Date.now().toString());
      }
    }, 500);
  };

  const handleRequestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraGranted(true);
      setCameraDenied(false);
      localStorage.setItem("intasela_camera_ts", "granted");
    } catch {
      // User denied — store timestamp for 7-day retry
      localStorage.setItem("intasela_camera_ts", Date.now().toString());
      setCameraDenied(true);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    setHasDismissed(true);
    // Store timestamp — will re-show after 7 days
    localStorage.setItem("intasela_permissions_dismissed", Date.now().toString());
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
                    <p className="text-xs text-muted-foreground">
                      {permission === "denied" ? "Denied — tap to retry" : "Get instant alerts."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRequestPush}
                  disabled={permission === "granted"}
                  className={`px-4 py-1.5 text-sm font-bold rounded-full transition-colors ${
                    permission === "granted"
                      ? "bg-primary/20 text-primary cursor-default"
                      : permission === "denied"
                      ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {permission === "granted" ? "✓ Enabled" : permission === "denied" ? "Retry" : "Allow"}
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
                    <p className="text-xs text-muted-foreground">
                      {cameraDenied && !cameraGranted ? "Denied — tap to retry" : "To capture Selas."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRequestCamera}
                  disabled={cameraGranted}
                  className={`px-4 py-1.5 text-sm font-bold rounded-full transition-colors ${
                    cameraGranted
                      ? "bg-primary/20 text-primary cursor-default"
                      : cameraDenied
                      ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {cameraGranted ? "✓ Enabled" : cameraDenied ? "Retry" : "Allow"}
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
