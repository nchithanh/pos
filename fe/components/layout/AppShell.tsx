"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileDrawer } from "./MobileDrawer";
import { ToastHost } from "@/components/ui/ToastHost";

export function AppShell({
  children,
  hideBottomNav,
  search,
  onSearchChange,
  searchPlaceholder,
}: {
  children: React.ReactNode;
  hideBottomNav?: boolean;
  search?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[var(--pos-bg)]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          search={search}
          onSearchChange={onSearchChange}
          onOpenMenu={() => setMenuOpen(true)}
          searchPlaceholder={searchPlaceholder}
        />
        <main
          className={`min-h-0 flex-1 overflow-x-hidden px-3 py-4 sm:px-5 sm:py-5 ${
            hideBottomNav ? "pb-6" : "pb-24 lg:pb-6"
          }`}
        >
          {children}
        </main>
      </div>
      {!hideBottomNav ? (
        <MobileBottomNav onMore={() => setMenuOpen(true)} />
      ) : null}
      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      <ToastHost />
    </div>
  );
}
