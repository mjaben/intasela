/**
 * Cross-platform haptic feedback utility.
 *
 * - Android Chrome / PWA: uses `navigator.vibrate()`
 * - iOS Safari / PWA: uses a silent AudioContext oscillator burst,
 *   which triggers the Taptic Engine when the device is not muted.
 *
 * iOS does not support `navigator.vibrate`, so this is the standard
 * workaround used by web apps to get selection-like feedback on iOS.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

/**
 * Trigger a short haptic tap.
 * @param durationMs Duration in ms for Android vibrate (default 40ms)
 */
export function hapticTap(durationMs = 40): void {
  if (typeof window === "undefined") return;

  // Android / non-iOS: use Vibration API
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(durationMs);
      return; // Android handled, no need for AudioContext
    } catch {
      // fall through to AudioContext approach
    }
  }

  // iOS PWA: trigger silent AudioContext pulse (fires Taptic Engine)
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    // Resume suspended context (required after user gesture on iOS)
    if (ctx.state === "suspended") {
      ctx.resume().then(() => triggerAudioPulse(ctx, durationMs));
    } else {
      triggerAudioPulse(ctx, durationMs);
    }
  } catch {
    // silently ignore
  }
}

function triggerAudioPulse(ctx: AudioContext, durationMs: number): void {
  const duration = durationMs / 1000;
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  // Inaudible frequency + near-zero gain = silent but still schedules audio work
  // which iOS maps to a light Taptic tap when haptics are enabled.
  oscillator.frequency.setValueAtTime(200, ctx.currentTime);
  gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}
