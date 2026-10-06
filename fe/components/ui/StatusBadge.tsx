import { cn } from "@/lib/format";

const MAP: Record<string, { label: string; className: string }> = {
  in_stock: { label: "Còn hàng", className: "bg-emerald-50 text-emerald-700" },
  low: { label: "Sắp hết", className: "bg-amber-50 text-amber-700" },
  out: { label: "Hết hàng", className: "bg-rose-50 text-rose-700" },
  unpaid: { label: "Chưa thanh toán", className: "bg-amber-50 text-amber-700" },
  partial: { label: "Một phần", className: "bg-sky-50 text-sky-700" },
  paid: { label: "Đã thanh toán", className: "bg-emerald-50 text-emerald-700" },
  overdue: { label: "Quá hạn", className: "bg-rose-50 text-rose-700" },
  active: { label: "Đang làm", className: "bg-emerald-50 text-emerald-700" },
  inactive: { label: "Tạm nghỉ", className: "bg-slate-100 text-slate-600" },
  cash: { label: "Tiền mặt", className: "bg-emerald-50 text-emerald-700" },
  transfer: { label: "Chuyển khoản", className: "bg-sky-50 text-sky-700" },
  qr: { label: "QR", className: "bg-violet-50 text-violet-700" },
};

export function StatusBadge({
  status,
  label,
}: {
  status: string;
  label?: string;
}) {
  const meta = MAP[status] ?? {
    label: label ?? status,
    className: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        meta.className,
      )}
    >
      {label ?? meta.label}
    </span>
  );
}
