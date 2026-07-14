"use client";

import { useState, useEffect } from "react";
import { getMonetizationRates, updateMonetizationRates, getMonetizationRules, updateMonetizationRules, MonetizationRules } from "./actions";
import { useToastStore } from "@/store/useToastStore";

export default function MonetizationSettingsPage() {
  const [rates, setRates] = useState({ sela: 0, resela: 0, reply: 0, viewRpm: 0 });
  const [rules, setRules] = useState<MonetizationRules>({
    bannedWords: "",
    minCharacterCount: 15,
    preventDuplicates: true,
    preventSelfReward: true,
    echoChamberLimit: 5,
    hourlyRewardLimit: 10,
    minWithdrawalThreshold: 5000,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    const loadSettings = async () => {
      const [fetchedRates, fetchedRules] = await Promise.all([
        getMonetizationRates(),
        getMonetizationRules()
      ]);
      setRates(fetchedRates);
      setRules(fetchedRules);
      setIsLoading(false);
    };
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Save both rates and rules concurrently
    const [ratesResult, rulesResult] = await Promise.all([
      updateMonetizationRates(rates),
      updateMonetizationRules(rules)
    ]);
    
    setIsSaving(false);
    
    if (ratesResult.success && rulesResult.success) {
      addToast("Monetization settings updated successfully!");
    } else {
      addToast(ratesResult.error || rulesResult.error || "Failed to update settings.");
    }
  };

  const handleRateChange = (field: keyof typeof rates, value: string) => {
    const parsed = parseFloat(value);
    setRates(prev => ({ ...prev, [field]: isNaN(parsed) ? 0 : parsed }));
  };

  const handleRuleChange = (field: keyof MonetizationRules, value: any) => {
    setRules(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Monetization Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Configure platform payout rates, content quality standards, and anti-spam limits.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* RATES SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-brand-card border border-brand-border/30 rounded-xl p-6 shadow-md h-full">
            <h2 className="text-lg font-semibold text-white mb-6">Interaction Rates</h2>
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="sela" className="text-sm font-medium text-gray-300">Sela Rate (NGN per post)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 font-medium">₦</span></div>
                  <input type="number" id="sela" min="0" step="0.01" value={rates.sela} onChange={(e) => handleRateChange("sela", e.target.value)} className="w-full bg-brand-bg border border-brand-border/50 text-white rounded-lg pl-8 pr-4 py-2.5 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="resela" className="text-sm font-medium text-gray-300">Resela Rate (NGN per resela)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 font-medium">₦</span></div>
                  <input type="number" id="resela" min="0" step="0.01" value={rates.resela} onChange={(e) => handleRateChange("resela", e.target.value)} className="w-full bg-brand-bg border border-brand-border/50 text-white rounded-lg pl-8 pr-4 py-2.5 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="reply" className="text-sm font-medium text-gray-300">Reply Rate (NGN per reply)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 font-medium">₦</span></div>
                  <input type="number" id="reply" min="0" step="0.01" value={rates.reply} onChange={(e) => handleRateChange("reply", e.target.value)} className="w-full bg-brand-bg border border-brand-border/50 text-white rounded-lg pl-8 pr-4 py-2.5 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-brand-card border border-brand-border/30 rounded-xl p-6 shadow-md">
              <h2 className="text-lg font-semibold text-white mb-6">Impression Rates</h2>
              <div className="flex flex-col gap-2">
                <label htmlFor="viewRpm" className="text-sm font-medium text-gray-300">Views RPM (NGN per 1,000 views)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 font-medium">₦</span></div>
                  <input type="number" id="viewRpm" min="0" step="0.01" value={rates.viewRpm} onChange={(e) => handleRateChange("viewRpm", e.target.value)} className="w-full bg-brand-bg border border-brand-border/50 text-white rounded-lg pl-8 pr-4 py-2.5 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Amount paid out per 1,000 valid views.</p>
              </div>
            </div>

            <div className="bg-brand-card border border-brand-border/30 rounded-xl p-6 shadow-md flex-1">
              <h2 className="text-lg font-semibold text-white mb-6">Financial Limits</h2>
              <div className="flex flex-col gap-2">
                <label htmlFor="minWithdrawalThreshold" className="text-sm font-medium text-gray-300">Min. Withdrawal Threshold (NGN)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 font-medium">₦</span></div>
                  <input type="number" id="minWithdrawalThreshold" min="0" step="100" value={rules.minWithdrawalThreshold} onChange={(e) => handleRuleChange("minWithdrawalThreshold", parseInt(e.target.value) || 0)} className="w-full bg-brand-bg border border-brand-border/50 text-white rounded-lg pl-8 pr-4 py-2.5 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum wallet balance required for a payout request.</p>
              </div>
            </div>
          </div>
        </div>

        {/* RULES SECTION */}
        <div className="bg-brand-card border border-brand-border/30 rounded-xl p-6 shadow-md">
          <h2 className="text-lg font-semibold text-white mb-6">Content Quality</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2 md:col-span-2">
              <label htmlFor="bannedWords" className="text-sm font-medium text-gray-300">Banned Words (Comma separated)</label>
              <textarea 
                id="bannedWords" 
                rows={3}
                value={rules.bannedWords}
                onChange={(e) => handleRuleChange("bannedWords", e.target.value)}
                placeholder="e.g. spamlink, scam, clickbait"
                className="w-full bg-brand-bg border border-brand-border/50 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors resize-none"
              />
              <p className="text-xs text-gray-500">Content containing any of these words becomes strictly non-eligible for monetization.</p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="minCharacterCount" className="text-sm font-medium text-gray-300">Min. Character Count (excl. emojis)</label>
              <input type="number" id="minCharacterCount" min="0" value={rules.minCharacterCount} onChange={(e) => handleRuleChange("minCharacterCount", parseInt(e.target.value) || 0)} className="w-full bg-brand-bg border border-brand-border/50 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors" />
              <p className="text-xs text-gray-500">Prevents low-effort posts (e.g. "lol") from being rewarded.</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-brand-bg rounded-lg border border-brand-border/30">
              <div className="flex flex-col gap-1 pr-4">
                <span className="text-sm font-medium text-gray-300">Prevent Duplicate Content</span>
                <span className="text-xs text-gray-500">Disqualify content if it perfectly matches a previous post/reply from the same user.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input type="checkbox" className="sr-only peer" checked={rules.preventDuplicates} onChange={(e) => handleRuleChange("preventDuplicates", e.target.checked)} />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-brand-card border border-brand-border/30 rounded-xl p-6 shadow-md">
          <h2 className="text-lg font-semibold text-white mb-6">Anti-Spam & Rate Limits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="flex items-center justify-between p-4 bg-brand-bg rounded-lg border border-brand-border/30 md:col-span-2">
              <div className="flex flex-col gap-1 pr-4">
                <span className="text-sm font-medium text-gray-300">Prevent Self-Reward (Critical)</span>
                <span className="text-xs text-gray-500">Blocks users from earning by replying to themselves, reselaing their own posts, or viewing their own content.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input type="checkbox" className="sr-only peer" checked={rules.preventSelfReward} onChange={(e) => handleRuleChange("preventSelfReward", e.target.checked)} />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="echoChamberLimit" className="text-sm font-medium text-gray-300">Echo-Chamber Limit (Per User Pair / Day)</label>
              <input type="number" id="echoChamberLimit" min="0" value={rules.echoChamberLimit} onChange={(e) => handleRuleChange("echoChamberLimit", parseInt(e.target.value) || 0)} className="w-full bg-brand-bg border border-brand-border/50 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors" />
              <p className="text-xs text-gray-500">Max rewarded interactions between the same two users in 24 hours.</p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="hourlyRewardLimit" className="text-sm font-medium text-gray-300">Hourly Reward Limit (Cooldown)</label>
              <input type="number" id="hourlyRewardLimit" min="0" value={rules.hourlyRewardLimit} onChange={(e) => handleRuleChange("hourlyRewardLimit", parseInt(e.target.value) || 0)} className="w-full bg-brand-bg border border-brand-border/50 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors" />
              <p className="text-xs text-gray-500">Max number of Selas, Reselas, and Replies a user can earn from per hour.</p>
            </div>

          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-end pt-4 pb-8">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 bg-brand text-brand-bg font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shadow-[0_0_15px_rgba(59,196,146,0.2)]"
          >
            {isSaving && <div className="w-4 h-4 border-2 border-brand-bg border-t-transparent rounded-full animate-spin"></div>}
            Save All Settings
          </button>
        </div>
      </form>
    </div>
  );
}
