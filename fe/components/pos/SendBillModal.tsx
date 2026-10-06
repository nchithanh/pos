"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Order } from "@/types";

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

  useEffect(() => {
    if (!open || !order) return;
    setPhone(order.customerPhone ?? "");
    setEmail(order.customerEmail ?? "");
    setSent(false);
    setSending(false);
  }, [open, order]);

  const submit = async () => {
    const p = phone.trim();
    const e = email.trim();
    if (!p && !e) {
      toast.error("Nhập số điện thoại hoặc email");
      return;
    }
    if (p && !/^0\d{9,10}$/.test(p.replace(/\s/g, ""))) {
      toast.error("Số điện thoại không hợp lệ");
      return;
    }
    if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      toast.error("Email không hợp lệ");
      return;
    }
    setSending(true);
    await new Promise((r) => setTimeout(r, 600));
    setSending(false);
    setSent(true);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={sent ? "Đã gửi bill" : "Gửi bill"}
      className="max-w-md"
    >
      {sent ? (
        <div className="py-4 text-center">
          <CheckCircle2 className="mx-auto text-emerald-500" size={40} />
          <p className="mt-3 text-lg font-bold">✓ Đã gửi bill thành công</p>
          <p className="mt-1 text-sm text-slate-500">
            Demo — chưa gửi tin nhắn / email thật.
          </p>
          <Button className="mt-5 w-full" onClick={onClose}>
            Đóng
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {order ? (
            <p className="text-sm text-slate-500">
              Bill đơn <span className="font-semibold text-slate-800 dark:text-slate-100">{order.code}</span>
            </p>
          ) : null}
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-500">
              Số điện thoại
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
          <p className="text-center text-xs font-medium text-slate-400">hoặc</p>
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
            <Button className="flex-1" onClick={submit} disabled={sending}>
              {sending ? "Đang gửi…" : "Gửi bill"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Hủy
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
