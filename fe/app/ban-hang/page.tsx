"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Minus,
  Pause,
  Plus,
  ShoppingBag,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { ReceiptActions } from "@/components/pos/ReceiptActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { db, getStockStatus } from "@/lib/db";
import { checkoutOrder, calcLineTotal } from "@/lib/services/orders";
import { cn, formatDateTime, formatVnd, uid } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import type { Order, PaymentMethod, Product } from "@/types";

export default function PosPage() {
  const products = useLiveQuery(() => db.products.filter((p) => p.active).toArray());
  const categories = useLiveQuery(() => db.categories.orderBy("sort").toArray());
  const customers = useLiveQuery(() => db.customers.toArray());
  const held = useLiveQuery(() => db.heldCarts.orderBy("createdAt").reverse().toArray());
  const settings = useLiveQuery(() => db.settings.get("store"));
  const user = useAuthStore((s) => s.user);
  const shift = useAuthStore((s) => s.shift);

  const lines = useCartStore((s) => s.lines);
  const discount = useCartStore((s) => s.discount);
  const customerId = useCartStore((s) => s.customerId);
  const addProduct = useCartStore((s) => s.addProduct);
  const setQty = useCartStore((s) => s.setQty);
  const removeLine = useCartStore((s) => s.removeLine);
  const clear = useCartStore((s) => s.clear);
  const setDiscount = useCartStore((s) => s.setDiscount);
  const setCustomerId = useCartStore((s) => s.setCustomerId);
  const loadHeld = useCartStore((s) => s.loadHeld);

  const [categoryId, setCategoryId] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [cash, setCash] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [mobileCart, setMobileCart] = useState(false);
  const [success, setSuccess] = useState<Order | null>(null);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [newCusName, setNewCusName] = useState("");
  const [newCusPhone, setNewCusPhone] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const [bumpId, setBumpId] = useState<string | null>(null);

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

  const totals = useMemo(() => {
    const subtotal = lines.reduce((s, l) => {
      const p = productMap.get(l.productId);
      if (!p) return s;
      return s + calcLineTotal(p.sellPrice, l.quantity, l.discountPercent);
    }, 0);
    const disc = Math.min(discount, subtotal);
    const total = subtotal - disc;
    const count = lines.reduce((s, l) => s + l.quantity, 0);
    return { subtotal, discount: disc, total, count };
  }, [lines, discount, productMap]);

  const tryAdd = (p: Product) => {
    const existing = lines.find((l) => l.productId === p.id)?.quantity ?? 0;
    if (existing + 1 > p.stock) {
      toast.error(`Chỉ còn ${p.stock} ${p.unit}`);
      return;
    }
    addProduct(p.id);
    setBumpId(p.id);
    setTimeout(() => setBumpId(null), 400);
  };

  // Barcode / keyboard wedge: Enter trên ô search
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
      tryAdd(filtered[0]);
      setQuery("");
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "F2") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "F4" && totals.count > 0) {
        e.preventDefault();
        setCheckoutOpen(true);
      }
      if (e.key === "Escape") {
        setCheckoutOpen(false);
        setMobileCart(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [totals.count]);

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
    toast.success("Đã giữ đơn");
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
    toast.success("Đã mở lại đơn giữ");
  };

  const createCustomer = async () => {
    if (!newCusName.trim() || !newCusPhone.trim()) {
      toast.error("Nhập tên và SĐT");
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
    toast.success("Đã thêm khách");
  };

  const pay = async () => {
    if (!user) return;
    if (!shift) {
      toast.error("Hãy mở ca trước khi bán");
      return;
    }
    try {
      const order = await checkoutOrder({
        lines,
        cartDiscount: discount,
        paymentMethod: method,
        cashReceived: method === "cash" ? Number(cash) || 0 : undefined,
        customerId,
        user,
        shiftId: shift.id,
      });
      clear();
      setCheckoutOpen(false);
      setMobileCart(false);
      setSuccess(order);
      toast.success("Thanh toán thành công");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thanh toán được");
    }
  };

  const CartBody = (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold">Giỏ ({totals.count})</h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={holdCart} disabled={!lines.length}>
            <Pause size={14} /> Giữ
          </Button>
          <Button variant="ghost" size="sm" onClick={clear} disabled={!lines.length}>
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
          ? customers?.find((c) => c.id === customerId)?.name ?? "Khách"
          : "Chọn / thêm khách"}
      </Button>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {lines.length === 0 ? (
          <EmptyState title="Giỏ trống" description="Quét barcode hoặc chạm Thêm." />
        ) : (
          lines.map((l) => {
            const p = productMap.get(l.productId);
            if (!p) return null;
            return (
              <div key={l.productId} className="rounded-[10px] border border-slate-200 p-3 dark:border-slate-700">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-slate-500">{formatVnd(p.sellPrice)}</p>
                  </div>
                  <button type="button" onClick={() => removeLine(l.productId)} aria-label="Xóa">
                    <Trash2 size={14} className="text-slate-400" />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="inline-flex items-center rounded-full border">
                    <button type="button" className="h-9 w-9" onClick={() => setQty(l.productId, l.quantity - 1)}>
                      <Minus size={14} className="mx-auto" />
                    </button>
                    <span className="min-w-8 text-center text-sm font-bold">{l.quantity}</span>
                    <button type="button" className="h-9 w-9" onClick={() => tryAdd(p)}>
                      <Plus size={14} className="mx-auto" />
                    </button>
                  </div>
                  <p className="text-sm font-bold">
                    {formatVnd(calcLineTotal(p.sellPrice, l.quantity, l.discountPercent))}
                  </p>
                </div>
              </div>
            );
          })
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
        <label className="block text-xs">
          <span className="text-slate-500">Giảm giá đơn (đ)</span>
          <Input
            type="number"
            className="mt-1"
            value={discount || ""}
            onChange={(e) => setDiscount(Number(e.target.value) || 0)}
          />
        </label>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Tạm tính</span>
          <span>{formatVnd(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between text-base font-bold">
          <span>Tổng</span>
          <span>{formatVnd(totals.total)}</span>
        </div>
        <div className="grid grid-cols-3 gap-1 sm:grid-cols-5">
          {(["cash", "transfer", "qr", "debt", "split"] as PaymentMethod[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={cn(
                "rounded-[8px] border px-1 py-2 text-[10px] font-semibold",
                method === m
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200",
              )}
            >
              {m === "cash" ? "Tiền mặt" : m === "transfer" ? "CK" : m === "qr" ? "QR" : m === "debt" ? "Nợ" : "Tách"}
            </button>
          ))}
        </div>
        <Button className="w-full" disabled={!lines.length} onClick={() => setCheckoutOpen(true)}>
          Thanh toán · {formatVnd(totals.total)}
        </Button>
        <p className="text-center text-[10px] text-slate-400">F2 tìm · F4 thanh toán</p>
      </div>
    </div>
  );

  return (
    <AppShell>
      <div className="flex h-[calc(100dvh-7.5rem)] flex-col gap-3 lg:h-[calc(100dvh-5.5rem)] lg:flex-row">
        <aside className="hidden w-[210px] shrink-0 xl:block">
          <Card className="h-full space-y-2 overflow-y-auto p-3">
            <h2 className="mb-2 font-bold">Danh mục</h2>
            <button
              type="button"
              onClick={() => setCategoryId("all")}
              className={cn(
                "flex w-full items-center justify-between rounded-[10px] px-3 py-2.5 text-sm font-semibold",
                categoryId === "all" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500" : "hover:bg-slate-50 dark:hover:bg-slate-800",
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
                  categoryId === c.id ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500" : "hover:bg-slate-50 dark:hover:bg-slate-800",
                )}
              >
                <span>{c.emoji} {c.name}</span>
                <span className="text-xs">{counts[c.id] ?? 0}</span>
              </button>
            ))}
          </Card>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <div className="mb-3 rounded-[12px] bg-[var(--banner)] px-4 py-3">
            <h1 className="text-lg font-bold">Bán hàng</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Tìm / quét barcode → thêm → thanh toán. Offline-ready.
            </p>
          </div>
          <div className="mb-3 flex gap-2 overflow-x-auto xl:hidden">
            <button type="button" onClick={() => setCategoryId("all")} className={cn("shrink-0 rounded-full px-3 py-2 text-sm font-semibold", categoryId === "all" ? "bg-emerald-500 text-white" : "bg-white border dark:bg-slate-900")}>Tất cả</button>
            {(categories ?? []).map((c) => (
              <button key={c.id} type="button" onClick={() => setCategoryId(c.id)} className={cn("shrink-0 rounded-full px-3 py-2 text-sm font-semibold", categoryId === c.id ? "bg-emerald-500 text-white" : "bg-white border dark:bg-slate-900")}>
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
          />
          <div className="min-h-0 flex-1 overflow-y-auto pb-24 lg:pb-0">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-4">
              <AnimatePresence>
                {filtered.map((p) => {
                  const status = getStockStatus(p.stock, p.minStock);
                  return (
                    <motion.article
                      key={p.id}
                      layout
                      animate={bumpId === p.id ? { scale: [1, 1.04, 1] } : {}}
                      className="rounded-[12px] border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full text-3xl" style={{ background: p.imageColor }}>
                          {p.emoji}
                        </div>
                        <h3 className="line-clamp-2 min-h-10 text-sm font-bold">{p.name}</h3>
                        <p className="text-xs text-slate-400">{p.sku}</p>
                        <p className="mt-1 font-bold">{formatVnd(p.sellPrice)}</p>
                        <div className="mt-1 flex items-center gap-1">
                          <Badge status={status} />
                          <span className="text-xs text-slate-500">{p.stock}</span>
                        </div>
                      </div>
                      <Button className="mt-3 w-full" size="sm" disabled={p.stock <= 0} onClick={() => tryAdd(p)}>
                        <Plus size={14} /> Thêm
                      </Button>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </section>

        <aside className="hidden w-[340px] shrink-0 lg:block">
          <Card className="h-full p-4">{CartBody}</Card>
        </aside>
      </div>

      {totals.count > 0 ? (
        <button
          type="button"
          className="fixed inset-x-3 bottom-[max(4.5rem,env(safe-area-inset-bottom))] z-40 flex items-center justify-between rounded-full bg-emerald-500 px-5 py-3.5 text-white shadow-lg lg:hidden"
          onClick={() => setMobileCart(true)}
        >
          <span className="inline-flex items-center gap-2 font-semibold">
            <ShoppingBag size={18} /> {totals.count} sản phẩm
          </span>
          <span className="font-bold">{formatVnd(totals.total)}</span>
        </button>
      ) : null}

      {mobileCart ? (
        <>
          <button type="button" className="fixed inset-0 z-50 bg-slate-900/40 lg:hidden" onClick={() => setMobileCart(false)} />
          <div className="fixed inset-x-0 bottom-0 z-[51] max-h-[88vh] overflow-auto rounded-t-[20px] bg-white p-4 dark:bg-slate-900 lg:hidden">
            {CartBody}
          </div>
        </>
      ) : null}

      <Dialog open={checkoutOpen} onClose={() => setCheckoutOpen(false)} title="Xác nhận thanh toán">
        <p className="text-2xl font-bold">{formatVnd(totals.total)}</p>
        <p className="mt-1 text-sm text-slate-500">Phương thức: {method}</p>
        {method === "cash" ? (
          <label className="mt-4 block">
            <span className="text-sm text-slate-500">Tiền khách đưa</span>
            <Input type="number" className="mt-1" value={cash} onChange={(e) => setCash(e.target.value)} autoFocus />
            <div className="mt-2 flex flex-wrap gap-2">
              {[totals.total, 500000, 1000000, 2000000].map((v) => (
                <button key={v} type="button" className="rounded-full border px-3 py-1 text-xs font-semibold" onClick={() => setCash(String(v))}>
                  {formatVnd(v)}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm font-semibold">
              Tiền thừa: {formatVnd(Math.max(0, (Number(cash) || 0) - totals.total))}
            </p>
          </label>
        ) : null}
        {method === "debt" ? (
          <p className="mt-3 rounded-[10px] bg-amber-50 p-3 text-sm text-amber-800">
            Ghi nợ yêu cầu chọn khách hàng.
          </p>
        ) : null}
        {method === "split" ? (
          <p className="mt-3 text-sm text-slate-500">
            Demo: tách bill sẽ ghi nhận đủ tổng bằng chuyển khoản (mở rộng sau).
          </p>
        ) : null}
        <Button className="mt-4 w-full" onClick={pay}>Xác nhận</Button>
      </Dialog>

      <Dialog open={customerOpen} onClose={() => setCustomerOpen(false)} title="Khách hàng">
        <div className="mb-3 max-h-48 space-y-1 overflow-auto">
          <button type="button" className="w-full rounded-[8px] px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => { setCustomerId(undefined); setCustomerOpen(false); }}>
            Khách lẻ
          </button>
          {(customers ?? []).map((c) => (
            <button key={c.id} type="button" className="w-full rounded-[8px] px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => { setCustomerId(c.id); setCustomerOpen(false); }}>
              {c.name} · {c.phone}
            </button>
          ))}
        </div>
        <p className="mb-2 text-xs font-semibold text-slate-500">Thêm nhanh</p>
        <Input className="mb-2" placeholder="Tên" value={newCusName} onChange={(e) => setNewCusName(e.target.value)} />
        <Input className="mb-3" placeholder="SĐT" value={newCusPhone} onChange={(e) => setNewCusPhone(e.target.value)} />
        <Button className="w-full" onClick={createCustomer}>Lưu khách</Button>
      </Dialog>

      <Dialog
        open={!!success}
        onClose={() => setSuccess(null)}
        title="Thanh toán thành công"
        className="max-w-md"
      >
        {success ? (
          <div>
            <div className="text-center">
              <CheckCircle2 className="mx-auto text-emerald-500" size={44} aria-hidden />
              <p className="mt-3 text-lg font-bold tracking-wide">
                ✓ THANH TOÁN THÀNH CÔNG
              </p>
              <p className="mt-2 text-sm font-semibold">Đơn hàng {success.code}</p>
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
          </div>
        ) : null}
      </Dialog>
    </AppShell>
  );
}
