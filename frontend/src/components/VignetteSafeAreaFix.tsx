"use client";

import { useEffect } from "react";

/**
 * Ensures Google AdSense Vignette Ads & Overlays respect mobile device safe-area-inset-top
 * in PWA standalone mode and mobile browsers, preventing the Close (X) button from clashing
 * with the device status bar and battery indicator.
 */
export default function VignetteSafeAreaFix() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const enforceSafeAreaOnVignette = () => {
      const selectors = [
        "#google_vignette",
        "div[id*='google_vignette']",
        "ins.adsbygoogle-vignette",
        ".google-auto-placed",
        "#dismiss-button",
        "div[aria-label='Close ad']",
        "button[aria-label='Close ad']",
        "div[id^='aswift_']"
      ];

      selectors.forEach((selector) => {
        const els = document.querySelectorAll<HTMLElement>(selector);
        els.forEach((el) => {
          if (el.getAttribute("data-safe-area-applied") === "true") return;

          el.setAttribute("data-safe-area-applied", "true");

          if (selector === "#dismiss-button" || selector.includes("Close ad")) {
            el.style.setProperty("top", "max(calc(env(safe-area-inset-top, 0px) + 12px), 24px)", "important");
            el.style.setProperty("z-index", "2147483647", "important");
          } else {
            el.style.setProperty("padding-top", "max(env(safe-area-inset-top, 0px), 24px)", "important");
            el.style.setProperty("box-sizing", "border-box", "important");
          }
        });
      });
    };

    enforceSafeAreaOnVignette();

    const observer = new MutationObserver(() => {
      enforceSafeAreaOnVignette();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class", "id"]
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
