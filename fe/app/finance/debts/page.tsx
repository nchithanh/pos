"use client";

import { tr } from "@/lib/i18n/translate";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EmptyBlock, LoadingBlock, Tabs } from "@/components/finance/widgets";
import { useBooks } from "@/lib/finance/use-books";
import { agingSums, debtAgeBucket, debtRemain, debtUiStatus, debtUiStatusLabel } from "@/lib/finance/metrics";
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
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);

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
        title={tr("Công nợ")}
        description={tr("Phải thu khách và phải trả nhà cung cấp. Thanh toán ghi vào sổ quỹ ngay.")}
      />
      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { id: "overview", label: tr("Tổng quan") },
          { id: "recv", label: tr("Phải thu") },
          { id: "pay", label: tr("Phải trả") },
          { id: "payments", label: tr("Thanh toán") },
          { id: "remind", label: tr("Nhắc nợ") },
        ]}
      />
      {books.loading ? <LoadingBlock /> : null}
      {!books.loading && tab === "overview" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <AgingCard title={tr("Phải thu")} total={recvOpen} rows={recv} />
          <AgingCard title={tr("Phải trả")} total={payOpen} rows={pay} />
        </div>
      ) : null}
      {!books.loading && (tab === "recv" || tab === "pay") ? (
        <DebtTable
          rows={list.filter((d) => {
            if (q && !d.partyName.toLowerCase().includes(q.toLowerCase())) return false;
            if (status !== "all" && debtUiStatus(d) !== status) return false;
            return true;
          })}
          kind={tab}
          q={q}
          setQ={setQ}
          status={status}
          setStatus={setStatus}
          selected={selected}
          setSelected={setSelected}
          onPay={(d) => {
            setPayRow(d);
            setAmount(String(debtRemain(d)));
          }}
          onRemind={(d) => setRemindRow(d)}
          onBulkRemind={() => {
            const targets = list.filter((d) => selected.includes(d.id) && d.type === "receivable");
            if (!targets.length) {
              notify.error(tr("Chọn khoản phải thu để nhắc"));
              return;
            }
            for (const d of targets) {
              books.finance.addReminder({
                debtId: d.id,
                partyName: d.partyName,
                channel,
              });
            }
            notify.success(`Đã tạo ${targets.length} nhắc nợ`);
            setSelected([]);
          }}
        />
      ) : null}
      {!books.loading && tab === "payments" ? (
        payments.length === 0 ? (
          <EmptyBlock text={tr("Chưa có lần thanh toán công nợ trong sổ quỹ.")} />
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
          <EmptyBlock text={tr("Chưa tạo nhắc nợ. Dùng nút Nhắc khách ở tab Phải thu.")} />
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

      <Dialog open={!!payRow} onClose={() => setPayRow(null)} title={tr("Thanh toán công nợ")}>
        {payRow ? (
          <div className="space-y-3 text-sm">
            <p className="font-semibold">{payRow.partyName}</p>
            <p>{tr("Còn lại")} {formatVnd(debtRemain(payRow))}</p>
            <label className="block">
              <span className="mb-1 block text-slate-500">{tr("Số tiền")}</span>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-slate-500">{tr("Tài khoản")}</span>
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
                    notify.success(tr("Đã ghi nhận thanh toán"));
                    setPayRow(null);
                  })
                  .catch((e: unknown) =>
                    notify.error(e instanceof Error ? e.message : tr("Không thanh toán được")),
                  );
              }}
            >
              {tr("Xác nhận")}
            </Button>
          </div>
        ) : null}
      </Dialog>

      <Dialog open={!!remindRow} onClose={() => setRemindRow(null)} title={tr("Nhắc khách")}>
        {remindRow ? (
          <div className="space-y-3">
            <p className="text-sm">{remindRow.partyName}</p>
            <fieldset>
              <legend className="mb-2 text-sm text-slate-500">{tr("Kênh")}</legend>
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
                notify.success(tr("Đã tạo nhắc nợ"));
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

function AgingCard({ title, total, rows }: { title: string; total: number; rows: Debt[] }) {
  const aging = agingSums(rows);
  const items = [
    { id: "current", label: tr("Chưa đến hạn"), amount: aging.current },
    { id: "d30", label: tr("1–30 ngày"), amount: aging.d30 },
    { id: "d60", label: tr("31–60 ngày"), amount: aging.d60 },
    { id: "d60p", label: tr("Trên 60 ngày"), amount: aging.d60p },
  ];
  return (
    <Card className="p-4 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-2xl font-bold tabular-nums">{formatVnd(total)}</p>
      <ul className="mt-3 space-y-1 text-sm">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between">
            <span className={item.id === "d60p" ? "text-rose-600" : "text-slate-500"}>{item.label}</span>
            <span className="tabular-nums">{formatVnd(item.amount)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function DebtTable({
  rows,
  kind,
  q,
  setQ,
  status,
  setStatus,
  selected,
  setSelected,
  onPay,
  onRemind,
  onBulkRemind,
}: {
  rows: Debt[];
  kind: string;
  q: string;
  setQ: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  selected: string[];
  setSelected: (v: string[]) => void;
  onPay: (d: Debt) => void;
  onRemind: (d: Debt) => void;
  onBulkRemind: () => void;
}) {
  if (!rows.length && !q && status === "all") return <EmptyBlock text={tr("Chưa có khoản công nợ.")} />;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr("Tìm khách hoặc nhà cung cấp")} aria-label={tr("Tìm công nợ")} className="max-w-xs" />
        <select
          className="min-h-11 rounded-[10px] border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          value={status}
          aria-label={tr("Trạng thái")}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">{tr("Mọi trạng thái")}</option>
          <option value="overdue">{tr("Quá hạn")}</option>
          <option value="due_soon">{tr("Sắp đến hạn")}</option>
          <option value="not_due">{tr("Chưa đến hạn")}</option>
          <option value="partial">{tr("Đã thanh toán một phần")}</option>
          <option value="paid">{tr("Đã thanh toán")}</option>
        </select>
        {kind === "recv" && selected.length > 0 ? (
          <Button size="sm" variant="outline" onClick={onBulkRemind}>
            Gửi nhắc nợ ({selected.length})
          </Button>
        ) : null}
      </div>
      <div className="max-h-[70vh] overflow-auto rounded-[10px] border border-slate-200">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-3">
                <input
                  type="checkbox"
                  aria-label={tr("Chọn tất cả")}
                  checked={rows.length > 0 && rows.every((d) => selected.includes(d.id))}
                  onChange={(e) => setSelected(e.target.checked ? rows.map((d) => d.id) : [])}
                />
              </th>
              <th className="px-3 py-3">{kind === "pay" ? tr("Nhà cung cấp") : tr("Khách hàng")}</th>
              <th className="px-3 py-3 text-right">{tr("Tổng nợ")}</th>
              <th className="px-3 py-3 text-right">{tr("Đã thu")}</th>
              <th className="px-3 py-3 text-right">{tr("Còn lại")}</th>
              <th className="px-3 py-3">{tr("Ngày đến hạn")}</th>
              <th className="px-3 py-3">{tr("Trạng thái")}</th>
              <th className="px-3 py-3">{tr("Thao tác")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => {
              const st = debtUiStatus(d);
              const bucket = debtAgeBucket(d);
              return (
                <tr key={d.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      aria-label={`Chọn ${d.partyName}`}
                      checked={selected.includes(d.id)}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked ? [...selected, d.id] : selected.filter((id) => id !== d.id),
                        )
                      }
                    />
                  </td>
                  <td className="px-3 py-2 font-semibold">{d.partyName}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatVnd(d.amount)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatVnd(d.paidAmount)}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatVnd(debtRemain(d))}</td>
                  <td className="px-3 py-2">{formatDate(d.dueDate)}</td>
                  <td className="px-3 py-2">
                    <span className={st === "overdue" || bucket === "d60p" ? "font-semibold text-rose-600" : st === "due_soon" ? "font-semibold text-amber-700" : ""}>
                      {debtUiStatusLabel(st)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      {debtRemain(d) > 0 ? (
                        <Button size="sm" onClick={() => onPay(d)}>
                          {tr("Thanh toán")}
                        </Button>
                      ) : null}
                      {d.type === "receivable" && debtRemain(d) > 0 ? (
                        <Button size="sm" variant="outline" onClick={() => onRemind(d)}>
                          {tr("Nhắc nợ")}
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
