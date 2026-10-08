"use client";

import { tr } from "@/lib/i18n/translate";

import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { AppShell } from "@/components/layout/app-shell";
import { WarehouseNav } from "@/components/kho/warehouse-nav";
import { EmptyBlock, FilterChip, StatusPill, outboundTone } from "@/components/kho/ui";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import { confirmShip } from "@/lib/warehouse/ops";
import { OUTBOUND_LABEL, type OutboundOrder } from "@/lib/warehouse/types";
import { useAuthStore } from "@/stores/auth-store";
import {
  availableQty,
  reservedQty,
  useWarehouseStore,
} from "@/stores/warehouse-store";
import { formatDateTime, formatVnd, uid } from "@/lib/utils";

const PURPOSES = ["Bán hàng", "Chuyển kho", "Nội bộ", "Hàng mẫu", "Hư hỏng", "Khác"];

export default function OutboundPage() {
  const products = useLiveQuery(() => db.products.toArray()) ?? [];
  const user = useAuthStore((s) => s.user);
  const outbounds = useWarehouseStore((s) => s.outbounds);
  const damaged = useWarehouseStore((s) => s.damaged);
  const saveOutbound = useWarehouseStore((s) => s.saveOutbound);
  const [open, setOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("10");
  const [purpose, setPurpose] = useState(PURPOSES[0]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [range, setRange] = useState("all");
  const canApprove = user?.role === "owner" || user?.role === "manager";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    if (status) setStatusFilter(status);
    if (params.get("create") === "1") setCreating(true);
  }, []);

  const visible = useMemo(() => {
    return outbounds.filter((order) => {
      if (statusFilter === "picking") {
        if (!["picking", "approved", "partial"].includes(order.status)) return false;
      } else if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (range !== "all") {
        const days = range === "7" ? 7 : 30;
        if (Date.now() - new Date(order.createdAt).getTime() > days * 86400000) return false;
      }
      return true;
    });
  }, [outbounds, statusFilter, range]);

  const create = () => {
    const product = products.find((p) => p.id === productId);
    if (!product || !user) {
      notify.error(tr("Chọn sản phẩm"));
      return;
    }
    const n = Number(qty) || 0;
    if (n <= 0) {
      notify.error(tr("Số lượng không hợp lệ"));
      return;
    }
    const order: OutboundOrder = {
      id: uid("ob"),
      code: `XK${String(128 + outbounds.length).padStart(5, "0")}`,
      requester: user.name,
      purpose,
      destination: tr("Kho cửa hàng"),
      note: "",
      status: "pending",
      createdAt: new Date().toISOString(),
      lines: [
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          requested: n,
          picked: 0,
        },
      ],
    };
    saveOutbound(order);
    setCreating(false);
    setOpen(order.id);
    notify.success(tr("Đã tạo yêu cầu xuất — trạng thái Chờ duyệt"));
  };

  const ship = async (order: OutboundOrder) => {
    if (!user) return;
    const lines = order.lines.filter((l) => l.picked > 0);
    if (!lines.length) {
      notify.error(tr("Chưa soạn hàng"));
      return;
    }
    try {
      await confirmShip(
        lines.map((l) => ({ productId: l.productId, qty: l.picked })),
        order.code,
        user,
      );
      saveOutbound({
        ...order,
        status: "shipped",
        shippedBy: user.name,
        shippedAt: new Date().toISOString(),
      });
      notify.success(tr("Đã xuất kho. Tồn đã giảm đúng số đã soạn."));
    } catch (e) {
      notify.error(e instanceof Error ? e.message : tr("Không xuất được"));
    }
  };

  return (
    <AppShell>
      <PageHeader
        title={tr("Đơn xuất hàng")}
        description={tr("Yêu cầu → duyệt → soạn → xác nhận. Không xuất âm tồn.")}
        actions={
          <Button size="sm" onClick={() => setCreating((v) => !v)}>
            + Yêu cầu xuất
          </Button>
        }
      />
      <WarehouseNav />
      {creating ? (
        <Card className="mb-4 space-y-3 p-4">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-500">{tr("Mục đích")}</span>
            <select
              className="min-h-11 w-full rounded-[10px] border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-900"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            >
              {PURPOSES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-500">{tr("Sản phẩm")}</span>
            <select
              className="min-h-11 w-full rounded-[10px] border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-900"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">{tr("Chọn")}</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · tồn {p.stock}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-500">{tr("Số lượng")}</span>
            <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
          </label>
          <Button onClick={create}>{tr("Tạo yêu cầu")}</Button>
        </Card>
      ) : null}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <FilterChip active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
          {tr("Tất cả")}
        </FilterChip>
        <FilterChip active={statusFilter === "pending"} onClick={() => setStatusFilter("pending")}>
          {tr("Chờ duyệt")}
        </FilterChip>
        <FilterChip active={statusFilter === "picking"} onClick={() => setStatusFilter("picking")}>
          {tr("Đang soạn")}
        </FilterChip>
        <FilterChip active={statusFilter === "ready"} onClick={() => setStatusFilter("ready")}>
          {tr("Chờ bàn giao")}
        </FilterChip>
        <FilterChip active={statusFilter === "shipped"} onClick={() => setStatusFilter("shipped")}>
          {tr("Đã xuất")}
        </FilterChip>
        <FilterChip active={range === "7"} onClick={() => setRange(range === "7" ? "all" : "7")}>
          {tr("7 ngày")}
        </FilterChip>
        <FilterChip active={range === "30"} onClick={() => setRange(range === "30" ? "all" : "30")}>
          {tr("30 ngày")}
        </FilterChip>
      </div>

      {visible.length === 0 ? (
        <EmptyBlock
          title={tr("Chưa có phiếu xuất")}
          body={tr("Sau khi nhập kho, tạo yêu cầu xuất để chạy quy trình duyệt và soạn hàng.")}
        />
      ) : null}

      <ul className="space-y-2">
        {visible.map((order) => {
          const product = products.find((p) => p.id === order.lines[0]?.productId);
          const line = order.lines[0];
          const avail = product
            ? availableQty(
                product.stock,
                damaged[product.id] ?? 0,
                reservedQty(outbounds, product.id, order.id),
              )
            : 0;
          const short = line && line.requested > avail && order.status !== "shipped";
          const total = order.lines.reduce((s, l) => {
            const cost = products.find((p) => p.id === l.productId)?.costPrice ?? 0;
            return s + l.requested * cost;
          }, 0);
          return (
            <li key={order.id} className="group">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 rounded-[10px] border border-slate-200 px-3 py-3 text-left shadow-sm hover:border-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700"
                onClick={() => setOpen(order.id === open ? null : order.id)}
              >
                <span className="min-w-0">
                  <span className="font-semibold">
                    {order.code} · {order.requester}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {formatDateTime(order.createdAt)} · {order.purpose} · {order.lines.length} dòng · {formatVnd(total)}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="hidden text-xs font-semibold text-emerald-700 group-hover:inline">
                    Mở phiếu
                  </span>
                  <StatusPill label={OUTBOUND_LABEL[order.status]} tone={outboundTone(order.status)} />
                </span>
              </button>
              {open === order.id && line ? (
                <Card className="mt-2 space-y-3 p-4 text-sm">
                  <p>
                    Yêu cầu {line.requested} · {line.name}
                  </p>
                  <p>
                    Tồn khả dụng {avail}
                    {product ? ` (tồn ${product.stock})` : ""}
                  </p>
                  {order.approvedBy ? (
                    <p className="text-slate-500">
                      Duyệt bởi {order.approvedBy} · {order.approvedAt ? formatDateTime(order.approvedAt) : ""}
                    </p>
                  ) : null}
                  {short ? (
                    <p className="rounded-[10px] bg-amber-50 px-3 py-2 text-amber-900">
                      Không đủ tồn. Thiếu {line.requested - avail}. Có thể xuất một phần {avail}.
                    </p>
                  ) : null}
                  {order.status === "pending" ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        disabled={!canApprove}
                        onClick={() =>
                          saveOutbound({
                            ...order,
                            status: "approved",
                            approvedBy: user?.name,
                            approvedAt: new Date().toISOString(),
                          })
                        }
                      >
                        Duyệt
                      </Button>
                      <Button
                        variant="outline"
                        disabled={!canApprove}
                        onClick={() => saveOutbound({ ...order, status: "rejected" })}
                      >
                        {tr("Từ chối")}
                      </Button>
                      {!canApprove ? (
                        <p className="text-xs text-slate-500">{tr("Chỉ quản lý hoặc chủ cửa hàng được duyệt.")}</p>
                      ) : null}
                    </div>
                  ) : null}
                  {order.status === "approved" || order.status === "picking" || order.status === "partial" || order.status === "ready" ? (
                    <div className="space-y-2">
                      <p className="font-semibold">{tr("Soạn hàng")}</p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            const picked = Math.max(0, line.picked - 1);
                            saveOutbound({
                              ...order,
                              status: "picking",
                              lines: [{ ...line, picked }],
                            });
                          }}
                        >
                          −
                        </Button>
                        <span className="min-w-16 text-center font-bold">
                          {line.picked}/{line.requested}
                        </span>
                        <Button
                          variant="outline"
                          onClick={() => {
                            const cap = Math.min(line.requested, avail + line.picked);
                            const picked = Math.min(cap, line.picked + 1);
                            const status =
                              picked === 0
                                ? "picking"
                                : picked < line.requested
                                  ? "partial"
                                  : "ready";
                            saveOutbound({
                              ...order,
                              status,
                              lines: [{ ...line, picked }],
                            });
                          }}
                        >
                          +
                        </Button>
                        {short ? (
                          <Button
                            variant="outline"
                            onClick={() =>
                              saveOutbound({
                                ...order,
                                status: "partial",
                                lines: [{ ...line, picked: avail }],
                              })
                            }
                          >
                            Xuất một phần
                          </Button>
                        ) : null}
                      </div>
                      {line.picked < line.requested ? (
                        <p className="text-amber-700">Thiếu {line.requested - line.picked}</p>
                      ) : (
                        <p className="text-emerald-700">{tr("Đã soạn đủ")}</p>
                      )}
                      <Button className="w-full" onClick={() => void ship(order)}>
                        {tr("Xác nhận xuất kho")}
                      </Button>
                      <p className="text-xs text-slate-500">
                        Sau khi xác nhận, tồn kho sẽ giảm đúng số đã soạn. Người thực hiện: {user?.name}.
                      </p>
                    </div>
                  ) : null}
                  {order.status === "shipped" ? (
                    <p className="text-emerald-700">
                      Đã xuất · {order.shippedBy} · {order.shippedAt ? formatDateTime(order.shippedAt) : ""}
                    </p>
                  ) : null}
                </Card>
              ) : null}
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}
