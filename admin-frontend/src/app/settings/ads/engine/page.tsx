"use client";

import { useState, useEffect } from "react";
import { useToastStore } from "@/store/useToastStore";

export default function AdEngineSettings() {
  const [minCpmRate, setMinCpmRate] = useState(100);
  const [googleCpm, setGoogleCpm] = useState(1000);
  const [minBudget, setMinBudget] = useState(2000);
  const [maxBudget, setMaxBudget] = useState(5000000);
  const [businessAdsEnabled, setBusinessAdsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        const headers: any = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/ads/settings`, { headers });
        if (res.ok) {
          const data = await res.json();
          setMinCpmRate(data.minCpmRate ?? 100);
          setGoogleCpm(data.googleCpm ?? 1000);
          setMinBudget(data.minBudget ?? 2000);
          setMaxBudget(data.maxBudget ?? 5000000);
          setBusinessAdsEnabled(data.businessAdsEnabled ?? true);
        }
      } catch (e) {
        console.error("Failed to load settings:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/ads/settings`, {
        method: "POST",
        headers,
        body: JSON.stringify({ minCpmRate: Number(minCpmRate), googleCpm: Number(googleCpm), minBudget: Number(minBudget), maxBudget: Number(maxBudget), businessAdsEnabled })
      });
      
      if (res.ok) {
        addToast("Engine Settings saved successfully!");
      } else {
        addToast("Failed to save settings");
      }
    } catch (e) {
      console.error(e);
      addToast("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-3xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">Ad Decision Engine</h1>
        <p className="text-gray-400">Configure the parameters for the Second-Price Auction and overall network ad delivery.</p>
      </header>

      {loading ? (
        <div className="animate-pulse space-y-4">
           <div className="h-64 bg-brand-card/50 rounded-xl w-full"></div>
        </div>
      ) : (
        <div className="bg-brand-card border border-brand-border rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-6 text-white border-b border-brand-border pb-4">Engine Parameters</h3>
          
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-200">Minimum Ad Rate (CPM Floor) in ₦</label>
              <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                This is the absolute floor price for the Second-Price Auction. Advertisers cannot bid below this amount, and if there are no competing bids, the winning ad will be charged this minimum rate.
              </p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₦</span>
                <input 
                  type="number" 
                  value={minCpmRate}
                  onChange={(e) => setMinCpmRate(Number(e.target.value))}
                  step={10}
                  className="w-full bg-transparent border border-brand-border rounded-lg py-3 pl-8 pr-4 text-white font-semibold focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/50 transition-all" 
                />
              </div>
            </div>

            <div className="pt-6 border-t border-brand-border">
              <label className="block text-sm font-semibold mb-2 text-gray-200">Historic Google CPM (₦)</label>
              <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                This value is used to estimate revenue when serving Google AdSense fallback ads, and helps the engine balance between internal and external ad revenue.
              </p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₦</span>
                <input 
                  type="number" 
                  value={googleCpm}
                  onChange={(e) => setGoogleCpm(Number(e.target.value))}
                  step={10}
                  className="w-full bg-transparent border border-brand-border rounded-lg py-3 pl-8 pr-4 text-white font-semibold focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/50 transition-all" 
                />
              </div>
            </div>

            <div className="pt-6 border-t border-brand-border">
              <h4 className="text-sm font-semibold text-gray-200 mb-4">Daily Budget Limits (₦)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-2 text-gray-400">Minimum Daily Budget</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₦</span>
                    <input 
                      type="number" 
                      value={minBudget}
                      onChange={(e) => setMinBudget(Number(e.target.value))}
                      step={500}
                      className="w-full bg-transparent border border-brand-border rounded-lg py-2.5 pl-8 pr-4 text-white font-semibold focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/50 transition-all" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 text-gray-400">Maximum Daily Budget</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₦</span>
                    <input 
                      type="number" 
                      value={maxBudget}
                      onChange={(e) => setMaxBudget(Number(e.target.value))}
                      step={1000}
                      className="w-full bg-transparent border border-brand-border rounded-lg py-2.5 pl-8 pr-4 text-white font-semibold focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/50 transition-all" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-brand-border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-sm font-semibold text-gray-200">Enable Internal Business Ads</h4>
                  <p className="text-xs text-gray-400">
                    If disabled, the platform will skip the internal auction and exclusively serve Google AdSense fallbacks.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={businessAdsEnabled}
                    onChange={(e) => setBusinessAdsEnabled(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                </label>
              </div>
            </div>

            <div className="pt-6 border-t border-brand-border flex justify-end">
              <button 
                onClick={saveSettings}
                disabled={saving}
                className="bg-brand text-white font-bold px-8 py-3 rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? "Saving Changes..." : "Save Engine Settings"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
