"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, MapPin } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatVnd } from "@/lib/format";
import { usePosStore } from "@/store/usePosStore";

export default function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const suppliers = usePosStore((s) => s.suppliers);
  const stockIns = usePosStore((s) => s.stockIns);
  const debts = usePosStore((s) => s.debts);
  const payDebt = usePosStore((s) => s.payDebt);
  const addToast = usePosStore((s) => s.addToast);

  const supplier = suppliers.find((s) => s.id === id);
  const history = stockIns.filter((r) => r.supplierId === id);
  const supplierDebts = debts.filter(
    (d) => d.type === "payable" && d.partyId === id,
  );

  if (!supplier) {
    return (
      <AppShell>
        <EmptyState
          title="Không tìm thấy nhà cung cấp"
          action={
            <Link href="/nha-cung-cap" className="pos-btn pos-btn-primary">
              Quay lại danh sách
            </Link>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title={supplier.name}
        description={supplier.address}
        actions={
          <Link href="/nha-cung-cap" className="pos-btn pos-btn-outline">
            <ArrowLeft size={16} />
            Danh sách
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="pos-card space-y-3 p-4 lg:col-span-1">
          <h2 className="text-base font-bold">Thông tin liên hệ</h2>
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <Phone size={16} /> {supplier.phone}
          </p>
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <Mail size={16} /> {supplier.email}
          </p>
          <p className="flex items-start gap-2 text-sm text-slate-600">
            <MapPin size={16} className="mt-0.5 shrink-0" /> {supplier.address}
          </p>
          <div className="rounded-[10px] bg-amber-50 p-3">
            <p className="text-xs text-amber-700">Công nợ hiện tại</p>
            <p className="text-xl font-bold text-amber-900">
              {formatVnd(supplier.debt)}
            </p>
          </div>
          <Link href="/kho/nhap" className="pos-btn pos-btn-primary w-full">
            Tạo phiếu nhập
          </Link>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="pos-card p-4">
            <h2 className="mb-3 text-base font-bold">Lịch sử nhập hàng</h2>
            {history.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có phiếu nhập.</p>
            ) : (
              <ul className="space-y-2">
                {history.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between rounded-[10px] bg-slate-50 px-3 py-2.5 text-sm"
                  >
                    <div>
                      <p className="font-semibold">{r.code}</p>
                      <p className="text-xs text-slate-500">
                        {formatDate(r.createdAt)} · {r.items.length} dòng
                      </p>
                    </div>
                    <p className="font-bold">{formatVnd(r.total)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="pos-card p-4">
            <h2 className="mb-3 text-base font-bold">Công nợ & thanh toán</h2>
            {supplierDebts.length === 0 ? (
              <p className="text-sm text-slate-500">Không có công nợ mở.</p>
            ) : (
              <ul className="space-y-3">
                {supplierDebts.map((d) => {
                  const remain = d.amount - d.paidAmount;
                  return (
                    <li
                      key={d.id}
                      className="rounded-[10px] border border-[var(--pos-border)] p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{formatVnd(remain)} còn lại</p>
                          <p className="text-xs text-slate-500">
                            Hạn {formatDate(d.dueDate)} · {d.note}
                          </p>
                        </div>
                      </div>
                      {remain > 0 ? (
                        <button
                          type="button"
                          className="pos-btn pos-btn-primary mt-3 !min-h-10 w-full"
                          onClick={() => {
                            payDebt(d.id, remain);
                            addToast("success", "Đã thanh toán đủ công nợ (mock)");
                          }}
                        >
                          Thanh toán đủ {formatVnd(remain)}
                        </button>
                      ) : (
                        <p className="mt-2 text-sm font-semibold text-emerald-600">
                          Đã thanh toán
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
