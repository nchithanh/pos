"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useWarehouseStore } from "@/stores/warehouse-store";

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

export function WarehouseNav() {
  const pathname = usePathname();
  const products = useLiveQuery(() => db.products.toArray());
  const suppliers = useLiveQuery(() => db.suppliers.toArray());
  const userName = useAuthStore((s) => s.user?.name);
  const ensureDemo = useWarehouseStore((s) => s.ensureDemo);

  useEffect(() => {
    if (!products?.length || !suppliers?.length) return;
    ensureDemo(products, suppliers, userName ?? "Phạm Đức Thành");
  }, [products, suppliers, userName, ensureDemo]);
  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
      {LINKS.map((l) => {
        const path =
          pathname.length > 1 && pathname.endsWith("/")
            ? pathname.slice(0, -1)
            : pathname;
        const active =
          l.href === "/kho" ? path === "/kho" : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-sm font-semibold",
              active
                ? "bg-emerald-500 text-white"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </div>
  );
}

export function StatusPill({ label, warn }: { label: string; warn?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
        warn
          ? "bg-amber-100 text-amber-800"
          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
      )}
    >
      {label}
    </span>
  );
}
