import { cn } from "@/lib/utils";

const MAP: Record<string, string> = {
  in_stock: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  low: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  out: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  unpaid: "bg-amber-50 text-amber-700",
  partial: "bg-sky-50 text-sky-700",
  paid: "bg-emerald-50 text-emerald-700",
  overdue: "bg-rose-50 text-rose-700",
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-slate-100 text-slate-600",
  open: "bg-emerald-50 text-emerald-700",
  closed: "bg-slate-100 text-slate-600",
  cash: "bg-emerald-50 text-emerald-700",
  transfer: "bg-sky-50 text-sky-700",
  qr: "bg-violet-50 text-violet-700",
  split: "bg-orange-50 text-orange-700",
  debt: "bg-amber-50 text-amber-800",
};

const LABEL: Record<string, string> = {
  in_stock: "Còn hàng",
  low: "Sắp hết",
  out: "Hết hàng",
  unpaid: "Chưa thanh toán",
  partial: "Một phần",
  paid: "Đã thanh toán",
  overdue: "Quá hạn",
  active: "Đang làm",
  inactive: "Tạm nghỉ",
  open: "Đang mở",
  closed: "Đã đóng",
  cash: "Tiền mặt",
  transfer: "Chuyển khoản",
  qr: "QR",
  split: "Tách bill",
  debt: "Ghi nợ",
  owner: "Chủ cửa hàng",
  manager: "Quản lý",
  cashier: "Thu ngân",
};

export function Badge({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        MAP[status] ?? "bg-slate-100 text-slate-600",
        className,
      )}
    >
      {label ?? LABEL[status] ?? status}
    </span>
  );
}
