"use client";

import { tr } from "@/lib/i18n/translate";

import Link from "next/link";
import { useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import {
  CashflowChart,
  LoadingBlock,
  PackageBadge,
} from "@/components/finance/widgets";
import { useBooks } from "@/lib/finance/use-books";
import { balancesOf, cashflowSeries } from "@/lib/finance/metrics";
import { formatVnd } from "@/lib/utils";

export default function ForecastPage() {
  const books = useBooks();
  const series = useMemo(
    () => cashflowSeries(books.orders, books.finance.txns, 14),
    [books.orders, books.finance.txns],
  );
  const money = balancesOf(books.finance.accounts, books.finance.txns);
  const balance = money.reduce((s, a) => s + a.balance, 0);
  const avgIn = series.reduce((s, d) => s + d.inflow, 0) / Math.max(1, series.length);
  const avgOut = series.reduce((s, d) => s + d.outflow, 0) / Math.max(1, series.length);
  const incoming = Math.round(avgIn * 30);
  const outgoing = Math.round(avgOut * 30);
  const projected = balance + incoming - outgoing;
  const rent = books.finance.recurring.find((r) => r.category === "Tiền thuê");
  const chart = Array.from({ length: 30 }, (_, i) => ({
    label: `${String(i + 1).padStart(2, "0")}`,
    inflow: Math.round(avgIn),
    outflow: Math.round(avgOut),
    net: Math.round(avgIn - avgOut),
  }));

  return (
    <AppShell>
      <PageHeader
        title={tr("Dự báo & Cảnh báo")}
        description={tr("Ước lượng 30 ngày tới từ nhịp thu chi gần đây. Đây là mô phỏng, không gọi AI bên ngoài.")}
        actions={
          <Link href="/finance/alerts" className="text-sm font-semibold text-emerald-700">
            Cấu hình cảnh báo
          </Link>
        }
      />
      {books.loading ? <LoadingBlock /> : null}
      {!books.loading ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold">{tr("Dự báo dòng tiền 30 ngày")}</h2>
            <PackageBadge tier="pro" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <p className="text-sm text-slate-500">{tr("Số dư hiện tại")}</p>
              <p className="text-lg font-bold">{formatVnd(balance)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-500">{tr("Tiền vào dự kiến")}</p>
              <p className="text-lg font-bold text-emerald-600">+{formatVnd(incoming)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-500">{tr("Tiền ra dự kiến")}</p>
              <p className="text-lg font-bold text-rose-600">−{formatVnd(outgoing)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-500">{tr("Số dư dự kiến")}</p>
              <p className="text-lg font-bold">{formatVnd(projected)}</p>
            </Card>
          </div>
          <Card className="p-4">
            <CashflowChart data={chart} />
          </Card>
          <Card className="space-y-2 border-slate-300 p-4 text-sm">
            <div className="flex items-center gap-2">
              <p className="font-bold">{tr("Gợi ý vận hành")}</p>
              <PackageBadge tier="ai" />
            </div>
            <p>
              Nhịp 14 ngày gần đây cho thấy tiền vào trung bình {formatVnd(avgIn)}/ngày và tiền ra{" "}
              {formatVnd(avgOut)}/ngày.
              {rent
                ? ` Tiền thuê ${formatVnd(rent.amount)} đến hạn ngày ${rent.dayOfMonth} hàng tháng — tuần có khoản này dòng tiền sẽ mỏng hơn.`
                : ""}
            </p>
            <p>
              Nếu trả hết công nợ nhà cung cấp trong tuần này, tiền mặt có thể xuống gần mức tối thiểu đã cấu hình.
            </p>
          </Card>
        </div>
      ) : null}
    </AppShell>
  );
}
