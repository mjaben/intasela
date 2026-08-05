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
          className={`backdrop-blur-xl border border-white/10 font-medium px-6 py-3 rounded-full shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300 text-sm whitespace-nowrap tracking-wide flex items-center gap-2 ${
            toast.type === "error" ? "bg-red-500/10 text-red-400 border-red-500/20" : 
            toast.type === "success" ? "bg-[#3BC492]/10 text-[#3BC492] border-[#3BC492]/20" : 
            "bg-zinc-900/80 text-foreground"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
