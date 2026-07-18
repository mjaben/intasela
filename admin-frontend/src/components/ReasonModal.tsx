import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

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
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <AlertDialogContent>
        <form onSubmit={handleSubmit}>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-orange-500/10 text-orange-500">
              <AlertTriangle />
            </AlertDialogMedia>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>
              This action will be logged in the system audit trail. Please provide a clear reason.
            </AlertDialogDescription>
            
            <div className="mt-4">
              <textarea
                autoFocus
                required
                rows={3}
                className="w-full bg-brand-bg border border-brand-border rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-none"
                placeholder={placeholder}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" onClick={handleCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              type="submit"
              disabled={!reason.trim()}
            >
              Confirm Action
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

