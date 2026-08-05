import { IconAlertTriangle, IconCancel, IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "./button";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmModal({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-sm bg-card border border-border rounded-3xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 p-6 flex flex-col gap-6">
        <div className="flex items-start gap-4">
          <div
            className={`w-10 h-10 rounded-full flex shrink-0 items-center justify-center ${isDestructive ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}
          >
            <IconAlertTriangle size={20} stroke={2} />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-medium">{title}</h2>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            icon={IconCancel}
            iconPlacement="left"
            variant="outline"
            onClick={onClose}
          >
            {cancelText}
          </Button>

          <Button
            icon={IconTrash}
            iconPlacement="left"
            onClick={handleConfirm}
            disabled={loading}
            variant="destructive"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
