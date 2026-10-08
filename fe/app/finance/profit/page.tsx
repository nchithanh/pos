"use client";

import { tr } from "@/lib/i18n/translate";

import { useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import {
  DateRangeFilter,
  LoadingBlock,
  SimpleBar,
  useRangeState,
} from "@/components/finance/widgets";
import { useBooks } from "@/lib/finance/use-books";
import { dateWindow } from "@/lib/finance/range";
import { cashflowSeries, periodSnapshot, revenueByCategory } from "@/lib/finance/metrics";
import { formatVnd } from "@/lib/utils";

export default function ProfitPage() {
  const books = useBooks();
  const range = useRangeState();
  const bounds = dateWindow(range.range, new Date(), {
    from: range.from,
    to: range.to,
  });
  const snap = useMemo(
    () => periodSnapshot(books.orders, books.finance.txns, bounds),
    [books.orders, books.finance.txns, bounds],
  );
  const series = useMemo(
    () => cashflowSeries(books.orders, books.finance.txns, 14),
    [books.orders, books.finance.txns],
  );
  const byCat = useMemo(
    () =>
      revenueByCategory(
        books.orders,
        books.products,
        books.categories,
        bounds.start,
        bounds.end,
      ),
    [books, bounds],
  );
  const grossMargin = snap.revenue ? (snap.gross / snap.revenue) * 100 : 0;
  const netMargin = snap.revenue ? (snap.profit / snap.revenue) * 100 : 0;
  const profitBars = series.map((d) => ({
    name: d.label,
    gross: Math.max(0, d.net),
  }));

  const lines = [
    ["Doanh thu", snap.revenue],
    [tr("Giá vốn"), snap.cogs],
    [tr("Lợi nhuận gộp"), snap.gross],
    [tr("Chi phí vận hành"), snap.opex],
    [tr("Lợi nhuận ròng"), snap.profit],
  ] as const;

  return (
    <AppShell>
      <PageHeader
        title={tr("Lợi nhuận")}
        description={tr("Lợi nhuận = doanh thu − giá vốn − chi phí vận hành. Tiền chuyển quỹ và trả nợ không tính vào đây.")}
        actions={
          <DateRangeFilter
            value={range.range}
            onChange={range.setRange}
            from={range.from}
            to={range.to}
            onFrom={range.setFrom}
            onTo={range.setTo}
          />
        }
      />
      {books.loading ? <LoadingBlock /> : null}
      {!books.loading ? (
        <div className="space-y-4">
          <Card className="divide-y divide-slate-100 dark:divide-slate-800">
            {lines.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>{label}</span>
                <span className="font-bold">{formatVnd(value)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span>{tr("Biên lợi nhuận gộp")}</span>
              <span className="font-bold">
                {grossMargin.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span>{tr("Biên lợi nhuận ròng")}</span>
              <span className="font-bold">
                {netMargin.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%
              </span>
            </div>
          </Card>
          <Card className="p-4">
            <h2 className="mb-2 text-sm font-bold">{tr("Dòng tiền ròng 14 ngày")}</h2>
            <SimpleBar data={profitBars} xKey="name" yKey="gross" />
          </Card>
          <Card className="p-4">
            <h2 className="mb-2 text-sm font-bold">{tr("Doanh thu theo danh mục")}</h2>
            <SimpleBar data={byCat} xKey="name" yKey="revenue" />
          </Card>
        </div>
      ) : null}
    </AppShell>
  );
}
