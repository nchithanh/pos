"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useTheme } from "@/components/theme-provider";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { resetDatabase } from "@/lib/seed";
import type { StoreVertical } from "@/types";

export default function SettingsPage() {
  const settings = useLiveQuery(() => db.settings.get("store"));
  const { setTheme } = useTheme();
  const [name, setName] = useState("");
  const [slogan, setSlogan] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [taxRate, setTaxRate] = useState("0");
  const [vertical, setVertical] = useState<StoreVertical>("pet");
  const [receiptWidth, setReceiptWidth] = useState<"58" | "80">("80");

  useEffect(() => {
    if (!settings) return;
    setName(settings.name);
    setSlogan(settings.slogan);
    setPhone(settings.phone);
    setAddress(settings.address);
    setTaxRate(String(settings.taxRate));
    setVertical(settings.vertical);
    setReceiptWidth(String(settings.receiptWidth) as "58" | "80");
  }, [settings]);

  const save = async () => {
    await db.settings.put({
      id: "store",
      name,
      slogan,
      phone,
      address,
      taxRate: Number(taxRate) || 0,
      vertical,
      currency: "VND",
      receiptWidth: Number(receiptWidth) as 58 | 80,
      logoEmoji: settings?.logoEmoji ?? "🐬",
      theme: settings?.theme ?? "system",
      updatedAt: new Date().toISOString(),
    });
    toast.success("Đã lưu cài đặt");
  };

  const backup = async () => {
    const data = {
      settings: await db.settings.toArray(),
      users: await db.users.toArray(),
      products: await db.products.toArray(),
      categories: await db.categories.toArray(),
      customers: await db.customers.toArray(),
      suppliers: await db.suppliers.toArray(),
      orders: await db.orders.toArray(),
      movements: await db.movements.toArray(),
      debts: await db.debts.toArray(),
      shifts: await db.shifts.toArray(),
      meta: await db.meta.toArray(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dolphin-pos-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Đã tải backup");
  };

  const restore = async (file: File) => {
    const text = await file.text();
    const data = JSON.parse(text) as Record<string, unknown[]>;
    await db.transaction("rw", db.tables, async () => {
      for (const table of db.tables) await table.clear();
      if (data.settings) await db.settings.bulkPut(data.settings as never[]);
      if (data.users) await db.users.bulkPut(data.users as never[]);
      if (data.products) await db.products.bulkPut(data.products as never[]);
      if (data.categories) await db.categories.bulkPut(data.categories as never[]);
      if (data.customers) await db.customers.bulkPut(data.customers as never[]);
      if (data.suppliers) await db.suppliers.bulkPut(data.suppliers as never[]);
      if (data.orders) await db.orders.bulkPut(data.orders as never[]);
      if (data.movements) await db.movements.bulkPut(data.movements as never[]);
      if (data.debts) await db.debts.bulkPut(data.debts as never[]);
      if (data.shifts) await db.shifts.bulkPut(data.shifts as never[]);
      if (data.meta) await db.meta.bulkPut(data.meta as never[]);
    });
    toast.success("Đã khôi phục dữ liệu");
    window.location.reload();
  };

  return (
    <AppShell>
      <PageHeader title="Cài đặt" description="Cửa hàng · máy in · theme · backup local" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3 p-4">
          <h2 className="font-bold">Thông tin cửa hàng</h2>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên cửa hàng" />
          <Input value={slogan} onChange={(e) => setSlogan(e.target.value)} placeholder="Slogan" />
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="SĐT" />
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Địa chỉ" />
          <Input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} placeholder="Thuế %" />
          <select className="h-11 w-full rounded-[10px] border px-3 dark:bg-slate-900" value={vertical} onChange={(e) => setVertical(e.target.value as StoreVertical)}>
            <option value="pet">Pet shop</option>
            <option value="cafe">Cafe</option>
            <option value="clothing">Clothing</option>
            <option value="general">General retail</option>
          </select>
          <select className="h-11 w-full rounded-[10px] border px-3 dark:bg-slate-900" value={receiptWidth} onChange={(e) => setReceiptWidth(e.target.value as "58" | "80")}>
            <option value="58">In nhiệt 58mm</option>
            <option value="80">In nhiệt 80mm</option>
          </select>
          <Button onClick={save} className="w-full">Lưu cài đặt</Button>
        </Card>

        <div className="space-y-4">
          <Card className="space-y-3 p-4">
            <h2 className="font-bold">Giao diện</h2>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setTheme("light")}>Light</Button>
              <Button variant="outline" onClick={() => setTheme("dark")}>Dark</Button>
              <Button variant="outline" onClick={() => setTheme("system")}>System</Button>
            </div>
          </Card>
          <Card className="space-y-3 p-4">
            <h2 className="font-bold">Backup / Restore</h2>
            <Button className="w-full" variant="outline" onClick={backup}>Tải backup JSON</Button>
            <label className="block">
              <span className="mb-1 block text-sm text-slate-500">Khôi phục từ file</span>
              <Input
                type="file"
                accept="application/json"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void restore(f);
                }}
              />
            </label>
            <Button
              variant="danger"
              className="w-full"
              onClick={async () => {
                if (!confirm("Xóa toàn bộ dữ liệu local và seed lại?")) return;
                await resetDatabase();
                toast.success("Đã reset DB");
                window.location.href = "/login";
              }}
            >
              Reset dữ liệu demo
            </Button>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
