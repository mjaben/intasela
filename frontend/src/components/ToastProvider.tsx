"use client";

import { useToastStore } from "@/store/useToastStore";

export default function ToastProvider() {
  const toasts = useToastStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div 
          key={toast.id} 
          className="bg-background/60 backdrop-blur-xl border border-white/10 text-foreground font-medium px-5 py-2 rounded-full shadow-2xl animate-in fade-in slide-in-from-bottom-4 text-[13px] whitespace-nowrap tracking-wide"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
