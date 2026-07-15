"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import AdminSidebarNav from "./AdminSidebarNav";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

export default function AdminLayout({ 
  children, 
  user 
}: { 
  children: React.ReactNode,
  user: { firstName: string, role: string, permissions?: string[] | null } | null
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  // Simple mapping to format the pathname into a readable title
  const getPageTitle = () => {
    if (pathname === "/") return "Overview";
    if (pathname === "/users") return "User Directory";
    if (pathname.startsWith("/moderation/selas")) return "Sela Content";
    if (pathname.startsWith("/moderation/orbits")) return "Orbits Content";
    if (pathname.startsWith("/moderation/replies")) return "Replies Content";
    if (pathname.startsWith("/moderation/flagged")) return "Flagged Content";
    if (pathname.startsWith("/creator/selas")) return "Sela Earnings";
    if (pathname.startsWith("/creator/reselas")) return "Resela Earnings";
    if (pathname.startsWith("/creator/replies")) return "Replies Earnings";
    if (pathname.startsWith("/creator/views")) return "View Tracking";
    if (pathname.startsWith("/creator/withdrawals")) return "Withdrawals";
    if (pathname.startsWith("/creator/settings")) return "Creator Studio Settings";
    if (pathname.startsWith("/security/logs")) return "Audit Logs";
    if (pathname.startsWith("/settings/ads")) return "Ad Manager";
    if (pathname.startsWith("/settings")) return "Platform Settings";
    
    // Fallback: Capitalize first letter of path segment
    const segment = pathname.split("/").filter(Boolean).pop() || "";
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  if (pathname === "/login") {
    return <>{children}</>;
  }

  const initial = user?.firstName ? user.firstName.charAt(0).toUpperCase() : "A";
  const displayName = user?.firstName || "System Admin";

  return (
    <div className="min-h-full flex w-full">
      <AdminSidebarNav isCollapsed={isCollapsed} permissions={user?.permissions || null} role={user?.role || "admin"} />
      
      <div className="flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-brand-border bg-brand-bg/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-gray-400 hover:text-white transition-colors"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </button>
            <span className="text-sm font-medium text-gray-300">{getPageTitle()}</span>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Removed dark mode toggle */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-card border border-brand-border flex items-center justify-center text-xs font-bold text-white">
                {initial}
              </div>
              <span className="text-sm font-medium text-white">{displayName}</span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
