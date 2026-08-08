'use client';

import { hapticTap } from '@/utils/haptic';

export const HAPTIC_PRESETS = {
  light: 30,
  medium: 60,
  heavy: 120,
  success: [30, 50, 30],
  error: [100, 40, 40],
  warning: [100, 40, 40]
};

export function useHaptic() {
  const trigger = (pattern: number | number[] = HAPTIC_PRESETS.light) => {
    // 1. Guard against SSR (Server-Side Rendering)
    if (typeof window === 'undefined') return;

    // 2. Delegate to our robust cross-platform utility for basic taps to ensure iOS support
    // (The user-provided pattern is great for Next.js, but navigator.vibrate fails completely on iOS Safari/PWAs)
    if (pattern === HAPTIC_PRESETS.light || pattern === HAPTIC_PRESETS.success) {
      hapticTap('light');
      return;
    } else if (pattern === HAPTIC_PRESETS.medium) {
      hapticTap('medium');
      return;
    } else if (pattern === HAPTIC_PRESETS.heavy || pattern === HAPTIC_PRESETS.error || pattern === HAPTIC_PRESETS.warning) {
      hapticTap('heavy');
      return;
    }

    // 3. Fallback for custom array patterns (Android only)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        console.warn('Haptic playback failed:', error);
      }
    }
  };

  return { trigger, PRESETS: HAPTIC_PRESETS };
}
