"use client";

import { tr } from "@/lib/i18n/translate";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { useWarehouseStore } from "@/stores/warehouse-store";
import { fieldClass } from "@/components/kho/ui";

const LINKS = [
  { href: "/kho", label: "Tổng quan" },
  { href: "/kho/ton", label: "Tồn kho" },
  { href: "/kho/don-nhap", label: "Nhập kho" },
  { href: "/kho/don-xuat", label: "Xuất kho" },
  { href: "/kho/kiem-ke", label: "Kiểm kê" },
  { href: "/kho/dieu-chinh", label: "Điều chỉnh" },
  { href: "/kho/chuyen-kho", label: "Chuyển kho" },
  { href: "/kho/lich-su", label: "Lịch sử" },
  { href: "/kho/goi-y", label: "Gợi ý" },
];

function normalize(pathname: string) {
  return pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
}

export function WarehouseNav() {
  const pathname = normalize(usePathname());
  const router = useRouter();
  const products = useLiveQuery(() => db.products.toArray());
  const suppliers = useLiveQuery(() => db.suppliers.toArray());
  const users = useLiveQuery(() => db.users.toArray());
  const ensureDemo = useWarehouseStore((s) => s.ensureDemo);
  const current =
    LINKS.find((l) => (l.href === "/kho" ? pathname === "/kho" : pathname.startsWith(l.href))) ??
    LINKS[0];

  useEffect(() => {
    if (!products?.length || !suppliers?.length || !users?.length) return;
    ensureDemo(products, suppliers, users);
  }, [products, suppliers, users, ensureDemo]);

  return (
    <div className="mb-4">
      <nav aria-label="Breadcrumb" className="mb-2 text-sm text-slate-500">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/kho" className="font-medium hover:text-slate-800 hover:underline">
              {tr("Kho")}
            </Link>
          </li>
          {current.href !== "/kho" ? (
            <li className="text-slate-800 dark:text-slate-100">
              <span aria-hidden> / </span>
              {tr(current.label)}
            </li>
          ) : null}
        </ol>
      </nav>
      <label className="block md:hidden">
        <span className="sr-only">{tr("Chọn mục kho")}</span>
        <select
          className={cn(fieldClass, "w-full")}
          value={current.href}
          onChange={(e) => router.push(e.target.value)}
        >
          {LINKS.map((l) => (
            <option key={l.href} value={l.href}>
              {tr(l.label)}
            </option>
          ))}
        </select>
      </label>
      <div className="hidden gap-2 overflow-x-auto pb-1 md:flex">
        {LINKS.map((l) => {
          const active = l.href === current.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                active
                  ? "bg-emerald-500 !text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300",
              )}
            >
              {tr(l.label)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export { StatusPill } from "@/components/kho/ui";
