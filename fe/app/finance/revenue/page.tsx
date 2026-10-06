"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DateRangeFilter,
  EmptyBlock,
  KpiCard,
  LoadingBlock,
  SimpleBar,
  Tabs,
  useRangeState,
} from "@/components/finance/widgets";
import { useBooks } from "@/lib/finance/use-books";
import { dateWindow } from "@/lib/finance/range";
import {
  periodSnapshot,
  revenueByCategory,
  revenueByMethod,
  revenueByProduct,
  revenueByStaff,
} from "@/lib/finance/metrics";
import { formatVnd } from "@/lib/utils";

export default function RevenuePage() {
  const books = useBooks();
  const range = useRangeState();
  const [tab, setTab] = useState("overview");
  const bounds = dateWindow(range.range, new Date(), {
    from: range.from,
    to: range.to,
  });
  const snap = useMemo(
    () => periodSnapshot(books.orders, books.finance.txns, bounds),
    [books.orders, books.finance.txns, bounds],
  );
  const byProduct = useMemo(
    () => revenueByProduct(books.orders, bounds.start, bounds.end),
    [books.orders, bounds],
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
  const byStaff = useMemo(
    () => revenueByStaff(books.orders, bounds.start, bounds.end),
    [books.orders, bounds],
  );
  const byMethod = useMemo(
    () => revenueByMethod(books.orders, bounds.start, bounds.end),
    [books.orders, bounds],
  );
  const daily = useMemo(() => {
    const map = new Map<string, number>();
    const cursor = new Date(bounds.start);
    while (cursor <= bounds.end) {
      const key = `${String(cursor.getDate()).padStart(2, "0")}/${String(cursor.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, 0);
      cursor.setDate(cursor.getDate() + 1);
      if (map.size > 120) break;
    }
    for (const o of books.orders) {
      if (o.status === "void") continue;
      const t = new Date(o.createdAt);
      if (t < bounds.start || t > bounds.end) continue;
      const key = `${String(t.getDate()).padStart(2, "0")}/${String(t.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, (map.get(key) ?? 0) + o.total);
    }
    return [...map.entries()].map(([name, revenue]) => ({ name, revenue }));
  }, [books.orders, bounds]);

  return (
    <AppShell>
      <PageHeader
        title="Doanh thu"
        description="Doanh thu theo đơn đã bán — chưa gồm tiền chuyển quỹ."
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
      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { id: "overview", label: "Tổng quan" },
          { id: "product", label: "Theo sản phẩm" },
          { id: "category", label: "Theo danh mục" },
          { id: "staff", label: "Theo nhân viên" },
          { id: "store", label: "Theo cửa hàng" },
          { id: "method", label: "Theo phương thức" },
        ]}
      />
      {books.loading ? <LoadingBlock /> : null}
      {!books.loading ? (
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                downloadCsv(
                  "doanh-thu.csv",
                  ["Tên", "Giá trị"],
                  (tab === "product" ? byProduct.map((r) => [r.name, r.revenue]) : tab === "staff" ? byStaff.map((r) => [r.name, r.revenue]) : daily.map((r) => [r.name, r.revenue])),
                )
              }
            >
              Xuất Excel
            </Button>
          </div>
          <div className="flex gap-3 overflow-x-auto lg:grid lg:grid-cols-4">
            <KpiCard label="Doanh thu" value={formatVnd(snap.revenue)} delta={snap.delta.revenue} />
            <KpiCard label="Đơn hàng" value={String(snap.orders)} />
            <KpiCard label="Giá trị đơn TB" value={formatVnd(snap.aov)} />
            <KpiCard label="Giảm giá" value={formatVnd(snap.discounts)} />
          </div>
          {tab === "overview" ? (
            <Card className="p-4">
              <h2 className="mb-2 text-sm font-bold">Doanh thu theo ngày</h2>
              <SimpleBar data={daily} xKey="name" yKey="revenue" />
            </Card>
          ) : null}
          {tab === "product" ? (
            <DataList
              rows={byProduct.map((r) => ({
                title: r.name,
                meta: `${r.qty} sp`,
                value: formatVnd(r.revenue),
              }))}
              empty="Chưa có sản phẩm bán trong kỳ."
            />
          ) : null}
          {tab === "category" ? (
            <Card className="p-4">
              <SimpleBar data={byCat} xKey="name" yKey="revenue" />
            </Card>
          ) : null}
          {tab === "staff" ? (
            <DataList
              rows={byStaff.map((r) => ({
                title: r.name,
                meta: `${r.orders} đơn`,
                value: formatVnd(r.revenue),
              }))}
              empty="Chưa có doanh thu theo nhân viên."
            />
          ) : null}
          {tab === "store" ? (
            <DataList
              rows={[
                {
                  title: "Cửa hàng chính",
                  meta: `${snap.orders} đơn`,
                  value: formatVnd(snap.revenue),
                },
              ]}
              empty=""
            />
          ) : null}
          {tab === "method" ? (
            <Card className="p-4">
              <SimpleBar data={byMethod} xKey="name" yKey="revenue" />
            </Card>
          ) : null}
        </div>
      ) : null}
    </AppShell>
  );
}

function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const lines = rows.map((row) =>
    row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
  );
  const blob = new Blob(["\uFEFF" + [header.join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function DataList({
  rows,
  empty,
}: {
  rows: { title: string; meta: string; value: string }[];
  empty: string;
}) {
  if (!rows.length) return <EmptyBlock text={empty} />;
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li
          key={r.title}
          className="flex items-center justify-between rounded-[10px] border border-slate-200 px-3 py-3 dark:border-slate-700"
        >
          <span>
            <span className="block font-semibold">{r.title}</span>
            <span className="text-xs text-slate-500">{r.meta}</span>
          </span>
          <span className="font-bold">{r.value}</span>
        </li>
      ))}
    </ul>
  );
}
