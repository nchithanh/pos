"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  CashflowChart,
  DateRangeFilter,
  ErrorBlock,
  KpiCard,
  LoadingBlock,
  useRangeState,
} from "@/components/finance/widgets";
import { useBooks } from "@/lib/finance/use-books";
import { dateWindow } from "@/lib/finance/range";
import {
  balancesOf,
  cashflowSeries,
  debtRemain,
  debtUiStatus,
  periodSnapshot,
} from "@/lib/finance/metrics";
import { formatDateTime, formatVnd } from "@/lib/utils";

type Activity = {
  id: string;
  at: string;
  amount: number;
  title: string;
  meta: string;
  positive: boolean;
};

export default function FinanceOverviewPage() {
  const books = useBooks();
  const range = useRangeState();
  const [picked, setPicked] = useState<Activity | null>(null);

  const view = useMemo(() => {
    try {
      const bounds = dateWindow(range.range, new Date(), {
        from: range.from,
        to: range.to,
      });
      const snap = periodSnapshot(
        books.orders,
        books.finance.txns,
        bounds,
      );
      const money = balancesOf(books.finance.accounts, books.finance.txns);
      const cash = money.filter((a) => a.type === "cash").reduce((s, a) => s + a.balance, 0);
      const bank = money.filter((a) => a.type === "bank").reduce((s, a) => s + a.balance, 0);
      const wallet = money
        .filter((a) => a.type === "ewallet")
        .reduce((s, a) => s + a.balance, 0);
      const other = money
        .filter((a) => a.type === "other")
        .reduce((s, a) => s + a.balance, 0);
      const openDebts = books.debts.filter((d) => debtRemain(d) > 0);
      const recv = openDebts.filter((d) => d.type === "receivable");
      const pay = openDebts.filter((d) => d.type === "payable");
      const countStatus = (rows: typeof openDebts, label: string) =>
        rows.filter((d) => debtUiStatus(d) === label).length;
      const chart = cashflowSeries(books.orders, books.finance.txns, 30);
      const activities: Activity[] = [
        ...books.orders
          .filter((o) => o.status !== "void")
          .map((o) => ({
            id: o.id,
            at: o.createdAt,
            amount: o.status === "debt" ? 0 : o.total,
            title: `Bán hàng #${o.code}`,
            meta: o.paymentMethod === "cash" ? "Tiền mặt" : o.customerName || "Thu ngân",
            positive: o.status !== "debt",
          })),
        ...books.finance.txns
          .filter((t) => t.source !== "sale" && t.kind !== "transfer")
          .map((t) => ({
            id: t.id,
            at: t.at,
            amount: t.amount,
            title: t.description,
            meta: t.party || t.category,
            positive: t.kind === "in",
          })),
      ]
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 8);

      const overdueCustomers = countStatus(recv, "Quá hạn");
      const expenseUp = snap.delta.spent > 10;
      const cashLow = cash < (books.finance.alerts.find((a) => a.kind === "low_cash")?.threshold ?? 5_000_000);
      const alerts = [
        overdueCustomers
          ? { tone: "warn" as const, text: `${overdueCustomers} khách hàng quá hạn thanh toán` }
          : null,
        countStatus(pay, "Sắp đến hạn")
          ? {
              tone: "warn" as const,
              text: `${countStatus(pay, "Sắp đến hạn")} khoản phải trả nhà cung cấp sắp đến hạn`,
            }
          : null,
        expenseUp
          ? {
              tone: "warn" as const,
              text: `Chi phí kỳ này ${snap.delta.spent > 0 ? "tăng" : "giảm"} so với kỳ trước`,
            }
          : null,
        cashLow
          ? { tone: "warn" as const, text: "Tiền mặt tại cửa hàng thấp hơn mức tối thiểu" }
          : null,
        snap.delta.revenue > 0
          ? {
              tone: "ok" as const,
              text: `Doanh thu kỳ này tăng ${Math.abs(snap.delta.revenue).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`,
            }
          : {
              tone: "warn" as const,
              text: "Doanh thu kỳ này chưa tăng so với kỳ trước",
            },
      ].filter(Boolean) as { tone: "warn" | "ok"; text: string }[];

      return {
        snap,
        cash,
        bank,
        wallet,
        other,
        total: cash + bank + wallet + other,
        recvSum: recv.reduce((s, d) => s + debtRemain(d), 0),
        paySum: pay.reduce((s, d) => s + debtRemain(d), 0),
        recvParties: new Set(recv.map((d) => d.partyId)).size,
        payParties: new Set(pay.map((d) => d.partyId)).size,
        recvOver: countStatus(recv, "Quá hạn"),
        recvSoon: countStatus(recv, "Sắp đến hạn"),
        payOver: countStatus(pay, "Quá hạn"),
        paySoon: countStatus(pay, "Sắp đến hạn"),
        chart,
        activities,
        alerts,
        ok: true as const,
      };
    } catch (e) {
      return {
        ok: false as const,
        error: e instanceof Error ? e.message : "Không tải được số liệu",
      };
    }
  }, [books, range.range, range.from, range.to]);

  return (
    <AppShell>
      <PageHeader
        title="Tài chính"
        description="Theo dõi doanh thu, dòng tiền, công nợ và lợi nhuận của cửa hàng."
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
      {!books.loading && !view.ok ? <ErrorBlock text={view.error} /> : null}

      {!books.loading && view.ok ? (
        <div className="space-y-6">
          <div className="flex gap-3 overflow-x-auto pb-1 lg:grid lg:grid-cols-4 lg:overflow-visible">
            <KpiCard label="Doanh thu" value={formatVnd(view.snap.revenue)} delta={view.snap.delta.revenue} />
            <KpiCard label="Tiền đã thu" value={formatVnd(view.snap.collected)} delta={view.snap.delta.collected} />
            <KpiCard label="Tiền đã chi" value={formatVnd(view.snap.spent)} delta={view.snap.delta.spent} />
            <KpiCard label="Lợi nhuận" value={formatVnd(view.snap.profit)} delta={view.snap.delta.profit} />
          </div>

          <section aria-labelledby="money-now">
            <h2 id="money-now" className="mb-3 text-base font-bold">
              Tiền hiện có
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Tiền mặt", view.cash],
                ["Ngân hàng", view.bank],
                ["Ví điện tử", view.wallet],
                ["Tổng", view.total],
              ].map(([label, amount]) => (
                <Link key={String(label)} href="/finance/accounts">
                  <Card className="p-4 transition hover:border-emerald-300">
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-1 text-lg font-bold">{formatVnd(Number(amount))}</p>
                    <p className="mt-1 text-xs text-slate-400">Xem sổ quỹ</p>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          <section className="grid gap-3 lg:grid-cols-2" aria-label="Công nợ">
            <Card className="p-4">
              <h2 className="text-base font-bold">Phải thu</h2>
              <p className="mt-1 text-2xl font-bold">{formatVnd(view.recvSum)}</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-500">
                <li>{view.recvParties} khách hàng</li>
                <li>{view.recvOver} khoản quá hạn</li>
                <li>{view.recvSoon} khoản đến hạn trong 7 ngày</li>
              </ul>
              <Link
                href="/finance/debts"
                className="mt-4 inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 text-sm font-semibold"
              >
                Xem công nợ
              </Link>
            </Card>
            <Card className="p-4">
              <h2 className="text-base font-bold">Phải trả</h2>
              <p className="mt-1 text-2xl font-bold">{formatVnd(view.paySum)}</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-500">
                <li>{view.payParties} nhà cung cấp</li>
                <li>{view.payOver} khoản quá hạn</li>
                <li>{view.paySoon} khoản đến hạn trong 7 ngày</li>
              </ul>
              <Link
                href="/finance/debts"
                className="mt-4 inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 text-sm font-semibold"
              >
                Xem công nợ
              </Link>
            </Card>
          </section>

          <section aria-labelledby="cf-heading">
            <h2 id="cf-heading" className="mb-3 text-base font-bold">
              Dòng tiền 30 ngày
            </h2>
            <Card className="p-4">
              <CashflowChart data={view.chart} />
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div>
              <h2 className="mb-3 text-base font-bold">Giao dịch gần đây</h2>
              {view.activities.length === 0 ? (
                <p className="text-sm text-slate-500">Chưa có giao dịch.</p>
              ) : (
                <ul className="space-y-2">
                  {view.activities.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        className="flex w-full min-h-11 items-center justify-between gap-3 rounded-[10px] border border-slate-200 px-3 py-2 text-left dark:border-slate-700"
                        onClick={() => setPicked(a)}
                      >
                        <span>
                          <span
                            className={
                              a.positive ? "font-bold text-emerald-600" : "font-bold text-rose-600"
                            }
                          >
                            {a.positive ? "+" : "−"}
                            {formatVnd(a.amount)}
                          </span>
                          <span className="mt-0.5 block text-sm">{a.title}</span>
                        </span>
                        <span className="text-right text-xs text-slate-500">
                          {a.meta}
                          <span className="mt-0.5 block">
                            {formatDateTime(a.at).slice(11, 16)}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h2 className="mb-3 text-base font-bold">Cảnh báo tài chính</h2>
              <ul className="space-y-2">
                {view.alerts.map((a) => (
                  <li
                    key={a.text}
                    className={
                      a.tone === "ok"
                        ? "rounded-[10px] bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
                        : "rounded-[10px] bg-amber-50 px-3 py-2 text-sm text-amber-900"
                    }
                  >
                    {a.tone === "ok" ? "✓" : "⚠"} {a.text}
                  </li>
                ))}
              </ul>
              <Link
                href="/finance/alerts"
                className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-emerald-700"
              >
                Cấu hình cảnh báo
              </Link>
            </div>
          </section>
        </div>
      ) : null}

      <Dialog
        open={!!picked}
        onClose={() => setPicked(null)}
        title="Chi tiết giao dịch"
      >
        {picked ? (
          <div className="space-y-2 text-sm">
            <p className="text-lg font-bold">
              {picked.positive ? "+" : "−"}
              {formatVnd(picked.amount)}
            </p>
            <p>{picked.title}</p>
            <p className="text-slate-500">{picked.meta}</p>
            <p className="text-slate-500">{formatDateTime(picked.at)}</p>
            <Button className="mt-2 w-full" variant="outline" onClick={() => setPicked(null)}>
              Đóng
            </Button>
          </div>
        ) : null}
      </Dialog>
    </AppShell>
  );
}
