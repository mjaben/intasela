"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

const navGroups = [
  {
    title: "Main",
    items: [
      { name: "Overview", href: "/", icon: LayoutDashboard },
      { name: "User Directory", href: "/users", icon: Users },
    ]
  },
  {
    title: "Content",
    items: [
      { name: "Sela", href: "/moderation/selas", icon: FileText },
      { name: "Orbits", href: "/moderation/orbits", icon: Video },
      { name: "Replies", href: "/moderation/replies", icon: MessageCircle },
    ]
  },
  {
    title: "Creator Studio",
    items: [
      { name: "Sela Earnings", href: "/creator/selas", icon: BadgeDollarSign },
      { name: "Resela Earnings", href: "/creator/reselas", icon: Repeat },
      { name: "Replies Earnings", href: "/creator/replies", icon: MessageSquareQuote },
      { name: "View Tracking", href: "/creator/views", icon: Eye },
      { name: "Withdrawals", href: "/creator/withdrawals", icon: Wallet },
      { name: "Settings", href: "/creator/settings", icon: SlidersHorizontal },
    ]
  },
  {
    title: "Compliance",
    items: [
      { name: "Flagged Content", href: "/moderation/flagged", icon: Flag },
      { name: "Audit Logs", href: "/security/logs", icon: ShieldAlert },
    ]
  },
  {
    title: "System",
    items: [
      { name: "Platform Settings", href: "/settings", icon: Settings },
      { name: "Ad Manager", href: "/settings/ads", icon: Megaphone },
    ]
  }
];

export default function AdminSidebarNav({ isCollapsed }: { isCollapsed: boolean }) {
  const pathname = usePathname();

  return (
    <aside className={`${isCollapsed ? 'w-[80px]' : 'w-[280px]'} transition-all duration-300 h-screen sticky top-0 flex flex-col bg-brand-bg text-gray-300 border-r border-brand-border flex-shrink-0 overflow-hidden`}>
      {/* Brand Logo */}
      <div className={`px-6 py-8 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} transition-all`}>
        <div className="w-8 h-8 rounded-lg bg-brand flex-shrink-0 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(59,196,146,0.4)]">
          In
        </div>
        {!isCollapsed && (
          <div className="whitespace-nowrap transition-opacity duration-300">
            <span className="text-xl font-bold tracking-tight text-white block leading-none mb-1">Intasela</span>
            <span className="text-[9px] uppercase tracking-widest text-brand font-semibold leading-none">Super Admin</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-6 overflow-y-auto pb-6 scrollbar-hide">
        {navGroups.map((group) => (
          <div key={group.title}>
            <div className={`mb-2 ${isCollapsed ? 'text-center px-0' : 'px-3'} text-[11px] font-bold text-brand uppercase tracking-wider transition-all`}>
              {isCollapsed ? "—" : group.title}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={isCollapsed ? item.name : undefined}
                    className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-lg transition-all duration-200 font-medium text-[13px] group ${
                      isActive
                        ? "bg-brand/10 text-brand font-semibold"
                        : "text-gray-400 hover:bg-brand-card hover:text-gray-200"
                    }`}
                  >
                    <item.icon className={`flex-shrink-0 w-4 h-4 ${isActive ? 'text-brand' : 'text-gray-500 group-hover:text-gray-300'} transition-colors`} />
                    {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
