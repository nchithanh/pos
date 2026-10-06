"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fish, Sparkles } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/format";
import { STORE_INFO } from "@/data/dashboard";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-[260px] shrink-0 flex-col border-r border-[var(--pos-border)] bg-white lg:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[var(--pos-green)] text-white">
          <Fish size={22} />
        </div>
        <div>
          <p className="text-sm font-bold tracking-wide text-[var(--pos-green-dark)]">
            DOLPHIN POS
          </p>
          <p className="text-xs text-slate-400">Pet shop & cafe</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {NAV_ITEMS.map((item) => {
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
                "relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
              )}
            >
              {active ? (
                <span className="absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[var(--pos-green)]" />
              ) : null}
              <Icon
                size={18}
                className={active ? "text-[var(--pos-green-dark)]" : undefined}
              />
              {item.label}
              {item.href === "/ban-hang" ? (
                <span className="pos-badge ml-auto bg-[var(--pos-green)] text-white">
                  POS
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mx-3 mb-3 rounded-[12px] bg-gradient-to-br from-[var(--pos-green)] to-emerald-400 p-4 text-white">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Sparkles size={16} />
          Dolphin Customer
        </div>
        <p className="text-xs leading-relaxed text-emerald-50">
          Quản lý khách hàng và tăng tỷ lệ khách quay lại.
        </p>
        <Link
          href="/khach-hang"
          className="mt-3 inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[var(--pos-green-dark)]"
        >
          Xem expansion
        </Link>
      </div>

      <div className="flex items-center gap-3 border-t border-[var(--pos-border)] px-4 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pos-green-soft)] text-sm font-bold text-[var(--pos-green-dark)]">
          NH
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">Nguyễn Thị Hương</p>
          <p className="truncate text-xs text-slate-400">{STORE_INFO.name}</p>
        </div>
      </div>
    </aside>
  );
}
