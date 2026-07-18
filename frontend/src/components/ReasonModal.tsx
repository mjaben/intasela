import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
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
            <div className="bg-orange-500/10 text-orange-500 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle />
            </div>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>
              This action will be logged in the system audit trail. Please provide a clear reason.
            </AlertDialogDescription>
            
            <div className="mt-4">
              <textarea
                autoFocus
                required
                rows={3}
                className="w-full bg-background border border-border rounded-lg p-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                placeholder={placeholder}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
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
