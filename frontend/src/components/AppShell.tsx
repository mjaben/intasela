"use client";

import { usePathname } from "next/navigation";
import SidebarNav from "@/components/SidebarNav";
import RightSidebar from "@/components/RightSidebar";
import MobileHeader from "@/components/MobileHeader";
import MobileBottomNav from "@/components/MobileBottomNav";
import MobileFAB from "@/components/MobileFAB";
import CreatePost from "@/components/CreatePost";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/register") || pathname?.startsWith("/forgot-password");

  if (isAuthPage) {
    return <main className="flex-1 min-w-0 flex flex-col w-full h-[100dvh] overflow-hidden bg-[#111111]">{children}</main>;
  }

  // Check if current page already has a local CreatePost instance to avoid double-mounting modals
  const hasLocalComposer = pathname === '/' || 
                           pathname?.includes('/posts/') || 
                           (pathname?.startsWith('/spaces/') && pathname.split('/').length === 3);

  return (
    <>
      <MobileHeader />
      <div className="flex flex-1 w-full max-w-[1280px] mx-auto px-0 sm:px-4 pt-[calc(60px+var(--safe-area-inset-top))] sm:pt-0">
        <SidebarNav />
        <main className="flex-1 min-w-0 pb-32 sm:pb-0 flex flex-col">
          {children}
        </main>
        <RightSidebar />
      </div>
      <MobileFAB />
      <MobileBottomNav />
      {!hasLocalComposer && (
        <CreatePost 
          hideInline={true} 
          onPostCreated={() => window.location.reload()} 
        />
      )}
    </>
  );
}
