"use client";

import { tr } from "@/lib/i18n/translate";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  BRANCH_ALL_ID,
  isAllBranches,
  switchBranch,
} from "@/lib/branch";
import { useBranchId } from "@/lib/use-branch";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useConfirm } from "@/hooks/use-confirm";

export function BranchSwitcher({ variant }: { variant: "sidebar" | "header" }) {
  const branchId = useBranchId();
  const branches =
    useLiveQuery(() => db.branches.toArray())?.slice().sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    ) ?? [];
  const shift = useAuthStore((s) => s.shift);
  const user = useAuthStore((s) => s.user);
  const refreshShift = useAuthStore((s) => s.refreshShift);
  const { confirm, dialog } = useConfirm();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = branches.find((b) => b.id === branchId);
  const label = isAllBranches(branchId)
    ? tr("Tất cả")
    : (current?.name ?? "…");

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    return () => window.removeEventListener("mousedown", onPointer);
  }, [open]);

  const pick = async (nextId: string) => {
    setOpen(false);
    if (nextId === branchId) return;
    if (shift && !isAllBranches(nextId)) {
      await confirm({
        title: tr("Đóng ca trước khi đổi chi nhánh"),
        description: tr(
          "Ca đang mở ở chi nhánh này. Đóng ca rồi chọn chi nhánh khác.",
        ),
        confirmLabel: tr("Đã hiểu"),
      });
      return;
    }
    await switchBranch(nextId);
    await refreshShift();
  };

  const options: { id: string; name: string }[] = [
    { id: BRANCH_ALL_ID, name: tr("Tất cả") },
    ...branches.map((b) => ({ id: b.id, name: b.name })),
  ];

  const list = open ? (
    <div
      role="listbox"
      aria-label={tr("Chi nhánh")}
      className={cn(
        "absolute z-40 mt-1 overflow-hidden rounded-[10px] border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900",
        variant === "header" ? "top-full left-0 min-w-[240px]" : "right-0 left-0",
      )}
    >
      {options.map((b) => {
        const active = b.id === branchId;
        return (
          <button
            key={b.id}
            type="button"
            role="option"
            aria-selected={active}
            className={cn(
              "relative flex min-h-11 w-full items-center px-3 text-left text-sm font-medium",
              active
                ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60",
            )}
            onClick={() => void pick(b.id)}
          >
            {active ? (
              <span className="absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r-full bg-emerald-500" />
            ) : null}
            <span className="min-w-0 flex-1 truncate">{b.name}</span>
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <div ref={rootRef} className="relative min-w-0">
      {dialog}
      {variant === "header" ? (
        <button
          type="button"
          className="min-w-0 max-w-full text-left"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <p className="truncate text-sm font-semibold">{label}</p>
          <p className="truncate text-xs text-slate-400">
            {user?.name} · {shift ? tr("Đang mở ca") : tr("Chưa mở ca")}
          </p>
        </button>
      ) : (
        <button
          type="button"
          className="flex min-h-11 w-full items-center justify-between gap-2 rounded-[10px] border border-slate-200 px-3 text-sm font-semibold dark:border-slate-700"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="truncate">
            {isAllBranches(branchId) ? label : (current?.name ?? tr("Chi nhánh"))}
          </span>
          <ChevronDown size={16} className="shrink-0 text-slate-400" />
        </button>
      )}
      {list}
    </div>
  );
}
