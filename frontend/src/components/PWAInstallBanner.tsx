"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIosSafari, setIsIosSafari] = useState(false);

  useEffect(() => {
    // Check 7-day dismissal
    const dismissedAt = localStorage.getItem('pwa_install_dismissed');
    if (dismissedAt && Date.now() - parseInt(dismissedAt) < 7 * 24 * 60 * 60 * 1000) {
      setShowBanner(false);
      return;
    }

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

  const handleDismiss = () => {
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleDismiss}
        >
          <div 
            className="bg-[#0f150e] border border-[#ACC8A2]/30 rounded-3xl p-8 max-w-sm w-full shadow-[0_0_50px_rgba(172,200,162,0.15)] flex flex-col items-center text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#ACC8A2]/20 to-[#ACC8A2]/5 flex items-center justify-center mb-6 border border-[#ACC8A2]/20 shadow-[0_0_30px_rgba(172,200,162,0.2)]">
              <img src="/intasela-icon.png" alt="Intasela Icon" className="w-12 h-12 object-contain drop-shadow-xl" />
            </div>
            
            <h3 className="text-2xl font-extrabold text-white mb-2 tracking-tight">Install Intasela</h3>
            <p className="text-white/60 text-sm mb-8 px-4 leading-relaxed">
              Add Intasela to your home screen for a seamless, full-screen native experience.
            </p>
            
            <div className="relative group w-full">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#ACC8A2] to-[#ACC8A2]/50 rounded-full blur opacity-40 group-hover:opacity-70 transition duration-1000 group-hover:duration-200"></div>
              <button 
                onClick={handleInstallClick}
                className="relative w-full py-3.5 bg-[#ACC8A2] text-[#1A2517] text-base font-bold rounded-full hover:bg-white transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Install App
              </button>
            </div>
            
            <button 
              onClick={handleDismiss}
              className="mt-4 text-sm text-white/40 hover:text-white/80 font-medium transition-colors"
            >
              Maybe later
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
