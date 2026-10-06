"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyBlock, LoadingBlock, PackageBadge, Tabs } from "@/components/finance/widgets";
import { useBooks } from "@/lib/finance/use-books";
import { useAuthStore } from "@/stores/auth-store";
import { formatDateTime, formatVnd } from "@/lib/utils";
import { notify } from "@/lib/notify";

export default function ShiftsPage() {
  const books = useBooks();
  const shift = useAuthStore((s) => s.shift);
  const closeShift = useAuthStore((s) => s.closeShift);
  const [tab, setTab] = useState("current");
  const [actual, setActual] = useState("");
  const [reason, setReason] = useState("");

  const salesOf = (shiftId?: string, from?: string) =>
    books.orders
      .filter((o) => o.status !== "void" && (shiftId ? o.shiftId === shiftId : o.createdAt >= (from ?? "")))
      .reduce((s, o) => s + o.total, 0);

  const cashOf = (from?: string) =>
    books.orders
      .filter(
        (o) =>
          o.status === "paid" &&
          o.paymentMethod === "cash" &&
          (!from || o.createdAt >= from),
      )
      .reduce((s, o) => s + o.total, 0);

  const submit = async () => {
    if (!shift) {
      notify.error("Chưa mở ca");
      return;
    }
    const sales = salesOf(shift.id);
    const expected = shift.openingCash + cashOf(shift.openedAt);
    const counted = Number(actual);
    if (!Number.isFinite(counted)) {
      notify.error("Nhập tiền mặt đếm được");
      return;
    }
    books.finance.closeReconciliation({
      shiftId: shift.id,
      employee: shift.userName,
      openedAt: shift.openedAt,
      sales,
      expectedCash: expected,
      actualCash: counted,
      reason: reason.trim() || undefined,
    });
    await closeShift(counted, reason.trim() || undefined);
    notify.success("Đã chốt ca");
    setActual("");
    setReason("");
  };

  const history = [...books.shifts].sort((a, b) => b.openedAt.localeCompare(a.openedAt));
  const gaps = books.finance.reconciliations.filter(
    (r) => r.actualCash !== r.expectedCash,
  );

  return (
    <AppShell>
      <PageHeader
        title="Ca & Đối soát"
        description="Đối chiếu tiền mặt cuối ca với doanh thu tiền mặt trong ca."
      />
      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { id: "current", label: "Ca hiện tại" },
          { id: "history", label: "Lịch sử ca" },
          { id: "gap", label: "Chênh lệch", badge: "advanced" },
        ]}
      />
      {books.loading ? <LoadingBlock /> : null}
      {!books.loading && tab === "current" ? (
        shift ? (
          <Card className="space-y-3 p-4 text-sm">
            <p className="font-semibold">{shift.userName}</p>
            <p>Bắt đầu: {formatDateTime(shift.openedAt)}</p>
            <p>Doanh thu ca: {formatVnd(salesOf(shift.id))}</p>
            <p>Tiền mặt bán được: {formatVnd(cashOf(shift.openedAt))}</p>
            <p>
              Tiền mặt dự kiến:{" "}
              {formatVnd(shift.openingCash + cashOf(shift.openedAt))}
            </p>
            <label className="block">
              <span className="mb-1 block text-slate-500">Tiền mặt thực tế</span>
              <Input type="number" value={actual} onChange={(e) => setActual(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-slate-500">Lý do chênh lệch</span>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} />
            </label>
            <Button onClick={() => void submit()}>Chốt ca</Button>
          </Card>
        ) : (
          <EmptyBlock text="Chưa mở ca. Dùng nút Mở ca trên thanh đầu trang." />
        )
      ) : null}
      {!books.loading && tab === "history" ? (
        history.length === 0 ? (
          <EmptyBlock text="Chưa có ca nào." />
        ) : (
          <ul className="space-y-2 text-sm">
            {history.map((s) => {
              const rec = books.finance.reconciliations.find((r) => r.shiftId === s.id);
              return (
                <li key={s.id} className="rounded-[10px] border border-slate-200 p-3">
                  <p className="font-semibold">
                    {s.userName} · {s.status === "open" ? "Đang mở" : "Đã đóng"}
                  </p>
                  <p className="text-slate-500">
                    {formatDateTime(s.openedAt)}
                    {s.closedAt ? ` → ${formatDateTime(s.closedAt)}` : ""}
                  </p>
                  {rec ? (
                    <p>
                      Doanh thu {formatVnd(rec.sales)} · Dự kiến {formatVnd(rec.expectedCash)} ·
                      Thực tế {formatVnd(rec.actualCash)} · Lệch{" "}
                      {formatVnd(rec.actualCash - rec.expectedCash)}
                    </p>
                  ) : (
                    <p className="text-slate-400">Chưa đối soát trong sổ tài chính</p>
                  )}
                </li>
              );
            })}
          </ul>
        )
      ) : null}
      {!books.loading && tab === "gap" ? (
        <div className="space-y-3">
          <PackageBadge tier="advanced" />
          {gaps.length === 0 ? (
            <EmptyBlock text="Chưa có ca lệch tiền." />
          ) : (
            <ul className="space-y-2 text-sm">
              {gaps.map((r) => (
                <li key={r.id} className="rounded-[10px] border border-amber-200 bg-amber-50 p-3">
                  {r.employee}: lệch {formatVnd(r.actualCash - r.expectedCash)}
                  {r.reason ? ` · ${r.reason}` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </AppShell>
  );
}
