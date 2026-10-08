"use client";

import { tr } from "@/lib/i18n/translate";

import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/notify";
import { formatVnd } from "@/lib/utils";

/** Demo QR only — payload includes the amount, not a live bank code. */
export function transferQrPayload(amount: number) {
  return `DOLPHIN-POS|CK|${Math.max(0, Math.round(amount))}|VND`;
}

export function TransferQr({ amount }: { amount: number }) {
  const [dataUrl, setDataUrl] = useState("");
  const payload = transferQrPayload(amount);
  const label = `Chuyển khoản ${formatVnd(amount)}`;

  useEffect(() => {
    let cancelled = false;
    void import("qrcode").then((QRCode) =>
      QRCode.toDataURL(payload, {
        margin: 1,
        width: 220,
        errorCorrectionLevel: "M",
      }).then((url) => {
        if (!cancelled) setDataUrl(url);
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [payload]);

  const share = async () => {
    const text = `${label}\n${payload}`;
    try {
      if (dataUrl && typeof navigator.share === "function") {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], "chuyen-khoan.png", { type: "image/png" });
        const withFile =
          typeof navigator.canShare !== "function" ||
          navigator.canShare({ files: [file] });
        if (withFile) {
          await navigator.share({ title: tr("Chuyển khoản"), text: label, files: [file] });
          return;
        }
        await navigator.share({ title: tr("Chuyển khoản"), text });
        return;
      }
      await navigator.clipboard.writeText(text);
      notify.success(tr("Đã copy nội dung chuyển khoản"));
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(text);
        notify.success(tr("Đã copy nội dung chuyển khoản"));
      } catch {
        notify.error(tr("Không chia sẻ được"));
      }
    }
  };

  return (
    <div className="mt-4 flex flex-col items-center rounded-[10px] border border-slate-200 p-4 dark:border-slate-700">
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dataUrl}
          alt={`Mã QR chuyển khoản ${formatVnd(amount)}`}
          width={220}
          height={220}
          className="rounded-[10px]"
        />
      ) : (
        <div className="h-[220px] w-[220px] animate-pulse rounded-[10px] bg-slate-100 dark:bg-slate-800" />
      )}
      <p className="mt-3 text-sm text-slate-500">{tr("Số tiền chuyển khoản")}</p>
      <p className="text-xl font-bold">{formatVnd(amount)}</p>
      <p className="mt-1 text-center text-xs text-slate-400">
        Mã QR demo, chưa nối ngân hàng.
      </p>
      <Button
        type="button"
        variant="outline"
        className="mt-3"
        onClick={() => void share()}
        disabled={amount <= 0}
      >
        <Share2 size={16} /> Chia sẻ
      </Button>
    </div>
  );
}
