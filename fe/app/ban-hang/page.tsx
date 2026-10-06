"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Minus,
  Pause,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { AppShell } from "@/components/layout/app-shell";
import { ReceiptActions } from "@/components/pos/ReceiptActions";
import { TransferQr } from "@/components/pos/transfer-qr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/hooks/use-confirm";
import { db, getStockStatus } from "@/lib/db";
import { notify } from "@/lib/notify";
import { checkoutOrder, calcLineTotal, POINT_VALUE_VND } from "@/lib/services/orders";
import { paymentLabel } from "@/lib/payment-labels";
import { cn, formatDateTime, formatVnd, uid } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import {
  useCartStore,
  type OrderDiscountMode,
} from "@/stores/cart-store";
import type { Order, PaymentMethod, PaymentSplit, Product } from "@/types";

export default function PosPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <ProductGridSkeleton count={8} />
        </AppShell>
      }
    >
      <PosPageInner />
    </Suspense>
  );
}

function PosPageInner() {
  const { confirm, dialog: confirmDialog } = useConfirm();
  const confirmRef = useRef(confirm);
  confirmRef.current = confirm;
  const products = useLiveQuery(() =>
    db.products.filter((p) => p.active).toArray(),
  );
  const categories = useLiveQuery(() => db.categories.orderBy("sort").toArray());
  const customers = useLiveQuery(() => db.customers.toArray());
  const held = useLiveQuery(() =>
    db.heldCarts.orderBy("createdAt").reverse().toArray(),
  );
  const settings = useLiveQuery(() => db.settings.get("store"));
  const user = useAuthStore((s) => s.user);
  const shift = useAuthStore((s) => s.shift);

  const lines = useCartStore((s) => s.lines);
  const discount = useCartStore((s) => s.discount);
  const discountMode = useCartStore((s) => s.discountMode);
  const discountInput = useCartStore((s) => s.discountInput);
  const customerId = useCartStore((s) => s.customerId);
  const pointsToRedeem = useCartStore((s) => s.pointsToRedeem);
  const addProduct = useCartStore((s) => s.addProduct);
  const setQty = useCartStore((s) => s.setQty);
  const removeLine = useCartStore((s) => s.removeLine);
  const setLineNote = useCartStore((s) => s.setLineNote);
  const setLineDiscount = useCartStore((s) => s.setLineDiscount);
  const clear = useCartStore((s) => s.clear);
  const setOrderDiscount = useCartStore((s) => s.setOrderDiscount);
  const setCustomerId = useCartStore((s) => s.setCustomerId);
  const setPointsToRedeem = useCartStore((s) => s.setPointsToRedeem);
  const loadHeld = useCartStore((s) => s.loadHeld);

  const [categoryId, setCategoryId] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [cash, setCash] = useState("");
  const [splitCash, setSplitCash] = useState("");
  const [splitOther, setSplitOther] = useState("");
  const [splitOtherMethod, setSplitOtherMethod] = useState<"transfer" | "qr">(
    "transfer",
  );
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [mobileCart, setMobileCart] = useState(false);
  const [success, setSuccess] = useState<Order | null>(null);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [newCusName, setNewCusName] = useState("");
  const [newCusPhone, setNewCusPhone] = useState("");
  const [bumpId, setBumpId] = useState<string | null>(null);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [expandedLine, setExpandedLine] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const cid = searchParams.get("customer");
    if (cid) setCustomerId(cid);
  }, [searchParams, setCustomerId]);

  const productMap = useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of products ?? []) m.set(p.id, p);
    return m;
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (products ?? []).filter((p) => {
      if (categoryId !== "all" && p.categoryId !== categoryId) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode ?? "").includes(q)
      );
    });
  }, [products, categoryId, query]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: products?.length ?? 0 };
    for (const p of products ?? []) {
      map[p.categoryId] = (map[p.categoryId] ?? 0) + 1;
    }
    return map;
  }, [products]);

  const selectedCustomer = useMemo(
    () => (customers ?? []).find((c) => c.id === customerId),
    [customers, customerId],
  );

  const totals = useMemo(() => {
    const subtotal = lines.reduce((s, l) => {
      const p = productMap.get(l.productId);
      if (!p) return s;
      return s + calcLineTotal(p.sellPrice, l.quantity, l.discountPercent);
    }, 0);
    const cartDisc = Math.min(discount, subtotal);
    const afterCart = subtotal - cartDisc;
    const maxPts = selectedCustomer
      ? Math.min(
          selectedCustomer.points,
          Math.floor(afterCart / POINT_VALUE_VND),
        )
      : 0;
    const pts = Math.min(pointsToRedeem, maxPts);
    const pointsDisc = pts * POINT_VALUE_VND;
    const total = afterCart - pointsDisc;
    const count = lines.reduce((s, l) => s + l.quantity, 0);
    return {
      subtotal,
      discount: cartDisc + pointsDisc,
      cartDiscount: cartDisc,
      pointsDiscount: pointsDisc,
      pointsUsed: pts,
      maxPoints: maxPts,
      total,
      count,
    };
  }, [lines, productMap, discount, pointsToRedeem, selectedCustomer]);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    if (discountMode !== "percent") return;
    setOrderDiscount("percent", discountInput, totals.subtotal);
  }, [totals.subtotal, discountMode, discountInput, setOrderDiscount]);

  const tryAdd = (p: Product) => {
    const existing = lines.find((l) => l.productId === p.id)?.quantity ?? 0;
    if (existing + 1 > p.stock) {
      notify.error(`Chỉ còn ${p.stock} ${p.unit}`);
      return;
    }
    addProduct(p.id);
    setActiveLineId(p.id);
    setBumpId(p.id);
    notify.success(`Đã thêm ${p.name}`);
    setTimeout(() => setBumpId(null), 350);
  };

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const q = query.trim();
    if (!q) return;
    const byBarcode = (products ?? []).find((p) => p.barcode === q);
    if (byBarcode) {
      tryAdd(byBarcode);
      setQuery("");
      return;
    }
    if (filtered.length === 1) {
      tryAdd(filtered[0]!);
      setQuery("");
    }
  };

  const clearCart = async () => {
    if (!lines.length) return;
    const ok = await confirm({
      title: "Xóa toàn bộ giỏ hàng?",
      description: `${lines.length} dòng sẽ bị xóa. Thao tác không thể hoàn tác.`,
      confirmLabel: "Xóa giỏ",
      variant: "danger",
    });
    if (!ok) return;
    clear();
    setActiveLineId(null);
    notify.info("Đã xóa giỏ hàng");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing =
        tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if (e.key === "F2") {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (e.key === "F4" && totals.count > 0) {
        e.preventDefault();
        setCash(String(totals.total));
        const half = Math.floor(totals.total / 2);
        setSplitCash(String(half));
        setSplitOther(String(totals.total - half));
        setCheckoutOpen(true);
        return;
      }
      if (e.key === "Escape") {
        if (checkoutOpen) {
          setCheckoutOpen(false);
          return;
        }
        if (mobileCart) {
          setMobileCart(false);
          return;
        }
        if (lines.length && !typing) {
          e.preventDefault();
          void (async () => {
            const ok = await confirmRef.current({
              title: "Xóa toàn bộ giỏ hàng?",
              description: `${lines.length} dòng sẽ bị xóa. Thao tác không thể hoàn tác.`,
              confirmLabel: "Xóa giỏ",
              variant: "danger",
            });
            if (!ok) return;
            clear();
            setActiveLineId(null);
            notify.info("Đã xóa giỏ hàng");
          })();
        }
        return;
      }
      if (typing) return;
      if ((e.key === "+" || e.key === "=") && activeLineId) {
        const p = productMap.get(activeLineId);
        if (!p) return;
        const existing =
          lines.find((l) => l.productId === p.id)?.quantity ?? 0;
        if (existing + 1 > p.stock) {
          notify.error(`Chỉ còn ${p.stock} ${p.unit}`);
          return;
        }
        addProduct(p.id);
      }
      if (e.key === "-" && activeLineId) {
        const line = lines.find((l) => l.productId === activeLineId);
        if (line) setQty(activeLineId, line.quantity - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    totals.count,
    totals.total,
    checkoutOpen,
    mobileCart,
    lines,
    activeLineId,
    productMap,
    addProduct,
    setQty,
    clear,
  ]);

  const holdCart = async () => {
    if (!lines.length) return;
    await db.heldCarts.add({
      id: uid("hold"),
      name: `Giữ ${new Date().toLocaleTimeString("vi-VN")}`,
      createdAt: new Date().toISOString(),
      customerId,
      items: lines,
      discount,
    });
    clear();
    notify.success("Đã giữ đơn");
  };

  const resumeHeld = async (id: string) => {
    const h = await db.heldCarts.get(id);
    if (!h) return;
    loadHeld({
      lines: h.items,
      discount: h.discount,
      note: h.note,
      customerId: h.customerId,
    });
    await db.heldCarts.delete(id);
    notify.success("Đã mở lại đơn giữ");
  };

  const createCustomer = async () => {
    if (!newCusName.trim() || !newCusPhone.trim()) {
      notify.error("Nhập tên và SĐT");
      return;
    }
    const id = uid("cus");
    await db.customers.add({
      id,
      name: newCusName.trim(),
      phone: newCusPhone.trim(),
      group: "Khách lẻ",
      points: 0,
      totalSpent: 0,
      visitCount: 0,
      debt: 0,
      createdAt: new Date().toISOString(),
    });
    setCustomerId(id);
    setCustomerOpen(false);
    setNewCusName("");
    setNewCusPhone("");
    notify.success("Đã thêm khách");
  };

  const openCheckout = () => {
    setCash(String(totals.total));
    const half = Math.floor(totals.total / 2);
    setSplitCash(String(half));
    setSplitOther(String(totals.total - half));
    setCheckoutOpen(true);
  };

  const pay = async () => {
    if (!user) return;
    if (!shift) {
      notify.error("Hãy mở ca trước khi bán");
      return;
    }
    let payments: PaymentSplit[] | undefined;
    if (method === "split") {
      const a = Number(splitCash) || 0;
      const b = Number(splitOther) || 0;
      if (Math.abs(a + b - totals.total) > 1) {
        notify.error("Tổng tách bill phải bằng tổng đơn");
        return;
      }
      if (a <= 0 || b <= 0) {
        notify.error("Mỗi phần tách bill phải > 0");
        return;
      }
      payments = [
        { method: "cash", amount: a },
        { method: splitOtherMethod, amount: b },
      ];
    }
    try {
      const order = await checkoutOrder({
        lines,
        cartDiscount: discount,
        pointsToRedeem: totals.pointsUsed,
        paymentMethod: method,
        payments,
        cashReceived:
          method === "cash"
            ? Number(cash) || 0
            : method === "split"
              ? Number(splitCash) || 0
              : undefined,
        customerId,
        user,
        shiftId: shift.id,
      });
      clear();
      setCheckoutOpen(false);
      setMobileCart(false);
      setSuccess(order);
      notify.success("Thanh toán thành công");
    } catch (e) {
      notify.fromError(e, "Không thanh toán được");
    }
  };

  const CartBody = (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold">Giỏ ({totals.count})</h2>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={holdCart}
            disabled={!lines.length}
          >
            <Pause size={14} /> Giữ
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCart}
            disabled={!lines.length}
          >
            Xóa
          </Button>
        </div>
      </div>

      <Button
        variant="outline"
        className="mb-3 w-full justify-start !rounded-[10px]"
        onClick={() => setCustomerOpen(true)}
      >
        <UserPlus size={16} />
        {customerId
          ? (customers?.find((c) => c.id === customerId)?.name ?? "Khách")
          : "Chọn / thêm khách"}
      </Button>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {lines.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Giỏ hàng trống"
            description="Quét barcode hoặc chạm Thêm trên sản phẩm. F2 để tìm nhanh."
          />
        ) : (
          <AnimatePresence initial={false}>
            {lines.map((l) => {
              const p = productMap.get(l.productId);
              if (!p) return null;
              const open = expandedLine === l.productId;
              return (
                <motion.div
                  key={l.productId}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className={cn(
                    "rounded-[10px] border p-3",
                    activeLineId === l.productId
                      ? "border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20"
                      : "border-slate-200 dark:border-slate-700",
                  )}
                  onClick={() => setActiveLineId(l.productId)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      <p className="text-xs text-slate-500">
                        {formatVnd(p.sellPrice)}
                        {(l.discountPercent ?? 0) > 0
                          ? ` · -${l.discountPercent}%`
                          : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Xóa dòng"
                      onClick={(e) => {
                        e.stopPropagation();
                        void (async () => {
                          const ok = await confirm({
                            title: "Xóa khỏi giỏ?",
                            description: `“${p.name}” sẽ bị xóa khỏi đơn hiện tại.`,
                            confirmLabel: "Xóa",
                            variant: "danger",
                          });
                          if (!ok) return;
                          removeLine(l.productId);
                          notify.info("Đã xóa khỏi giỏ");
                        })();
                      }}
                    >
                      <Trash2 size={14} className="text-rose-400" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-full border">
                      <button
                        type="button"
                        className="h-9 w-9"
                        aria-label="Giảm"
                        onClick={() => setQty(l.productId, l.quantity - 1)}
                      >
                        <Minus size={14} className="mx-auto" />
                      </button>
                      <span className="min-w-8 text-center text-sm font-bold">
                        {l.quantity}
                      </span>
                      <button
                        type="button"
                        className="h-9 w-9"
                        aria-label="Tăng"
                        onClick={() => tryAdd(p)}
                      >
                        <Plus size={14} className="mx-auto" />
                      </button>
                    </div>
                    <p className="text-sm font-bold">
                      {formatVnd(
                        calcLineTotal(
                          p.sellPrice,
                          l.quantity,
                          l.discountPercent,
                        ),
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="mt-2 text-xs font-semibold text-emerald-600"
                    onClick={() =>
                      setExpandedLine(open ? null : l.productId)
                    }
                  >
                    {open ? "Ẩn ghi chú / giảm giá" : "Ghi chú / giảm giá dòng"}
                  </button>
                  {open ? (
                    <div className="mt-2 grid gap-2">
                      <Input
                        placeholder="Ghi chú dòng (ít đá, tách bill…)"
                        value={l.note ?? ""}
                        onChange={(e) =>
                          setLineNote(l.productId, e.target.value)
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                      <label className="block text-xs">
                        <span className="text-slate-500">Giảm giá dòng (%)</span>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          className="mt-1"
                          value={l.discountPercent ?? 0}
                          onChange={(e) =>
                            setLineDiscount(
                              l.productId,
                              Number(e.target.value) || 0,
                            )
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                      </label>
                    </div>
                  ) : null}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {(held?.length ?? 0) > 0 ? (
        <div className="mt-2 space-y-1 border-t pt-2">
          <p className="text-xs font-semibold text-slate-500">Đơn đang giữ</p>
          {held?.slice(0, 3).map((h) => (
            <button
              key={h.id}
              type="button"
              className="flex w-full items-center justify-between rounded-[8px] bg-slate-50 px-2 py-1.5 text-xs dark:bg-slate-800"
              onClick={() => resumeHeld(h.id)}
            >
              <span>{h.name}</span>
              <span className="text-emerald-600">Mở</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-3 space-y-2 border-t pt-3">
        <div className="flex gap-2">
          {(
            [
              ["amount", "Giảm đ"],
              ["percent", "Giảm %"],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold",
                discountMode === mode
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200",
              )}
              onClick={() =>
                setOrderDiscount(mode as OrderDiscountMode, discountInput, totals.subtotal)
              }
            >
              {label}
            </button>
          ))}
        </div>
        <label className="block text-xs">
          <span className="text-slate-500">
            {discountMode === "percent"
              ? "Giảm giá đơn (%)"
              : "Giảm giá đơn (đ)"}
          </span>
          <Input
            type="number"
            className="mt-1"
            value={discountInput || ""}
            onChange={(e) =>
              setOrderDiscount(
                discountMode,
                Number(e.target.value) || 0,
                totals.subtotal,
              )
            }
          />
        </label>
        {selectedCustomer ? (
          <div className="rounded-[10px] border border-emerald-200 bg-emerald-50/50 p-2 dark:bg-emerald-950/30">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                Điểm: {selectedCustomer.points}
              </span>
              <span className="text-slate-500">1 điểm = 1.000đ</span>
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                min={0}
                max={totals.maxPoints}
                value={pointsToRedeem || ""}
                placeholder="Đổi điểm"
                onChange={(e) =>
                  setPointsToRedeem(
                    Math.min(
                      totals.maxPoints,
                      Number(e.target.value) || 0,
                    ),
                  )
                }
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setPointsToRedeem(totals.maxPoints)}
              >
                Max
              </Button>
            </div>
          </div>
        ) : null}
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Tạm tính</span>
          <span>{formatVnd(totals.subtotal)}</span>
        </div>
        {totals.discount > 0 ? (
          <div className="flex justify-between text-sm text-rose-600">
            <span>
              Giảm giá
              {totals.pointsUsed
                ? ` (điểm ${totals.pointsUsed})`
                : ""}
            </span>
            <span>-{formatVnd(totals.discount)}</span>
          </div>
        ) : null}
        <div className="flex justify-between text-base font-bold">
          <span>Tổng</span>
          <span>{formatVnd(totals.total)}</span>
        </div>
        <div className="grid grid-cols-3 gap-1 sm:grid-cols-5">
          {(["cash", "transfer", "qr", "debt", "split"] as PaymentMethod[]).map(
            (m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={cn(
                  "rounded-[8px] border px-1 py-2 text-[10px] font-semibold",
                  method === m
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950"
                    : "border-slate-200 dark:border-slate-700",
                )}
              >
                {m === "cash"
                  ? "Tiền mặt"
                  : m === "transfer"
                    ? "CK"
                    : m === "qr"
                      ? "QR"
                      : m === "debt"
                        ? "Nợ"
                        : "Tách"}
              </button>
            ),
          )}
        </div>
        <Button
          className="w-full"
          disabled={!lines.length}
          onClick={openCheckout}
        >
          Thanh toán · {formatVnd(totals.total)}
        </Button>
        <p className="text-center text-[10px] text-slate-400">
          F2 tìm · F4 thanh toán · Esc xóa giỏ · +/- số lượng dòng
        </p>
      </div>
    </div>
  );

  return (
    <AppShell>
      {confirmDialog}
      <div className="flex h-[calc(100dvh-7.5rem)] flex-col gap-3 lg:h-[calc(100dvh-5.5rem)] lg:flex-row">
        <aside className="hidden w-[210px] shrink-0 xl:block">
          <Card className="h-full space-y-2 overflow-y-auto p-3">
            <h2 className="mb-2 font-bold">Danh mục</h2>
            <button
              type="button"
              onClick={() => setCategoryId("all")}
              className={cn(
                "flex w-full items-center justify-between rounded-[10px] px-3 py-2.5 text-sm font-semibold",
                categoryId === "all"
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500 dark:bg-emerald-950"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800",
              )}
            >
              <span>🐾 Tất cả</span>
              <span className="text-xs">{counts.all ?? 0}</span>
            </button>
            {(categories ?? []).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-[10px] px-3 py-2.5 text-sm font-semibold",
                  categoryId === c.id
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500 dark:bg-emerald-950"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800",
                )}
              >
                <span>
                  {c.emoji} {c.name}
                </span>
                <span className="text-xs">{counts[c.id] ?? 0}</span>
              </button>
            ))}
          </Card>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <div className="mb-3 rounded-[12px] bg-[var(--banner)] px-4 py-3">
            <h1 className="text-lg font-bold">Bán hàng</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Quét barcode · chọn hàng · thanh toán nhanh
            </p>
          </div>
          <div className="mb-3 flex gap-2 overflow-x-auto xl:hidden">
            <button
              type="button"
              onClick={() => setCategoryId("all")}
              className={cn(
                "shrink-0 rounded-full px-3 py-2 text-sm font-semibold",
                categoryId === "all"
                  ? "bg-emerald-500 text-white"
                  : "border bg-white dark:bg-slate-900",
              )}
            >
              Tất cả
            </button>
            {(categories ?? []).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-2 text-sm font-semibold",
                  categoryId === c.id
                    ? "bg-emerald-500 text-white"
                    : "border bg-white dark:bg-slate-900",
                )}
              >
                {c.emoji} {c.name}
              </button>
            ))}
          </div>
          <Input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onSearchKey}
            placeholder="Tìm tên / SKU / quét barcode rồi Enter…"
            className="mb-3 !rounded-full"
            autoFocus
          />
          <div className="min-h-0 flex-1 overflow-y-auto pb-24 lg:pb-0">
            {products === undefined ? (
              <ProductGridSkeleton count={8} />
            ) : !filtered.length ? (
              <EmptyState
                title="Không tìm thấy sản phẩm"
                description="Thử đổi danh mục hoặc từ khóa."
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-4">
                {filtered.map((p) => {
                  const status = getStockStatus(p.stock, p.minStock);
                  const disabled = p.stock <= 0;
                  return (
                    <motion.article
                      key={p.id}
                      layout
                      whileHover={disabled ? undefined : { y: -2, scale: 1.01 }}
                      whileTap={disabled ? undefined : { scale: 0.98 }}
                      animate={
                        bumpId === p.id ? { scale: [1, 1.05, 1] } : { scale: 1 }
                      }
                      className={cn(
                        "group cursor-pointer rounded-[12px] border bg-white p-3 shadow-sm transition dark:bg-slate-900",
                        disabled
                          ? "border-slate-100 opacity-60 dark:border-slate-800"
                          : "border-slate-200 hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:hover:border-emerald-700",
                      )}
                      onClick={() => {
                        if (!disabled) tryAdd(p);
                      }}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div
                          className="relative mb-2 flex h-24 w-full items-center justify-center overflow-hidden rounded-[10px] text-4xl"
                          style={{
                            background: p.imageUrl
                              ? undefined
                              : `linear-gradient(145deg, ${p.imageColor}, #fff)`,
                          }}
                        >
                          {p.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="drop-shadow-sm">{p.emoji}</span>
                          )}
                          <div className="absolute inset-0 z-10 flex items-start justify-end p-1">
                            <Badge status={status} />
                          </div>
                        </div>
                        <h3 className="line-clamp-2 min-h-10 text-sm font-bold">
                          {p.name}
                        </h3>
                        <p className="text-xs text-slate-400">{p.sku}</p>
                        <p className="mt-1 text-base font-bold text-emerald-700 dark:text-emerald-400">
                          {formatVnd(p.sellPrice)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Tồn {p.stock} {p.unit}
                        </p>
                      </div>
                      <Button
                        className="mt-3 w-full"
                        size="sm"
                        disabled={disabled}
                        onClick={(e) => {
                          e.stopPropagation();
                          tryAdd(p);
                        }}
                      >
                        <Plus size={14} /> Thêm
                      </Button>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="hidden w-[360px] shrink-0 lg:block">
          <Card className="h-full p-4">{CartBody}</Card>
        </aside>
      </div>

      {totals.count > 0 ? (
        <motion.button
          type="button"
          layout
          className="fixed inset-x-3 bottom-[max(4.5rem,env(safe-area-inset-bottom))] z-40 flex items-center justify-between rounded-full bg-emerald-500 px-5 py-3.5 text-white shadow-lg lg:hidden"
          onClick={() => setMobileCart(true)}
        >
          <span className="inline-flex items-center gap-2 font-semibold">
            <ShoppingBag size={18} /> {totals.count} sản phẩm
          </span>
          <span className="font-bold">{formatVnd(totals.total)}</span>
        </motion.button>
      ) : null}

      {mobileCart ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-50 bg-slate-900/40 lg:hidden"
            onClick={() => setMobileCart(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[51] max-h-[88vh] overflow-auto rounded-t-[20px] bg-white p-4 dark:bg-slate-900 lg:hidden">
            {CartBody}
          </div>
        </>
      ) : null}

      <Dialog
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        title="Xác nhận thanh toán"
        className="max-w-md"
      >
        <p className="text-2xl font-bold">{formatVnd(totals.total)}</p>
        <p className="mt-1 text-sm text-slate-500">
          Phương thức: {paymentLabel(method)}
        </p>

        {method === "cash" ? (
          <label className="mt-4 block">
            <span className="text-sm text-slate-500">Tiền khách đưa</span>
            <Input
              type="number"
              className="mt-1"
              value={cash}
              onChange={(e) => setCash(e.target.value)}
              autoFocus
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {[totals.total, 500000, 1000000, 2000000].map((v) => (
                <button
                  key={v}
                  type="button"
                  className="rounded-full border px-3 py-1 text-xs font-semibold"
                  onClick={() => setCash(String(v))}
                >
                  {formatVnd(v)}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm font-semibold text-emerald-700">
              Tiền thừa:{" "}
              {formatVnd(Math.max(0, (Number(cash) || 0) - totals.total))}
            </p>
          </label>
        ) : null}

        {method === "debt" ? (
          <p className="mt-3 rounded-[10px] bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            Ghi nợ yêu cầu chọn khách hàng trước khi xác nhận.
          </p>
        ) : null}

        {method === "transfer" ? <TransferQr amount={totals.total} /> : null}

        {method === "split" ? (
          <div className="mt-4 space-y-3">
            <label className="block text-sm">
              <span className="text-slate-500">Tiền mặt</span>
              <Input
                type="number"
                className="mt-1"
                value={splitCash}
                onChange={(e) => setSplitCash(e.target.value)}
              />
            </label>
            <div className="flex gap-2">
              {(
                [
                  ["transfer", "Chuyển khoản"],
                  ["qr", "QR"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold",
                    splitOtherMethod === id
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200",
                  )}
                  onClick={() => setSplitOtherMethod(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="block text-sm">
              <span className="text-slate-500">
                {splitOtherMethod === "qr" ? "QR" : "Chuyển khoản"}
              </span>
              <Input
                type="number"
                className="mt-1"
                value={splitOther}
                onChange={(e) => setSplitOther(e.target.value)}
              />
            </label>
            <p
              className={cn(
                "text-sm font-semibold",
                Math.abs(
                  (Number(splitCash) || 0) +
                    (Number(splitOther) || 0) -
                    totals.total,
                ) <= 1
                  ? "text-emerald-600"
                  : "text-rose-600",
              )}
            >
              Tổng tách:{" "}
              {formatVnd(
                (Number(splitCash) || 0) + (Number(splitOther) || 0),
              )}{" "}
              / {formatVnd(totals.total)}
            </p>
            {splitOtherMethod === "transfer" ? (
              <TransferQr amount={Number(splitOther) || 0} />
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setCheckoutOpen(false)}
          >
            Hủy
          </Button>
          <Button className="flex-1" onClick={pay}>
            Xác nhận
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={customerOpen}
        onClose={() => setCustomerOpen(false)}
        title="Khách hàng"
      >
        <div className="mb-3 max-h-48 space-y-1 overflow-auto">
          <button
            type="button"
            className="w-full rounded-[8px] px-3 py-2 text-left text-sm hover:bg-slate-50"
            onClick={() => {
              setCustomerId(undefined);
              setCustomerOpen(false);
            }}
          >
            Khách lẻ
          </button>
          {(customers ?? []).map((c) => (
            <button
              key={c.id}
              type="button"
              className="w-full rounded-[8px] px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              onClick={() => {
                setCustomerId(c.id);
                setCustomerOpen(false);
              }}
            >
              {c.name} · {c.phone}
            </button>
          ))}
        </div>
        <p className="mb-2 text-xs font-semibold text-slate-500">Thêm nhanh</p>
        <Input
          className="mb-2"
          placeholder="Tên"
          value={newCusName}
          onChange={(e) => setNewCusName(e.target.value)}
        />
        <Input
          className="mb-3"
          placeholder="SĐT"
          value={newCusPhone}
          onChange={(e) => setNewCusPhone(e.target.value)}
        />
        <Button className="w-full" onClick={createCustomer}>
          Lưu khách
        </Button>
      </Dialog>

      <Dialog
        open={!!success}
        onClose={() => setSuccess(null)}
        title="Thanh toán thành công"
        className="max-w-md"
      >
        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.6 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 16 }}
              >
                <CheckCircle2
                  className="mx-auto text-emerald-500"
                  size={48}
                  aria-hidden
                />
              </motion.div>
              <p className="mt-3 text-lg font-bold tracking-wide">
                ✓ THANH TOÁN THÀNH CÔNG
              </p>
              <p className="mt-2 text-sm font-semibold">
                Đơn hàng {success.code}
              </p>
              <p className="text-xs text-slate-500">
                {formatDateTime(success.createdAt)}
              </p>
              <p className="mt-4 text-sm text-slate-500">Tổng tiền</p>
              <p className="text-3xl font-bold text-emerald-600">
                {formatVnd(success.total)}
              </p>
            </div>
            <ReceiptActions
              className="mt-5"
              order={success}
              store={settings}
              onOrderChange={setSuccess}
            />
            <Button className="mt-3 w-full" onClick={() => setSuccess(null)}>
              Xong
            </Button>
          </motion.div>
        ) : null}
      </Dialog>
    </AppShell>
  );
}
