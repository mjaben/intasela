"use client";

import { useUserStore } from "@/store/useUserStore";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdvertiserPortal() {
  const user = useUserStore((s) => s.user);

  return (
    <div className="w-full max-w-5xl mx-auto min-h-screen p-6 sm:p-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Advertiser Portal</h1>
        <p className="text-muted-foreground">Manage your ad campaigns, budgets, and view analytics.</p>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="bg-[#18181b]/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl transition-transform hover:scale-[1.02]">
          <h3 className="text-gray-400 font-semibold text-sm mb-2 uppercase tracking-wider font-mono">Total Spend</h3>
          <div className="text-4xl font-bold text-white">₦0.00</div>
        </div>
        <div className="bg-[#18181b]/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl transition-transform hover:scale-[1.02]">
          <h3 className="text-gray-400 font-semibold text-sm mb-2 uppercase tracking-wider font-mono">Active Campaigns</h3>
          <div className="text-4xl font-bold text-[#3BC492]">0</div>
        </div>
        <div className="bg-[#18181b]/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl transition-transform hover:scale-[1.02]">
          <h3 className="text-gray-400 font-semibold text-sm mb-2 uppercase tracking-wider font-mono">Total Impressions</h3>
          <div className="text-4xl font-bold text-white">0</div>
        </div>
      </div>

      {/* Campaigns Table Placeholder */}
      <div className="bg-[#18181b]/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
          <h2 className="text-xl font-bold text-white">Your Campaigns</h2>
          <Button asChild>
            <Link href="/ads/campaigns/new">
              + New Campaign
            </Link>
          </Button>
        </div>
        <div className="p-16 text-center flex flex-col items-center justify-center bg-gradient-to-b from-transparent to-black/40">
          <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#3BC492]"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-2 tracking-tight">No campaigns yet</h3>
          <p className="text-gray-400 mb-6 max-w-sm">Create your first ad campaign to start reaching Intasela users and growing your business.</p>
        </div>
      </div>
    </div>
  );
}
