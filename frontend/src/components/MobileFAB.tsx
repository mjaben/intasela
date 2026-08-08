"use client";

import { useFeedStore } from "@/store/useFeedStore";
import { useUserStore } from "@/store/useUserStore";
import { useRouter, usePathname } from "next/navigation";

export default function MobileFAB() {
  const { openComposer, composerState } = useFeedStore();
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = () => {
    if (!isAuthenticated) {
      return router.push("/login");
    }
    openComposer("CREATE");
  };

  if (!isAuthenticated) return null;
  if (composerState.isOpen) return null;
  if (pathname && (
    pathname.includes('/posts/') || 
    pathname.includes('/orbit') ||
    pathname.startsWith('/creator-studio') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/ads')
  )) return null;

  return (
    <button
      onClick={handleClick}
      className="sm:hidden fixed right-5 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-transform active:scale-95 z-[900]"
      style={{ bottom: 'calc(88px + env(safe-area-inset-bottom, 0px))' }}
      data-haptic="medium"
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
