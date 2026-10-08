"use client";

import { tr } from "@/lib/i18n/translate";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import {
  CashflowChart,
  DateRangeFilter,
  ErrorBlock,
  KpiCard,
  LoadingBlock,
  SimpleBar,
  useRangeState,
} from "@/components/finance/widgets";
import { useBooks } from "@/lib/finance/use-books";
import { dateWindow } from "@/lib/finance/range";
import {
  balancesOf,
  cashflowSeries,
  debtRemain,
  debtUiStatus,
  debtUiStatusLabel,
  expenseBreakdown,
  periodSnapshot,
} from "@/lib/finance/metrics";
import { formatDate, formatVnd } from "@/lib/utils";

export default function FinanceOverviewPage() {
  const books = useBooks();
  const range = useRangeState();
  const [days, setDays] = useState<7 | 30 | 90>(30);

  const view = useMemo(() => {
    try {
      const bounds = dateWindow(range.range, new Date(), {
        from: range.from,
        to: range.to,
      });
      const snap = periodSnapshot(books.orders, books.finance.txns, bounds);
      const openDebts = books.debts.filter((d) => debtRemain(d) > 0);
      const recv = openDebts.filter((d) => d.type === "receivable");
      const pay = openDebts.filter((d) => d.type === "payable");
      const chart = cashflowSeries(books.orders, books.finance.txns, days);
      const sparkIn = chart.map((p) => p.inflow);
      const sparkOut = chart.map((p) => p.outflow);
      const sparkNet = chart.map((p) => p.net);
      const topSpend = expenseBreakdown(books.finance.txns, bounds.start, bounds.end).slice(0, 5);
      const watch = recv
        .filter((d) => {
          const st = debtUiStatus(d);
          return st === "overdue" || st === "due_soon";
        })
        .slice(0, 5);
      const money = balancesOf(books.finance.accounts, books.finance.txns);
      const cash = money.filter((a) => a.type === "cash").reduce((s, a) => s + a.balance, 0);
      return {
        ok: true as const,
        snap,
        chart,
        sparkIn,
        sparkOut,
        sparkNet,
        topSpend,
        watch,
        recvSum: recv.reduce((s, d) => s + debtRemain(d), 0),
        paySum: pay.reduce((s, d) => s + debtRemain(d), 0),
        cash,
      };
    } catch (e) {
      return {
        ok: false as const,
        error: e instanceof Error ? e.message : tr("Không tải được số liệu"),
      };
    }
  }, [books, range.range, range.from, range.to, days]);

  return (
    <AppShell>
      <PageHeader
        title={tr("Tài chính")}
        description={tr("Doanh thu, chi phí, lợi nhuận và công nợ của kỳ đang chọn.")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DateRangeFilter
              value={range.range}
              onChange={range.setRange}
              from={range.from}
              to={range.to}
              onFrom={range.setFrom}
              onTo={range.setTo}
            />
            <Link href="/finance/cash-flow" className="inline-flex min-h-11 items-center rounded-full bg-emerald-500 px-4 text-sm font-semibold !text-white">
              + Phiếu thu
            </Link>
            <Link href="/finance/cash-flow" className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 text-sm font-semibold">
              + Phiếu chi
            </Link>
            <Link href="/finance/debts" className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 text-sm font-semibold">
              {tr("Thanh toán công nợ")}
            </Link>
            <Link href="/finance/reports" className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 text-sm font-semibold">
              Xuất báo cáo
            </Link>
          </div>
        }
      />

      {books.loading ? <LoadingBlock /> : null}
      {!books.loading && !view.ok ? <ErrorBlock text={view.error} /> : null}

      {!books.loading && view.ok ? (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <KpiCard label="Doanh thu" value={formatVnd(view.snap.revenue)} delta={view.snap.delta.revenue} spark={view.sparkIn} />
            <KpiCard label={tr("Chi phí vận hành")} value={formatVnd(view.snap.opex)} delta={view.snap.delta.opex} spark={view.sparkOut} />
            <KpiCard label={tr("Lợi nhuận gộp")} value={formatVnd(view.snap.gross)} delta={view.snap.delta.gross} spark={view.sparkNet} />
            <KpiCard
              label={tr("Biên lợi nhuận")}
              value={`${view.snap.margin.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`}
              delta={view.snap.delta.margin}
            />
            <KpiCard
              label={tr("Dòng tiền ròng")}
              value={formatVnd(view.snap.net)}
              delta={view.snap.delta.net}
              valueClass={view.snap.net >= 0 ? "text-emerald-700" : "text-rose-600"}
            />
            <KpiCard
              label={tr("Công nợ ròng")}
              value={formatVnd(view.recvSum - view.paySum)}
              valueClass="text-slate-900"
            />
          </div>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card className="p-4 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-medium">{tr("Dòng tiền")}</h2>
                <div className="flex gap-1">
                  {([7, 30, 90] as const).map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`min-h-9 rounded-full px-3 text-sm font-semibold ${days === n ? "bg-emerald-500 !text-white" : "bg-slate-100 text-slate-600"}`}
                      onClick={() => setDays(n)}
                    >
                      {n} ngày
                    </button>
                  ))}
                </div>
              </div>
              <CashflowChart data={view.chart} />
            </Card>
            <Card className="p-4 shadow-sm">
              <h2 className="mb-3 text-base font-medium">{tr("Lãi lỗ kỳ này")}</h2>
              <SimpleBar
                data={[
                  { name: "Doanh thu", value: view.snap.revenue, color: "#10B981" },
                  { name: tr("Giá vốn"), value: view.snap.cogs, color: "#64748B" },
                  { name: tr("Chi phí"), value: view.snap.opex, color: "#F43F5E" },
                  { name: tr("Lợi nhuận"), value: Math.max(0, view.snap.profit), color: "#047857" },
                ]}
                xKey="name"
                yKey="value"
              />
              <p className="mt-2 text-sm text-slate-500">
                Doanh thu {formatVnd(view.snap.revenue)} − giá vốn {formatVnd(view.snap.cogs)} − chi phí{" "}
                {formatVnd(view.snap.opex)} = lợi nhuận {formatVnd(view.snap.profit)}.
              </p>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card className="p-4 shadow-sm">
              <h2 className="mb-3 text-base font-medium">{tr("Khoản chi lớn nhất")}</h2>
              {view.topSpend.length === 0 ? (
                <p className="text-sm text-slate-500">{tr("Chưa có chi phí vận hành trong kỳ.")}</p>
              ) : (
                <ul className="space-y-3">
                  {view.topSpend.map((row) => {
                    const max = view.topSpend[0]?.amount || 1;
                    return (
                      <li key={row.name}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span>{row.name}</span>
                          <span className="font-semibold tabular-nums">{formatVnd(row.amount)}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full bg-rose-400" style={{ width: `${Math.round((row.amount / max) * 100)}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
            <Card className="p-4 shadow-sm">
              <h2 className="mb-3 text-base font-medium">{tr("Công nợ cần chú ý")}</h2>
              {view.watch.length === 0 ? (
                <p className="text-sm text-slate-500">{tr("Không có khoản sắp đến hạn hoặc quá hạn.")}</p>
              ) : (
                <ul className="space-y-2">
                  {view.watch.map((d) => {
                    const st = debtUiStatus(d);
                    return (
                      <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-slate-100 px-3 py-2 text-sm">
                        <span>
                          <span className="block font-semibold">{d.partyName}</span>
                          <span className={st === "overdue" ? "text-rose-600" : "text-amber-700"}>
                            {debtUiStatusLabel(st)} · {tr("Hạn")} {formatDate(d.dueDate)}
                          </span>
                        </span>
                        <span className="font-bold tabular-nums">{formatVnd(debtRemain(d))}</span>
                        <Link href="/finance/debts" className="text-sm font-semibold text-emerald-700">
                          {st === "overdue" ? tr("Nhắc nợ") : tr("Thanh toán")}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </section>
          <p className="text-xs text-slate-400">Tiền mặt hiện có {formatVnd(view.cash)}.</p>
        </div>
      ) : null}
    </AppShell>
  );
}
