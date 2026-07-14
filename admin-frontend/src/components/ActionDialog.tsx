"use client";

import { useState } from "react";

export default function ActionDialog({ 
  isOpen, 
  title, 
  description, 
  confirmText, 
  onConfirm, 
  onCancel 
}: { 
  isOpen: boolean, 
  title: string, 
  description: string, 
  confirmText: string, 
  onConfirm: () => void, 
  onCancel: () => void 
}) {
  const [input, setInput] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-red-500/20 rounded-xl p-6 shadow-2xl w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
        <p className="text-sm text-gray-400 mb-4">{description}</p>
        
        <div className="mb-6">
          <label className="block text-xs text-gray-500 uppercase font-semibold mb-2">
            Type <span className="text-red-400 font-mono bg-red-400/10 px-1 rounded">{confirmText}</span> to confirm
          </label>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
            placeholder={confirmText}
          />
        </div>

        <div className="flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              if (input === confirmText) {
                onConfirm();
                setInput("");
              }
            }}
            disabled={input !== confirmText}
            className="px-4 py-2 text-sm font-medium bg-red-500/10 text-red-500 border border-red-500/20 rounded hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Confirm Action
          </button>
        </div>
      </div>
    </div>
  );
}
