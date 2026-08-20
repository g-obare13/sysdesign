import { IconAlertTriangle } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-sm bg-card border border-border rounded-lg shadow-lg animate-in zoom-in-98 duration-150 p-5 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`size-8 rounded-md shrink-0 flex items-center justify-center ${
              isDestructive
                ? "bg-destructive/10 text-destructive border border-destructive/20"
                : "bg-primary/10 text-primary border border-primary/20"
            }`}
          >
            <IconAlertTriangle size={16} stroke={1.8} />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <h6 className="text-sm font-semibold text-foreground leading-snug">
              {title}
            </h6>
            <p className="text-xs text-muted-foreground leading-normal">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
          >
            {cancelText}
          </Button>

          <Button
            size="sm"
            onClick={handleConfirm}
            loading={loading}
            variant={isDestructive ? "destructive" : "default"}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
