import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/format";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "green" | "amber" | "rose" | "sky";
}) {
  const tones = {
    default: "bg-white",
    green: "bg-[var(--pos-green-muted)]",
    amber: "bg-amber-50",
    rose: "bg-rose-50",
    sky: "bg-sky-50",
  };
  const iconTones = {
    default: "bg-slate-100 text-slate-600",
    green: "bg-[var(--pos-green-soft)] text-[var(--pos-green-dark)]",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
    sky: "bg-sky-100 text-sky-700",
  };

  return (
    <div className={cn("pos-card p-4", tones[tone])}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {value}
          </p>
          {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
        </div>
        {Icon ? (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]",
              iconTones[tone],
            )}
          >
            <Icon size={20} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
