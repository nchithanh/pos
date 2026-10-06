"use client";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="pos-modal-backdrop" role="dialog" aria-modal="true">
      <div className="pos-modal p-5">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        ) : null}
        <div className="mt-5 flex gap-2">
          <button type="button" className="pos-btn pos-btn-outline flex-1" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`pos-btn flex-1 ${danger ? "pos-btn-danger" : "pos-btn-primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
