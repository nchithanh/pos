import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--pos-green-soft)] text-[var(--pos-green-dark)]">
        <Icon size={26} />
      </div>
      <div>
        <p className="text-base font-semibold text-slate-900">{title}</p>
        {description ? (
          <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
