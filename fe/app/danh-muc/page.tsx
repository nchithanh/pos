"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { FolderPlus, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { db, getStockStatus } from "@/lib/db";
import { cn, formatVnd, uid } from "@/lib/utils";
import type { Category, Product } from "@/types";

const EMOJI_PRESETS = ["🥣", "📦", "🥫", "🦴", "🧸", "🧴", "🎀", "🐾", "☕", "👕", "🆕"];

export default function CategoriesPage() {
  const categories = useLiveQuery(() => db.categories.orderBy("sort").toArray()) ?? [];
  const products = useLiveQuery(() => db.products.toArray()) ?? [];
  const [selectedId, setSelectedId] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🆕");

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: products.length };
    for (const p of products) {
      map[p.categoryId] = (map[p.categoryId] ?? 0) + 1;
    }
    return map;
  }, [products]);

  const selectedProducts = useMemo(() => {
    if (selectedId === "all") return products;
    return products.filter((p) => p.categoryId === selectedId);
  }, [products, selectedId]);

  const selectedCategory = categories.find((c) => c.id === selectedId);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setEmoji("🆕");
    setFormOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setName(cat.name);
    setEmoji(cat.emoji);
    setFormOpen(true);
  };

  const save = async () => {
    if (!name.trim()) {
      toast.error("Nhập tên danh mục");
      return;
    }
    if (editing) {
      await db.categories.update(editing.id, {
        name: name.trim(),
        emoji,
      });
      toast.success("Đã cập nhật danh mục");
    } else {
      const id = uid("cat").replace(/_/g, "-");
      const maxSort = categories.reduce((m, c) => Math.max(m, c.sort), 0);
      await db.categories.add({
        id,
        name: name.trim(),
        emoji,
        sort: maxSort + 1,
      });
      toast.success("Đã thêm danh mục");
      setSelectedId(id);
    }
    setFormOpen(false);
  };

  const remove = async (cat: Category) => {
    const count = counts[cat.id] ?? 0;
    if (count > 0) {
      toast.error(`Không thể xóa — còn ${count} sản phẩm trong danh mục`);
      return;
    }
    if (!confirm(`Xóa danh mục “${cat.name}”?`)) return;
    await db.categories.delete(cat.id);
    if (selectedId === cat.id) setSelectedId("all");
    toast.success("Đã xóa danh mục");
  };

  return (
    <AppShell>
      <PageHeader
        title="Danh mục sản phẩm"
        description="Quản lý category kiểu menu — lọc và thêm nhanh"
        actions={
          <Button onClick={openCreate}>
            <FolderPlus size={16} />
            Thêm danh mục
          </Button>
        }
      />

      <div className="flex flex-col gap-4 lg:h-[calc(100dvh-11rem)] lg:flex-row">
        {/* Category list — Like Food middle pane */}
        <aside className="flex w-full shrink-0 flex-col lg:w-[260px]">
          <Card className="flex min-h-0 flex-1 flex-col p-3">
            <h2 className="mb-3 px-1 text-base font-bold">Danh mục</h2>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              <CategoryRow
                emoji="🐾"
                name="Tất cả"
                count={counts.all ?? 0}
                active={selectedId === "all"}
                onClick={() => setSelectedId("all")}
              />
              {categories.map((cat) => (
                <CategoryRow
                  key={cat.id}
                  emoji={cat.emoji}
                  name={cat.name}
                  count={counts[cat.id] ?? 0}
                  active={selectedId === cat.id}
                  onClick={() => setSelectedId(cat.id)}
                  onEdit={() => openEdit(cat)}
                  onDelete={() => remove(cat)}
                />
              ))}
              {!categories.length ? (
                <EmptyState title="Chưa có danh mục" description="Bấm Thêm danh mục để bắt đầu." />
              ) : null}
            </div>
            <Button className="mt-3 w-full !rounded-[10px]" onClick={openCreate}>
              <Plus size={16} />
              Thêm danh mục
            </Button>
          </Card>
        </aside>

        {/* Products in category */}
        <section className="min-w-0 flex-1">
          <div className="mb-3 rounded-[12px] bg-[var(--banner)] px-4 py-4">
            <h2 className="text-lg font-bold">
              {selectedId === "all"
                ? "Tất cả sản phẩm"
                : `${selectedCategory?.emoji ?? ""} ${selectedCategory?.name ?? "Danh mục"}`}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {selectedProducts.length} sản phẩm · chỉnh sửa chi tiết ở trang Sản phẩm
            </p>
          </div>

          {selectedProducts.length === 0 ? (
            <Card>
              <EmptyState
                title="Chưa có sản phẩm trong danh mục này"
                action={
                  <Link href="/san-pham">
                    <Button>Đi tới Sản phẩm</Button>
                  </Link>
                }
              />
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              <Link
                href="/san-pham"
                className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-[12px] border-2 border-dashed border-emerald-500 bg-emerald-50/50 p-4 text-center dark:bg-emerald-950/20"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Plus size={28} />
                </div>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  Thêm sản phẩm
                  {selectedCategory ? ` vào ${selectedCategory.name}` : ""}
                </p>
              </Link>
              {selectedProducts.map((p) => (
                <ProductMiniCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      </div>

      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Sửa danh mục" : "Thêm danh mục"}
      >
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-500">Tên danh mục</span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Thức ăn ướt"
              autoFocus
            />
          </label>
          <div>
            <p className="mb-2 text-sm text-slate-500">Icon</p>
            <div className="flex flex-wrap gap-2">
              {EMOJI_PRESETS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-[10px] border text-xl",
                    emoji === e
                      ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                      : "border-slate-200 dark:border-slate-700",
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <Button className="w-full" onClick={save}>
            Lưu danh mục
          </Button>
        </div>
      </Dialog>
    </AppShell>
  );
}

function CategoryRow({
  emoji,
  name,
  count,
  active,
  onClick,
  onEdit,
  onDelete,
}: {
  emoji: string;
  name: string;
  count: number;
  active: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-[10px] border px-2 py-2 transition-colors",
        active
          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
          : "border-transparent bg-white hover:bg-slate-50 dark:bg-transparent dark:hover:bg-slate-800",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span className="text-lg">{emoji}</span>
        <span className="flex-1 truncate text-sm font-semibold">{name}</span>
        <span
          className={cn(
            "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold",
            active
              ? "bg-emerald-500 text-white"
              : "bg-slate-100 text-slate-500 dark:bg-slate-800",
          )}
        >
          {count}
        </span>
      </button>
      {onEdit || onDelete ? (
        <div className="flex shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
          {onEdit ? (
            <button
              type="button"
              className="rounded-full p-1.5 text-slate-400 hover:bg-white hover:text-slate-700"
              onClick={onEdit}
              aria-label="Sửa"
            >
              <Pencil size={14} />
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              className="rounded-full p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              onClick={onDelete}
              aria-label="Xóa"
            >
              <Trash2 size={14} />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ProductMiniCard({ product }: { product: Product }) {
  const status = getStockStatus(product.stock, product.minStock);
  return (
    <article className="rounded-[12px] border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col items-center text-center">
        <div
          className="mb-2 flex h-20 w-20 items-center justify-center rounded-full text-3xl"
          style={{ background: product.imageColor }}
        >
          {product.emoji}
        </div>
        <h3 className="line-clamp-2 min-h-10 text-sm font-bold">{product.name}</h3>
        <p className="text-xs text-slate-400">{product.sku}</p>
        <p className="mt-1 font-bold">{formatVnd(product.sellPrice)}</p>
        <p className="mt-1 text-xs text-slate-500">
          Tồn {product.stock} ·{" "}
          {status === "out" ? "Hết hàng" : status === "low" ? "Sắp hết" : "Còn hàng"}
        </p>
      </div>
    </article>
  );
}
