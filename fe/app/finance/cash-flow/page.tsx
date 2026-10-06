"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  EmptyBlock,
  LoadingBlock,
  PackageBadge,
  Tabs,
} from "@/components/finance/widgets";
import { useBooks } from "@/lib/finance/use-books";
import {
  EXPENSE_CATEGORIES,
  INCOME_TYPES,
  type FinanceTxn,
} from "@/lib/finance/model";
import { accountBalance } from "@/stores/finance-store";
import { useAuthStore } from "@/stores/auth-store";
import { formatDateTime, formatVnd } from "@/lib/utils";
import { notify } from "@/lib/notify";

type Tab = "all" | "in" | "out" | "transfer" | "recon";

export default function CashFlowPage() {
  const books = useBooks();
  const user = useAuthStore((s) => s.user);
  const shift = useAuthStore((s) => s.shift);
  const [tab, setTab] = useState<Tab>("all");
  const [modal, setModal] = useState<"in" | "out" | "transfer" | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [kind, setKind] = useState<"all" | "in" | "out">("all");
  const [accountId, setAccountId] = useState("all");
  const [category, setCategory] = useState("all");
  const [staff, setStaff] = useState("all");
  const [picked, setPicked] = useState<FinanceTxn | null>(null);

  const [inType, setInType] = useState<string>(INCOME_TYPES[0]);
  const [outCat, setOutCat] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [acc, setAcc] = useState("acc_cash");
  const [accTo, setAccTo] = useState("acc_vcb");
  const [party, setParty] = useState("");
  const [note, setNote] = useState("");
  const [fileName, setFileName] = useState("");
  const [reason, setReason] = useState("");

  const accounts = books.finance.accounts.filter((a) => a.active);

  const rows = useMemo(() => {
    return books.finance.txns.filter((t) => {
      if (tab === "in" && t.kind !== "in") return false;
      if (tab === "out" && t.kind !== "out") return false;
      if (tab === "transfer" && t.kind !== "transfer") return false;
      if (tab === "all" || tab === "recon") {
        if (kind === "in" && t.kind !== "in") return false;
        if (kind === "out" && t.kind !== "out") return false;
      }
      if (accountId !== "all" && t.accountId !== accountId && t.counterAccountId !== accountId) {
        return false;
      }
      if (category !== "all" && t.category !== category) return false;
      if (staff !== "all" && t.createdBy !== staff) return false;
      return true;
    });
  }, [books.finance.txns, tab, kind, accountId, category, staff]);

  const staffNames = [...new Set(books.finance.txns.map((t) => t.createdBy))];

  const resetForm = () => {
    setAmount("");
    setParty("");
    setNote("");
    setFileName("");
  };

  const saveIn = () => {
    const value = Number(amount) || 0;
    if (value <= 0) {
      notify.error("Nhập số tiền");
      return;
    }
    books.finance.addTxn({
      at: new Date().toISOString(),
      kind: "in",
      category: inType,
      description: note || inType,
      accountId: acc,
      amount: value,
      createdBy: user?.name ?? "Chủ cửa hàng",
      method: acc === "acc_cash" ? "cash" : "transfer",
      party,
      source: "manual",
      profitClass: "none",
      attachmentName: fileName || undefined,
    });
    notify.success("Đã ghi phiếu thu");
    setModal(null);
    resetForm();
  };

  const saveOut = () => {
    const value = Number(amount) || 0;
    if (value <= 0) {
      notify.error("Nhập số tiền");
      return;
    }
    const bal = accountBalance(books.finance.accounts, books.finance.txns, acc);
    if (value > bal) {
      notify.error("Số dư tài khoản không đủ");
      return;
    }
    const opex = ![
      "Nhập hàng",
      "Trả công nợ NCC",
    ].includes(outCat);
    books.finance.addTxn({
      at: new Date().toISOString(),
      kind: "out",
      category: outCat,
      description: note || outCat,
      accountId: acc,
      amount: value,
      createdBy: user?.name ?? "Chủ cửa hàng",
      party,
      source: "manual",
      profitClass: opex ? "opex" : "none",
      attachmentName: fileName || undefined,
    });
    notify.success("Đã ghi phiếu chi");
    setModal(null);
    resetForm();
  };

  const saveTransfer = () => {
    const value = Number(amount) || 0;
    if (value <= 0) {
      notify.error("Nhập số tiền");
      return;
    }
    if (acc === accTo) {
      notify.error("Chọn hai tài khoản khác nhau");
      return;
    }
    const bal = accountBalance(books.finance.accounts, books.finance.txns, acc);
    if (value > bal) {
      notify.error("Số dư tài khoản nguồn không đủ");
      return;
    }
    books.finance.addTxn({
      at: new Date().toISOString(),
      kind: "transfer",
      category: "Chuyển tiền",
      description: note || "Chuyển tiền nội bộ",
      accountId: acc,
      counterAccountId: accTo,
      amount: value,
      createdBy: user?.name ?? "Chủ cửa hàng",
      source: "transfer",
      profitClass: "none",
    });
    notify.success("Đã chuyển tiền — không tính vào doanh thu hay lợi nhuận");
    setModal(null);
    resetForm();
  };

  const nameOf = (id: string) => accounts.find((a) => a.id === id)?.name ?? id;

  const closeShiftBook = () => {
    if (!shift) {
      notify.error("Chưa có ca đang mở");
      return;
    }
    const sales = books.orders
      .filter((o) => o.shiftId === shift.id && o.status !== "void")
      .reduce((s, o) => s + o.total, 0);
    const cashIn = books.finance.txns
      .filter(
        (t) =>
          t.accountId === "acc_cash" &&
          t.kind === "in" &&
          t.at >= shift.openedAt,
      )
      .reduce((s, t) => s + t.amount, 0);
    const expected = shift.openingCash + cashIn;
    const actual = Number(amount) || expected;
    books.finance.closeReconciliation({
      shiftId: shift.id,
      employee: shift.userName,
      openedAt: shift.openedAt,
      sales,
      expectedCash: expected,
      actualCash: actual,
      reason: reason.trim() || undefined,
    });
    notify.success("Đã chốt ca");
    setAmount("");
    setReason("");
  };

  return (
    <AppShell>
      <PageHeader
        title="Dòng tiền"
        description="Phiếu thu, phiếu chi và chuyển tiền giữa các quỹ. Chuyển tiền không làm đổi lợi nhuận."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setModal("in")}>
              + Phiếu thu
            </Button>
            <Button size="sm" variant="outline" onClick={() => setModal("out")}>
              + Phiếu chi
            </Button>
            <Button size="sm" variant="outline" onClick={() => setModal("transfer")}>
              Chuyển tiền
            </Button>
          </div>
        }
      />

      <Tabs
        value={tab}
        onChange={(v) => setTab(v as Tab)}
        options={[
          { id: "all", label: "Giao dịch" },
          { id: "in", label: "Phiếu thu" },
          { id: "out", label: "Phiếu chi" },
          { id: "transfer", label: "Chuyển tiền" },
          { id: "recon", label: "Đối soát", badge: "advanced" },
        ]}
      />

      {books.loading ? <LoadingBlock /> : null}

      {!books.loading && tab !== "recon" ? (
        <>
          <div className="mb-3 lg:hidden">
            <Button variant="outline" size="sm" onClick={() => setFiltersOpen(true)}>
              Bộ lọc
            </Button>
          </div>
          <div className="mb-4 hidden flex-wrap gap-2 lg:flex">
            <FilterFields
              kind={kind}
              setKind={setKind}
              accountId={accountId}
              setAccountId={setAccountId}
              category={category}
              setCategory={setCategory}
              staff={staff}
              setStaff={setStaff}
              accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
              staffNames={staffNames}
            />
          </div>
          {rows.length === 0 ? (
            <EmptyBlock text="Không có giao dịch khớp bộ lọc." />
          ) : (
            <>
              <div className="hidden md:block">
                <Card className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-slate-500">
                      <tr>
                        {["Thời gian", "Loại", "Danh mục", "Nội dung", "Tài khoản", "Số tiền", "Người tạo", "Trạng thái"].map(
                          (h) => (
                            <th key={h} className="px-3 py-2 font-medium">
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((t) => (
                        <tr
                          key={t.id}
                          className="cursor-pointer border-t border-slate-100 dark:border-slate-800"
                          onClick={() => setPicked(t)}
                        >
                          <td className="px-3 py-2">{formatDateTime(t.at)}</td>
                          <td className="px-3 py-2">{labelKind(t.kind)}</td>
                          <td className="px-3 py-2">{t.category}</td>
                          <td className="px-3 py-2">{t.description}</td>
                          <td className="px-3 py-2">
                            {t.kind === "transfer"
                              ? `${nameOf(t.accountId)} → ${nameOf(t.counterAccountId ?? "")}`
                              : nameOf(t.accountId)}
                          </td>
                          <td className="px-3 py-2 font-semibold">
                            {t.kind === "out" ? "−" : t.kind === "in" ? "+" : ""}
                            {formatVnd(t.amount)}
                          </td>
                          <td className="px-3 py-2">{t.createdBy}</td>
                          <td className="px-3 py-2">Đã ghi</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>
              <ul className="space-y-2 md:hidden">
                {rows.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      className="w-full rounded-[10px] border border-slate-200 p-3 text-left dark:border-slate-700"
                      onClick={() => setPicked(t)}
                    >
                      <p className="font-semibold">
                        {labelKind(t.kind)} · {formatVnd(t.amount)}
                      </p>
                      <p className="text-sm">{t.description}</p>
                      <p className="text-xs text-slate-500">
                        {formatDateTime(t.at)} · {t.createdBy}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      ) : null}

      {!books.loading && tab === "recon" ? (
        <Card className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold">Ca hiện tại</h2>
            <PackageBadge tier="advanced" />
          </div>
          {shift ? (
            <>
              <p className="text-sm">Nhân viên: {shift.userName}</p>
              <p className="text-sm">Mở ca: {formatDateTime(shift.openedAt)}</p>
              <p className="text-sm">
                Tiền mặt đầu ca: {formatVnd(shift.openingCash)}
              </p>
              <label className="block text-sm">
                <span className="mb-1 block text-slate-500">Tiền mặt đếm được</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-slate-500">Lý do chênh lệch</span>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} />
              </label>
              <Button onClick={closeShiftBook}>Chốt ca</Button>
            </>
          ) : (
            <EmptyBlock text="Chưa mở ca. Mở ca từ thanh trên cùng rồi quay lại đối soát." />
          )}
          <h3 className="pt-2 text-sm font-bold">Đã chốt</h3>
          {books.finance.reconciliations.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có ca nào được chốt trong sổ này.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {books.finance.reconciliations.map((r) => (
                <li key={r.id} className="rounded-[10px] border border-slate-200 p-3">
                  <p className="font-semibold">
                    ✓ Đã chốt · {r.employee}
                  </p>
                  <p>
                    Doanh thu {formatVnd(r.sales)} · Dự kiến {formatVnd(r.expectedCash)} ·
                    Thực tế {formatVnd(r.actualCash)} · Lệch{" "}
                    {formatVnd(r.actualCash - r.expectedCash)}
                  </p>
                  {r.reason ? <p className="text-slate-500">{r.reason}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}

      <Dialog open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Bộ lọc">
        <div className="flex flex-col gap-2">
          <FilterFields
            kind={kind}
            setKind={setKind}
            accountId={accountId}
            setAccountId={setAccountId}
            category={category}
            setCategory={setCategory}
            staff={staff}
            setStaff={setStaff}
            accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
            staffNames={staffNames}
          />
          <Button onClick={() => setFiltersOpen(false)}>Áp dụng</Button>
        </div>
      </Dialog>

      <Dialog open={modal === "in"} onClose={() => setModal(null)} title="Phiếu thu">
        <div className="space-y-3">
          <Field label="Loại thu">
            <Select value={inType} onChange={setInType} options={INCOME_TYPES.map((x) => [x, x])} />
          </Field>
          <Field label="Số tiền">
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Tài khoản nhận">
            <Select
              value={acc}
              onChange={setAcc}
              options={accounts.map((a) => [a.id, a.name])}
            />
          </Field>
          <Field label="Người nộp">
            <Input value={party} onChange={(e) => setParty(e.target.value)} />
          </Field>
          <Field label="Nội dung">
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <Field label="Đính kèm chứng từ">
            <Input
              type="file"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
            />
          </Field>
          <Button className="w-full" onClick={saveIn}>
            Lưu phiếu thu
          </Button>
        </div>
      </Dialog>

      <Dialog open={modal === "out"} onClose={() => setModal(null)} title="Phiếu chi">
        <div className="space-y-3">
          <Field label="Danh mục">
            <Select value={outCat} onChange={setOutCat} options={EXPENSE_CATEGORIES.map((x) => [x, x])} />
          </Field>
          <Field label="Số tiền">
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Tài khoản chi">
            <Select value={acc} onChange={setAcc} options={accounts.map((a) => [a.id, a.name])} />
          </Field>
          <Field label="Người nhận">
            <Input value={party} onChange={(e) => setParty(e.target.value)} />
          </Field>
          <Field label="Nội dung">
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <Field label="Đính kèm chứng từ">
            <Input type="file" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
          </Field>
          <Button className="w-full" onClick={saveOut}>
            Lưu phiếu chi
          </Button>
        </div>
      </Dialog>

      <Dialog open={modal === "transfer"} onClose={() => setModal(null)} title="Chuyển tiền">
        <div className="space-y-3">
          <Field label="Từ tài khoản">
            <Select value={acc} onChange={setAcc} options={accounts.map((a) => [a.id, a.name])} />
          </Field>
          <Field label="Đến tài khoản">
            <Select value={accTo} onChange={setAccTo} options={accounts.map((a) => [a.id, a.name])} />
          </Field>
          <Field label="Số tiền">
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Nội dung">
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <p className="text-xs text-slate-500">
            Chuyển tiền chỉ đổi số dư hai quỹ. Không tính doanh thu, chi phí hay lợi nhuận.
          </p>
          <Button className="w-full" onClick={saveTransfer}>
            Xác nhận chuyển
          </Button>
        </div>
      </Dialog>

      <Dialog open={!!picked} onClose={() => setPicked(null)} title="Giao dịch">
        {picked ? (
          <div className="space-y-1 text-sm">
            <p className="text-lg font-bold">{formatVnd(picked.amount)}</p>
            <p>{picked.description}</p>
            <p className="text-slate-500">{picked.category}</p>
            <p className="text-slate-500">{formatDateTime(picked.at)}</p>
            {picked.attachmentName ? <p>Chứng từ: {picked.attachmentName}</p> : null}
          </div>
        ) : null}
      </Dialog>
    </AppShell>
  );
}

function labelKind(kind: FinanceTxn["kind"]) {
  if (kind === "in") return "Thu";
  if (kind === "out") return "Chi";
  return "Chuyển";
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: (readonly [string, string])[] | [string, string][];
}) {
  return (
    <select
      className="min-h-11 w-full rounded-[10px] border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map(([id, label]) => (
        <option key={id} value={id}>
          {label}
        </option>
      ))}
    </select>
  );
}

function FilterFields(props: {
  kind: "all" | "in" | "out";
  setKind: (v: "all" | "in" | "out") => void;
  accountId: string;
  setAccountId: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  staff: string;
  setStaff: (v: string) => void;
  accounts: { id: string; name: string }[];
  staffNames: string[];
}) {
  return (
    <>
      <Select
        value={props.kind}
        onChange={(v) => props.setKind(v as "all" | "in" | "out")}
        options={[
          ["all", "Thu / Chi"],
          ["in", "Thu"],
          ["out", "Chi"],
        ]}
      />
      <Select
        value={props.accountId}
        onChange={props.setAccountId}
        options={[["all", "Mọi tài khoản"], ...props.accounts.map((a) => [a.id, a.name] as [string, string])]}
      />
      <Select
        value={props.category}
        onChange={props.setCategory}
        options={[
          ["all", "Mọi danh mục"],
          ...[...INCOME_TYPES, ...EXPENSE_CATEGORIES].map((c) => [c, c] as [string, string]),
        ]}
      />
      <Select
        value={props.staff}
        onChange={props.setStaff}
        options={[["all", "Mọi nhân viên"], ...props.staffNames.map((n) => [n, n] as [string, string])]}
      />
    </>
  );
}
