"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EmptyBlock, LoadingBlock, Tabs } from "@/components/finance/widgets";
import { useBooks } from "@/lib/finance/use-books";
import { debtRemain, debtUiStatus } from "@/lib/finance/metrics";
import { payDebt } from "@/lib/services/debts";
import { useAuthStore } from "@/stores/auth-store";
import { formatDate, formatVnd } from "@/lib/utils";
import { notify } from "@/lib/notify";
import type { Debt } from "@/types";

export default function FinanceDebtsPage() {
  const books = useBooks();
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState("overview");
  const [payRow, setPayRow] = useState<Debt | null>(null);
  const [remindRow, setRemindRow] = useState<Debt | null>(null);
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("acc_cash");
  const [channel, setChannel] = useState<"zalo" | "sms" | "email">("zalo");

  const recv = books.debts.filter((d) => d.type === "receivable");
  const pay = books.debts.filter((d) => d.type === "payable");
  const recvOpen = recv.reduce((s, d) => s + debtRemain(d), 0);
  const payOpen = pay.reduce((s, d) => s + debtRemain(d), 0);

  const list = tab === "pay" ? pay : recv;

  const payments = useMemo(() => books.finance.txns.filter((t) => t.source === "debt"), [books.finance.txns]);

  const methodOf = (id: string) =>
    id === "acc_vcb" || id === "acc_mb" ? "transfer" : id === "acc_momo" ? "qr" : "cash";

  return (
    <AppShell>
      <PageHeader
        title="Công nợ"
        description="Phải thu khách và phải trả nhà cung cấp. Thanh toán ghi vào sổ quỹ ngay."
      />
      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { id: "overview", label: "Tổng quan" },
          { id: "recv", label: "Phải thu" },
          { id: "pay", label: "Phải trả" },
          { id: "payments", label: "Thanh toán" },
          { id: "remind", label: "Nhắc nợ" },
        ]}
      />
      {books.loading ? <LoadingBlock /> : null}
      {!books.loading && tab === "overview" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="p-4">
            <p className="text-sm text-slate-500">Phải thu</p>
            <p className="text-2xl font-bold">{formatVnd(recvOpen)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-slate-500">Phải trả</p>
            <p className="text-2xl font-bold">{formatVnd(payOpen)}</p>
          </Card>
        </div>
      ) : null}
      {!books.loading && (tab === "recv" || tab === "pay") ? (
        list.length === 0 ? (
          <EmptyBlock text="Chưa có khoản công nợ." />
        ) : (
          <ul className="space-y-2">
            {list.map((d) => (
              <li
                key={d.id}
                className="rounded-[10px] border border-slate-200 p-3 text-sm dark:border-slate-700"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{d.partyName}</p>
                    <p className="text-slate-500">{d.note}</p>
                    <p className="text-xs text-slate-400">
                      Hạn {formatDate(d.dueDate)} · {debtUiStatus(d)}
                    </p>
                  </div>
                  <p className="font-bold">{formatVnd(debtRemain(d))}</p>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {debtRemain(d) > 0 ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        setPayRow(d);
                        setAmount(String(debtRemain(d)));
                      }}
                    >
                      Thanh toán
                    </Button>
                  ) : null}
                  {d.type === "receivable" ? (
                    <Button size="sm" variant="outline" onClick={() => setRemindRow(d)}>
                      Nhắc khách
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )
      ) : null}
      {!books.loading && tab === "payments" ? (
        payments.length === 0 ? (
          <EmptyBlock text="Chưa có lần thanh toán công nợ trong sổ quỹ." />
        ) : (
          <ul className="space-y-2 text-sm">
            {payments.map((t) => (
              <li key={t.id} className="rounded-[10px] border border-slate-200 px-3 py-3">
                <p className="font-semibold">
                  {t.kind === "in" ? "+" : "−"}
                  {formatVnd(t.amount)} · {t.party}
                </p>
                <p className="text-slate-500">{t.description}</p>
              </li>
            ))}
          </ul>
        )
      ) : null}
      {!books.loading && tab === "remind" ? (
        books.finance.reminders.length === 0 ? (
          <EmptyBlock text="Chưa tạo nhắc nợ. Dùng nút Nhắc khách ở tab Phải thu." />
        ) : (
          <ul className="space-y-2 text-sm">
            {books.finance.reminders.map((r) => (
              <li key={r.id} className="rounded-[10px] border border-slate-200 px-3 py-3">
                ✓ Đã tạo nhắc nợ · {r.partyName} · {r.channel.toUpperCase()}
              </li>
            ))}
          </ul>
        )
      ) : null}

      <Dialog open={!!payRow} onClose={() => setPayRow(null)} title="Thanh toán công nợ">
        {payRow ? (
          <div className="space-y-3 text-sm">
            <p className="font-semibold">{payRow.partyName}</p>
            <p>Còn lại {formatVnd(debtRemain(payRow))}</p>
            <label className="block">
              <span className="mb-1 block text-slate-500">Số tiền</span>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-slate-500">Tài khoản</span>
              <select
                className="min-h-11 w-full rounded-[10px] border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-900"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              >
                {books.finance.accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            <Button
              className="w-full"
              onClick={() => {
                if (!user || !payRow) return;
                void payDebt({
                  debtId: payRow.id,
                  amount: Number(amount) || 0,
                  method: methodOf(accountId) as "cash",
                  user,
                })
                  .then(() => {
                    notify.success("Đã ghi nhận thanh toán");
                    setPayRow(null);
                  })
                  .catch((e: unknown) =>
                    notify.error(e instanceof Error ? e.message : "Không thanh toán được"),
                  );
              }}
            >
              Xác nhận
            </Button>
          </div>
        ) : null}
      </Dialog>

      <Dialog open={!!remindRow} onClose={() => setRemindRow(null)} title="Nhắc khách">
        {remindRow ? (
          <div className="space-y-3">
            <p className="text-sm">{remindRow.partyName}</p>
            <fieldset>
              <legend className="mb-2 text-sm text-slate-500">Kênh</legend>
              <div className="flex gap-2">
                {(["zalo", "sms", "email"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`min-h-11 flex-1 rounded-full border text-sm font-semibold ${channel === c ? "border-emerald-500 bg-emerald-50" : "border-slate-200"}`}
                    onClick={() => setChannel(c)}
                  >
                    {c === "zalo" ? "Zalo" : c === "sms" ? "SMS" : "Email"}
                  </button>
                ))}
              </div>
            </fieldset>
            <Button
              className="w-full"
              onClick={() => {
                books.finance.addReminder({
                  debtId: remindRow.id,
                  partyName: remindRow.partyName,
                  channel,
                });
                notify.success("Đã tạo nhắc nợ");
                setRemindRow(null);
              }}
            >
              Tạo nhắc nợ
            </Button>
          </div>
        ) : null}
      </Dialog>
    </AppShell>
  );
}
