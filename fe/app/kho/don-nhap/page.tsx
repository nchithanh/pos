"use client";

import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { AppShell } from "@/components/layout/app-shell";
import { WarehouseNav } from "@/components/kho/warehouse-nav";
import { EmptyBlock, FilterChip, StatusPill, fieldClass, purchaseTone } from "@/components/kho/ui";
import { PackageBadge } from "@/components/finance/widgets";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import { confirmReceive } from "@/lib/warehouse/ops";
import { PURCHASE_LABEL, type PurchaseLine, type PurchaseOrder } from "@/lib/warehouse/types";
import { useAuthStore } from "@/stores/auth-store";
import { useWarehouseStore } from "@/stores/warehouse-store";
import { formatDateTime, formatVnd, uid } from "@/lib/utils";

export default function PurchasePage() {
  const products = useLiveQuery(() => db.products.toArray()) ?? [];
  const suppliers = useLiveQuery(() => db.suppliers.toArray()) ?? [];
  const users = useLiveQuery(() => db.users.toArray()) ?? [];
  const user = useAuthStore((s) => s.user);
  const purchases = useWarehouseStore((s) => s.purchases);
  const ensureDemo = useWarehouseStore((s) => s.ensureDemo);
  const savePurchase = useWarehouseStore((s) => s.savePurchase);
  const addDamaged = useWarehouseStore((s) => s.addDamaged);
  const [open, setOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("50");
  const [statusFilter, setStatusFilter] = useState("all");
  const [range, setRange] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const current = purchases.find((p) => p.id === open) ?? null;

  useEffect(() => {
    if (products.length && suppliers.length && users.length) {
      ensureDemo(products, suppliers, users);
    }
  }, [products, suppliers, users, ensureDemo]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    if (status) setStatusFilter(status);
    if (params.get("create") === "1") setCreating(true);
    const product = params.get("product");
    if (product) {
      setProductId(product);
      setCreating(true);
    }
    const openId = params.get("open");
    if (openId) setOpen(openId);
  }, []);

  const visible = useMemo(() => {
    return purchases.filter((po) => {
      if (statusFilter === "working") {
        if (po.status !== "receiving" && po.status !== "variance") return false;
      } else if (statusFilter !== "all" && po.status !== statusFilter) return false;
      if (supplierFilter !== "all" && po.supplierId !== supplierFilter) return false;
      if (range !== "all") {
        const days = range === "7" ? 7 : 30;
        if (Date.now() - new Date(po.createdAt).getTime() > days * 86400000) return false;
      }
      return true;
    });
  }, [purchases, statusFilter, supplierFilter, range]);

  const updateLine = (po: PurchaseOrder, index: number, patch: Partial<PurchaseLine>) => {
    const lines = po.lines.map((l, i) => (i === index ? { ...l, ...patch } : l));
    const hasVariance = lines.some((l) => l.received !== l.ordered || l.damaged > 0);
    savePurchase({
      ...po,
      lines,
      status: po.status === "done" ? po.status : hasVariance ? "variance" : "receiving",
    });
  };

  const confirm = async (po: PurchaseOrder) => {
    if (!user) return;
    try {
      const posted = await confirmReceive(po, user);
      for (const line of po.lines) {
        if (line.damaged > 0) addDamaged(line.productId, line.damaged);
      }
      savePurchase({
        ...po,
        status: "done",
        receivedBy: user.name,
        receivedAt: new Date().toISOString(),
      });
      const short = po.lines
        .filter((l) => l.received < l.ordered)
        .map((l) => `${l.name} thiếu ${l.ordered - l.received}`)
        .join(", ");
      notify.success(
        short
          ? `Đã nhập ${posted.code}. ${short}.`
          : `Đã nhập kho ${posted.code}`,
      );
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Không nhập được");
    }
  };

  const create = () => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    const product = products.find((p) => p.id === productId);
    if (!supplier || !product || !user) {
      notify.error("Chọn nhà cung cấp và sản phẩm");
      return;
    }
    const n = Number(qty) || 0;
    if (n <= 0) {
      notify.error("Số lượng không hợp lệ");
      return;
    }
    const po: PurchaseOrder = {
      id: uid("po"),
      code: `NK${String(purchases.length + 90).padStart(5, "0")}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      status: "awaiting_receive",
      expectedAt: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      createdBy: user.name,
      note: "",
      payLater: true,
      lines: [
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          ordered: n,
          received: n,
          damaged: 0,
          cost: product.costPrice,
        },
      ],
    };
    savePurchase(po);
    setCreating(false);
    setOpen(po.id);
    notify.success("Đã tạo đơn nhập — kiểm nhận số thực nhận trước khi nhập kho");
  };

  return (
    <AppShell>
      <PageHeader
        title="Đơn nhập hàng"
        description="Kiểm nhận theo số thực nhận. Tồn chỉ tăng đúng số hàng tốt đã nhận."
        actions={
          <Button size="sm" onClick={() => setCreating((v) => !v)}>
            + Đơn nhập hàng
          </Button>
        }
      />
      <WarehouseNav />
      {creating ? (
        <Card className="mb-4 space-y-3 p-4">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-500">Nhà cung cấp</span>
            <select
              className="min-h-11 w-full rounded-[10px] border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-900"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">Chọn</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-500">Sản phẩm</span>
            <select
              className="min-h-11 w-full rounded-[10px] border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-900"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">Chọn</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-500">Số lượng đặt</span>
            <Input value={qty} onChange={(e) => setQty(e.target.value)} type="number" />
          </label>
          <Button onClick={create}>Lưu đơn</Button>
        </Card>
      ) : null}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <FilterChip active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
          Tất cả
        </FilterChip>
        <FilterChip active={statusFilter === "awaiting_receive"} onClick={() => setStatusFilter("awaiting_receive")}>
          Chờ kiểm nhận
        </FilterChip>
        <FilterChip active={statusFilter === "working"} onClick={() => setStatusFilter("working")}>
          Đang nhập
        </FilterChip>
        <FilterChip active={statusFilter === "done"} onClick={() => setStatusFilter("done")}>
          Hoàn tất
        </FilterChip>
        <FilterChip active={range === "7"} onClick={() => setRange(range === "7" ? "all" : "7")}>
          7 ngày
        </FilterChip>
        <FilterChip active={range === "30"} onClick={() => setRange(range === "30" ? "all" : "30")}>
          30 ngày
        </FilterChip>
        <select
          className={fieldClass}
          aria-label="Nhà cung cấp"
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
        >
          <option value="all">Mọi nhà cung cấp</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {visible.length === 0 ? (
        <EmptyBlock
          title="Chưa có phiếu nhập"
          body="Tạo đơn nhập để kiểm nhận số thực nhận trước khi cộng tồn."
        />
      ) : null}

      <ul className="space-y-2">
        {visible.map((po) => {
          const total = po.lines.reduce((s, l) => s + l.ordered * l.cost, 0);
          return (
          <li key={po.id} className="group">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 rounded-[10px] border border-slate-200 px-3 py-3 text-left shadow-sm hover:border-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-slate-700"
              onClick={() => setOpen(po.id === open ? null : po.id)}
            >
              <span className="min-w-0">
                <span className="block font-semibold">
                  {po.code} · {po.supplierName}
                </span>
                <span className="text-xs text-slate-500">
                  {formatDateTime(po.createdAt)} · {po.createdBy} · {po.lines.length} dòng · {formatVnd(total)}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className="hidden text-xs font-semibold text-emerald-700 group-hover:inline">
                  Mở phiếu
                </span>
                <StatusPill label={PURCHASE_LABEL[po.status]} tone={purchaseTone(po.status)} />
              </span>
            </button>
            {current?.id === po.id ? (
              <Card className="mt-2 space-y-3 p-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold">Thực nhận</h2>
                  <PackageBadge tier="basic" />
                </div>
                {po.lines.map((line, index) => {
                  const gap = line.ordered - line.received;
                  return (
                    <div key={line.productId} className="rounded-[10px] bg-slate-50 p-3 text-sm dark:bg-slate-800">
                      <p className="font-semibold">{line.name}</p>
                      <p className="text-slate-500">Đặt {line.ordered} · Giá {formatVnd(line.cost)}</p>
                      <label className="mt-2 block">
                        <span className="mb-1 block text-slate-500">Thực nhận</span>
                        <Input
                          type="number"
                          value={line.received}
                          disabled={po.status === "done"}
                          onChange={(e) =>
                            updateLine(po, index, { received: Number(e.target.value) || 0 })
                          }
                        />
                      </label>
                      <label className="mt-2 block">
                        <span className="mb-1 block text-slate-500">Hàng hỏng (không nhập bán)</span>
                        <Input
                          type="number"
                          value={line.damaged}
                          disabled={po.status === "done"}
                          onChange={(e) =>
                            updateLine(po, index, { damaged: Number(e.target.value) || 0 })
                          }
                        />
                      </label>
                      {gap !== 0 ? (
                        <p className="mt-2 font-semibold text-amber-700">
                          {gap > 0 ? `Thiếu ${gap}` : `Thừa ${-gap}`}
                        </p>
                      ) : (
                        <p className="mt-2 text-emerald-700">Đủ hàng</p>
                      )}
                    </div>
                  );
                })}
                <p className="text-sm">
                  Tổng hàng tốt:{" "}
                  {formatVnd(
                    po.lines.reduce(
                      (s, l) => s + Math.max(0, l.received - l.damaged) * l.cost,
                      0,
                    ),
                  )}
                  {po.payLater ? " · ghi công nợ nhà cung cấp" : ""}
                </p>
                {po.status !== "done" ? (
                  <Button className="w-full" onClick={() => void confirm(po)}>
                    Xác nhận nhập kho
                  </Button>
                ) : (
                  <p className="text-sm text-emerald-700">
                    Hoàn tất · {po.receivedBy} · tồn đã tăng theo số thực nhận
                  </p>
                )}
              </Card>
            ) : null}
          </li>
          );
        })}
      </ul>
    </AppShell>
  );
}
