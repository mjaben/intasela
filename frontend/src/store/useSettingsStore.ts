import { create } from 'zustand';

interface SettingsState {
  settings: any;
  setSettings: (settings: any) => void;
  updateSetting: (key: string, value: any) => void;
  getCookiePreference: (cookieId: string) => boolean;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: {},
  setSettings: (settings) => set({ settings }),
  updateSetting: (key, value) => set((state) => ({
    settings: {
      ...state.settings,
      [key]: value
    }
  })),
  getCookiePreference: (cookieId) => {
    const { settings } = get();
    // Default to true if not explicitly set to false
    if (!settings?.cookies) return true;
    return settings.cookies[cookieId] ?? true;
  }
}));
