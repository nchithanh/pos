"use client";

import { setLang, useLang } from "@/lib/i18n";
import { tr } from "@/lib/i18n/translate";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { SupportIcon } from "@/components/support-icon";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { isNavActive, NAV_GROUPS, type NavItem } from "@/lib/nav";
import { cn, formatDateTime, formatVnd, todayKey } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CommandPalette } from "@/components/layout/command-palette";
import { BranchSwitcher } from "@/components/layout/branch-switcher";
import { inBranch } from "@/lib/branch";
import { useBranchId } from "@/lib/use-branch";
import { OfflineBanner } from "@/components/layout/offline-banner";
import { PageTransition } from "@/components/layout/page-transition";
import { useConfirm } from "@/hooks/use-confirm";
import { notify } from "@/lib/notify";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { confirm, dialog: confirmDialog } = useConfirm();
  const pathname = usePathname();
  const router = useRouter();
  const lang = useLang();
  const branchId = useBranchId();
  const user = useAuthStore((s) => s.user);
  const shift = useAuthStore((s) => s.shift);
  const logout = useAuthStore((s) => s.logout);
  const openShift = useAuthStore((s) => s.openShift);
  const closeShift = useAuthStore((s) => s.closeShift);
  const settings = useLiveQuery(() => db.settings.get("store"));
  const todayOrders = useLiveQuery(async () => {
    const key = todayKey();
    const all = await db.orders.toArray();
    return all.filter(
      (o) => o.createdAt.startsWith(key) && inBranch(o.branchId, branchId),
    ).length;
  }, [branchId]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(false);
  const [cash, setCash] = useState("500000");
  /** Tablet landscape / kiosk: ẩn sidebar cố định, full-width main */
  const isPosKiosk = pathname.startsWith("/ban-hang");

  const groups = useMemo(() => {
    return NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !user || !item.permission || user.permissions[item.permission],
      ),
    })).filter((group) => group.items.length > 0);
  }, [user]);
  const nav = groups.flatMap((g) => g.items);
  const mobileNav = nav.filter((n) => n.mobilePrimary).slice(0, 4);

  const renderLink = (item: NavItem, onNavigate?: () => void) => {
    const active = isNavActive(item.href, pathname);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "relative flex min-h-11 items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium",
          active
            ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
            : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/60",
        )}
      >
        {active ? (
          <span className="absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r-full bg-emerald-500" />
        ) : null}
        <Icon size={18} className={active ? "text-emerald-600" : undefined} />
        <span className="flex-1">{tr(item.label)}</span>
        {item.badgeTodayOrders && (todayOrders ?? 0) > 0 ? (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-white">
            {todayOrders}
          </span>
        ) : null}
      </Link>
    );
  };

  const onShiftAction = async () => {
    const amount = Number(cash) || 0;
    try {
      if (shift) {
        const ok = await confirm({
          title: tr("Đóng ca làm việc?"),
          description: tr(
            "Tiền mặt cuối ca: {amount}. Sau khi đóng ca, thu ngân cần mở ca mới để bán tiếp.",
            { amount: formatVnd(amount) },
          ),
          confirmLabel: tr("Đóng ca"),
          variant: "danger",
        });
        if (!ok) return;
        await closeShift(amount);
        notify.success(tr("Đã đóng ca"));
      } else {
        await openShift(amount);
        notify.success(tr("Đã mở ca"));
      }
      setShiftOpen(false);
    } catch (e) {
      notify.fromError(e, tr("Lỗi ca làm"));
    }
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--background)]">
      <aside
        className={cn(
          "h-full w-[260px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--card)]",
          /* Desktop: hiện sidebar; tablet landscape kiosk POS: ẩn */
          isPosKiosk ? "hidden xl:flex" : "hidden lg:flex",
        )}
      >
        <div className="flex shrink-0 items-center gap-2.5 px-5 py-5">
          <BrandMark className="h-10 w-10" />
          <div>
            <p className="text-sm font-bold tracking-wide text-emerald-600">
              DOLPHIN POS
            </p>
            <p className="text-xs text-slate-400">
              {settings?.slogan ?? "Pet shop & cafe"}
            </p>
          </div>
        </div>
        <div className="px-3 pb-3">
          <p className="mb-1 px-3 text-[11px] font-bold tracking-wide text-slate-400 uppercase">
            {tr("Chi nhánh")}
          </p>
          <BranchSwitcher variant="sidebar" />
        </div>
        <nav className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 pb-4">
          {groups.map((group) => (
            <div key={group.id}>
              <p className="mb-1 px-3 text-[11px] font-bold tracking-wide text-slate-400 uppercase">
                {tr(group.label)}
              </p>
              {group.items.map((item) => renderLink(item))}
            </div>
          ))}
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
                  ? tr("Ca mở · {time}", { time: formatDateTime(shift.openedAt) })
                  : tr("Chưa mở ca")}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <OfflineBanner />
        <header className="z-30 flex shrink-0 items-center gap-2 border-b border-[var(--border)] bg-[var(--card)]/95 px-3 py-3 backdrop-blur sm:px-5">
          <Button
            variant="outline"
            size="icon"
            className={cn(
              isPosKiosk ? "xl:hidden max-xl:landscape:inline-flex" : "lg:hidden",
            )}
            onClick={() => setMenuOpen(true)}
            aria-label={tr("Menu")}
          >
            <Menu size={18} />
          </Button>
          <div className="min-w-0 flex-1">
            <BranchSwitcher variant="header" />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCash(shift ? String(shift.openingCash) : "500000");
              setShiftOpen(true);
            }}
          >
            {shift ? tr("Đóng ca") : tr("Mở ca")}
          </Button>
          <div
            role="group"
            aria-label={tr("Ngôn ngữ")}
            className="inline-flex h-9 items-center rounded-full border border-slate-200 p-0.5 text-xs font-bold dark:border-slate-700"
          >
            {(["vi", "en"] as const).map((code) => (
              <button
                key={code}
                type="button"
                aria-pressed={lang === code}
                onClick={() => setLang(code)}
                className={cn(
                  "min-h-8 rounded-full px-2.5",
                  lang === code
                    ? "bg-emerald-500 text-white"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800",
                )}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            aria-label={tr("Đăng xuất")}
          >
            <LogOut size={18} />
          </Button>
        </header>

        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 pb-24 sm:px-5 lg:pb-6">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--card)] px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {mobileNav.map((item) => {
            const active = isNavActive(item.href, pathname);
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
                {tr(item.mobileLabel ?? item.label)}
              </Link>
            );
          })}
          <a
            href="https://zalo.me/0779937633"
            target="_blank"
            rel="noreferrer"
            className="flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium text-slate-400"
          >
            <SupportIcon className="h-5 w-5" />
            Support
          </a>
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
              <div className="flex items-center gap-2">
                <BrandMark className="h-8 w-8" />
                <p className="font-bold text-emerald-600">Dolphin POS</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMenuOpen(false)}>
                <X size={18} />
              </Button>
            </div>
            <nav className="space-y-3 overflow-y-auto px-3 pb-6">
              <div className="px-3 pb-2">
                <p className="mb-1 text-[11px] font-bold tracking-wide text-slate-400 uppercase">
                  {tr("Chi nhánh")}
                </p>
                <BranchSwitcher variant="sidebar" />
              </div>
              {groups.map((group) => (
                <div key={group.id}>
                  <p className="mb-1 px-3 text-[11px] font-bold tracking-wide text-slate-400 uppercase">
                    {tr(group.label)}
                  </p>
                  {group.items.map((item) => renderLink(item, () => setMenuOpen(false)))}
                </div>
              ))}
            </nav>
          </div>
        </>
      ) : null}

      <Dialog
        open={shiftOpen}
        onClose={() => setShiftOpen(false)}
        title={shift ? tr("Đóng ca làm việc") : tr("Mở ca làm việc")}
      >
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-500">
            {shift ? tr("Tiền mặt cuối ca") : tr("Tiền mặt đầu ca")}
          </span>
          <Input
            type="number"
            value={cash}
            onChange={(e) => setCash(e.target.value)}
          />
        </label>
        <Button className="mt-4 w-full" onClick={onShiftAction}>
          {tr("Xác nhận")}
        </Button>
      </Dialog>

      <a
        href="https://zalo.me/0779937633"
        target="_blank"
        rel="noreferrer"
        aria-label="Support"
        className="fixed right-5 bottom-5 z-40 hidden h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white shadow-lg hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 lg:inline-flex"
      >
        <SupportIcon className="h-6 w-6" />
      </a>

      <CommandPalette />
      {confirmDialog}
    </div>
  );
}
