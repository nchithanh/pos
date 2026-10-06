"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EmptyBlock, LoadingBlock, Tabs } from "@/components/finance/widgets";
import { useBooks } from "@/lib/finance/use-books";
import { balancesOf } from "@/lib/finance/metrics";
import type { AccountType } from "@/lib/finance/model";
import { formatDateTime, formatVnd } from "@/lib/utils";
import { notify } from "@/lib/notify";

const TYPES: { id: AccountType | "all"; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "cash", label: "Tiền mặt" },
  { id: "bank", label: "Ngân hàng" },
  { id: "ewallet", label: "Ví điện tử" },
  { id: "other", label: "Tài khoản khác" },
];

export default function AccountsPage() {
  const books = useBooks();
  const [tab, setTab] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("bank");
  const [opening, setOpening] = useState("");
  const rows = balancesOf(books.finance.accounts, books.finance.txns).filter(
    (a) => tab === "all" || a.type === tab,
  );
  const current = rows.find((a) => a.id === selected) ?? null;
  const txns = books.finance.txns.filter(
    (t) => t.accountId === selected || t.counterAccountId === selected,
  );

  return (
    <AppShell>
      <PageHeader
        title="Quỹ & Tài khoản"
        description="Tiền mặt, ngân hàng và ví. Số dư gồm số đầu kỳ cộng các phiếu thu, chi và chuyển tiền."
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            + Thêm tài khoản
          </Button>
        }
      />
      <Tabs
        value={tab}
        onChange={(v) => {
          setTab(v);
          setSelected(null);
        }}
        options={TYPES.map((t) => ({ id: t.id, label: t.label }))}
      />
      {books.loading ? <LoadingBlock /> : null}
      {!books.loading && rows.length === 0 ? (
        <EmptyBlock text="Chưa có tài khoản trong nhóm này." />
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((a) => (
          <button key={a.id} type="button" className="text-left" onClick={() => setSelected(a.id)}>
            <Card className="p-4 hover:border-emerald-300">
              <p className="text-sm text-slate-500">{a.name}</p>
              <p className="text-xl font-bold">{formatVnd(a.balance)}</p>
              <p className="mt-1 text-xs text-slate-400">
                Số dư đầu {formatVnd(a.openingBalance)} · {a.active ? "Đang dùng" : "Ngưng"}
              </p>
            </Card>
          </button>
        ))}
      </div>
      {current ? (
        <section className="mt-4">
          <h2 className="mb-2 text-sm font-bold">Giao dịch · {current.name}</h2>
          {txns.length === 0 ? (
            <EmptyBlock text="Chưa có phiếu trên tài khoản này." />
          ) : (
            <ul className="space-y-2 text-sm">
              {txns.map((t) => (
                <li key={t.id} className="rounded-[10px] border border-slate-200 px-3 py-2">
                  <p className="font-semibold">
                    {t.kind === "out" || (t.kind === "transfer" && t.accountId === current.id)
                      ? "−"
                      : "+"}
                    {formatVnd(t.amount)} · {t.description}
                  </p>
                  <p className="text-xs text-slate-500">{formatDateTime(t.at)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <Dialog open={open} onClose={() => setOpen(false)} title="Thêm tài khoản">
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-500">Tên</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: ACB" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-500">Loại</span>
            <select
              className="min-h-11 w-full rounded-[10px] border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
            >
              <option value="cash">Tiền mặt</option>
              <option value="bank">Ngân hàng</option>
              <option value="ewallet">Ví điện tử</option>
              <option value="other">Khác</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-500">Số dư đầu</span>
            <Input type="number" value={opening} onChange={(e) => setOpening(e.target.value)} />
          </label>
          <Button
            className="w-full"
            onClick={() => {
              if (!name.trim()) {
                notify.error("Nhập tên tài khoản");
                return;
              }
              books.finance.addAccount({
                name,
                type,
                openingBalance: Number(opening) || 0,
              });
              notify.success("Đã thêm tài khoản");
              setOpen(false);
              setName("");
              setOpening("");
            }}
          >
            Lưu
          </Button>
        </div>
      </Dialog>
    </AppShell>
  );
}
