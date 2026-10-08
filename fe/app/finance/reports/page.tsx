"use client";

import { tr } from "@/lib/i18n/translate";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DateRangeFilter,
  KpiCard,
  LoadingBlock,
  SimpleBar,
  Tabs,
  useRangeState,
} from "@/components/finance/widgets";
import { useBooks } from "@/lib/finance/use-books";
import { dateWindow } from "@/lib/finance/range";
import {
  cashflowSeries,
  expenseBreakdown,
  periodSnapshot,
  revenueByCategory,
} from "@/lib/finance/metrics";
import { formatVnd } from "@/lib/utils";
import { notify } from "@/lib/notify";

const TABS = [
  { id: "revenue", label: "Doanh thu" },
  { id: "cash", label: "Dòng tiền" },
  { id: "expense", label: "Chi phí" },
  { id: "debt", label: "Công nợ" },
  { id: "profit", label: "Lợi nhuận" },
];

export default function ReportsPage() {
  const books = useBooks();
  const range = useRangeState();
  const [tab, setTab] = useState("revenue");
  const bounds = dateWindow(range.range, new Date(), {
    from: range.from,
    to: range.to,
  });
  const snap = useMemo(
    () => periodSnapshot(books.orders, books.finance.txns, bounds),
    [books.orders, books.finance.txns, bounds],
  );
  const chart = useMemo(() => {
    if (tab === "expense") return expenseBreakdown(books.finance.txns, bounds.start, bounds.end);
    if (tab === "revenue" || tab === "profit") {
      return revenueByCategory(
        books.orders,
        books.products,
        books.categories,
        bounds.start,
        bounds.end,
      ).map((r) => ({ name: r.name, amount: r.revenue }));
    }
    return cashflowSeries(books.orders, books.finance.txns, 14).map((d) => ({
      name: d.label,
      amount: d.net,
    }));
  }, [tab, books, bounds]);

  const exportCsv = () => {
    const lines = [
      ["Chi tieu", "Gia tri"],
      ["Doanh thu", String(snap.revenue)],
      ["Tien da thu", String(snap.collected)],
      ["Tien da chi", String(snap.spent)],
      ["Loi nhuan", String(snap.profit)],
    ];
    const blob = new Blob([lines.map((r) => r.join(",")).join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bao-cao-${tab}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <PageHeader
        title={tr("Báo cáo")}
        description={tr("Tóm tắt số liệu cửa hàng theo kỳ. Xuất file để xem ngoài ứng dụng.")}
        actions={
          <div className="flex flex-wrap gap-2">
            <DateRangeFilter
              value={range.range}
              onChange={range.setRange}
              from={range.from}
              to={range.to}
              onFrom={range.setFrom}
              onTo={range.setTo}
            />
            <Button size="sm" variant="outline" onClick={exportCsv}>
              {tr("Xuất Excel")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                notify.success(tr("Đã mở hộp thoại in — chọn Lưu PDF"));
                window.print();
              }}
            >
              Xuất PDF
            </Button>
          </div>
        }
      />
      <Tabs value={tab} onChange={setTab} options={TABS} />
      {books.loading ? <LoadingBlock /> : null}
      {!books.loading ? (
        <div className="space-y-4">
          <div className="flex gap-3 overflow-x-auto">
            <KpiCard label="Doanh thu" value={formatVnd(snap.revenue)} />
            <KpiCard label={tr("Lợi nhuận")} value={formatVnd(snap.profit)} />
            <KpiCard label={tr("Chi phí vận hành")} value={formatVnd(snap.opex)} />
          </div>
          <Card className="p-4">
            <SimpleBar
              data={chart as { name: string; amount: number }[]}
              xKey="name"
              yKey="amount"
              fill={tab === "expense" ? "#F43F5E" : tab === "profit" ? "#047857" : "#10B981"}
            />
          </Card>
          {tab === "debt" ? (
            <Card className="p-4 text-sm">
              <p>
                Phải thu còn lại{" "}
                {formatVnd(
                  books.debts
                    .filter((d) => d.type === "receivable")
                    .reduce((s, d) => s + Math.max(0, d.amount - d.paidAmount), 0),
                )}
              </p>
              <p className="mt-1">
                Phải trả còn lại{" "}
                {formatVnd(
                  books.debts
                    .filter((d) => d.type === "payable")
                    .reduce((s, d) => s + Math.max(0, d.amount - d.paidAmount), 0),
                )}
              </p>
            </Card>
          ) : null}
        </div>
      ) : null}
    </AppShell>
  );
}
