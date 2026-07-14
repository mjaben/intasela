export default function SettingsModule() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Platform Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Manage global feature flags, site configurations, and rules.</p>
      </div>
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 shadow-xl h-96 flex items-center justify-center">
        <span className="text-gray-500 font-medium">Settings toggles will be rendered here.</span>
      </div>
    </div>
  );
}
