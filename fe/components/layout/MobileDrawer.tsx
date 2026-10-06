"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fish, X } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/format";

export function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="pos-sheet-backdrop lg:hidden"
        aria-label="Đóng menu"
        onClick={onClose}
      />
      <div className="fixed top-0 left-0 z-[52] flex h-full w-[min(86vw,320px)] flex-col bg-white shadow-2xl lg:hidden">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--pos-green)] text-white">
              <Fish size={18} />
            </div>
            <p className="font-bold text-[var(--pos-green-dark)]">Dolphin POS</p>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-6">
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
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-[10px] px-3 py-3 text-sm font-medium",
                  active
                    ? "bg-[var(--pos-green-soft)] text-[var(--pos-green-dark)]"
                    : "text-slate-600",
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/khach-hang"
            onClick={onClose}
            className="flex items-center gap-3 rounded-[10px] px-3 py-3 text-sm font-medium text-slate-600"
          >
            Dolphin Customer
          </Link>
        </nav>
      </div>
    </>
  );
}
