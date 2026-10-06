"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Download,
  History,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/lib/db";
import {
  createDebt,
  debtRemain,
  debtStatusLabel,
  displayDebtStatus,
  downloadDebtsCsv,
  isDebtOverdue,
  matchesDueFilter,
  overdueDays,
  payDebt,
  printDebtReceipt,
  type DebtDueFilter,
} from "@/lib/services/debts";
import { paymentLabel } from "@/lib/payment-labels";
import { cn, formatDate, formatDateTime, formatVnd, todayKey } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import type { Debt, DebtType, PaymentMethod } from "@/types";

const PAGE_SIZE = 10;

type PayMethodUi = Extract<PaymentMethod, "cash" | "transfer" | "qr">;

function resolvePhone(
  d: Debt,
  customers: Map<string, string>,
  suppliers: Map<string, string>,
): string {
  if (d.partyPhone) return d.partyPhone;
  return (
    customers.get(d.partyId) ??
    suppliers.get(d.partyId) ??
    "—"
  );
}

export default function DebtPage() {
  const debts = useLiveQuery(() => db.debts.toArray()) ?? [];
  const payments = useLiveQuery(() => db.debtPayments.toArray()) ?? [];
  const customers = useLiveQuery(() => db.customers.toArray()) ?? [];
  const suppliers = useLiveQuery(() => db.suppliers.toArray()) ?? [];
  const orders = useLiveQuery(() => db.orders.toArray()) ?? [];
  const settings = useLiveQuery(() => db.settings.get("store"));
  const user = useAuthStore((s) => s.user);

  const [tab, setTab] = useState<DebtType>("receivable");
  const [q, setQ] = useState("");
  const [dueFilter, setDueFilter] = useState<DebtDueFilter>("all");
  const [page, setPage] = useState(1);
  const [menuId, setMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [payDebtRow, setPayDebtRow] = useState<Debt | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<PayMethodUi>("cash");
  const [payNote, setPayNote] = useState("");
  const [printReceipt, setPrintReceipt] = useState(true);
  const [sendZalo, setSendZalo] = useState(false);

  const [historyDebt, setHistoryDebt] = useState<Debt | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newType, setNewType] = useState<DebtType>("receivable");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDue, setNewDue] = useState(todayKey());
  const [newNote, setNewNote] = useState("");

  const today = todayKey();
  const phoneByCustomer = useMemo(
    () => new Map(customers.map((c) => [c.id, c.phone])),
    [customers],
  );
  const phoneBySupplier = useMemo(
    () => new Map(suppliers.map((s) => [s.id, s.phone])),
    [suppliers],
  );
  const orderCodeById = useMemo(
    () => new Map(orders.map((o) => [o.id, o.code])),
    [orders],
  );

  const summary = useMemo(() => {
    const open = debts.filter((d) => debtRemain(d) > 0);
    const receivableRows = open.filter((d) => d.type === "receivable");
    const payableRows = open.filter((d) => d.type === "payable");
    const overdueRows = open.filter((d) => isDebtOverdue(d, today));
    return {
      receivable: receivableRows.reduce((s, d) => s + debtRemain(d), 0),
      receivableCount: receivableRows.length,
      payable: payableRows.reduce((s, d) => s + debtRemain(d), 0),
      payableCount: payableRows.length,
      overdue: overdueRows.reduce((s, d) => s + debtRemain(d), 0),
      overdueCount: overdueRows.length,
    };
  }, [debts, today]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return debts
      .filter((d) => d.type === tab)
      .filter((d) => matchesDueFilter(d, dueFilter, today))
      .filter((d) => {
        if (!query) return true;
        const phone = resolvePhone(d, phoneByCustomer, phoneBySupplier);
        const orderCode = d.orderId ? orderCodeById.get(d.orderId) ?? "" : "";
        return (
          d.partyName.toLowerCase().includes(query) ||
          phone.toLowerCase().includes(query) ||
          d.note.toLowerCase().includes(query) ||
          orderCode.toLowerCase().includes(query) ||
          (d.orderId ?? "").toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        // Quá hạn trước, rồi hạn gần nhất
        const ao = isDebtOverdue(a, today) ? 0 : 1;
        const bo = isDebtOverdue(b, today) ? 0 : 1;
        if (ao !== bo) return ao - bo;
        return a.dueDate.localeCompare(b.dueDate);
      });
  }, [
    debts,
    tab,
    dueFilter,
    today,
    q,
    phoneByCustomer,
    phoneBySupplier,
    orderCodeById,
  ]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [tab, dueFilter, q]);

  useEffect(() => {
    if (!menuId) return;
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuId(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuId]);

  const openPay = (d: Debt) => {
    setPayDebtRow(d);
    setPayAmount(String(debtRemain(d)));
    setPayMethod("cash");
    setPayNote("");
    setPrintReceipt(true);
    setSendZalo(false);
    setMenuId(null);
  };

  const confirmPay = async () => {
    if (!user || !payDebtRow) return;
    const amount = Number(payAmount) || 0;
    try {
      await payDebt({
        debtId: payDebtRow.id,
        amount,
        method: payMethod,
        user,
        note: payNote.trim() || undefined,
      });
      if (printReceipt) {
        printDebtReceipt({
          debt: payDebtRow,
          paidNow: Math.min(amount, debtRemain(payDebtRow)),
          method: payMethod,
          cashierName: user.name,
          storeName: settings?.name,
        });
      }
      if (sendZalo) {
        toast.success("Demo: đã gửi phiếu xác nhận qua Zalo");
      } else {
        toast.success("Đã ghi nhận thanh toán");
      }
      setPayDebtRow(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thanh toán được");
    }
  };

  const remind = (d: Debt) => {
    setMenuId(null);
    const phone = resolvePhone(d, phoneByCustomer, phoneBySupplier);
    toast.success(
      `Demo nhắc nợ: đã xếp hàng tin Zalo/SMS tới ${phone !== "—" ? phone : d.partyName}`,
    );
  };

  const createNote = async () => {
    try {
      await createDebt({
        type: newType,
        partyName: newName,
        partyPhone: newPhone,
        amount: Number(newAmount) || 0,
        dueDate: newDue,
        note: newNote,
      });
      toast.success("Đã tạo phiếu ghi nợ");
      setCreateOpen(false);
      setNewName("");
      setNewPhone("");
      setNewAmount("");
      setNewNote("");
      setNewDue(todayKey());
      setTab(newType);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tạo được");
    }
  };

  const historyPayments = useMemo(() => {
    if (!historyDebt) return [];
    return payments
      .filter((p) => p.debtId === historyDebt.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [historyDebt, payments]);

  const payLabel = tab === "receivable" ? "Thu nợ" : "Trả nợ";

  return (
    <AppShell>
      <PageHeader
        title="Công nợ"
        description="Theo dõi phải thu / phải trả và ghi nhận thanh toán từng phần"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadDebtsCsv(filtered)}
            >
              <Download size={16} /> Xuất CSV
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setNewType(tab);
                setCreateOpen(true);
              }}
            >
              <Plus size={16} /> Ghi nợ
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          className={cn(
            "rounded-[10px] border border-[var(--border)] bg-[var(--card)] p-4 text-left transition",
            tab === "receivable" && dueFilter === "all"
              ? "ring-2 ring-emerald-500/40"
              : "hover:border-emerald-300",
          )}
          onClick={() => {
            setTab("receivable");
            setDueFilter("all");
          }}
        >
          <p className="text-sm text-slate-500">Phải thu</p>
          <p className="text-xl font-bold">{formatVnd(summary.receivable)}</p>
          <p className="mt-1 text-xs text-slate-400">
            {summary.receivableCount} khoản
          </p>
        </button>
        <button
          type="button"
          className={cn(
            "rounded-[10px] border border-[var(--border)] bg-[var(--card)] p-4 text-left transition",
            tab === "payable" && dueFilter === "all"
              ? "ring-2 ring-emerald-500/40"
              : "hover:border-emerald-300",
          )}
          onClick={() => {
            setTab("payable");
            setDueFilter("all");
          }}
        >
          <p className="text-sm text-slate-500">Phải trả</p>
          <p className="text-xl font-bold">{formatVnd(summary.payable)}</p>
          <p className="mt-1 text-xs text-slate-400">
            {summary.payableCount} khoản
          </p>
        </button>
        <button
          type="button"
          className={cn(
            "rounded-[10px] border border-[var(--border)] bg-[var(--card)] p-4 text-left transition",
            dueFilter === "overdue"
              ? "ring-2 ring-rose-400/50"
              : "hover:border-rose-300",
          )}
          onClick={() => setDueFilter("overdue")}
        >
          <p className="text-sm text-slate-500">Quá hạn</p>
          <p className="text-xl font-bold text-rose-600">
            {formatVnd(summary.overdue)}
          </p>
          <p className="mt-1 text-xs text-rose-500/80">
            {summary.overdueCount} khoản
          </p>
        </button>
      </div>

      <div className="mt-4 flex gap-2 rounded-[12px] bg-white p-1 dark:bg-slate-900">
        {(
          [
            ["receivable", "Phải thu"],
            ["payable", "Phải trả"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={cn(
              "flex-1 rounded-[10px] py-2.5 text-sm font-semibold",
              tab === id ? "bg-emerald-500 text-white" : "text-slate-500",
            )}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
          />
          <Input
            className="pl-9"
            placeholder="Tìm theo tên, SĐT, mã đơn…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className="min-h-11 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium dark:border-slate-700 dark:bg-slate-900"
          value={dueFilter}
          onChange={(e) => setDueFilter(e.target.value as DebtDueFilter)}
          aria-label="Lọc trạng thái hạn"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="due_today">Đến hạn hôm nay</option>
          <option value="overdue">Đã quá hạn</option>
          <option value="upcoming">Chưa đến hạn</option>
        </select>
      </div>

      {!filtered.length ? (
        <Card className="mt-4">
          <EmptyState
            title="Không có khoản công nợ"
            description="Thử đổi bộ lọc hoặc tạo phiếu ghi nợ mới."
            action={
              <Button onClick={() => setCreateOpen(true)}>
                <Plus size={16} /> Ghi nợ
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          {/* Mobile cards — dense */}
          <div className="mt-4 space-y-2 md:hidden">
            {pageItems.map((d) => {
              const remain = debtRemain(d);
              const status = displayDebtStatus(d, today);
              const days = overdueDays(d, today);
              const phone = resolvePhone(d, phoneByCustomer, phoneBySupplier);
              const orderCode = d.orderId
                ? orderCodeById.get(d.orderId)
                : undefined;
              return (
                <Card key={d.id} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{d.partyName}</p>
                      <p className="text-xs text-slate-500">{phone}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Hạn {formatDate(d.dueDate)} · {d.note}
                      </p>
                      {orderCode ? (
                        <Link
                          href="/don-hang"
                          className="mt-1 inline-block text-xs font-semibold text-emerald-600"
                        >
                          Đơn {orderCode}
                        </Link>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatVnd(remain)}</p>
                      <Badge
                        className="mt-1"
                        status={status}
                        label={debtStatusLabel(status, days)}
                      />
                    </div>
                  </div>
                  {remain > 0 ? (
                    <div className="mt-3 flex items-center gap-2">
                      <Button size="sm" onClick={() => openPay(d)}>
                        {payLabel}
                      </Button>
                      <div className="relative" ref={menuId === d.id ? menuRef : undefined}>
                        <Button
                          variant="outline"
                          size="icon"
                          className="!h-9 !w-9 !min-h-9"
                          aria-label="Thêm thao tác"
                          onClick={() =>
                            setMenuId((id) => (id === d.id ? null : d.id))
                          }
                        >
                          <MoreHorizontal size={16} />
                        </Button>
                        {menuId === d.id ? (
                          <div className="absolute right-0 z-20 mt-1 w-44 rounded-[10px] border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                            <MenuItems
                              onHistory={() => {
                                setHistoryDebt(d);
                                setMenuId(null);
                              }}
                              onRemind={() => remind(d)}
                              hasOrder={!!d.orderId}
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </Card>
              );
            })}
          </div>

          {/* Desktop table */}
          <Card className="mt-4 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b bg-slate-50 text-slate-500 dark:bg-slate-800">
                <tr>
                  {[
                    "Khách hàng / Đối tác",
                    "Số điện thoại",
                    "Hạn thanh toán",
                    "Nội dung nợ",
                    "Còn nợ",
                    "Trạng thái",
                    "Thao tác",
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((d) => {
                  const remain = debtRemain(d);
                  const status = displayDebtStatus(d, today);
                  const days = overdueDays(d, today);
                  const phone = resolvePhone(
                    d,
                    phoneByCustomer,
                    phoneBySupplier,
                  );
                  const orderCode = d.orderId
                    ? orderCodeById.get(d.orderId)
                    : undefined;
                  return (
                    <tr key={d.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{d.partyName}</p>
                        {orderCode ? (
                          <Link
                            href="/don-hang"
                            className="text-xs font-semibold text-emerald-600"
                          >
                            Đơn {orderCode}
                          </Link>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{phone}</td>
                      <td className="px-4 py-3">{formatDate(d.dueDate)}</td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-slate-600">
                        {d.note}
                      </td>
                      <td className="px-4 py-3 font-bold">
                        {formatVnd(remain)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          status={status}
                          label={debtStatusLabel(status, days)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {remain > 0 ? (
                            <Button size="sm" onClick={() => openPay(d)}>
                              {payLabel}
                            </Button>
                          ) : null}
                          <div
                            className="relative"
                            ref={menuId === d.id ? menuRef : undefined}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Thêm thao tác"
                              onClick={() =>
                                setMenuId((id) => (id === d.id ? null : d.id))
                              }
                            >
                              <MoreHorizontal size={16} />
                            </Button>
                            {menuId === d.id ? (
                              <div className="absolute right-0 z-20 mt-1 w-48 rounded-[10px] border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                                <MenuItems
                                  onHistory={() => {
                                    setHistoryDebt(d);
                                    setMenuId(null);
                                  }}
                                  onRemind={() => remind(d)}
                                  hasOrder={!!d.orderId}
                                />
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Trang {safePage}/{pageCount} · {filtered.length} khoản
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              >
                Sau
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Pay modal */}
      <Dialog
        open={!!payDebtRow}
        onClose={() => setPayDebtRow(null)}
        title={tab === "receivable" ? "Thu tiền công nợ" : "Trả nợ nhà cung cấp"}
        className="max-w-md"
      >
        {payDebtRow ? (
          <div className="space-y-3">
            <div className="rounded-[10px] bg-slate-50 p-3 text-sm dark:bg-slate-800">
              <p className="font-semibold">{payDebtRow.partyName}</p>
              <p className="mt-1 text-slate-500">{payDebtRow.note}</p>
              <p className="mt-2">
                Tổng nợ:{" "}
                <span className="font-bold">{formatVnd(payDebtRow.amount)}</span>
              </p>
              <p>
                Đã trả: {formatVnd(payDebtRow.paidAmount)} · Còn lại:{" "}
                <span className="font-bold text-emerald-600">
                  {formatVnd(debtRemain(payDebtRow))}
                </span>
              </p>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-500">
                Số tiền lần này
              </span>
              <Input
                type="number"
                min={0}
                max={debtRemain(payDebtRow)}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-400">
                Còn lại sau lần này:{" "}
                {formatVnd(
                  Math.max(
                    0,
                    debtRemain(payDebtRow) - (Number(payAmount) || 0),
                  ),
                )}
              </p>
            </label>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-500">
                Hình thức
              </legend>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["cash", "Tiền mặt"],
                    ["transfer", "Chuyển khoản"],
                    ["qr", "QR"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold",
                      payMethod === id
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 text-slate-600 dark:border-slate-700",
                    )}
                    onClick={() => setPayMethod(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {payMethod === "qr" ? (
                <div className="mt-3 rounded-[10px] border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500 dark:border-slate-600">
                  <p className="font-semibold text-slate-700 dark:text-slate-200">
                    VietQR demo
                  </p>
                  <p className="mt-1">
                    Số tiền {formatVnd(Number(payAmount) || 0)} — chưa nối ngân
                    hàng thật
                  </p>
                  <div className="mx-auto mt-3 flex h-28 w-28 items-center justify-center rounded-[8px] bg-slate-100 font-mono text-[10px] dark:bg-slate-800">
                    QR
                  </div>
                </div>
              ) : null}
            </fieldset>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-500">
                Ghi chú
              </span>
              <Input
                value={payNote}
                onChange={(e) => setPayNote(e.target.value)}
                placeholder="VD: Khách chuyển khoản Vietcombank"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={printReceipt}
                onChange={(e) => setPrintReceipt(e.target.checked)}
              />
              In biên lai sau khi xác nhận
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={sendZalo}
                onChange={(e) => setSendZalo(e.target.checked)}
              />
              Gửi phiếu xác nhận qua Zalo (demo)
            </label>
            <div className="flex flex-col gap-2 pt-1 sm:flex-row">
              <Button className="flex-1" onClick={confirmPay}>
                Xác nhận {payLabel.toLowerCase()}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setPayDebtRow(null)}
              >
                Hủy
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>

      {/* History */}
      <Dialog
        open={!!historyDebt}
        onClose={() => setHistoryDebt(null)}
        title="Lịch sử thanh toán"
        className="max-w-md"
      >
        {historyDebt ? (
          <div className="space-y-3">
            <div className="rounded-[10px] bg-slate-50 p-3 text-sm dark:bg-slate-800">
              <p className="font-semibold">{historyDebt.partyName}</p>
              <p className="text-slate-500">{historyDebt.note}</p>
              <p className="mt-1 font-bold">
                Còn lại {formatVnd(debtRemain(historyDebt))}
              </p>
            </div>
            {!historyPayments.length ? (
              <p className="text-sm text-slate-500">Chưa có lần thanh toán nào.</p>
            ) : (
              <ul className="max-h-64 space-y-2 overflow-auto text-sm">
                {historyPayments.map((p) => (
                  <li
                    key={p.id}
                    className="flex justify-between gap-2 rounded-[10px] border border-slate-100 px-3 py-2 dark:border-slate-800"
                  >
                    <div>
                      <p className="font-semibold">{formatVnd(p.amount)}</p>
                      <p className="text-xs text-slate-500">
                        {formatDateTime(p.createdAt)} · {paymentLabel(p.method)}
                      </p>
                      {p.note ? (
                        <p className="text-xs text-slate-400">{p.note}</p>
                      ) : null}
                    </div>
                    <History size={14} className="mt-1 shrink-0 text-slate-400" />
                  </li>
                ))}
              </ul>
            )}
            <Button className="w-full" variant="outline" onClick={() => setHistoryDebt(null)}>
              Đóng
            </Button>
          </div>
        ) : null}
      </Dialog>

      {/* Create debt */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Tạo phiếu ghi nợ"
        className="max-w-md"
      >
        <div className="space-y-3">
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-500">
              Loại
            </legend>
            <div className="flex gap-2">
              {(
                [
                  ["receivable", "Phải thu"],
                  ["payable", "Phải trả"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={cn(
                    "flex-1 rounded-full border py-2 text-sm font-semibold",
                    newType === id
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 text-slate-600",
                  )}
                  onClick={() => setNewType(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-500">
              Tên khách / đối tác *
            </span>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Cửa hàng Pet House Q3"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-500">
              Số điện thoại
            </span>
            <Input
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="0908 xxx xxx"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-500">
              Số tiền *
            </span>
            <Input
              type="number"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-500">
              Hạn thanh toán *
            </span>
            <Input
              type="date"
              value={newDue}
              onChange={(e) => setNewDue(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-500">
              Nội dung nợ
            </span>
            <Input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Bán sỉ cát + thức ăn"
            />
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="flex-1" onClick={createNote}>
              Lưu phiếu
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setCreateOpen(false)}
            >
              Hủy
            </Button>
          </div>
        </div>
      </Dialog>
    </AppShell>
  );
}

function MenuItems({
  onHistory,
  onRemind,
  hasOrder,
}: {
  onHistory: () => void;
  onRemind: () => void;
  hasOrder: boolean;
}) {
  return (
    <>
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
        onClick={onHistory}
      >
        <History size={14} /> Xem lịch sử
      </button>
      {hasOrder ? (
        <Link
          href="/don-hang"
          className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          Xem đơn hàng
        </Link>
      ) : null}
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
        onClick={onRemind}
      >
        <MessageCircle size={14} /> Nhắc nợ (demo)
      </button>
    </>
  );
}
