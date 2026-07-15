import { getSettings } from "./actions";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsModule() {
  const result = await getSettings();
  
  // Note: if getSettings fails, we could handle it here, but we'll assume it succeeds and falls back to defaults.
  const settings: Record<string, any> = (result.success && result.data) ? result.data : {};

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Platform Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Manage global feature flags, site configurations, and rules.</p>
      </div>
      
      {result.success ? (
        <SettingsForm initialSettings={settings} />
      ) : (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">
          Failed to load settings. Please try again later.
        </div>
      )}
    </div>
  );
}
