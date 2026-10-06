"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { AppShell } from "@/components/layout/app-shell";
import { WarehouseNav } from "@/components/kho/warehouse-nav";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { db, getStockStatus } from "@/lib/db";
import { PackageBadge } from "@/components/finance/widgets";
import { PURCHASE_LABEL, OUTBOUND_LABEL } from "@/lib/warehouse/types";
import { useWarehouseStore } from "@/stores/warehouse-store";
import { formatVnd } from "@/lib/utils";

export default function WarehouseOverviewPage() {
  const products = useLiveQuery(() => db.products.toArray()) ?? [];
  const purchases = useWarehouseStore((s) => s.purchases);
  const outbounds = useWarehouseStore((s) => s.outbounds);
  const active = products.filter((p) => p.active);
  const qty = active.reduce((s, p) => s + p.stock, 0);
  const value = active.reduce((s, p) => s + p.stock * p.costPrice, 0);
  const low = active.filter((p) => getStockStatus(p.stock, p.minStock) === "low");
  const out = active.filter((p) => getStockStatus(p.stock, p.minStock) === "out");
  const waitIn = purchases.filter((p) => p.status === "awaiting_receive" || p.status === "receiving");
  const variance = purchases.filter((p) => p.status === "variance");
  const waitOut = outbounds.filter((o) =>
    ["pending", "approved", "picking", "partial", "ready"].includes(o.status),
  );
  const pendingApprove = outbounds.filter((o) => o.status === "pending");

  const inboundBuckets = useMemo(
    () => ({
      wait: purchases.filter((p) => p.status === "awaiting_receive").length,
      doing: purchases.filter((p) => p.status === "receiving" || p.status === "variance").length,
      done: purchases.filter((p) => p.status === "done").length,
    }),
    [purchases],
  );
  const outboundBuckets = useMemo(
    () => ({
      wait: outbounds.filter((o) => o.status === "pending").length,
      pick: outbounds.filter((o) => o.status === "picking" || o.status === "approved" || o.status === "partial").length,
      hand: outbounds.filter((o) => o.status === "ready").length,
    }),
    [outbounds],
  );

  const cards = [
    ["Tổng sản phẩm tồn", String(qty), "/kho/ton"],
    ["Giá trị tồn kho", formatVnd(value), "/kho/ton"],
    ["Đang chờ nhập", String(waitIn.length), "/kho/don-nhap"],
    ["Đang chờ xuất", String(waitOut.length), "/kho/don-xuat"],
    ["Sắp hết", String(low.length), "/kho/ton"],
    ["Hết hàng", String(out.length), "/kho/ton"],
  ] as const;

  return (
    <AppShell>
      <PageHeader
        title="Kho"
        description="Quản lý hàng nhập, tồn kho, xuất kho và biến động hàng hóa."
      />
      <WarehouseNav />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, valueText, href]) => (
          <Link key={label} href={href}>
            <Card className="p-4 hover:border-emerald-300">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-1 text-xl font-bold">{valueText}</p>
            </Card>
          </Link>
        ))}
      </div>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-bold">Quy trình đang xử lý · Nhập kho</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/kho/don-nhap" className="flex min-h-11 items-center justify-between">
                <span>Chờ kiểm nhận</span>
                <b>{inboundBuckets.wait} phiếu</b>
              </Link>
            </li>
            <li>
              <Link href="/kho/don-nhap" className="flex min-h-11 items-center justify-between">
                <span>Đang nhập / sai lệch</span>
                <b>{inboundBuckets.doing} phiếu</b>
              </Link>
            </li>
            <li>
              <Link href="/kho/don-nhap" className="flex min-h-11 items-center justify-between">
                <span>Hoàn tất</span>
                <b>{inboundBuckets.done} phiếu</b>
              </Link>
            </li>
          </ul>
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-bold">Quy trình đang xử lý · Xuất kho</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/kho/don-xuat" className="flex min-h-11 items-center justify-between">
                <span>Chờ duyệt</span>
                <b>{outboundBuckets.wait} phiếu</b>
              </Link>
            </li>
            <li>
              <Link href="/kho/don-xuat" className="flex min-h-11 items-center justify-between">
                <span>Đang soạn</span>
                <b>{outboundBuckets.pick} phiếu</b>
              </Link>
            </li>
            <li>
              <Link href="/kho/don-xuat" className="flex min-h-11 items-center justify-between">
                <span>Chờ bàn giao</span>
                <b>{outboundBuckets.hand} phiếu</b>
              </Link>
            </li>
          </ul>
        </Card>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-bold">Sản phẩm cần chú ý</h2>
        <ul className="space-y-2">
          {[...out, ...low].slice(0, 5).map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-slate-200 px-3 py-3 text-sm dark:border-slate-700"
            >
              <span>
                <span className="block font-semibold">{p.name}</span>
                <span className="text-slate-500">
                  Tồn {p.stock} · Tối thiểu {p.minStock} ·{" "}
                  {p.stock <= 0 ? "Hết hàng" : "Sắp hết"}
                </span>
              </span>
              <span className="flex gap-2">
                <Link href="/kho/ton" className="font-semibold text-emerald-700">
                  Xem sản phẩm
                </Link>
                <Link href="/kho/don-nhap" className="font-semibold text-emerald-700">
                  Tạo yêu cầu nhập
                </Link>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Tồn kho thấp", String(low.length), "/kho/ton"],
          ["Phiếu có sai lệch", String(variance.length), "/kho/don-nhap"],
          ["Đơn xuất chờ duyệt", String(pendingApprove.length), "/kho/don-xuat"],
          ["Hàng sắp hết hạn", "3 lô", "/kho/goi-y"],
        ].map(([label, n, href]) => (
          <Link key={label} href={href}>
            <Card className="p-3 text-sm hover:border-emerald-300">
              <p className="text-slate-500">{label}</p>
              <p className="font-bold">{n}</p>
            </Card>
          </Link>
        ))}
      </section>

      <p className="mt-4 text-xs text-slate-400">
        Trạng thái phiếu:{" "}
        {Object.values(PURCHASE_LABEL).slice(0, 3).join(" · ")} ·{" "}
        {Object.values(OUTBOUND_LABEL).slice(0, 3).join(" · ")}
        <span className="ml-2 inline-flex">
          <PackageBadge tier="basic" />
        </span>
      </p>
    </AppShell>
  );
}
