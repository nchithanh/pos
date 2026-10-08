"use client";

import { tr } from "@/lib/i18n/translate";

import Link from "next/link";
import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { TrendingDown, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { WarehouseNav } from "@/components/kho/warehouse-nav";
import {
  ProductThumb,
  QuickLink,
  Sparkline,
  StockMeter,
  stockLevel,
} from "@/components/kho/ui";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { db, getStockStatus } from "@/lib/db";
import { inBranch } from "@/lib/branch";
import { useBranchId } from "@/lib/use-branch";
import { useWarehouseStore } from "@/stores/warehouse-store";
import { formatVnd } from "@/lib/utils";

export default function WarehouseOverviewPage() {
  const products = useLiveQuery(() => db.products.toArray()) ?? [];
  const branchId = useBranchId();
  const movements =
    useLiveQuery(
      () => db.movements.filter((m) => inBranch(m.branchId, branchId)).toArray(),
      [branchId],
    ) ?? [];
  const purchases = useWarehouseStore((s) => s.purchases);
  const outbounds = useWarehouseStore((s) => s.outbounds);
  const active = products.filter((p) => p.active);
  const qty = active.reduce((s, p) => s + p.stock, 0);
  const value = active.reduce((s, p) => s + p.stock * p.costPrice, 0);
  const low = active.filter((p) => getStockStatus(p.stock, p.minStock) === "low");
  const out = active.filter((p) => getStockStatus(p.stock, p.minStock) === "out");
  const waitIn = purchases.filter((p) => p.status === "awaiting_receive" || p.status === "receiving");
  const waitOut = outbounds.filter((o) =>
    ["pending", "approved", "picking", "partial", "ready"].includes(o.status),
  );

  const series = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const day = d.toISOString().slice(0, 10);
      return movements
        .filter((m) => m.createdAt.slice(0, 10) === day)
        .reduce((s, m) => s + m.items.reduce((a, line) => a + line.quantity, 0), 0);
    });
  }, [movements]);
  const trendUp = series[series.length - 1] >= series[0];

  const inbound = {
    wait: purchases.filter((p) => p.status === "awaiting_receive").length,
    doing: purchases.filter((p) => p.status === "receiving" || p.status === "variance").length,
    done: purchases.filter((p) => p.status === "done").length,
  };
  const outbound = {
    wait: outbounds.filter((o) => o.status === "pending").length,
    pick: outbounds.filter((o) => ["picking", "approved", "partial"].includes(o.status)).length,
    hand: outbounds.filter((o) => o.status === "ready").length,
  };

  const cards: {
    label: string;
    value: string;
    href: string;
    tone?: "warn" | "danger";
  }[] = [
    { label: tr("Tổng sản phẩm tồn"), value: String(qty), href: "/kho/ton" },
    { label: tr("Giá trị tồn kho"), value: formatVnd(value), href: "/kho/ton" },
    { label: tr("Đang chờ nhập"), value: String(waitIn.length), href: "/kho/don-nhap?status=awaiting_receive" },
    { label: tr("Đang chờ xuất"), value: String(waitOut.length), href: "/kho/don-xuat?status=pending" },
    { label: tr("Sắp hết"), value: String(low.length), href: "/kho/ton?level=low", tone: "warn" },
    { label: tr("Hết hàng"), value: String(out.length), href: "/kho/ton?level=out", tone: "danger" },
  ];

  const watch = [...out, ...low].slice(0, 5);

  return (
    <AppShell>
      <PageHeader
        title="Kho"
        description={tr("Quản lý hàng nhập, tồn kho, xuất kho và biến động hàng hóa.")}
      />
      <WarehouseNav />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="rounded-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
            <Card className="p-4 shadow-sm transition hover:border-emerald-300">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-slate-500">{card.label}</p>
                <Sparkline points={series} />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <p
                  className={
                    card.tone === "danger"
                      ? "text-2xl font-bold text-rose-600"
                      : card.tone === "warn"
                        ? "text-2xl font-bold text-amber-600"
                        : "text-2xl font-bold"
                  }
                >
                  {card.value}
                </p>
                {trendUp ? (
                  <TrendingUp className="h-4 w-4 text-emerald-600" aria-hidden />
                ) : (
                  <TrendingDown className="h-4 w-4 text-slate-400" aria-hidden />
                )}
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        <QuickLink href="/kho/don-nhap?create=1" primary>
          + Nhập kho
        </QuickLink>
        <QuickLink href="/kho/don-xuat?create=1">{tr("+ Xuất kho")}</QuickLink>
        <QuickLink href="/kho/kiem-ke?mode=batch">{tr("Tạo phiếu kiểm kê")}</QuickLink>
        <QuickLink href="/kho/dieu-chinh">{tr("Điều chỉnh tồn")}</QuickLink>
      </div>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-4 shadow-sm">
          <h2 className="mb-3 text-base font-medium">{tr("Quy trình đang xử lý · Nhập kho")}</h2>
          <ul className="space-y-1 text-sm">
            <CountLink href="/kho/don-nhap?status=awaiting_receive" label={tr("Chờ kiểm nhận")} count={inbound.wait} />
            <CountLink href="/kho/don-nhap?status=working" label={tr("Đang nhập / sai lệch")} count={inbound.doing} />
            <CountLink href="/kho/don-nhap?status=done" label={tr("Hoàn tất")} count={inbound.done} />
          </ul>
        </Card>
        <Card className="p-4 shadow-sm">
          <h2 className="mb-3 text-base font-medium">{tr("Quy trình đang xử lý · Xuất kho")}</h2>
          <ul className="space-y-1 text-sm">
            <CountLink href="/kho/don-xuat?status=pending" label={tr("Chờ duyệt")} count={outbound.wait} />
            <CountLink href="/kho/don-xuat?status=picking" label={tr("Đang soạn")} count={outbound.pick} />
            <CountLink href="/kho/don-xuat?status=ready" label={tr("Chờ bàn giao")} count={outbound.hand} />
          </ul>
        </Card>
      </section>

      <section className="mt-6" aria-labelledby="kho-watch">
        <h2 id="kho-watch" className="mb-3 text-base font-medium">
          Sản phẩm cần chú ý
        </h2>
        {watch.length === 0 ? (
          <p className="text-sm text-slate-500">{tr("Không có sản phẩm sắp hết hoặc hết hàng.")}</p>
        ) : (
          <ul className="space-y-2">
            {watch.map((p) => {
              const level = stockLevel(p.stock, p.minStock, p.active);
              return (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center gap-3 rounded-[10px] border border-slate-200 px-3 py-3 text-sm shadow-sm dark:border-slate-700"
                >
                  <ProductThumb
                    name={p.name}
                    emoji={p.emoji}
                    imageColor={p.imageColor}
                    imageUrl={p.imageUrl}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{p.name}</span>
                    <span className="text-slate-500">
                      {p.sku} · Tồn {p.stock} · Tối thiểu {p.minStock}
                    </span>
                    <span className="mt-2 block">
                      <StockMeter stock={p.stock} minStock={p.minStock} />
                    </span>
                  </span>
                  <span className={level === "out" ? "font-semibold text-rose-600" : "font-semibold text-amber-600"}>
                    {level === "out" ? tr("Hết hàng") : tr("Sắp hết")}
                  </span>
                  <QuickLink href={`/kho/don-nhap?create=1&product=${p.id}`} primary>
                    {tr("Tạo yêu cầu nhập")}
                  </QuickLink>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <p className="mt-4 text-xs text-slate-400">{tr("Phím / trên trang tồn kho để tìm nhanh.")}</p>
    </AppShell>
  );
}

function CountLink({ href, label, count }: { href: string; label: string; count: number }) {
  return (
    <li>
      <Link
        href={href}
        className="flex min-h-11 items-center justify-between rounded-[10px] px-2 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-slate-800"
      >
        <span>{label}</span>
        <b>{count} phiếu</b>
      </Link>
    </li>
  );
}
