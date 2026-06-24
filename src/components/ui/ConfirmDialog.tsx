"use client";

import { Button } from "@/components/ui/Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div
        className="w-full max-w-sm rounded-3xl border border-border bg-surface p-5 safe-bottom"
        role="dialog"
        aria-modal="true"
      >
        <p className="text-lg font-semibold tracking-tight">{title}</p>
        {description && <p className="mt-2 text-sm text-secondary">{description}</p>}
        <div className="mt-5 flex flex-col gap-2">
          <Button
            variant={danger ? "danger" : "primary"}
            className="w-full"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onCancel}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
