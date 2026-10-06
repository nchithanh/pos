"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, FileText } from "lucide-react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { issueMockEInvoice } from "@/lib/services/einvoice";
import { formatDate, formatVnd } from "@/lib/utils";
import type { EInvoiceMock, Order } from "@/types";

type CustomerType = EInvoiceMock["customerType"];

export function ElectronicInvoiceModal({
  open,
  order,
  onClose,
  onIssued,
}: {
  open: boolean;
  order: Order | null;
  onClose: () => void;
  onIssued?: (order: Order) => void;
}) {
  const [customerType, setCustomerType] = useState<CustomerType>("business");
  const [companyName, setCompanyName] = useState("");
  const [taxCode, setTaxCode] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<EInvoiceMock | null>(null);
  const [viewing, setViewing] = useState(false);

  useEffect(() => {
    if (!open || !order) return;
    if (order.eInvoice) {
      setIssued(order.eInvoice);
      setViewing(false);
      return;
    }
    setIssued(null);
    setViewing(false);
    setCustomerType("business");
    setCompanyName(order.customerName && order.customerName !== "Khách lẻ" ? order.customerName : "");
    setTaxCode("");
    setAddress("");
    setEmail(order.customerEmail ?? "");
    setBusy(false);
  }, [open, order]);

  const submit = async () => {
    if (!order) return;
    const name = companyName.trim();
    const tax = taxCode.trim();
    const mail = email.trim();
    if (!name) {
      toast.error("Nhập tên công ty / cá nhân");
      return;
    }
    if (!/^\d{10}(\d{3})?$/.test(tax.replace(/\s/g, ""))) {
      toast.error("Mã số thuế phải gồm 10 hoặc 13 số");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      toast.error("Email nhận hóa đơn không hợp lệ");
      return;
    }
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      const updated = await issueMockEInvoice(order.id, {
        customerType,
        companyName: name,
        taxCode: tax.replace(/\s/g, ""),
        address: address.trim(),
        email: mail,
      });
      setIssued(updated.eInvoice ?? null);
      onIssued?.(updated);
      toast.success("Demo: đã phát hành hóa đơn");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không phát hành được");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={
        issued
          ? viewing
            ? "Xem hóa đơn demo"
            : "Hóa đơn đã phát hành"
          : "Thông tin xuất hóa đơn"
      }
      className="max-w-md"
    >
      {issued && viewing ? (
        <div className="space-y-3 text-sm">
          <p className="rounded-[10px] bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            Demo phát hành hóa đơn điện tử — không phải hóa đơn pháp lý.
          </p>
          <div className="rounded-[10px] border border-slate-200 p-3 dark:border-slate-700">
            <p className="font-bold">Số HĐ: {issued.number}</p>
            <p className="mt-1 text-slate-500">
              Ngày: {formatDate(issued.issuedAt)}
            </p>
            <p className="mt-2">{issued.companyName}</p>
            <p>MST: {issued.taxCode}</p>
            {issued.address ? <p>{issued.address}</p> : null}
            <p>{issued.email}</p>
            {order ? (
              <p className="mt-2 font-semibold">
                Liên kết đơn {order.code} · {formatVnd(order.total)}
              </p>
            ) : null}
          </div>
          <Button className="w-full" variant="outline" onClick={() => setViewing(false)}>
            Quay lại
          </Button>
        </div>
      ) : issued ? (
        <div className="py-2 text-center">
          <CheckCircle2 className="mx-auto text-emerald-500" size={40} />
          <p className="mt-3 text-lg font-bold">✓ Hóa đơn đã được phát hành</p>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
            Demo phát hành hóa đơn điện tử
          </p>
          <div className="mt-4 rounded-[10px] bg-slate-50 p-3 text-left text-sm dark:bg-slate-800">
            <p>
              Số hóa đơn:{" "}
              <span className="font-bold">{issued.number}</span>
            </p>
            <p className="mt-1">
              Ngày phát hành: {formatDate(issued.issuedAt)}
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setViewing(true)}
            >
              <FileText size={16} /> Xem hóa đơn
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                toast.success("Demo: đã gửi email hóa đơn");
              }}
            >
              Gửi email
            </Button>
          </div>
          <Button className="mt-2 w-full" onClick={onClose}>
            Đóng
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="rounded-[10px] bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            Demo phát hành hóa đơn điện tử — không kết nối cơ quan thuế.
          </p>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-500">
              Loại khách hàng
            </legend>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="einvoice-type"
                  checked={customerType === "individual"}
                  onChange={() => setCustomerType("individual")}
                />
                Cá nhân
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="einvoice-type"
                  checked={customerType === "business"}
                  onChange={() => setCustomerType("business")}
                />
                Doanh nghiệp
              </label>
            </div>
          </fieldset>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-500">
              {customerType === "business" ? "Tên công ty *" : "Họ tên *"}
            </span>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder={
                customerType === "business"
                  ? "Công ty TNHH ABC"
                  : "Nguyễn Văn A"
              }
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-500">
              Mã số thuế *
            </span>
            <Input
              value={taxCode}
              onChange={(e) => setTaxCode(e.target.value)}
              placeholder="0312345678"
              inputMode="numeric"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-500">Địa chỉ</span>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Nguyễn Văn A, TP.HCM"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-500">
              Email nhận hóa đơn *
            </span>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="accounting@abc.vn"
            />
          </label>
          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <Button className="flex-1" onClick={submit} disabled={busy}>
              {busy ? "Đang phát hành…" : "Phát hành hóa đơn"}
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
