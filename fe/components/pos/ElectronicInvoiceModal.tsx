"use client";

import { tr } from "@/lib/i18n/translate";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { CheckCircle2, FileText } from "lucide-react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { normalizeEInvoiceConfig } from "@/lib/einvoice-config";
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
  const settings = useLiveQuery(() => db.settings.get("store"));
  const cfg = normalizeEInvoiceConfig(settings?.eInvoice);
  const connected = cfg.provider !== "none" && cfg.connected;

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
    setCompanyName(
      order.customerName && order.customerName !== "Khách lẻ"
        ? order.customerName
        : "",
    );
    setTaxCode("");
    setAddress("");
    setEmail(order.customerEmail ?? "");
    setBusy(false);
  }, [open, order]);

  const submit = async () => {
    if (!order) return;
    if (!connected) {
      toast.error(tr("Chưa kết nối HĐĐT — vào Cài đặt để cấu hình"));
      return;
    }
    const name = companyName.trim();
    const tax = taxCode.trim();
    const mail = email.trim();
    if (!name) {
      toast.error(tr("Nhập tên công ty / cá nhân"));
      return;
    }
    if (!/^\d{10}(\d{3})?$/.test(tax.replace(/\s/g, ""))) {
      toast.error(tr("Mã số thuế phải gồm 10 hoặc 13 số"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      toast.error(tr("Email nhận hóa đơn không hợp lệ"));
      return;
    }
    setBusy(true);
    try {
      const updated = await issueMockEInvoice(order.id, {
        customerType,
        companyName: name,
        taxCode: tax.replace(/\s/g, ""),
        address: address.trim(),
        email: mail,
      });
      setIssued(updated.eInvoice ?? null);
      onIssued?.(updated);
      toast.success(
        cfg.mode === "simulator"
          ? tr("Simulator SePay: đã phát hành (tracking)")
          : tr("Đã phát hành hóa đơn"),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tr("Không phát hành được"));
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
            ? tr("Xem hóa đơn demo")
            : tr("Hóa đơn đã phát hành")
          : tr("Thông tin xuất hóa đơn")
      }
      className="max-w-md"
    >
      {issued && viewing ? (
        <div className="space-y-3 text-sm">
          <p className="rounded-[10px] bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            Demo phát hành hóa đơn điện tử — không phải hóa đơn pháp lý.
          </p>
          <div className="rounded-[10px] border border-slate-200 p-3 dark:border-slate-700">
            <p className="font-bold">
              Số HĐ: {issued.invoiceSeries ?? cfg.invoiceSeries}-
              {issued.number}
            </p>
            {issued.trackingCode ? (
              <p className="mt-1 text-xs text-slate-500">
                Tracking: {issued.trackingCode}
                {issued.status ? ` · ${issued.status}` : ""}
              </p>
            ) : null}
            <p className="mt-1 text-slate-500">
              {tr("Ngày:")} {formatDate(issued.issuedAt)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Người bán: {issued.accountLabel ?? cfg.accountLabel}
            </p>
            <p className="text-xs text-slate-500">
              {tr("Mẫu:")} {issued.invoiceTemplateLabel ?? cfg.invoiceTemplateLabel} ·{" "}
              {issued.storeLabel ?? cfg.storeLabel}
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
          <Button
            className="w-full"
            variant="outline"
            onClick={() => setViewing(false)}
          >
            {tr("Quay lại")}
          </Button>
        </div>
      ) : issued ? (
        <div className="py-2 text-center">
          <CheckCircle2 className="mx-auto text-emerald-500" size={40} />
          <p className="mt-3 text-lg font-bold">{tr("✓ Hóa đơn đã được phát hành")}</p>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
            Demo phát hành hóa đơn điện tử
          </p>
          <div className="mt-4 rounded-[10px] bg-slate-50 p-3 text-left text-sm dark:bg-slate-800">
            <p>
              Số hóa đơn:{" "}
              <span className="font-bold">
                {issued.invoiceSeries ?? cfg.invoiceSeries}-{issued.number}
              </span>
            </p>
            <p className="mt-1">
              Ngày phát hành: {formatDate(issued.issuedAt)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Ký hiệu {issued.invoiceSeries} · {issued.storeLabel}
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
                toast.success(tr("Demo: đã gửi email hóa đơn"));
              }}
            >
              Gửi email
            </Button>
          </div>
          <Button className="mt-2 w-full" onClick={onClose}>
            {tr("Đóng")}
          </Button>
        </div>
      ) : !connected ? (
        <div className="space-y-3 py-2 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Chưa kết nối nhà cung cấp hóa đơn điện tử.
          </p>
          <p className="text-xs text-slate-500">
            Vào Cài đặt → Hóa đơn điện tử để chọn SePay, mẫu, ký hiệu và địa
            điểm kinh doanh (demo).
          </p>
          <Link href="/cai-dat" onClick={onClose}>
            <Button className="w-full">{tr("Mở cài đặt HĐĐT")}</Button>
          </Link>
          <Button variant="outline" className="w-full" onClick={onClose}>
            {tr("Đóng")}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="rounded-[10px] bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            Demo SePay — dùng cấu hình admin (không kết nối cơ quan thuế).
          </p>
          <div className="rounded-[10px] bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <p>
              <span className="text-slate-400">{tr("Tài khoản:")}</span>{" "}
              {cfg.accountLabel}
            </p>
            <p>
              <span className="text-slate-400">{tr("Mẫu:")}</span>{" "}
              {cfg.invoiceTemplateLabel}
            </p>
            <p>
              <span className="text-slate-400">{tr("Ký hiệu:")}</span>{" "}
              {cfg.invoiceSeries}
            </p>
            <p>
              <span className="text-slate-400">{tr("Địa điểm:")}</span> {cfg.storeLabel}
            </p>
          </div>
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
              {customerType === "business" ? tr("Tên công ty *") : tr("Họ tên *")}
            </span>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder={
                customerType === "business"
                  ? tr("Công ty TNHH ABC")
                  : tr("Nguyễn Văn A")
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
            <span className="mb-1 block font-medium text-slate-500">{tr("Địa chỉ")}</span>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={tr("123 Nguyễn Văn A, TP.HCM")}
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
              {busy ? tr("Đang phát hành…") : tr("Phát hành hóa đơn")}
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
