"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { MOBILE_NAV } from "@/lib/nav";
import { cn } from "@/lib/format";

export function MobileBottomNav({ onMore }: { onMore: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-40 border-t border-[var(--pos-border)] bg-white px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="grid grid-cols-5 gap-1">
        {MOBILE_NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-[10px] text-[11px] font-medium",
                active
                  ? "text-[var(--pos-green-dark)]"
                  : "text-slate-400",
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 2} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onMore}
          className="flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-[10px] text-[11px] font-medium text-slate-400"
        >
          <MoreHorizontal size={20} />
          <span>Thêm</span>
        </button>
      </div>
    </nav>
  );
}
