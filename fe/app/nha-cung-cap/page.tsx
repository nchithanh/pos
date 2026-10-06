"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Truck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { CardListSkeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import { formatVnd, uid } from "@/lib/utils";

export default function SuppliersPage() {
  const suppliers = useLiveQuery(() => db.suppliers.toArray());
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [contact, setContact] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return (suppliers ?? []).filter(
      (s) =>
        !query ||
        s.name.toLowerCase().includes(query) ||
        s.phone.includes(query) ||
        s.contactPerson.toLowerCase().includes(query),
    );
  }, [suppliers, q]);

  return (
    <AppShell>
      <PageHeader
        title="Nhà cung cấp"
        actions={<Button onClick={() => setOpen(true)}><Plus size={16} /> Thêm</Button>}
      />
      <Input className="mb-4" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm NCC…" />
      {suppliers === undefined ? (
        <CardListSkeleton count={6} />
      ) : !filtered.length ? (
        <Card><EmptyState title="Chưa có NCC" icon={Truck} /></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <Link key={s.id} href={`/nha-cung-cap/${s.id}`} className="block">
              <Card className="h-full p-4 transition hover:border-emerald-500">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-emerald-50 text-emerald-600">
                    <Truck size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold">{s.name}</h2>
                    <p className="text-xs text-slate-500">{s.contactPerson} · {s.phone}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-[10px] bg-slate-50 p-2 dark:bg-slate-800">
                    <p className="text-slate-500">SP</p>
                    <p className="font-bold">{s.productCount}</p>
                  </div>
                  <div className="rounded-[10px] bg-slate-50 p-2 dark:bg-slate-800">
                    <p className="text-slate-500">Mua</p>
                    <p className="truncate font-bold">{formatVnd(s.totalPurchased)}</p>
                  </div>
                  <div className="rounded-[10px] bg-amber-50 p-2">
                    <p className="text-amber-700">Nợ</p>
                    <p className="truncate font-bold text-amber-800">{formatVnd(s.debt)}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title="Thêm nhà cung cấp">
        <div className="space-y-3">
          <Input placeholder="Tên NCC" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="SĐT" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input placeholder="Người liên hệ" value={contact} onChange={(e) => setContact(e.target.value)} />
          <Button
            className="w-full"
            onClick={async () => {
              if (!name.trim()) return notify.error("Nhập tên");
              await db.suppliers.add({
                id: uid("sup"),
                name: name.trim(),
                phone: phone.trim() || "—",
                email: "",
                address: "",
                contactPerson: contact.trim() || "—",
                productCount: 0,
                totalPurchased: 0,
                debt: 0,
                createdAt: new Date().toISOString(),
              });
              notify.success("Đã thêm NCC");
              setOpen(false);
            }}
          >
            Lưu
          </Button>
        </div>
      </Dialog>
    </AppShell>
  );
}
