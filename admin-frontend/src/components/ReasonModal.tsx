import { useState } from "react";

type ReasonModalProps = {
  isOpen: boolean;
  title?: string;
  placeholder?: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
};

export default function ReasonModal({ 
  isOpen, 
  title = "Reason Required", 
  placeholder = "Provide a reason for this action...",
  onConfirm, 
  onCancel 
}: ReasonModalProps) {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onConfirm(reason);
    setReason("");
  };

  const handleCancel = () => {
    setReason("");
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCancel}></div>
      <div className="relative bg-brand-card border border-brand-border/50 rounded-xl shadow-2xl w-[calc(100%-2rem)] max-w-[400px] p-6 animate-in fade-in zoom-in duration-200">
        <h3 className="text-lg font-bold text-gray-200 mb-2">{title}</h3>
        <p className="text-sm text-gray-400 mb-6">
          This action will be logged in the system audit trail. Please provide a clear reason.
        </p>
        
        <form onSubmit={handleSubmit}>
          <textarea
            autoFocus
            required
            rows={3}
            className="w-full bg-brand-bg border border-brand-border rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-none"
            placeholder={placeholder}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-400 font-semibold text-sm hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason.trim()}
              className="px-4 py-2 bg-brand text-brand-bg font-bold text-sm rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Action
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
