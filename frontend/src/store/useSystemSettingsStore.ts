import { create } from 'zustand';

interface SystemSettingsState {
  businessAdsEnabled: boolean;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
}

export const useSystemSettingsStore = create<SystemSettingsState>((set) => ({
  businessAdsEnabled: true,
  isLoading: false,
  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ads/settings/public`);
      if (res.ok) {
        const data = await res.json();
        set({ businessAdsEnabled: data.businessAdsEnabled, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      console.error("Failed to fetch system settings", e);
      set({ isLoading: false });
    }
  }
}));
