"use client";

import { use } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/lib/db";
import { payDebt } from "@/lib/services/debts";
import { formatDate, formatVnd } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

export default function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const supplier = useLiveQuery(() => db.suppliers.get(id), [id]);
  const history = useLiveQuery(
    () => db.movements.filter((m) => m.supplierId === id).reverse().sortBy("createdAt"),
    [id],
  );
  const debts = useLiveQuery(
    () => db.debts.filter((d) => d.type === "payable" && d.partyId === id).toArray(),
    [id],
  );
  const user = useAuthStore((s) => s.user);

  if (supplier === undefined) {
    return <AppShell><Card className="p-8"><EmptyState title="Đang tải…" /></Card></AppShell>;
  }
  if (!supplier) {
    return (
      <AppShell>
        <EmptyState title="Không tìm thấy NCC" action={<Link href="/nha-cung-cap"><Button>Quay lại</Button></Link>} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title={supplier.name}
        description={supplier.address || supplier.phone}
        actions={<Link href="/nha-cung-cap"><Button variant="outline">Danh sách</Button></Link>}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="space-y-2 p-4">
          <p className="text-sm text-slate-500">Liên hệ: {supplier.contactPerson}</p>
          <p className="text-sm">{supplier.phone}</p>
          <p className="text-sm">{supplier.email}</p>
          <div className="rounded-[10px] bg-amber-50 p-3">
            <p className="text-xs text-amber-700">Công nợ</p>
            <p className="text-xl font-bold text-amber-900">{formatVnd(supplier.debt)}</p>
          </div>
          <Link href="/kho/nhap"><Button className="w-full">Tạo phiếu nhập</Button></Link>
        </Card>
        <Card className="p-4 lg:col-span-2">
          <h2 className="mb-3 font-bold">Lịch sử nhập</h2>
          <ul className="mb-6 space-y-2 text-sm">
            {(history ?? []).length === 0 ? (
              <li className="text-slate-500">Chưa có phiếu.</li>
            ) : (
              (history ?? []).map((m) => (
                <li key={m.id} className="flex justify-between rounded-[10px] bg-slate-50 px-3 py-2 dark:bg-slate-800">
                  <span>{m.code} · {formatDate(m.createdAt)}</span>
                  <span className="font-semibold">{formatVnd(m.totalCost)}</span>
                </li>
              ))
            )}
          </ul>
          <h2 className="mb-3 font-bold">Công nợ</h2>
          <ul className="space-y-3">
            {(debts ?? []).map((d) => {
              const remain = d.amount - d.paidAmount;
              return (
                <li key={d.id} className="rounded-[10px] border p-3">
                  <p className="font-semibold">{formatVnd(remain)} còn lại</p>
                  <p className="text-xs text-slate-500">Hạn {formatDate(d.dueDate)} · {d.note}</p>
                  {remain > 0 && user ? (
                    <Button
                      className="mt-2 w-full"
                      size="sm"
                      onClick={async () => {
                        await payDebt({ debtId: d.id, amount: remain, method: "transfer", user });
                        toast.success("Đã thanh toán công nợ");
                      }}
                    >
                      Thanh toán đủ
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
