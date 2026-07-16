"use client";

import { useState, useEffect } from "react";
import { useToastStore } from "@/store/useToastStore";

export default function AdminAdsDashboard() {
  const [activeTab, setActiveTab] = useState<"pending" | "active">("pending");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [activeCampaignsList, setActiveCampaignsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const addToast = useToastStore((state) => state.addToast);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const url = activeTab === "pending" 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/ads/campaigns/pending`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/ads/campaigns/active`;

      const res = await fetch(url, { headers });
      if (res.ok) {
        if (activeTab === "pending") {
          setCampaigns(await res.json());
        } else {
          setActiveCampaignsList(await res.json());
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "pending" || activeTab === "active") {
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
        addToast("Campaign approved successfully.");
      }
    } catch (e) {
      console.error(e);
      addToast("Error approving campaign.");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/ads/campaigns/reject/${id}`, {
        method: "POST",
        headers
      });
      
      if (res.ok) {
        setCampaigns(campaigns.filter(c => c.id !== id));
        addToast("Campaign rejected & refunded.");
      }
    } catch (e) {
      console.error(e);
      addToast("Error rejecting campaign.");
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-5xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">Ad Network Management</h1>
        <p className="text-gray-400">Approve campaigns, monitor active ads, and manage the Ad Decision Engine settings.</p>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-brand-border mb-8">
        {["pending", "active"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-3 font-bold text-sm capitalize relative transition-colors ${
              activeTab === tab ? "text-brand" : "text-gray-400 hover:text-white"
            }`}
          >
            {tab === "pending" ? "Pending Approvals" : "Active Campaigns"}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content: Pending */}
      {activeTab === "pending" && (
        <div className="space-y-6">
          {loading ? (
            <div className="animate-pulse space-y-4">
               <div className="h-32 bg-brand-card/50 rounded-xl w-full"></div>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="bg-brand-card border border-brand-border rounded-xl p-10 text-center text-gray-400">
              No campaigns currently pending approval.
            </div>
          ) : (
            campaigns.map((camp) => {
              const creative = camp.creatives?.[0];
              return (
                <div key={camp.id} className="bg-brand-card border border-brand-border rounded-xl overflow-hidden flex flex-col md:flex-row">
                  {/* Creative Preview */}
                  <div className="w-full md:w-[250px] bg-black/20 shrink-0 flex items-center justify-center p-4">
                    {creative?.mediaUrl ? (
                      <img src={creative.mediaUrl} className="w-full h-auto max-h-[150px] object-cover rounded" alt="Preview" />
                    ) : (
                      <span className="text-gray-500 text-xs uppercase tracking-widest font-bold">No Media</span>
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg mb-1 text-white">{camp.name}</h3>
                        <p className="text-sm text-gray-400">Advertiser: <span className="text-gray-200">{camp.advertiser?.companyName}</span></p>
                      </div>
                      <div className="text-right">
                        <div className="text-brand font-bold">${camp.budget.toFixed(2)}</div>
                        <div className="text-xs text-gray-400">Budget</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-6 bg-black/20 p-4 rounded-lg border border-brand-border/50">
                      <div>
                        <span className="block text-gray-400 text-xs">Target CPM</span>
                        <span className="font-semibold text-white">${camp.bid.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400 text-xs">Objective</span>
                        <span className="font-semibold text-white">{camp.objective || 'AWARENESS'}</span>
                      </div>
                    </div>

                    <div className="mt-auto flex justify-end gap-3">
                      <button 
                        onClick={() => handleReject(camp.id)}
                        className="px-6 py-2 rounded-lg font-bold text-sm bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                      >
                        Reject & Refund
                      </button>
                      <button 
                        onClick={() => handleApprove(camp.id)}
                        className="px-6 py-2 rounded-lg font-bold text-sm bg-brand text-white hover:bg-brand-hover transition-colors"
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

      {/* Tab Content: Active */}
      {activeTab === "active" && (
        <div className="space-y-6">
          {loading ? (
            <div className="animate-pulse space-y-4">
               <div className="h-32 bg-brand-card/50 rounded-xl w-full"></div>
            </div>
          ) : activeCampaignsList.length === 0 ? (
            <div className="bg-brand-card border border-brand-border rounded-xl p-10 text-center text-gray-400">
              No campaigns are currently active on the network.
            </div>
          ) : (
            activeCampaignsList.map((camp) => {
              const creative = camp.creatives?.[0];
              const percentageSpent = ((camp.budget - camp.remainingBudget) / camp.budget) * 100;
              
              return (
                <div key={camp.id} className="bg-brand-card border border-brand-border rounded-xl overflow-hidden flex flex-col md:flex-row">
                  <div className="w-full md:w-[150px] bg-black/20 shrink-0 flex items-center justify-center p-2">
                    {creative?.mediaUrl ? (
                      <img src={creative.mediaUrl} className="w-full h-auto max-h-[100px] object-cover rounded" alt="Preview" />
                    ) : (
                      <span className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">No Media</span>
                    )}
                  </div>
                  
                  <div className="p-4 flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-base mb-1 text-white">{camp.name}</h3>
                        <p className="text-xs text-gray-400">{camp.advertiser?.companyName}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-white">${camp.remainingBudget.toFixed(2)}</div>
                        <div className="text-[10px] text-gray-400">Remaining</div>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-black/40 rounded-full mt-2 overflow-hidden border border-brand-border">
                      <div className="h-full bg-brand rounded-full" style={{ width: `${percentageSpent}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                      <span>Spent: ${(camp.budget - camp.remainingBudget).toFixed(2)}</span>
                      <span>Total: ${camp.budget.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
}
