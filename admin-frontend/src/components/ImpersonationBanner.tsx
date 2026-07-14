"use client";

export default function ImpersonationBanner({ targetUser, onExit }: { targetUser: string, onExit: () => void }) {
  return (
    <div className="fixed top-0 left-0 w-full bg-yellow-500 text-black text-xs font-bold py-2 px-4 z-50 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
        <span>You are currently impersonating <span className="underline">{targetUser}</span></span>
      </div>
      <button 
        onClick={onExit}
        className="px-3 py-1 bg-black text-yellow-500 rounded hover:bg-gray-900 transition-colors"
      >
        Return to Self
      </button>
    </div>
  );
}
