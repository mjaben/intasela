"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIosSafari, setIsIosSafari] = useState(false);

  useEffect(() => {
    // Check if it's already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    
    if (isStandalone) {
      setShowBanner(false);
      return;
    }

    // Detect iOS Safari
    const isIos = /ipad|iphone|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isSafari = /safari/.test(window.navigator.userAgent.toLowerCase()) && !/chrome|crios/.test(window.navigator.userAgent.toLowerCase());

    if (isIos && isSafari) {
      // iOS doesn't support beforeinstallprompt, so we just show the banner anyway with instructions
      setTimeout(() => {
        setIsIosSafari(true);
        setShowBanner(true);
      }, 3000);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", () => {
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIosSafari) {
      // Just visually alert them how to install on iOS
      alert("To install: tap the Share button at the bottom of Safari and select 'Add to Home Screen'.");
      return;
    }

    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-[calc(80px+var(--safe-area-inset-bottom))] left-4 right-4 z-50 bg-card border border-border rounded-xl shadow-2xl p-4 flex items-center justify-between sm:left-auto sm:w-[400px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">Install Intasela</span>
              <span className="text-xs text-muted-foreground">Add to home screen for the best experience.</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setShowBanner(false)}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <button 
              onClick={handleInstallClick}
              className="px-4 py-1.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all"
            >
              Install
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
