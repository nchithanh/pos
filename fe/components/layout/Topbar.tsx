"use client";

import { Bell, Menu } from "lucide-react";
import { STORE_INFO } from "@/data/dashboard";
import { SearchBar } from "@/components/ui/SearchBar";

export function Topbar({
  search,
  onSearchChange,
  onOpenMenu,
  searchPlaceholder = "Tìm sản phẩm, đơn hàng, nhà cung cấp...",
}: {
  search?: string;
  onSearchChange?: (v: string) => void;
  onOpenMenu?: () => void;
  searchPlaceholder?: string;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-[var(--pos-border)] bg-white/95 px-3 py-3 backdrop-blur sm:gap-3 sm:px-5">
      <button
        type="button"
        className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-[var(--pos-border)] lg:hidden"
        onClick={onOpenMenu}
        aria-label="Mở menu"
      >
        <Menu size={20} />
      </button>

      <div className="hidden min-w-0 md:block">
        <p className="truncate text-sm font-semibold text-slate-900">
          {STORE_INFO.name}
        </p>
        <p className="truncate text-xs text-slate-400">Hôm nay · 06/10/2026</p>
      </div>

      {onSearchChange ? (
        <SearchBar
          value={search ?? ""}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          className="min-w-0 flex-1"
        />
      ) : (
        <div className="flex-1" />
      )}

      <button
        type="button"
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[var(--pos-border)] bg-white"
        aria-label="Thông báo"
      >
        <Bell size={18} />
        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[var(--pos-green)]" />
      </button>

      <div className="hidden h-11 w-11 items-center justify-center rounded-full bg-[var(--pos-green-soft)] text-sm font-bold text-[var(--pos-green-dark)] sm:flex">
        NH
      </div>
    </header>
  );
}
