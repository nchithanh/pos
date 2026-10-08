"use client";

import { tr } from "@/lib/i18n/translate";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { NAV_ITEMS } from "@/lib/nav";
import { useAuthStore } from "@/stores/auth-store";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;

  const items = NAV_ITEMS.filter(
    (n) => !n.permission || user?.permissions[n.permission],
  );

  return (
    <div className="fixed inset-0 z-[90] bg-slate-900/50 p-4">
      <button
        type="button"
        className="absolute inset-0"
        onClick={() => setOpen(false)}
        aria-label={tr("Đóng")}
      />
      <Command className="relative z-10 mx-auto mt-[12vh] max-w-lg overflow-hidden rounded-[12px] border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <Command.Input
          placeholder={tr("Tìm trang… (Ctrl/Cmd + K)")}
          className="w-full border-b border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-700"
        />
        <Command.List className="max-h-72 overflow-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-sm text-slate-500">
            {tr("Không có kết quả")}
          </Command.Empty>
          {items.map((item) => (
            <Command.Item
              key={item.href}
              value={item.label}
              onSelect={() => {
                router.push(item.href);
                setOpen(false);
              }}
              className="flex cursor-pointer items-center gap-2 rounded-[10px] px-3 py-2.5 text-sm aria-selected:bg-emerald-50 dark:aria-selected:bg-emerald-950"
            >
              <item.icon size={16} />
              {tr(item.label)}
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </div>
  );
}
