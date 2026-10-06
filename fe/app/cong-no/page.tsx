"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatVnd } from "@/lib/format";
import type { DebtType } from "@/lib/types";
import { usePosStore } from "@/store/usePosStore";

export default function DebtPage() {
  const debts = usePosStore((s) => s.debts);
  const payDebt = usePosStore((s) => s.payDebt);
  const [tab, setTab] = useState<DebtType>("receivable");
  const [payId, setPayId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  const summary = useMemo(() => {
    const receivable = debts
      .filter((d) => d.type === "receivable" && d.status !== "paid")
      .reduce((s, d) => s + (d.amount - d.paidAmount), 0);
    const payable = debts
      .filter((d) => d.type === "payable" && d.status !== "paid")
      .reduce((s, d) => s + (d.amount - d.paidAmount), 0);
    const overdue = debts
      .filter((d) => d.status === "overdue")
      .reduce((s, d) => s + (d.amount - d.paidAmount), 0);
    return { receivable, payable, overdue };
  }, [debts]);

  const list = debts.filter((d) => d.type === tab);

  return (
    <AppShell>
      <PageHeader
        title="Công nợ"
        description="Theo dõi phải thu / phải trả và thanh toán nhanh"
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Tổng phải thu" value={formatVnd(summary.receivable)} tone="sky" />
        <StatCard label="Tổng phải trả" value={formatVnd(summary.payable)} tone="amber" />
        <StatCard label="Quá hạn" value={formatVnd(summary.overdue)} tone="rose" />
      </div>

      <div className="mt-4 flex gap-2 rounded-[12px] bg-white p-1 shadow-sm">
        {(
          [
            ["receivable", "Phải thu"],
            ["payable", "Phải trả"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`flex-1 rounded-[10px] py-2.5 text-sm font-semibold ${
              tab === id
                ? "bg-[var(--pos-green)] text-white"
                : "text-slate-500"
            }`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3 md:hidden">
        {list.map((d) => {
          const remain = d.amount - d.paidAmount;
          return (
            <article key={d.id} className="pos-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{d.partyName}</p>
                  <p className="text-xs text-slate-500">
                    Hạn {formatDate(d.dueDate)}
                  </p>
                </div>
                <StatusBadge status={d.status} />
              </div>
              <p className="mt-2 text-lg font-bold">{formatVnd(remain)}</p>
              <p className="text-xs text-slate-500">{d.note}</p>
              {remain > 0 ? (
                <button
                  type="button"
                  className="pos-btn pos-btn-primary mt-3 w-full !min-h-10"
                  onClick={() => {
                    setPayId(d.id);
                    setAmount(String(remain));
                  }}
                >
                  Thanh toán
                </button>
              ) : null}
            </article>
          );
        })}
      </div>

      <div className="pos-card mt-4 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-[var(--pos-border)] bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Đối tượng</th>
              <th className="px-4 py-3 font-semibold">Số tiền còn lại</th>
              <th className="px-4 py-3 font-semibold">Ngày đến hạn</th>
              <th className="px-4 py-3 font-semibold">Trạng thái</th>
              <th className="px-4 py-3 font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {list.map((d) => {
              const remain = d.amount - d.paidAmount;
              return (
                <tr key={d.id} className="border-b border-[var(--pos-border)] last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{d.partyName}</p>
                    <p className="text-xs text-slate-400">{d.note}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatVnd(remain)}</td>
                  <td className="px-4 py-3">{formatDate(d.dueDate)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="px-4 py-3">
                    {remain > 0 ? (
                      <button
                        type="button"
                        className="pos-btn pos-btn-primary !min-h-9 !px-3 text-xs"
                        onClick={() => {
                          setPayId(d.id);
                          setAmount(String(remain));
                        }}
                      >
                        Thanh toán
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {payId ? (
        <div className="pos-modal-backdrop" role="dialog" aria-modal="true">
          <div className="pos-modal p-5">
            <h2 className="text-lg font-bold">Thanh toán công nợ</h2>
            <label className="mt-4 block">
              <span className="pos-label">Số tiền</span>
              <input
                type="number"
                className="pos-input pos-input-rect"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className="pos-btn pos-btn-outline flex-1"
                onClick={() => setPayId(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="pos-btn pos-btn-primary flex-1"
                onClick={() => {
                  payDebt(payId, Number(amount) || 0);
                  setPayId(null);
                }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
