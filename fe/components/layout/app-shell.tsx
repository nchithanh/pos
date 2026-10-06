"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Fish,
  LogOut,
  Menu,
  Moon,
  MoreHorizontal,
  Sun,
  X,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { NAV_ITEMS } from "@/lib/nav";
import { cn, formatDateTime, todayKey } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CommandPalette } from "@/components/layout/command-palette";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const shift = useAuthStore((s) => s.shift);
  const logout = useAuthStore((s) => s.logout);
  const openShift = useAuthStore((s) => s.openShift);
  const closeShift = useAuthStore((s) => s.closeShift);
  const settings = useLiveQuery(() => db.settings.get("store"));
  const todayOrders = useLiveQuery(async () => {
    const key = todayKey();
    const all = await db.orders.toArray();
    return all.filter((o) => o.createdAt.startsWith(key)).length;
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(false);
  const [cash, setCash] = useState("500000");

  const nav = useMemo(() => {
    if (!user) return NAV_ITEMS;
    return NAV_ITEMS.filter(
      (item) => !item.permission || user.permissions[item.permission],
    );
  }, [user]);
  const mobileNav = nav.filter((n) => n.mobilePrimary).slice(0, 4);

  const onShiftAction = async () => {
    try {
      if (shift) {
        await closeShift(Number(cash) || 0);
        toast.success("Đã đóng ca");
      } else {
        await openShift(Number(cash) || 0);
        toast.success("Đã mở ca");
      }
      setShiftOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi ca làm");
    }
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--background)]">
      <aside className="hidden h-full w-[260px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--card)] lg:flex">
        <div className="flex shrink-0 items-center gap-2.5 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-emerald-500 text-white">
            <Fish size={22} />
          </div>
          <div>
            <p className="text-sm font-bold tracking-wide text-emerald-600">
              DOLPHIN POS
            </p>
            <p className="text-xs text-slate-400">
              {settings?.slogan ?? "Pet shop & cafe"}
            </p>
          </div>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {nav.map((item) => {
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
                  "relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium",
                  active
                    ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                    : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/60",
                )}
              >
                {active ? (
                  <span className="absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r-full bg-emerald-500" />
                ) : null}
                <Icon
                  size={18}
                  className={active ? "text-emerald-600" : undefined}
                />
                <span className="flex-1">{item.label}</span>
                {item.badgeTodayOrders && (todayOrders ?? 0) > 0 ? (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-white">
                    {todayOrders}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="shrink-0 border-t border-[var(--border)] p-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: user?.avatarColor ?? "#10B981" }}
              aria-hidden
            >
              {(user?.name ?? "N").trim().charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight">
                {user?.name}
              </p>
              <p className="truncate text-xs text-slate-400">{user?.email}</p>
              <p className="truncate text-[11px] text-slate-500">
                {shift
                  ? `Ca mở · ${formatDateTime(shift.openedAt)}`
                  : "Chưa mở ca"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="z-30 flex shrink-0 items-center gap-2 border-b border-[var(--border)] bg-[var(--card)]/95 px-3 py-3 backdrop-blur sm:px-5">
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Menu"
          >
            <Menu size={18} />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {settings?.name ?? "Pet Dolphin Store"}
            </p>
            <p className="truncate text-xs text-slate-400">
              {user?.name} · {shift ? "Đang mở ca" : "Chưa mở ca"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCash(shift ? String(shift.openingCash) : "500000");
              setShiftOpen(true);
            }}
          >
            {shift ? "Đóng ca" : "Mở ca"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            aria-label="Đăng xuất"
          >
            <LogOut size={18} />
          </Button>
        </header>

        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 pb-24 sm:px-5 lg:pb-6">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--card)] px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {mobileNav.map((item) => {
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
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-[10px] text-[11px] font-medium",
                  active ? "text-emerald-600" : "text-slate-400",
                )}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            className="flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium text-slate-400"
            onClick={() => setMenuOpen(true)}
          >
            <MoreHorizontal size={20} />
            Thêm
          </button>
        </div>
      </nav>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-50 bg-slate-900/40 lg:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed top-0 left-0 z-[51] flex h-full w-[min(86vw,320px)] flex-col bg-[var(--card)] shadow-2xl lg:hidden">
            <div className="flex items-center justify-between px-4 py-4">
              <p className="font-bold text-emerald-600">Dolphin POS</p>
              <Button variant="ghost" size="icon" onClick={() => setMenuOpen(false)}>
                <X size={18} />
              </Button>
            </div>
            <nav className="space-y-1 px-3 pb-6">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-[10px] px-3 py-3 text-sm font-medium"
                >
                  <item.icon size={18} />
                  <span className="flex-1">{item.label}</span>
                  {item.badgeTodayOrders && (todayOrders ?? 0) > 0 ? (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-white">
                      {todayOrders}
                    </span>
                  ) : null}
                </Link>
              ))}
            </nav>
          </div>
        </>
      ) : null}

      <Dialog
        open={shiftOpen}
        onClose={() => setShiftOpen(false)}
        title={shift ? "Đóng ca làm việc" : "Mở ca làm việc"}
      >
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-500">
            {shift ? "Tiền mặt cuối ca" : "Tiền mặt đầu ca"}
          </span>
          <Input
            type="number"
            value={cash}
            onChange={(e) => setCash(e.target.value)}
          />
        </label>
        <Button className="mt-4 w-full" onClick={onShiftAction}>
          Xác nhận
        </Button>
      </Dialog>

      <CommandPalette />
    </div>
  );
}
