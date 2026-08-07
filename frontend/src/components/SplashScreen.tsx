"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function SplashScreen() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Hide the splash screen after 2.5 seconds
    const timer = setTimeout(() => {
      setShow(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(10px)" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background overflow-hidden"
        >
          {/* Animated Ambient Glow */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3] 
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40dvh] h-[40dvh] bg-primary/20 blur-[120px] rounded-full pointer-events-none" 
          />
          
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex flex-col items-center"
          >
            <div className="relative">
              {/* Pulsing ring behind logo */}
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                className="absolute inset-0 rounded-3xl border border-primary/40 bg-primary/10"
              />
              
              <div className="w-28 h-28 rounded-3xl bg-card/40 border border-white/5 flex items-center justify-center shadow-[0_0_60px_rgba(172,200,162,0.15)] relative overflow-hidden backdrop-blur-2xl p-4">
                <Image 
                  src="/icon-192x192.png" 
                  alt="Intasela" 
                  width={100} 
                  height={100} 
                  className="object-contain drop-shadow-2xl"
                  priority
                />
              </div>
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
              className="mt-8 flex flex-col items-center"
            >
              <h1 className="text-3xl font-bold tracking-tighter text-foreground">
                Intasela
              </h1>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "40px" }}
                transition={{ delay: 0.8, duration: 0.6, ease: "circOut" }}
                className="h-1 bg-primary rounded-full mt-4"
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
