"use client";

import { useState, useEffect } from "react";

export default function AdminAdsDashboard() {
  const [activeTab, setActiveTab] = useState<"pending" | "active" | "settings">("pending");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/ads/campaigns/pending`, { headers });
      if (res.ok) {
        setCampaigns(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "pending") {
      fetchCampaigns();
    }
  }, [activeTab]);

  const handleApprove = async (id: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/ads/campaigns/approve/${id}`, {
        method: "POST",
        headers
      });
      
      if (res.ok) {
        setCampaigns(campaigns.filter(c => c.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-5xl mx-auto">
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
        <div className="space-y-6">
          {loading ? (
            <div className="animate-pulse space-y-4">
               <div className="h-32 bg-muted/20 rounded-xl w-full"></div>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground">
              No campaigns currently pending approval.
            </div>
          ) : (
            campaigns.map((camp) => {
              const creative = camp.creatives?.[0];
              return (
                <div key={camp.id} className="bg-card border border-border rounded-xl overflow-hidden flex flex-col md:flex-row">
                  {/* Creative Preview */}
                  <div className="w-full md:w-[250px] bg-muted shrink-0 flex items-center justify-center p-4">
                    {creative?.mediaUrl ? (
                      <img src={creative.mediaUrl} className="w-full h-auto max-h-[150px] object-cover rounded" alt="Preview" />
                    ) : (
                      <span className="text-muted-foreground text-xs uppercase tracking-widest font-bold">No Media</span>
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg mb-1">{camp.name}</h3>
                        <p className="text-sm text-muted-foreground">Advertiser: <span className="text-foreground">{camp.advertiser?.companyName}</span></p>
                      </div>
                      <div className="text-right">
                        <div className="text-primary font-bold">${camp.budget.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">Budget</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-6 bg-muted/30 p-4 rounded-lg">
                      <div>
                        <span className="block text-muted-foreground text-xs">Target CPM</span>
                        <span className="font-semibold">${camp.bid.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="block text-muted-foreground text-xs">Objective</span>
                        <span className="font-semibold">{camp.objective || 'AWARENESS'}</span>
                      </div>
                    </div>

                    <div className="mt-auto flex justify-end gap-3">
                      <button className="px-6 py-2 rounded-lg font-bold text-sm bg-muted text-foreground hover:bg-muted/80 transition-colors">
                        Reject
                      </button>
                      <button 
                        onClick={() => handleApprove(camp.id)}
                        className="px-6 py-2 rounded-lg font-bold text-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                      >
                        Approve Campaign
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
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
