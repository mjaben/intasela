"use client";

import { useUserStore } from "@/store/useUserStore";

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
        <div className="bg-card border border-border p-6 rounded-xl">
          <h3 className="text-muted-foreground font-semibold text-sm mb-2">Total Spend</h3>
          <div className="text-3xl font-bold">$0.00</div>
        </div>
        <div className="bg-card border border-border p-6 rounded-xl">
          <h3 className="text-muted-foreground font-semibold text-sm mb-2">Active Campaigns</h3>
          <div className="text-3xl font-bold">0</div>
        </div>
        <div className="bg-card border border-border p-6 rounded-xl">
          <h3 className="text-muted-foreground font-semibold text-sm mb-2">Total Impressions</h3>
          <div className="text-3xl font-bold">0</div>
        </div>
      </div>

      {/* Campaigns Table Placeholder */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold">Your Campaigns</h2>
          <button className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-full text-sm hover:opacity-90 transition-opacity">
            + New Campaign
          </button>
        </div>
        <div className="p-10 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
          </div>
          <h3 className="font-bold mb-1">No campaigns yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first ad campaign to start reaching Intasela users.</p>
        </div>
      </div>
    </div>
  );
}
