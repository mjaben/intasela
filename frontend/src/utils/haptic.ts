/**
 * Cross-platform haptic feedback utility.
 *
 * Strategy:
 * - Android Chrome / PWA: uses navigator.vibrate()
 * - iOS PWA: uses AudioContext with a near-silent sine burst.
 *   This leverages the Taptic Engine on iOS when device is not muted.
 *   The AudioContext must be created DURING a user gesture (touchstart/click)
 *   to bypass iOS autoplay policy.
 *
 * Usage:
 *   hapticTap()        - light tap (navigation, toggles)
 *   hapticTap('medium') - medium tap (confirmations, selections)
 *   hapticTap('heavy')  - heavy tap (errors, destructive actions)
 */

let audioCtx: AudioContext | null = null;

/**
 * Must be called during a user gesture to initialize AudioContext on iOS.
 * Safe to call multiple times — idempotent.
 */
export function initHapticContext(): void {
  if (typeof window === 'undefined') return;
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    // On iOS, context starts 'suspended' — resume it immediately while we have a gesture
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  } catch {
    // silently ignore — device doesn't support Web Audio
  }
}

type HapticIntensity = 'light' | 'medium' | 'heavy';

const VIBRATION_DURATIONS: Record<HapticIntensity, number> = {
  light: 30,
  medium: 50,
  heavy: 80,
};

const AUDIO_DURATIONS: Record<HapticIntensity, number> = {
  light: 0.02,
  medium: 0.04,
  heavy: 0.08,
};

export function hapticTap(intensity: HapticIntensity = 'light'): void {
  if (typeof window === 'undefined') return;

  // Android / vibration-capable devices
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(VIBRATION_DURATIONS[intensity]);
    } catch {
      // ignore
    }
  }

  // iOS fallback via AudioContext (fires Taptic Engine via silent audio scheduling)
  if (!audioCtx) {
    // Try to init if not already done (may fail if not in a gesture)
    initHapticContext();
  }

  if (!audioCtx || audioCtx.state === 'closed') return;

  const resume = audioCtx.state === 'suspended'
    ? audioCtx.resume()
    : Promise.resolve();

  resume.then(() => {
    if (!audioCtx) return;
    try {
      const duration = AUDIO_DURATIONS[intensity];
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      // Frequency / gain chosen to be below hearing but trigger Taptic Engine
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);

      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + duration);
    } catch {
      // silently ignore
    }
  }).catch(() => {});
}

/**
 * Installs a global document-level listener that:
 * 1. Initializes AudioContext on the very first user touch (iOS requirement)
 * 2. Fires haptic feedback on any element with data-haptic attribute
 *
 * Call this once on app mount (e.g., in a useEffect in layout).
 * This is the ONLY reliable way to get haptic feedback on iOS PWAs.
 */
export function installGlobalHapticListener(): () => void {
  if (typeof document === 'undefined') return () => {};

  const onFirstTouch = () => {
    initHapticContext();
    // Remove after first touch — context is now initialized
    document.removeEventListener('touchstart', onFirstTouch, { capture: true });
  };

  const onTouchStart = (e: TouchEvent) => {
    const target = e.target as HTMLElement;
    const hapticEl = target.closest('[data-haptic]') as HTMLElement | null;
    if (!hapticEl) return;
    const intensity = (hapticEl.dataset.haptic as HapticIntensity) || 'light';
    hapticTap(intensity);
  };

  document.addEventListener('touchstart', onFirstTouch, { capture: true, passive: true });
  document.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });

  return () => {
    document.removeEventListener('touchstart', onFirstTouch, { capture: true });
    document.removeEventListener('touchstart', onTouchStart, { capture: true });
  };
}
