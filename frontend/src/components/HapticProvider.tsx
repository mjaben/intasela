"use client";

import { useEffect } from "react";
import { installGlobalHapticListener } from "@/utils/haptic";

/**
 * Mounts once in the app root and installs the global haptic touchstart listener.
 * This enables the data-haptic="light|medium|heavy" attribute pattern on any element.
 *
 * Also initializes the AudioContext on the first user touch (iOS requirement).
 */
export default function HapticProvider() {
  useEffect(() => {
    const cleanup = installGlobalHapticListener();
    return cleanup;
  }, []);

  return null;
}
