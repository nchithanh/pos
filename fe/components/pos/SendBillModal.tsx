"use client";

import { tr } from "@/lib/i18n/translate";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { paymentLabel } from "@/lib/payment-labels";
import { formatDateTime, formatVnd } from "@/lib/utils";
import type { Order } from "@/types";

function digitsOnly(phone: string) {
  return phone.replace(/\D/g, "");
}

function billText(order: Order): string {
  const lines = order.items
    .map(
      (i) =>
        `• ${i.productName} × ${i.quantity} = ${formatVnd(i.lineTotal)}`,
    )
    .join("\n");
  return [
    `Bill ${order.code}`,
    formatDateTime(order.createdAt),
    order.customerName ? `Khách: ${order.customerName}` : null,
    "",
    lines,
    "",
    `Tổng: ${formatVnd(order.total)}`,
    `Thanh toán: ${paymentLabel(order.paymentMethod)}`,
  ]
    .filter((x) => x != null)
    .join("\n");
}

export function SendBillModal({
  open,
  order,
  onClose,
}: {
  open: boolean;
  order: Order | null;
  onClose: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [via, setVia] = useState<"zalo" | "email" | "both" | null>(null);

  useEffect(() => {
    if (!open || !order) return;
    setPhone(order.customerPhone ?? "");
    setEmail(order.customerEmail ?? "");
    setSent(false);
    setSending(false);
    setVia(null);
  }, [open, order]);

  const submit = async () => {
    if (!order) return;
    const p = phone.trim();
    const e = email.trim();
    const digits = digitsOnly(p);
    if (!p && !e) {
      toast.error(tr("Nhập số điện thoại hoặc email"));
      return;
    }
    if (p && !/^0\d{9,10}$/.test(digits)) {
      toast.error(tr("Số điện thoại không hợp lệ"));
      return;
    }
    if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      toast.error(tr("Email không hợp lệ"));
      return;
    }

    setSending(true);
    const text = billText(order);
    let openedZalo = false;
    let openedMail = false;

    try {
      if (digits) {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          /* vẫn mở Zalo */
        }
        window.open(`https://zalo.me/${digits}`, "_blank", "noopener,noreferrer");
        openedZalo = true;
      }
      if (e) {
        const subject = encodeURIComponent(`Bill ${order.code}`);
        const body = encodeURIComponent(text);
        window.open(`mailto:${e}?subject=${subject}&body=${body}`, "_self");
        openedMail = true;
      }
      setVia(openedZalo && openedMail ? "both" : openedZalo ? "zalo" : "email");
      setSent(true);
      if (openedZalo) {
        toast.success(tr("Đã mở Zalo — dán bill đã copy nếu cần"));
      }
    } catch {
      toast.error(tr("Không gửi được bill"));
    } finally {
      setSending(false);
    }
  };

  const successHint =
    via === "zalo"
      ? tr("Đã mở Zalo. Nội dung bill đã copy — dán vào chat nếu cần.")
      : via === "email"
        ? tr("Đã mở email với nội dung bill.")
        : tr("Đã mở Zalo và email. Bill đã copy vào clipboard.");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={sent ? tr("Đã gửi bill") : tr("Gửi bill")}
      className="max-w-md"
    >
      {sent ? (
        <div className="py-4 text-center">
          <CheckCircle2 className="mx-auto text-emerald-500" size={40} />
          <p className="mt-3 text-lg font-bold">{tr("✓ Đã gửi bill thành công")}</p>
          <p className="mt-1 text-sm text-slate-500">{successHint}</p>
          <Button className="mt-5 w-full" onClick={onClose}>
            {tr("Đóng")}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {order ? (
            <p className="text-sm text-slate-500">
              Bill đơn{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {order.code}
              </span>
            </p>
          ) : null}
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-500">
              {tr("Số điện thoại")} (Zalo)
            </span>
            <Input
              type="tel"
              inputMode="tel"
              placeholder="0901 234 567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </label>
          <p className="text-center text-xs font-medium text-slate-400">
            {tr("hoặc")}
          </p>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-500">Email</span>
            <Input
              type="email"
              placeholder="customer@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <Button className="flex-1" onClick={() => void submit()} disabled={sending}>
              {sending ? tr("Đang gửi…") : tr("Gửi bill")}
            </Button>
            <Button variant="outline" className="flex-1" onClick={onClose}>
              {tr("Hủy")}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
