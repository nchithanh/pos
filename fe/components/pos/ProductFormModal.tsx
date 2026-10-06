"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { CATEGORIES } from "@/data/categories";
import type { CategoryId, Product } from "@/lib/types";
import { usePosStore } from "@/store/usePosStore";

type FormState = {
  name: string;
  sku: string;
  categoryId: Exclude<CategoryId, "all">;
  costPrice: string;
  sellPrice: string;
  stock: string;
  unit: string;
  supplierId: string;
  minStock: string;
};

const empty = (supplierId: string): FormState => ({
  name: "",
  sku: "",
  categoryId: "thuc-an",
  costPrice: "",
  sellPrice: "",
  stock: "0",
  unit: "cái",
  supplierId,
  minStock: "5",
});

export function ProductFormModal({
  open,
  product,
  onClose,
}: {
  open: boolean;
  product?: Product | null;
  onClose: () => void;
}) {
  const suppliers = usePosStore((s) => s.suppliers);
  const addProduct = usePosStore((s) => s.addProduct);
  const updateProduct = usePosStore((s) => s.updateProduct);
  const addToast = usePosStore((s) => s.addToast);
  const [form, setForm] = useState<FormState>(empty(suppliers[0]?.id ?? "sup-01"));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (!open) return;
    if (product) {
      setForm({
        name: product.name,
        sku: product.sku,
        categoryId: product.categoryId,
        costPrice: String(product.costPrice),
        sellPrice: String(product.sellPrice),
        stock: String(product.stock),
        unit: product.unit,
        supplierId: product.supplierId,
        minStock: String(product.minStock),
      });
    } else {
      setForm(empty(suppliers[0]?.id ?? "sup-01"));
    }
    setErrors({});
  }, [open, product, suppliers]);

  if (!open) return null;

  const set = (key: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "Nhập tên sản phẩm";
    if (!form.sku.trim()) next.sku = "Nhập SKU";
    if (!form.sellPrice || Number(form.sellPrice) <= 0)
      next.sellPrice = "Giá bán không hợp lệ";
    if (!form.costPrice || Number(form.costPrice) < 0)
      next.costPrice = "Giá nhập không hợp lệ";
    if (form.stock === "" || Number(form.stock) < 0)
      next.stock = "Tồn kho không hợp lệ";
    if (!form.unit.trim()) next.unit = "Nhập đơn vị";
    if (!form.supplierId) next.supplierId = "Chọn nhà cung cấp";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = () => {
    if (!validate()) {
      addToast("error", "Vui lòng kiểm tra lại thông tin");
      return;
    }
    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim().toUpperCase(),
      categoryId: form.categoryId,
      costPrice: Number(form.costPrice),
      sellPrice: Number(form.sellPrice),
      stock: Number(form.stock),
      unit: form.unit.trim(),
      supplierId: form.supplierId,
      minStock: Number(form.minStock) || 0,
    };
    if (product) {
      updateProduct(product.id, payload);
    } else {
      addProduct(payload);
    }
    onClose();
  };

  return (
    <div className="pos-modal-backdrop" role="dialog" aria-modal="true">
      <div className="pos-modal p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {product ? "Sửa sản phẩm" : "Thêm sản phẩm"}
          </h2>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="pos-label">Tên sản phẩm</span>
            <input
              className="pos-input pos-input-rect"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
            {errors.name ? <p className="mt-1 text-xs text-rose-600">{errors.name}</p> : null}
          </label>
          <label>
            <span className="pos-label">SKU</span>
            <input
              className="pos-input pos-input-rect"
              value={form.sku}
              onChange={(e) => set("sku", e.target.value)}
            />
            {errors.sku ? <p className="mt-1 text-xs text-rose-600">{errors.sku}</p> : null}
          </label>
          <label>
            <span className="pos-label">Danh mục</span>
            <select
              className="pos-input pos-input-rect"
              value={form.categoryId}
              onChange={(e) =>
                set("categoryId", e.target.value as FormState["categoryId"])
              }
            >
              {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="pos-label">Giá nhập</span>
            <input
              type="number"
              className="pos-input pos-input-rect"
              value={form.costPrice}
              onChange={(e) => set("costPrice", e.target.value)}
            />
            {errors.costPrice ? (
              <p className="mt-1 text-xs text-rose-600">{errors.costPrice}</p>
            ) : null}
          </label>
          <label>
            <span className="pos-label">Giá bán</span>
            <input
              type="number"
              className="pos-input pos-input-rect"
              value={form.sellPrice}
              onChange={(e) => set("sellPrice", e.target.value)}
            />
            {errors.sellPrice ? (
              <p className="mt-1 text-xs text-rose-600">{errors.sellPrice}</p>
            ) : null}
          </label>
          <label>
            <span className="pos-label">Tồn kho</span>
            <input
              type="number"
              className="pos-input pos-input-rect"
              value={form.stock}
              onChange={(e) => set("stock", e.target.value)}
            />
          </label>
          <label>
            <span className="pos-label">Đơn vị</span>
            <input
              className="pos-input pos-input-rect"
              value={form.unit}
              onChange={(e) => set("unit", e.target.value)}
            />
          </label>
          <label>
            <span className="pos-label">Nhà cung cấp</span>
            <select
              className="pos-input pos-input-rect"
              value={form.supplierId}
              onChange={(e) => set("supplierId", e.target.value)}
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="pos-label">Mức tồn cảnh báo</span>
            <input
              type="number"
              className="pos-input pos-input-rect"
              value={form.minStock}
              onChange={(e) => set("minStock", e.target.value)}
            />
          </label>
        </div>

        <div className="mt-5 flex gap-2">
          <button type="button" className="pos-btn pos-btn-outline flex-1" onClick={onClose}>
            Hủy
          </button>
          <button type="button" className="pos-btn pos-btn-primary flex-1" onClick={submit}>
            Lưu sản phẩm
          </button>
        </div>
      </div>
    </div>
  );
}
