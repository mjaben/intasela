"use client";

import { useState, useEffect, ReactNode, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  const MAX_PULL = 100;
  const THRESHOLD = 60;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || isRefreshing || window.scrollY > 0) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - startY.current;

      if (distance > 0) {
        // Prevent default scrolling when pulling down at the top
        if (e.cancelable) e.preventDefault();
        
        const dampedDistance = Math.min(distance * 0.4, MAX_PULL);
        setPullDistance(dampedDistance);
        controls.set({ y: dampedDistance });
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;
      setIsPulling(false);

      if (pullDistance > THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        controls.start({ y: 50 }); // Hold spinner at 50px
        await onRefresh();
        setIsRefreshing(false);
      }
      
      setPullDistance(0);
      controls.start({ y: 0 }); // Snap back
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, isRefreshing, pullDistance, onRefresh, controls]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[100dvh]">
      <motion.div 
        animate={controls}
        initial={{ y: 0 }}
        className="absolute top-0 left-0 right-0 flex justify-center z-50 pointer-events-none"
        style={{ marginTop: '-40px' }}
      >
        <div className="bg-background border border-border shadow-md rounded-full p-2 flex items-center justify-center">
          <Loader2 
            className={`w-5 h-5 text-primary ${isRefreshing ? 'animate-spin' : ''}`} 
            style={{ 
              transform: !isRefreshing ? `rotate(${pullDistance * 3}deg)` : 'none',
              opacity: pullDistance / THRESHOLD
            }} 
          />
        </div>
      </motion.div>
      <motion.div animate={controls} className="w-full h-full">
        {children}
      </motion.div>
    </div>
  );
}
