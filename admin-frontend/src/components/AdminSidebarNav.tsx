"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hasPermission, Permission } from "@/lib/permissions";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Video, 
  MessageCircle, 
  BadgeDollarSign, 
  Repeat, 
  MessageSquareQuote, 
  Eye, 
  Wallet, 
  SlidersHorizontal, 
  Flag, 
  ShieldAlert, 
  Settings, 
  Megaphone 
} from "lucide-react";

const navGroups: {
  title: string;
  items: { name: string; href: string; icon: any; permission?: Permission }[];
}[] = [
  {
    title: "Main",
    items: [
      { name: "Overview", href: "/", icon: LayoutDashboard },
      { name: "User Directory", href: "/users", icon: Users, permission: "MANAGE_USERS" },
    ]
  },
  {
    title: "Content",
    items: [
      { name: "Sela", href: "/moderation/selas", icon: FileText, permission: "MODERATE_CONTENT" },
      { name: "Orbits", href: "/moderation/orbits", icon: Video, permission: "MODERATE_CONTENT" },
      { name: "Replies", href: "/moderation/replies", icon: MessageCircle, permission: "MODERATE_CONTENT" },
    ]
  },
  {
    title: "Creator Studio",
    items: [
      { name: "Sela Earnings", href: "/creator/selas", icon: BadgeDollarSign, permission: "MANAGE_FINANCE" },
      { name: "Resela Earnings", href: "/creator/reselas", icon: Repeat, permission: "MANAGE_FINANCE" },
      { name: "Replies Earnings", href: "/creator/replies", icon: MessageSquareQuote, permission: "MANAGE_FINANCE" },
      { name: "View Tracking", href: "/creator/views", icon: Eye, permission: "MANAGE_FINANCE" },
      { name: "Withdrawals", href: "/creator/withdrawals", icon: Wallet, permission: "MANAGE_FINANCE" },
      { name: "Settings", href: "/creator/settings", icon: SlidersHorizontal, permission: "MANAGE_FINANCE" },
    ]
  },
  {
    title: "Compliance",
    items: [
      { name: "Flagged Content", href: "/moderation/flagged", icon: Flag, permission: "MODERATE_CONTENT" },
      { name: "Audit Logs", href: "/security/logs", icon: ShieldAlert, permission: "MANAGE_SYSTEM" },
    ]
  },
  {
    title: "System",
    items: [
      { name: "Team Members", href: "/settings/team", icon: ShieldAlert, permission: "MANAGE_SYSTEM" },
      { name: "Platform Settings", href: "/settings", icon: Settings, permission: "MANAGE_SYSTEM" },
      { name: "Ad Manager", href: "/settings/ads", icon: Megaphone, permission: "MANAGE_SYSTEM" },
    ]
  }
];

export default function AdminSidebarNav({ 
  isCollapsed, 
  isMobileMenuOpen,
  permissions, 
  role 
}: { 
  isCollapsed: boolean, 
  isMobileMenuOpen?: boolean,
  permissions?: string[] | null, 
  role?: string 
}) {
  const pathname = usePathname();

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 transform md:relative md:translate-x-0
      ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      ${isCollapsed ? 'md:w-[80px]' : 'md:w-[280px]'} 
      w-[280px] transition-all duration-300 h-screen sticky top-0 flex flex-col bg-brand-bg text-gray-300 border-r border-brand-border flex-shrink-0 overflow-hidden
    `}>
      {/* Brand Logo */}
      <div className={`px-6 py-8 flex items-center ${isCollapsed ? 'md:justify-center' : 'gap-3'} transition-all`}>
        <div className="w-8 h-8 rounded-lg bg-brand flex-shrink-0 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(59,196,146,0.4)]">
          In
        </div>
        <div className={`whitespace-nowrap transition-opacity duration-300 ${isCollapsed ? 'md:hidden' : 'block'}`}>
          <span className="text-xl font-bold tracking-tight text-white block leading-none mb-1">Intasela</span>
          <span className="text-[9px] uppercase tracking-widest text-brand font-semibold leading-none">Super Admin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-6 overflow-y-auto pb-6 scrollbar-hide">
        {navGroups.map((group) => {
          // Filter items based on user permissions
          const allowedItems = group.items.filter(item => {
            if (!item.permission) return true;
            return hasPermission(permissions || null, item.permission, role || "admin");
          });

          if (allowedItems.length === 0) return null;

          return (
          <div key={group.title}>
            <div className={`mb-2 ${isCollapsed ? 'md:text-center md:px-0' : 'px-3'} text-[11px] font-bold text-brand uppercase tracking-wider transition-all block`}>
              <span className={`${isCollapsed ? 'md:hidden' : ''}`}>{group.title}</span>
              <span className={`hidden ${isCollapsed ? 'md:inline-block' : ''}`}>—</span>
            </div>
            <div className="space-y-1">
              {allowedItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={isCollapsed ? item.name : undefined}
                    className={`flex items-center ${isCollapsed ? 'md:justify-center md:px-0' : 'gap-3 px-3'} gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 font-medium text-[13px] group ${
                      isActive
                        ? "bg-brand/10 text-brand font-semibold"
                        : "text-gray-400 hover:bg-brand-card hover:text-gray-200"
                    }`}
                  >
                    <item.icon className={`flex-shrink-0 w-4 h-4 ${isActive ? 'text-brand' : 'text-gray-500 group-hover:text-gray-300'} transition-colors`} />
                    <span className={`whitespace-nowrap ${isCollapsed ? 'md:hidden' : 'block'}`}>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          );
        })}
      </nav>
    </aside>
  );
}
