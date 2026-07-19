"use client";

import { useFeedStore } from "@/store/useFeedStore";
import { useUserStore } from "@/store/useUserStore";
import { useRouter, usePathname } from "next/navigation";

export default function MobileFAB() {
  const { openComposer } = useFeedStore();
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const router = useRouter();

  const handleClick = () => {
    if (!isAuthenticated) {
      return router.push("/login");
    }
    openComposer("CREATE");
  };

  return (
    <button
      onClick={handleClick}
      className="sm:hidden fixed bottom-[80px] right-4 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-transform active:scale-95 z-50"
      aria-label="Create Sela"
    >
      <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    </button>
  );
}
