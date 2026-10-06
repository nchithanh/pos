"use client";

import { CATEGORIES } from "@/data/categories";
import type { CategoryId } from "@/lib/types";
import { cn } from "@/lib/format";

export function CategoryTabs({
  value,
  onChange,
  counts,
  variant = "pills",
}: {
  value: CategoryId;
  onChange: (id: CategoryId) => void;
  counts?: Partial<Record<CategoryId, number>>;
  variant?: "pills" | "list";
}) {
  if (variant === "list") {
    return (
      <div className="flex h-full flex-col">
        <h2 className="mb-3 px-1 text-base font-bold text-slate-900">
          Danh mục sản phẩm
        </h2>
        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          {CATEGORIES.map((cat) => {
            const active = value === cat.id;
            const count = counts?.[cat.id] ?? 0;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onChange(cat.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[10px] border px-3 py-3 text-left transition-colors",
                  active
                    ? "border-[var(--pos-green)] bg-[var(--pos-green-muted)]"
                    : "border-transparent bg-white hover:bg-slate-50",
                )}
              >
                <span className="text-lg">{cat.emoji}</span>
                <span className="flex-1 text-sm font-semibold text-slate-800">
                  {cat.name}
                </span>
                <span
                  className={cn(
                    "pos-badge",
                    active
                      ? "bg-[var(--pos-green)] text-white"
                      : "bg-slate-100 text-slate-500",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {CATEGORIES.map((cat) => {
        const active = value === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(cat.id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold whitespace-nowrap",
              active
                ? "border-[var(--pos-green)] bg-[var(--pos-green)] text-white"
                : "border-[var(--pos-border)] bg-white text-slate-600",
            )}
          >
            <span>{cat.emoji}</span>
            {cat.name}
            {counts?.[cat.id] != null ? (
              <span
                className={cn(
                  "pos-badge !h-5 !min-w-5 text-[10px]",
                  active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500",
                )}
              >
                {counts[cat.id]}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
