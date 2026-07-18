"use client";

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
import { Trash2Icon } from "lucide-react";

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
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          {destructive && (
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <Trash2Icon />
            </AlertDialogMedia>
          )}
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction 
            variant={destructive ? "destructive" : "default"} 
            onClick={(e) => {
              e.preventDefault(); // Prevent Dialog from auto-closing if onConfirm is async
              onConfirm();
              onCancel(); // Actually close it after confirming
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

