"use client";

export default function ConfirmModal({ 
  isOpen, 
  title, 
  description, 
  onConfirm, 
  onCancel,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false
}: { 
  isOpen: boolean, 
  title: string, 
  description: string, 
  onConfirm: () => void, 
  onCancel: () => void,
  confirmLabel?: string,
  cancelLabel?: string,
  destructive?: boolean
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#18181b] border border-white/10 rounded-xl p-6 shadow-2xl w-full max-w-sm">
        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
        <p className="text-sm text-gray-400 mb-6">{description}</p>
        
        <div className="flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            {cancelLabel}
          </button>
          <button 
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
              destructive 
                ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" 
                : "bg-brand text-white hover:bg-brand/90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
