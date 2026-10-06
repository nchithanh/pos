"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { db, getStockStatus } from "@/lib/db";
import { formatVnd, uid } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1, "Bắt buộc"),
  sku: z.string().min(1, "Bắt buộc"),
  barcode: z.string().optional(),
  categoryId: z.string().min(1),
  brand: z.string().optional(),
  sellPrice: z.number().positive(),
  costPrice: z.number().min(0),
  stock: z.number().min(0),
  minStock: z.number().min(0),
  unit: z.string().min(1),
  supplierId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ProductsPage() {
  const products = useLiveQuery(() => db.products.toArray());
  const categories = useLiveQuery(() => db.categories.toArray());
  const suppliers = useLiveQuery(() => db.suppliers.toArray());
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

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
    return (products ?? []).filter(
      (p) =>
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        (p.barcode ?? "").includes(query),
    );
  }, [products, q]);

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
    });
    setOpen(true);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const now = new Date().toISOString();
    if (editId) {
      await db.products.update(editId, { ...values, updatedAt: now });
      toast.success("Đã cập nhật sản phẩm");
    } else {
      await db.products.add({
        id: uid("p"),
        ...values,
        imageColor: "#E8F5E9",
        emoji: "🐾",
        active: true,
        createdAt: now,
        updatedAt: now,
      });
      toast.success("Đã thêm sản phẩm");
    }
    setOpen(false);
  });

  const remove = async (id: string) => {
    if (!confirm("Xóa sản phẩm này?")) return;
    await db.products.delete(id);
    toast.success("Đã xóa");
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
    toast.success("Đã import 1 dòng mẫu");
  };

  return (
    <AppShell>
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
      <Input className="mb-4" placeholder="Tìm tên / SKU / barcode…" value={q} onChange={(e) => setQ(e.target.value)} />

      {!filtered.length ? (
        <Card><EmptyState title="Không có sản phẩm" action={<Button onClick={openCreate}>Thêm sản phẩm</Button>} /></Card>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filtered.map((p) => (
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
                {filtered.map((p) => (
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
              <span className="mb-1 block text-slate-500">{key}</span>
              <Input type="number" {...form.register(key, { valueAsNumber: true })} />
            </label>
          ))}
          <div className="sm:col-span-2">
            <Button type="submit" className="w-full">Lưu</Button>
          </div>
        </form>
      </Dialog>
    </AppShell>
  );
}
