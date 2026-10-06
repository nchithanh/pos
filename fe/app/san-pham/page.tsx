"use client";

import { useMemo, useState } from "react";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchBar } from "@/components/ui/SearchBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CategoryTabs } from "@/components/pos/CategoryTabs";
import { AddProductCard, ProductCard } from "@/components/pos/ProductCard";
import { ProductFormModal } from "@/components/pos/ProductFormModal";
import { CATEGORY_MAP } from "@/data/categories";
import { getStockStatus } from "@/data/products";
import type { CategoryId, Product } from "@/lib/types";
import { formatVnd } from "@/lib/format";
import { usePosStore } from "@/store/usePosStore";

export default function ProductsPage() {
  const products = usePosStore((s) => s.products);
  const deleteProduct = usePosStore((s) => s.deleteProduct);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId>("all");
  const [view, setView] = useState<"table" | "grid">("grid");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [viewing, setViewing] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "all" && p.categoryId !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    });
  }, [products, query, category]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <AppShell>
      <PageHeader
        title="Sản phẩm"
        description={`${products.length} sản phẩm đang quản lý`}
        actions={
          <button type="button" className="pos-btn pos-btn-primary" onClick={openCreate}>
            <Plus size={16} />
            Thêm sản phẩm
          </button>
        }
      />

      <div className="mb-4 rounded-[12px] bg-[var(--pos-banner)] px-4 py-4">
        <h2 className="text-lg font-bold">Quản lý menu cửa hàng dễ dàng</h2>
        <p className="mt-1 text-sm text-slate-600">
          Cập nhật giá, tồn kho và danh mục — đồng bộ ngay với màn hình bán hàng.
        </p>
      </div>

      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchBar
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(1);
          }}
          placeholder="Tìm sản phẩm..."
          className="flex-1"
          rect
        />
        <div className="flex gap-2">
          <button
            type="button"
            className={`pos-btn ${view === "grid" ? "pos-btn-primary" : "pos-btn-outline"}`}
            onClick={() => setView("grid")}
          >
            Lưới
          </button>
          <button
            type="button"
            className={`pos-btn ${view === "table" ? "pos-btn-primary" : "pos-btn-outline"}`}
            onClick={() => setView("table")}
          >
            Bảng
          </button>
        </div>
      </div>

      <div className="mb-4">
        <CategoryTabs
          value={category}
          onChange={(id) => {
            setCategory(id);
            setPage(1);
          }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="pos-card">
          <EmptyState
            title="Chưa có sản phẩm phù hợp"
            action={
              <button type="button" className="pos-btn pos-btn-primary" onClick={openCreate}>
                Thêm sản phẩm
              </button>
            }
          />
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          <AddProductCard
            onClick={openCreate}
            label={
              category === "all"
                ? "Thêm sản phẩm mới"
                : `Thêm vào ${CATEGORY_MAP[category].name}`
            }
          />
          {filtered.map((p) => (
            <div key={p.id} className="relative">
              <ProductCard
                product={p}
                mode="manage"
                onOpenMenu={() => setEditing(p)}
              />
              <div className="mt-2 grid grid-cols-3 gap-1">
                <button
                  type="button"
                  className="pos-btn pos-btn-outline !min-h-9 !rounded-[10px] !px-2 text-xs"
                  onClick={() => setViewing(p)}
                >
                  <Eye size={14} />
                </button>
                <button
                  type="button"
                  className="pos-btn pos-btn-outline !min-h-9 !rounded-[10px] !px-2 text-xs"
                  onClick={() => {
                    setEditing(p);
                    setFormOpen(true);
                  }}
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  className="pos-btn pos-btn-danger !min-h-9 !rounded-[10px] !px-2 text-xs"
                  onClick={() => setDeleteId(p.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {pageItems.map((p) => (
              <article key={p.id} className="pos-card p-3">
                <div className="flex gap-3">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-full text-2xl"
                    style={{ background: p.imageColor }}
                  >
                    {p.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.sku}</p>
                    <p className="mt-1 text-sm font-bold">{formatVnd(p.sellPrice)}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusBadge status={getStockStatus(p.stock, p.minStock)} />
                      <span className="text-xs text-slate-500">
                        {CATEGORY_MAP[p.categoryId].name}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    className="pos-btn pos-btn-outline !min-h-10 !rounded-[10px]"
                    onClick={() => setViewing(p)}
                  >
                    Xem
                  </button>
                  <button
                    type="button"
                    className="pos-btn pos-btn-outline !min-h-10 !rounded-[10px]"
                    onClick={() => {
                      setEditing(p);
                      setFormOpen(true);
                    }}
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    className="pos-btn pos-btn-danger !min-h-10 !rounded-[10px]"
                    onClick={() => setDeleteId(p.id)}
                  >
                    Xóa
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Desktop table */}
          <div className="pos-card hidden overflow-x-auto md:block">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-[var(--pos-border)] bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Sản phẩm</th>
                  <th className="px-4 py-3 font-semibold">SKU</th>
                  <th className="px-4 py-3 font-semibold">Danh mục</th>
                  <th className="px-4 py-3 font-semibold">Giá bán</th>
                  <th className="px-4 py-3 font-semibold">Giá nhập</th>
                  <th className="px-4 py-3 font-semibold">Tồn kho</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((p) => (
                  <tr key={p.id} className="border-b border-[var(--pos-border)] last:border-0">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-slate-500">{p.sku}</td>
                    <td className="px-4 py-3">{CATEGORY_MAP[p.categoryId].name}</td>
                    <td className="px-4 py-3 font-semibold">{formatVnd(p.sellPrice)}</td>
                    <td className="px-4 py-3">{formatVnd(p.costPrice)}</td>
                    <td className="px-4 py-3">
                      {p.stock} {p.unit}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={getStockStatus(p.stock, p.minStock)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="rounded-[8px] p-2 hover:bg-slate-100"
                          onClick={() => setViewing(p)}
                          aria-label="Xem"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          className="rounded-[8px] p-2 hover:bg-slate-100"
                          onClick={() => {
                            setEditing(p);
                            setFormOpen(true);
                          }}
                          aria-label="Sửa"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="rounded-[8px] p-2 text-rose-600 hover:bg-rose-50"
                          onClick={() => setDeleteId(p.id)}
                          aria-label="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Trang {page}/{pageCount} · {filtered.length} sản phẩm
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="pos-btn pos-btn-outline !min-h-10"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Trước
              </button>
              <button
                type="button"
                className="pos-btn pos-btn-outline !min-h-10"
                disabled={page >= pageCount}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </button>
            </div>
          </div>
        </>
      )}

      <ProductFormModal
        open={formOpen}
        product={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      />

      {viewing ? (
        <div className="pos-modal-backdrop" role="dialog" aria-modal="true">
          <div className="pos-modal p-5">
            <h2 className="text-lg font-bold">{viewing.name}</h2>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-slate-500">SKU</dt>
                <dd className="font-semibold">{viewing.sku}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Danh mục</dt>
                <dd className="font-semibold">
                  {CATEGORY_MAP[viewing.categoryId].name}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Giá bán</dt>
                <dd className="font-semibold">{formatVnd(viewing.sellPrice)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Giá nhập</dt>
                <dd className="font-semibold">{formatVnd(viewing.costPrice)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Tồn kho</dt>
                <dd className="font-semibold">
                  {viewing.stock} {viewing.unit}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Cảnh báo</dt>
                <dd className="font-semibold">{viewing.minStock}</dd>
              </div>
            </dl>
            <button
              type="button"
              className="pos-btn pos-btn-primary mt-5 w-full"
              onClick={() => setViewing(null)}
            >
              Đóng
            </button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={!!deleteId}
        title="Xóa sản phẩm?"
        description="Thao tác này sẽ gỡ sản phẩm khỏi danh sách và giỏ hàng hiện tại."
        confirmLabel="Xóa"
        danger
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteProduct(deleteId);
          setDeleteId(null);
        }}
      />
    </AppShell>
  );
}
