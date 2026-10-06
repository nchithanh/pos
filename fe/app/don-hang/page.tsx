"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { Eye, Printer, ShoppingBag } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ReceiptActions } from "@/components/pos/ReceiptActions";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { CardListSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db";
import { paymentLabel } from "@/lib/payment-labels";
import { printReceipt } from "@/lib/print-receipt";
import { formatDateTime, formatVnd, todayKey } from "@/lib/utils";
import type { Order } from "@/types";

const PAGE_SIZE = 12;

export default function OrdersPage() {
  const orders = useLiveQuery(() =>
    db.orders.orderBy("createdAt").reverse().toArray(),
  );
  const settings = useLiveQuery(() => db.settings.get("store"));
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "today" | "paid" | "debt">("all");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Order | null>(null);

  const today = todayKey();
  const todayCount = useMemo(
    () => (orders ?? []).filter((o) => o.createdAt.startsWith(today)).length,
    [orders, today],
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return (orders ?? []).filter((o) => {
      if (filter === "today" && !o.createdAt.startsWith(today)) return false;
      if (filter === "paid" && o.status !== "paid") return false;
      if (filter === "debt" && o.status !== "debt") return false;
      if (!query) return true;
      return (
        o.code.toLowerCase().includes(query) ||
        o.cashierName.toLowerCase().includes(query) ||
        (o.customerName ?? "").toLowerCase().includes(query)
      );
    });
  }, [orders, q, filter, today]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const todayRevenue = useMemo(
    () =>
      (orders ?? [])
        .filter((o) => o.createdAt.startsWith(today) && o.status !== "void")
        .reduce((s, o) => s + o.total, 0),
    [orders, today],
  );

  const openDetail = (o: Order) => setDetail(o);

  return (
    <AppShell>
      <PageHeader
        title="Đơn hàng"
        description={`Hôm nay ${todayCount} đơn · ${formatVnd(todayRevenue)}`}
        actions={
          <Link href="/ban-hang">
            <Button>
              <ShoppingBag size={16} />
              Mở bán hàng
            </Button>
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-slate-500">Đơn hôm nay</p>
          <p className="text-2xl font-bold text-emerald-600">{todayCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Doanh thu hôm nay</p>
          <p className="text-xl font-bold">{formatVnd(todayRevenue)}</p>
        </Card>
        <Card className="col-span-2 p-4 sm:col-span-1">
          <p className="text-sm text-slate-500">Tổng đơn trong hệ thống</p>
          <p className="text-2xl font-bold">{orders?.length ?? 0}</p>
        </Card>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          className="flex-1"
          placeholder="Tìm mã đơn / nhân viên / khách…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "Tất cả"],
              ["today", "Hôm nay"],
              ["paid", "Đã thanh toán"],
              ["debt", "Ghi nợ"],
            ] as const
          ).map(([id, label]) => (
            <Button
              key={id}
              size="sm"
              variant={filter === id ? "default" : "outline"}
              onClick={() => {
                setFilter(id);
                setPage(1);
              }}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {orders === undefined ? (
        <>
          <div className="md:hidden">
            <CardListSkeleton count={4} />
          </div>
          <div className="hidden md:block">
            <TableSkeleton rows={6} cols={5} />
          </div>
        </>
      ) : !filtered.length ? (
        <Card>
          <EmptyState
            title="Chưa có đơn hàng"
            description="Bán đơn đầu tiên từ màn Bán hàng."
            action={
              <Link href="/ban-hang">
                <Button>Đi bán hàng</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {pageItems.map((o) => (
              <Card key={o.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{o.code}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(o.createdAt)}</p>
                    <p className="text-xs text-slate-500">
                      {o.customerName ?? "Khách lẻ"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatVnd(o.total)}</p>
                    <div className="mt-1 flex flex-col items-end gap-1">
                      <Badge status={o.paymentMethod} />
                      <Badge
                        status={o.eInvoice ? "invoice_issued" : "invoice_pending"}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openDetail(o)}
                  >
                    <Eye size={14} /> Xem đơn
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => printReceipt(o, settings)}
                  >
                    <Printer size={14} /> In bill
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <Card className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b bg-slate-50 text-slate-500 dark:bg-slate-800">
                <tr>
                  {[
                    "Mã đơn",
                    "Thời gian",
                    "Khách hàng",
                    "Tổng tiền",
                    "Thanh toán",
                    "Hóa đơn",
                    "",
                  ].map((h) => (
                    <th key={h || "actions"} className="px-4 py-3 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((o) => (
                  <tr key={o.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-semibold">{o.code}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatDateTime(o.createdAt)}
                    </td>
                    <td className="px-4 py-3">{o.customerName ?? "Khách lẻ"}</td>
                    <td className="px-4 py-3 font-bold">{formatVnd(o.total)}</td>
                    <td className="px-4 py-3">
                      <Badge status={o.paymentMethod} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        status={o.eInvoice ? "invoice_issued" : "invoice_pending"}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDetail(o)}
                          aria-label="Xem đơn"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => printReceipt(o, settings)}
                          aria-label="In bill"
                        >
                          <Printer size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Trang {safePage}/{pageCount} · {filtered.length} đơn
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

      <Dialog
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? `Đơn hàng ${detail.code}` : "Chi tiết đơn"}
        className="max-w-lg"
      >
        {detail ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                status={detail.status === "debt" ? "debt" : "paid"}
                label={
                  detail.status === "debt" ? "Ghi nợ" : "✓ Đã thanh toán"
                }
              />
              <Badge
                status={detail.eInvoice ? "invoice_issued" : "invoice_pending"}
              />
            </div>

            <div className="rounded-[10px] bg-slate-50 p-3 text-sm dark:bg-slate-800">
              <p>
                <span className="text-slate-500">Mã đơn:</span> {detail.code}
              </p>
              <p>
                <span className="text-slate-500">Thời gian:</span>{" "}
                {formatDateTime(detail.createdAt)}
              </p>
              <p>
                <span className="text-slate-500">Thu ngân:</span>{" "}
                {detail.cashierName}
              </p>
              <p>
                <span className="text-slate-500">Khách:</span>{" "}
                {detail.customerName ?? "Khách lẻ"}
              </p>
              <p>
                <span className="text-slate-500">Thanh toán:</span>{" "}
                {paymentLabel(detail.paymentMethod)}
              </p>
              {detail.discount > 0 ? (
                <p>
                  <span className="text-slate-500">Giảm giá:</span>{" "}
                  {formatVnd(detail.discount)}
                </p>
              ) : null}
              <p className="mt-1 font-bold">Tổng: {formatVnd(detail.total)}</p>
            </div>

            <ul className="max-h-48 space-y-2 overflow-auto text-sm">
              {detail.items.map((item) => (
                <li
                  key={`${item.productId}-${item.productName}`}
                  className="flex justify-between gap-2 border-b border-slate-100 pb-2 last:border-0 dark:border-slate-800"
                >
                  <span>
                    <span className="font-medium">{item.productName}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {item.quantity} × {formatVnd(item.unitPrice)}
                    </span>
                  </span>
                  <span className="font-semibold">{formatVnd(item.lineTotal)}</span>
                </li>
              ))}
            </ul>

            <ReceiptActions
              order={detail}
              store={settings}
              onOrderChange={setDetail}
            />

            <Button className="w-full" variant="outline" onClick={() => setDetail(null)}>
              Đóng
            </Button>
          </div>
        ) : null}
      </Dialog>
    </AppShell>
  );
}
