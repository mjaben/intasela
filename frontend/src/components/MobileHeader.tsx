"use client";

import Link from "next/link";
import { useUserStore } from "@/store/useUserStore";

export default function MobileHeader() {
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  return (
    <header className="sm:hidden sticky top-0 w-full h-[60px] bg-background/90 backdrop-blur-md border-b border-border z-40 flex items-center justify-between px-4">
      {/* Brand Logo */}
      <Link href="/" className="flex items-center gap-1.5">
        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center font-bold text-primary-foreground text-sm">
          In
        </div>
        <span className="text-xl font-bold tracking-tight">tasela</span>
      </Link>

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
  );
}
