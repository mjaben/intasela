"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { useState } from "react";
import MobileSidebarDrawer from "./MobileSidebarDrawer";

export default function MobileHeader() {
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <header className="sm:hidden fixed top-0 left-0 right-0 h-[60px] bg-background/90 backdrop-blur-md border-b border-border z-40 flex items-center justify-between px-4">
        {/* Left Side: Hamburger (if logged in) + Brand Logo */}
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <button 
              onClick={() => setIsDrawerOpen(true)} 
              className="p-1 -ml-1 text-foreground hover:opacity-80 transition-opacity"
              aria-label="Open Menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
          )}
          <Link href="/" className="flex items-center gap-1.5">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center font-bold text-primary-foreground text-sm">
              In
            </div>
            <span className="text-xl font-bold tracking-tight">tasela</span>
          </Link>
        </div>

        {/* User Avatar or Login Button */}
        {isAuthenticated && user ? (
          <Link href={`/@${user.username}`}>
            <div className="w-9 h-9 rounded-full bg-muted overflow-hidden border border-border">
              <img 
                src={user.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.username}`} 
                alt={user.username} 
                className="w-full h-full object-cover" 
              />
            </div>
          </Link>
        ) : (
          <Link 
            href="/login" 
            className="bg-primary text-primary-foreground font-bold text-sm px-4 py-1.5 rounded-full"
          >
            Login
          </Link>
        )}
      </header>

      <MobileSidebarDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </>
  );
}
