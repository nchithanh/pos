"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { usePosStore } from "@/store/usePosStore";

export function ToastHost() {
  const toasts = usePosStore((s) => s.toasts);
  const dismissToast = usePosStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[80] flex w-[min(100%-2rem,360px)] flex-col gap-2">
      {toasts.map((t) => {
        const Icon =
          t.type === "success" ? CheckCircle2 : t.type === "error" ? XCircle : Info;
        const color =
          t.type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : t.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-sky-200 bg-sky-50 text-sky-800";
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-[10px] border px-3 py-3 shadow-lg ${color}`}
          >
            <Icon size={18} className="mt-0.5 shrink-0" />
            <p className="flex-1 text-sm font-medium">{t.message}</p>
            <button
              type="button"
              className="rounded-full p-1 hover:bg-black/5"
              onClick={() => dismissToast(t.id)}
              aria-label="Đóng"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
