"use client";

import { tr } from "@/lib/i18n/translate";

import { useEffect, useState } from "react";
import { Download, FileText, Printer, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ReceiptPreview } from "@/components/pos/ReceiptPreview";
import { SendBillModal } from "@/components/pos/SendBillModal";
import { ElectronicInvoiceModal } from "@/components/pos/ElectronicInvoiceModal";
import { downloadReceiptPdf } from "@/lib/pdf-receipt";
import { printReceipt } from "@/lib/print-receipt";
import { cn } from "@/lib/utils";
import type { Order, StoreSettings } from "@/types";

export function ReceiptActions({
  order,
  store,
  layout = "stack",
  onOrderChange,
  className,
}: {
  order: Order;
  store?: StoreSettings;
  layout?: "stack" | "row";
  onOrderChange?: (order: Order) => void;
  className?: string;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [current, setCurrent] = useState(order);

  useEffect(() => {
    setCurrent(order);
  }, [order]);

  const btnClass = layout === "stack" ? "w-full" : "flex-1";

  return (
    <>
      <div
        className={cn(
          layout === "stack" ? "flex flex-col gap-2" : "flex flex-wrap gap-2",
          className,
        )}
      >
        <Button
          variant="outline"
          className={btnClass}
          onClick={() => setPreviewOpen(true)}
        >
          <Printer size={16} /> {tr("In bill")}
        </Button>
        <Button
          variant="outline"
          className={btnClass}
          onClick={() => setSendOpen(true)}
        >
          <Send size={16} /> {tr("Gửi bill")}
        </Button>
        <Button
          variant="outline"
          className={btnClass}
          onClick={() => setInvoiceOpen(true)}
        >
          <FileText size={16} /> Xuất hóa đơn điện tử
        </Button>
        <Button
          variant="outline"
          className={btnClass}
          onClick={() => {
            try {
              downloadReceiptPdf(current, store);
              toast.success(tr("Đã tải PDF bill"));
            } catch (e) {
              toast.error(e instanceof Error ? e.message : tr("Không xuất PDF được"));
            }
          }}
        >
          <Download size={16} /> Tải PDF
        </Button>
      </div>

      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={tr("Xem trước bill")}
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="max-h-[55vh] overflow-y-auto sm:max-h-[60vh]">
            <ReceiptPreview order={current} store={store} />
          </div>
          <p className="text-center text-xs text-slate-500">
            Khổ in: {store?.receiptWidth ?? 80}mm · Cài đặt cửa hàng để đổi 58/80
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="flex-1"
              onClick={() => printReceipt(current, store)}
            >
              <Printer size={16} /> {tr("In bill")}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                downloadReceiptPdf(current, store);
                toast.success(tr("Đã tải PDF bill"));
              }}
            >
              <Download size={16} /> PDF
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setPreviewOpen(false)}
            >
              {tr("Đóng")}
            </Button>
          </div>
        </div>
      </Dialog>

      <SendBillModal
        open={sendOpen}
        order={current}
        onClose={() => setSendOpen(false)}
      />

      <ElectronicInvoiceModal
        open={invoiceOpen}
        order={current}
        onClose={() => setInvoiceOpen(false)}
        onIssued={(updated) => {
          setCurrent(updated);
          onOrderChange?.(updated);
        }}
      />
    </>
  );
}
