"use client";

import { useState, useTransition } from "react";
import { updateSetting } from "./actions";
import ReasonModal from "@/components/ReasonModal";
import { useToastStore } from "@/store/useToastStore";

export default function SettingsForm({ initialSettings }: { initialSettings: Record<string, any> }) {
  const [settings, setSettings] = useState(initialSettings);
  const [isPending, startTransition] = useTransition();
  const [modalState, setModalState] = useState<{ isOpen: boolean; key: string; value: any; title: string }>({
    isOpen: false,
    key: "",
    value: null,
    title: ""
  });
  const addToast = useToastStore(state => state.addToast);

  const requestUpdate = (key: string, value: any) => {
    setModalState({
      isOpen: true,
      key,
      value,
      title: `Reason for updating '${key}'`
    });
  };

  const handleConfirmUpdate = async (reason: string) => {
    const { key, value } = modalState;
    setModalState(prev => ({ ...prev, isOpen: false }));
    
    let finalValue = value;

    if (value instanceof File) {
      try {
        const formData = new FormData();
        formData.append("file", value);
        const token = localStorage.getItem("access_token");
        const response = await fetch("http://localhost:3001/uploads/image", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        if (!response.ok) throw new Error("Failed to upload image");
        const data = await response.json();
        finalValue = data.url;
      } catch (error: any) {
        addToast(error.message, "error");
        return;
      }
    }
    
    startTransition(async () => {
      const result = await updateSetting(key, finalValue, reason);
      if (result.success) {
        setSettings(prev => ({ ...prev, [key]: finalValue }));
        addToast(`Updated ${key} successfully`, "success");
      } else {
        addToast(result.error, "error");
      }
    });
  };

  const renderToggle = (key: string, label: string, description: string) => (
    <div className="flex items-center justify-between p-5 border border-brand-border/30 rounded-xl bg-brand-bg/50 hover:border-brand-border transition-colors">
      <div>
        <h4 className="font-semibold text-gray-200">{label}</h4>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          className="sr-only peer" 
          checked={settings[key] === true}
          disabled={isPending}
          onChange={(e) => requestUpdate(key, e.target.checked)}
        />
        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
      </label>
    </div>
  );

  const renderNumberInput = (key: string, label: string, description: string) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-brand-border/30 rounded-xl bg-brand-bg/50 hover:border-brand-border transition-colors gap-4">
      <div className="flex-1">
        <h4 className="font-semibold text-gray-200">{label}</h4>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <input 
          type="number" 
          value={settings[key]} 
          disabled={isPending}
          onChange={(e) => setSettings(prev => ({ ...prev, [key]: Number(e.target.value) }))}
          className="bg-gray-800 border border-brand-border/50 text-white rounded-lg px-3 py-2 w-32 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-right"
        />
        <button 
          disabled={isPending}
          onClick={() => requestUpdate(key, settings[key])}
          className="px-4 py-2 bg-brand/10 text-brand font-semibold text-sm rounded-lg hover:bg-brand/20 transition-colors disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </div>
  );

  const renderTextInput = (key: string, label: string, description: string) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-brand-border/30 rounded-xl bg-brand-bg/50 hover:border-brand-border transition-colors gap-4">
      <div className="flex-1">
        <h4 className="font-semibold text-gray-200">{label}</h4>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      <div className="flex items-center gap-2 flex-1 sm:justify-end">
        <input 
          type="text" 
          value={settings[key]} 
          disabled={isPending}
          onChange={(e) => setSettings(prev => ({ ...prev, [key]: e.target.value }))}
          className="bg-gray-800 border border-brand-border/50 text-white rounded-lg px-3 py-2 w-full max-w-xs focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
        <button 
          disabled={isPending}
          onClick={() => requestUpdate(key, settings[key])}
          className="px-4 py-2 bg-brand/10 text-brand font-semibold text-sm rounded-lg hover:bg-brand/20 transition-colors disabled:opacity-50 flex-shrink-0"
        >
          Save
        </button>
      </div>
    </div>
  );

  const renderImageUpload = (key: string, label: string, description: string) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-brand-border/30 rounded-xl bg-brand-bg/50 hover:border-brand-border transition-colors gap-4">
      <div className="flex-1">
        <h4 className="font-semibold text-gray-200">{label}</h4>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
        {settings[key] && (
          <div className="mt-3 relative w-32 h-12 bg-gray-800 rounded flex items-center justify-center p-2 border border-brand-border/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={settings[key]} alt="Logo" className="max-h-full max-w-full object-contain" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 flex-1 sm:justify-end">
        <input 
          type="file" 
          accept="image/*"
          disabled={isPending}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              requestUpdate(key, e.target.files[0]);
              e.target.value = ''; // Reset input
            }
          }}
          className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20 transition-colors file:cursor-pointer disabled:opacity-50"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      
      {/* Section 1: Feature Flags */}
      <section className="bg-brand-card rounded-2xl shadow-xl border border-brand-border/30 overflow-hidden">
        <div className="px-6 py-5 border-b border-brand-border/30 bg-brand-bg/30">
          <h2 className="text-lg font-bold text-gray-200">Platform Operations</h2>
          <p className="text-sm text-gray-400">Master switches for critical platform features.</p>
        </div>
        <div className="p-6 space-y-4">
          {renderToggle("maintenance_mode", "Maintenance Mode", "Blocks all public access to the platform when enabled.")}
          {renderToggle("allow_signups", "Allow New Signups", "Enable or disable new user registrations.")}
          {renderToggle("enable_withdrawals", "Enable Withdrawals", "Allow creators to submit new withdrawal requests.")}
        </div>
      </section>

      {/* Section 2: Monetization Rules */}
      <section className="bg-brand-card rounded-2xl shadow-xl border border-brand-border/30 overflow-hidden">
        <div className="px-6 py-5 border-b border-brand-border/30 bg-brand-bg/30">
          <h2 className="text-lg font-bold text-gray-200">Monetization & Finance</h2>
          <p className="text-sm text-gray-400">Configure global financial rules and thresholds.</p>
        </div>
        <div className="p-6 space-y-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
          {renderNumberInput("withdrawal_fee_percentage", "Withdrawal Fee (%)", "Percentage fee taken on every creator withdrawal.")}
          {renderNumberInput("platform_fee_percentage", "Platform Fee (%)", "Default percentage fee taken on tips/direct purchases.")}
        </div>
      </section>

      {/* Section 3: Site Configuration */}
      <section className="bg-brand-card rounded-2xl shadow-xl border border-brand-border/30 overflow-hidden">
        <div className="px-6 py-5 border-b border-brand-border/30 bg-brand-bg/30">
          <h2 className="text-lg font-bold text-gray-200">Site Configuration</h2>
          <p className="text-sm text-gray-400">Global text and upload variables.</p>
        </div>
        <div className="p-6 space-y-4">
          {renderImageUpload("platform_logo_url", "Platform Logo", "Upload a new logo for the site. Useful for holiday/seasonal events.")}
          {renderTextInput("support_email", "Support Email", "The primary contact email address for user support.")}
          {renderNumberInput("max_upload_size_mb", "Max Upload Size (MB)", "The maximum allowed file size for media uploads in megabytes.")}
        </div>
      </section>

      {/* Section 4: Moderation */}
      <section className="bg-brand-card rounded-2xl shadow-xl border border-brand-border/30 overflow-hidden">
        <div className="px-6 py-5 border-b border-brand-border/30 bg-brand-bg/30">
          <h2 className="text-lg font-bold text-gray-200">Moderation Rules</h2>
          <p className="text-sm text-gray-400">Automated safety parameters.</p>
        </div>
        <div className="p-6 space-y-4">
          {renderNumberInput("auto_suspend_flag_threshold", "Auto-Suspend Flag Threshold", "Number of user flags required before content is automatically suspended/hidden.")}
        </div>
      </section>

      <ReasonModal 
        isOpen={modalState.isOpen}
        title={modalState.title}
        onConfirm={handleConfirmUpdate}
        onCancel={() => setModalState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
