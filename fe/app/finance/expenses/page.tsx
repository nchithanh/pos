"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DateRangeFilter,
  EmptyBlock,
  KpiCard,
  LoadingBlock,
  PackageBadge,
  SimpleBar,
  Tabs,
  useRangeState,
} from "@/components/finance/widgets";
import { useBooks } from "@/lib/finance/use-books";
import { dateWindow, formatPct } from "@/lib/finance/range";
import { expenseBreakdown, periodSnapshot } from "@/lib/finance/metrics";
import { EXPENSE_CATEGORIES } from "@/lib/finance/model";
import { formatVnd } from "@/lib/utils";
import { notify } from "@/lib/notify";

export default function ExpensesPage() {
  const books = useBooks();
  const range = useRangeState();
  const [tab, setTab] = useState("overview");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState("5");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[2]);
  const bounds = dateWindow(range.range, new Date(), {
    from: range.from,
    to: range.to,
  });
  const snap = useMemo(
    () => periodSnapshot(books.orders, books.finance.txns, bounds),
    [books.orders, books.finance.txns, bounds],
  );
  const breakdown = useMemo(
    () => expenseBreakdown(books.finance.txns, bounds.start, bounds.end),
    [books.finance.txns, bounds],
  );

  return (
    <AppShell>
      <PageHeader
        title="Chi phí"
        description="Chi phí vận hành tách khỏi giá vốn. Giá vốn tính khi bán hàng, không phải mỗi lần tiền ra."
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
          { id: "items", label: "Khoản chi" },
          { id: "recurring", label: "Chi phí định kỳ", badge: "advanced" },
          { id: "cats", label: "Danh mục chi phí" },
        ]}
      />
      {books.loading ? <LoadingBlock /> : null}
      {!books.loading && tab === "overview" ? (
        <div className="space-y-4">
          <div className="flex gap-3 overflow-x-auto">
            <KpiCard
              label="Chi phí vận hành"
              value={formatVnd(snap.opex)}
              delta={snap.delta.spent}
            />
            <KpiCard label="Giá vốn hàng bán" value={formatVnd(snap.cogs)} />
          </div>
          <p className="text-sm text-slate-500">{formatPct(snap.delta.spent)} so với kỳ trước (tiền chi)</p>
          <Card className="p-4">
            <h2 className="mb-2 text-sm font-bold">Cơ cấu chi phí vận hành</h2>
            <SimpleBar data={breakdown} xKey="name" yKey="amount" />
          </Card>
          <Card className="p-4 text-sm">
            <p className="font-semibold">Giá vốn (không gộp vào chi phí mặt bằng)</p>
            <p className="mt-1 text-slate-500">
              {formatVnd(snap.cogs)} — lấy từ giá vốn trên từng dòng đơn hàng.
            </p>
          </Card>
        </div>
      ) : null}
      {!books.loading && tab === "items" ? (
        books.finance.txns.filter((t) => t.kind === "out" && t.profitClass === "opex").length === 0 ? (
          <EmptyBlock text="Chưa có khoản chi vận hành." />
        ) : (
          <ul className="space-y-2">
            {books.finance.txns
              .filter((t) => t.kind === "out" && t.profitClass === "opex")
              .map((t) => (
                <li
                  key={t.id}
                  className="flex justify-between gap-3 rounded-[10px] border border-slate-200 px-3 py-3 text-sm dark:border-slate-700"
                >
                  <span>
                    <span className="block font-semibold">{t.category}</span>
                    <span className="text-slate-500">{t.description}</span>
                  </span>
                  <span className="font-bold">{formatVnd(t.amount)}</span>
                </li>
              ))}
          </ul>
        )
      ) : null}
      {!books.loading && tab === "recurring" ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <PackageBadge tier="advanced" />
            <Button size="sm" onClick={() => setOpen(true)}>
              + Thêm khoản chi định kỳ
            </Button>
          </div>
          <ul className="space-y-2">
            {books.finance.recurring.map((r) => (
              <li
                key={r.id}
                className="rounded-[10px] border border-slate-200 px-3 py-3 text-sm dark:border-slate-700"
              >
                <p className="font-semibold">{r.name}</p>
                <p className="text-slate-500">
                  {formatVnd(r.amount)} / tháng · Ngày {r.dayOfMonth}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {!books.loading && tab === "cats" ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {EXPENSE_CATEGORIES.map((c) => (
            <li
              key={c}
              className="rounded-[10px] border border-slate-200 px-3 py-3 text-sm dark:border-slate-700"
            >
              {c}
            </li>
          ))}
        </ul>
      ) : null}

      <Dialog open={open} onClose={() => setOpen(false)} title="Khoản chi định kỳ">
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-500">Tên</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-500">Số tiền mỗi tháng</span>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-500">Ngày trong tháng</span>
            <Input type="number" min={1} max={28} value={day} onChange={(e) => setDay(e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-500">Danh mục</span>
            <select
              className="min-h-11 w-full rounded-[10px] border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <Button
            className="w-full"
            onClick={() => {
              if (!name.trim() || !(Number(amount) > 0)) {
                notify.error("Nhập tên và số tiền");
                return;
              }
              books.finance.addRecurring({
                name: name.trim(),
                amount: Number(amount),
                dayOfMonth: Math.min(28, Math.max(1, Number(day) || 1)),
                category,
              });
              notify.success("Đã thêm khoản chi định kỳ");
              setOpen(false);
              setName("");
              setAmount("");
            }}
          >
            Lưu
          </Button>
        </div>
      </Dialog>
    </AppShell>
  );
}
