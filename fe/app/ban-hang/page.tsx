"use client";

import { useMemo, useState } from "react";
import { Filter, LayoutGrid, List, ShoppingBag } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { CategoryTabs } from "@/components/pos/CategoryTabs";
import { ProductCard } from "@/components/pos/ProductCard";
import { CartPanel } from "@/components/pos/CartPanel";
import { CheckoutSheet } from "@/components/pos/CheckoutSheet";
import { SearchBar } from "@/components/ui/SearchBar";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CategoryId, PaymentMethod } from "@/lib/types";
import { formatVnd } from "@/lib/format";
import { useShallow } from "zustand/react/shallow";
import { usePosStore, selectCartTotals } from "@/store/usePosStore";

export default function PosPage() {
  const products = usePosStore((s) => s.products);
  const addToCart = usePosStore((s) => s.addToCart);
  const totals = usePosStore(useShallow(selectCartTotals));

  const [category, setCategory] = useState<CategoryId>("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const counts = useMemo(() => {
    const map: Partial<Record<CategoryId, number>> = { all: products.length };
    for (const p of products) {
      map[p.categoryId] = (map[p.categoryId] ?? 0) + 1;
    }
    return map;
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (!p.active) return false;
      if (category !== "all" && p.categoryId !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    });
  }, [products, category, query]);

  return (
    <AppShell hideBottomNav search={query} onSearchChange={setQuery} searchPlaceholder="Tìm món / sản phẩm...">
      <div className="flex h-[calc(100dvh-7.5rem)] flex-col gap-3 lg:h-[calc(100dvh-5.5rem)] lg:flex-row">
        {/* Category column — desktop */}
        <aside className="hidden w-[220px] shrink-0 xl:block">
          <div className="pos-card h-full p-3">
            <CategoryTabs
              variant="list"
              value={category}
              onChange={setCategory}
              counts={counts}
            />
          </div>
        </aside>

        {/* Products */}
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="mb-3 rounded-[12px] bg-[var(--pos-banner)] px-4 py-4 sm:px-5">
            <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
              Bán hàng nhanh — Pet Dolphin Store
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Chọn sản phẩm · thêm vào giỏ · thanh toán trong vài thao tác.
            </p>
          </div>

          <div className="mb-3 xl:hidden">
            <CategoryTabs value={category} onChange={setCategory} counts={counts} />
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder="Tìm sản phẩm theo tên hoặc SKU..."
              className="min-w-0 flex-1"
              rect
            />
            <div className="flex rounded-[10px] border border-[var(--pos-border)] bg-white p-1">
              <button
                type="button"
                className={`flex h-10 w-10 items-center justify-center rounded-[8px] ${view === "list" ? "bg-slate-100" : ""}`}
                onClick={() => setView("list")}
                aria-label="Danh sách"
              >
                <List size={18} />
              </button>
              <button
                type="button"
                className={`flex h-10 w-10 items-center justify-center rounded-[8px] ${view === "grid" ? "bg-[var(--pos-green)] text-white" : ""}`}
                onClick={() => setView("grid")}
                aria-label="Lưới"
              >
                <LayoutGrid size={18} />
              </button>
            </div>
            <button
              type="button"
              className="pos-btn pos-btn-primary !min-h-11 xl:hidden"
              onClick={() => setFilterOpen(true)}
            >
              <Filter size={16} />
              Lọc
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pb-24 lg:pb-0">
            {filtered.length === 0 ? (
              <EmptyState
                title="Không tìm thấy sản phẩm"
                description="Thử đổi danh mục hoặc từ khóa tìm kiếm."
              />
            ) : view === "grid" ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
                {filtered.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    mode="pos"
                    onAdd={() => addToCart(p.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((p) => (
                  <div
                    key={p.id}
                    className="pos-card flex items-center gap-3 p-3"
                  >
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl"
                      style={{ background: p.imageColor }}
                    >
                      {p.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{p.name}</p>
                      <p className="text-xs text-slate-400">
                        {p.sku} · Tồn {p.stock}
                      </p>
                      <p className="font-bold">{formatVnd(p.sellPrice)}</p>
                    </div>
                    <button
                      type="button"
                      className="pos-btn pos-btn-primary !min-h-10 !px-4"
                      disabled={p.stock <= 0}
                      onClick={() => addToCart(p.id)}
                    >
                      Thêm
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Cart — desktop */}
        <aside className="hidden w-[340px] shrink-0 lg:block">
          <div className="pos-card h-full p-4">
            <CartPanel
              paymentMethod={method}
              onPaymentMethodChange={setMethod}
              onCheckout={() => setCheckoutOpen(true)}
            />
          </div>
        </aside>
      </div>

      {/* Mobile sticky cart */}
      {totals.count > 0 ? (
        <button
          type="button"
          className="fixed right-3 bottom-[max(1rem,env(safe-area-inset-bottom))] left-3 z-40 flex items-center justify-between rounded-full bg-[var(--pos-green)] px-5 py-3.5 text-white shadow-lg lg:hidden"
          onClick={() => setMobileCartOpen(true)}
        >
          <span className="inline-flex items-center gap-2 font-semibold">
            <ShoppingBag size={18} />
            {totals.count} sản phẩm
          </span>
          <span className="font-bold">{formatVnd(totals.total)}</span>
        </button>
      ) : null}

      {mobileCartOpen ? (
        <>
          <button
            type="button"
            className="pos-sheet-backdrop lg:hidden"
            onClick={() => setMobileCartOpen(false)}
            aria-label="Đóng giỏ"
          />
          <div className="pos-sheet p-4 lg:hidden">
            <CartPanel
              compact
              paymentMethod={method}
              onPaymentMethodChange={setMethod}
              onCheckout={() => {
                setMobileCartOpen(false);
                setCheckoutOpen(true);
              }}
            />
          </div>
        </>
      ) : null}

      {filterOpen ? (
        <>
          <button
            type="button"
            className="pos-sheet-backdrop"
            onClick={() => setFilterOpen(false)}
            aria-label="Đóng lọc"
          />
          <div className="pos-sheet p-4">
            <h2 className="mb-3 text-lg font-bold">Lọc danh mục</h2>
            <CategoryTabs
              variant="list"
              value={category}
              onChange={(id) => {
                setCategory(id);
                setFilterOpen(false);
              }}
              counts={counts}
            />
          </div>
        </>
      ) : null}

      <CheckoutSheet
        open={checkoutOpen}
        method={method}
        onClose={() => setCheckoutOpen(false)}
      />
    </AppShell>
  );
}
