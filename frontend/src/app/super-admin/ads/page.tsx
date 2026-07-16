"use client";

import { useState } from "react";

export default function AdminAdsDashboard() {
  const [activeTab, setActiveTab] = useState<"pending" | "active" | "settings">("pending");

  return (
    <div className="p-6 sm:p-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Ad Network Management</h1>
        <p className="text-muted-foreground">Approve campaigns and manage the Ad Decision Engine settings.</p>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-border mb-8">
        {["pending", "active", "settings"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-3 font-bold text-sm capitalize relative transition-colors ${
              activeTab === tab ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "pending" ? "Pending Approvals" : tab === "active" ? "Active Campaigns" : "Engine Settings"}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "pending" && (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
          No campaigns currently pending approval.
        </div>
      )}

      {activeTab === "settings" && (
        <div className="max-w-2xl">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-bold text-lg mb-4">Ad Decision Engine Settings</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Historic Google CPM (USD)</label>
                <p className="text-xs text-muted-foreground mb-3">
                  This value is used to compete against Internal Business Ads in the auction when a real-time bid from Google is unavailable.
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <input 
                    type="number" 
                    defaultValue={1.50}
                    step={0.10}
                    className="w-full bg-background border border-border rounded-lg py-2 pl-8 pr-4 focus:outline-none focus:border-primary" 
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <button className="bg-primary text-primary-foreground font-bold px-6 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity">
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
