"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { payDebt } from "@/lib/services/debts";
import { formatDate, formatVnd } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import type { DebtType } from "@/types";

export default function DebtPage() {
  const debts = useLiveQuery(() => db.debts.toArray()) ?? [];
  const user = useAuthStore((s) => s.user);
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
      <PageHeader title="Công nợ" description="Phải thu / phải trả · thanh toán ghi IndexedDB" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4"><p className="text-sm text-slate-500">Phải thu</p><p className="text-xl font-bold">{formatVnd(summary.receivable)}</p></Card>
        <Card className="p-4"><p className="text-sm text-slate-500">Phải trả</p><p className="text-xl font-bold">{formatVnd(summary.payable)}</p></Card>
        <Card className="p-4"><p className="text-sm text-slate-500">Quá hạn</p><p className="text-xl font-bold text-rose-600">{formatVnd(summary.overdue)}</p></Card>
      </div>
      <div className="mt-4 flex gap-2 rounded-[12px] bg-white p-1 dark:bg-slate-900">
        {([["receivable", "Phải thu"], ["payable", "Phải trả"]] as const).map(([id, label]) => (
          <button key={id} type="button" className={`flex-1 rounded-[10px] py-2.5 text-sm font-semibold ${tab === id ? "bg-emerald-500 text-white" : "text-slate-500"}`} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {list.map((d) => {
          const remain = d.amount - d.paidAmount;
          return (
            <Card key={d.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{d.partyName}</p>
                  <p className="text-xs text-slate-500">Hạn {formatDate(d.dueDate)} · {d.note}</p>
                </div>
                <Badge status={d.status} />
              </div>
              <p className="mt-2 text-lg font-bold">{formatVnd(remain)}</p>
              {remain > 0 ? (
                <Button className="mt-3 w-full" size="sm" onClick={() => { setPayId(d.id); setAmount(String(remain)); }}>
                  Thanh toán
                </Button>
              ) : null}
            </Card>
          );
        })}
      </div>
      <Dialog open={!!payId} onClose={() => setPayId(null)} title="Thanh toán công nợ">
        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Button
          className="mt-4 w-full"
          onClick={async () => {
            if (!user || !payId) return;
            try {
              await payDebt({ debtId: payId, amount: Number(amount) || 0, method: "transfer", user });
              toast.success("Đã ghi nhận thanh toán");
              setPayId(null);
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Lỗi");
            }
          }}
        >
          Xác nhận
        </Button>
      </Dialog>
    </AppShell>
  );
}
