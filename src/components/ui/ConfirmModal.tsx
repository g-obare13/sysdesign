/**
 * @fileoverview Reusable confirmation dialog modal for destructive or state-altering actions.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { IconAlertTriangle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

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
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm nordic-panel rounded-xl shadow-popover animate-in zoom-in-98 duration-150 p-6 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`size-8 rounded-lg shrink-0 flex items-center justify-center border ${
              isDestructive
                ? "bg-destructive/10 text-destructive border-destructive/20"
                : "bg-muted text-foreground border-border"
            }`}
          >
            <IconAlertTriangle size={16} stroke={1.6} />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <h3 className="text-card font-medium text-foreground">{title}</h3>
            <p className="text-small text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
          <Button variant="outline" size="sm" onClick={onClose}>
            {cancelText}
          </Button>

          <Button
            size="sm"
            onClick={handleConfirm}
            loading={loading}
            tone={isDestructive ? "destructive" : "default"}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
