"use client";

import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { AlertTriangle, Pencil, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { CardListSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/hooks/use-confirm";
import { db, getStockStatus } from "@/lib/db";
import { notify } from "@/lib/notify";
import { formatVnd, uid } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1, "Bắt buộc"),
  sku: z.string().min(1, "Bắt buộc"),
  barcode: z.string().optional(),
  categoryId: z.string().min(1),
  brand: z.string().optional(),
  sellPrice: z.number().positive("Giá bán phải > 0"),
  costPrice: z.number().min(0, "Giá nhập ≥ 0"),
  stock: z.number().min(0, "Tồn không âm"),
  minStock: z.number().min(0),
  unit: z.string().min(1),
  supplierId: z.string().optional(),
  imageUrl: z
    .string()
    .refine((v) => !v || /^https?:\/\//i.test(v), "URL ảnh không hợp lệ")
    .optional(),
});

type FormValues = z.infer<typeof schema>;

const PAGE_SIZE = 10;

export default function ProductsPage() {
  const { confirm, dialog: confirmDialog } = useConfirm();
  const products = useLiveQuery(() => db.products.toArray());
  const categories = useLiveQuery(() => db.categories.toArray());
  const suppliers = useLiveQuery(() => db.suppliers.toArray());
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const loading = products === undefined;
  const lowCount = useMemo(
    () =>
      (products ?? []).filter(
        (p) => getStockStatus(p.stock, p.minStock) !== "in_stock",
      ).length,
    [products],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      sku: "",
      categoryId: "thuc-an",
      sellPrice: 0,
      costPrice: 0,
      stock: 0,
      minStock: 5,
      unit: "cái",
    },
  });

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return (products ?? []).filter((p) => {
      if (categoryFilter !== "all" && p.categoryId !== categoryFilter) return false;
      if (!query) return true;
      return (
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        (p.barcode ?? "").includes(query)
      );
    });
  }, [products, q, categoryFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const openCreate = () => {
    setEditId(null);
    form.reset({
      name: "",
      sku: "",
      categoryId: categories?.[0]?.id ?? "thuc-an",
      sellPrice: 0,
      costPrice: 0,
      stock: 0,
      minStock: 5,
      unit: "cái",
      supplierId: suppliers?.[0]?.id,
      imageUrl: "",
    });
    setOpen(true);
  };

  const openEdit = (id: string) => {
    const p = products?.find((x) => x.id === id);
    if (!p) return;
    setEditId(id);
    form.reset({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      categoryId: p.categoryId,
      brand: p.brand,
      sellPrice: p.sellPrice,
      costPrice: p.costPrice,
      stock: p.stock,
      minStock: p.minStock,
      unit: p.unit,
      supplierId: p.supplierId,
      imageUrl: p.imageUrl ?? "",
    });
    setOpen(true);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const now = new Date().toISOString();
    const imageUrl = values.imageUrl?.trim() || undefined;
    const payload = { ...values, imageUrl };
    if (editId) {
      await db.products.update(editId, { ...payload, updatedAt: now });
      notify.success("Đã cập nhật sản phẩm");
    } else {
      await db.products.add({
        id: uid("p"),
        ...payload,
        imageColor: "#E8F5E9",
        emoji: "🐾",
        active: true,
        createdAt: now,
        updatedAt: now,
      });
      notify.success("Đã thêm sản phẩm");
    }
    setOpen(false);
  });

  const remove = async (id: string) => {
    const p = products?.find((x) => x.id === id);
    const ok = await confirm({
      title: "Xóa sản phẩm?",
      description: p
        ? `“${p.name}” sẽ bị xóa khỏi danh mục. Tồn kho và lịch sử liên quan vẫn giữ trong sổ kho cũ.`
        : "Sản phẩm sẽ bị xóa khỏi danh mục.",
      confirmLabel: "Xóa",
      variant: "danger",
    });
    if (!ok) return;
    await db.products.delete(id);
    notify.deleted("Đã xóa sản phẩm");
  };

  const bulkDemo = async () => {
    const now = new Date().toISOString();
    await db.products.add({
      id: uid("p"),
      name: `SP import ${Date.now().toString().slice(-4)}`,
      sku: `IMP-${Date.now().toString().slice(-6)}`,
      barcode: `${Date.now()}`.slice(0, 13),
      categoryId: "phu-kien",
      sellPrice: 99000,
      costPrice: 55000,
      stock: 10,
      minStock: 3,
      unit: "cái",
      imageColor: "#E0F7FA",
      emoji: "📦",
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    notify.success("Đã import 1 dòng mẫu");
  };

  return (
    <AppShell>
      {confirmDialog}
      <PageHeader
        title="Sản phẩm"
        description={`${products?.length ?? 0} SKU · lưu IndexedDB`}
        actions={
          <>
            <Button variant="outline" onClick={bulkDemo}>Import mẫu</Button>
            <Button onClick={openCreate}><Plus size={16} /> Thêm</Button>
          </>
        }
      />
      {lowCount > 0 ? (
        <Card className="mb-3 flex flex-wrap items-center justify-between gap-2 border-amber-300 bg-amber-50 p-3 dark:bg-amber-950/40">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-200">
            <AlertTriangle size={16} />
            {lowCount} SKU sắp hết / hết hàng
          </p>
          <Link href="/kho">
            <Button size="sm" variant="outline">
              Xem kho
            </Button>
          </Link>
        </Card>
      ) : null}
      <Input
        className="mb-3"
        placeholder="Tìm tên / SKU / barcode…"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setPage(1);
        }}
      />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => {
            setCategoryFilter("all");
            setPage(1);
          }}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
            categoryFilter === "all"
              ? "bg-emerald-500 text-white"
              : "border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
          }`}
        >
          Tất cả
        </button>
        {(categories ?? []).map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              setCategoryFilter(c.id);
              setPage(1);
            }}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
              categoryFilter === c.id
                ? "bg-emerald-500 text-white"
                : "border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
            }`}
          >
            {c.emoji} {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <>
          <div className="md:hidden">
            <CardListSkeleton count={4} />
          </div>
          <div className="hidden md:block">
            <TableSkeleton rows={6} cols={6} />
          </div>
        </>
      ) : !filtered.length ? (
        <Card><EmptyState title="Không có sản phẩm" action={<Button onClick={openCreate}>Thêm sản phẩm</Button>} /></Card>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {pageItems.map((p) => (
              <Card key={p.id} className="p-3">
                <div className="flex gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full text-xl" style={{ background: p.imageColor }}>{p.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.sku}</p>
                    <p className="font-bold">{formatVnd(p.sellPrice)}</p>
                    <Badge status={getStockStatus(p.stock, p.minStock)} />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(p.id)}><Pencil size={14} /> Sửa</Button>
                  <Button variant="danger" size="sm" onClick={() => remove(p.id)}><Trash2 size={14} /> Xóa</Button>
                </div>
              </Card>
            ))}
          </div>
          <Card className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b bg-slate-50 text-slate-500 dark:bg-slate-800">
                <tr>
                  {["Sản phẩm", "SKU", "Danh mục", "Giá bán", "Giá nhập", "Tồn", "TT", ""].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-slate-500">{p.sku}</td>
                    <td className="px-4 py-3">{categories?.find((c) => c.id === p.categoryId)?.name}</td>
                    <td className="px-4 py-3 font-semibold">{formatVnd(p.sellPrice)}</td>
                    <td className="px-4 py-3">{formatVnd(p.costPrice)}</td>
                    <td className="px-4 py-3">{p.stock} {p.unit}</td>
                    <td className="px-4 py-3"><Badge status={getStockStatus(p.stock, p.minStock)} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p.id)}><Pencil size={16} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(p.id)}><Trash2 size={16} className="text-rose-500" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Trang {safePage}/{pageCount} · {filtered.length} sản phẩm
              {filtered.length !== (products?.length ?? 0)
                ? ` (lọc từ ${products?.length ?? 0})`
                : ""}
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

      <Dialog open={open} onClose={() => setOpen(false)} title={editId ? "Sửa sản phẩm" : "Thêm sản phẩm"} className="max-w-2xl">
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["name", "Tên"],
              ["sku", "SKU"],
              ["barcode", "Barcode"],
              ["brand", "Thương hiệu"],
              ["unit", "Đơn vị"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-sm">
              <span className="mb-1 block text-slate-500">{label}</span>
              <Input {...form.register(key)} />
            </label>
          ))}
          <label className="block text-sm">
            <span className="mb-1 block text-slate-500">Danh mục</span>
            <select className="h-11 w-full rounded-[10px] border px-3 dark:bg-slate-900" {...form.register("categoryId")}>
              {(categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-500">NCC</span>
            <select className="h-11 w-full rounded-[10px] border px-3 dark:bg-slate-900" {...form.register("supplierId")}>
              {(suppliers ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          {(["sellPrice", "costPrice", "stock", "minStock"] as const).map((key) => (
            <label key={key} className="block text-sm">
              <span className="mb-1 block text-slate-500">
                {key === "sellPrice"
                  ? "Giá bán"
                  : key === "costPrice"
                    ? "Giá nhập"
                    : key === "stock"
                      ? "Tồn kho"
                      : "Tồn tối thiểu"}
              </span>
              <Input type="number" {...form.register(key, { valueAsNumber: true })} />
              {form.formState.errors[key] ? (
                <p className="mt-1 text-xs text-rose-600">
                  {form.formState.errors[key]?.message}
                </p>
              ) : null}
            </label>
          ))}
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-slate-500">URL ảnh (tuỳ chọn)</span>
            <Input
              placeholder="https://…"
              {...form.register("imageUrl")}
            />
            {form.formState.errors.imageUrl ? (
              <p className="mt-1 text-xs text-rose-600">
                {form.formState.errors.imageUrl.message}
              </p>
            ) : null}
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" className="w-full">Lưu</Button>
          </div>
        </form>
      </Dialog>
    </AppShell>
  );
}
