"use client";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingBlock } from "@/components/finance/widgets";
import { useBooks } from "@/lib/finance/use-books";
import { formatVnd } from "@/lib/utils";

const COPY: Record<string, string> = {
  low_cash: "Tiền mặt thấp hơn mức tối thiểu",
  overdue_debt: "Công nợ quá hạn",
  due_soon: "Công nợ sắp đến hạn",
  expense_spike: "Chi phí tăng bất thường",
  negative_cashflow: "Dòng tiền âm",
  revenue_drop: "Doanh thu giảm",
  shift_mismatch: "Lệch tiền khi đối soát ca",
};

export default function AlertsPage() {
  const books = useBooks();
  return (
    <AppShell>
      <PageHeader
        title="Cảnh báo tài chính"
        description="Bật hoặc tắt từng loại cảnh báo. Ngưỡng lưu trên trình duyệt này."
      />
      {books.loading ? <LoadingBlock /> : null}
      {!books.loading ? (
        <ul className="space-y-3">
          {books.finance.alerts.map((rule) => (
            <li key={rule.id}>
              <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{COPY[rule.kind] ?? rule.label}</p>
                  <p className="text-xs text-slate-500">{rule.label}</p>
                </div>
                <div className="flex items-center gap-3">
                  {rule.kind === "low_cash" ? (
                    <label className="text-sm">
                      <span className="mb-1 block text-slate-500">
                        Tiền mặt thấp hơn {formatVnd(rule.threshold ?? 0)}
                      </span>
                      <Input
                        type="number"
                        value={rule.threshold ?? 0}
                        onChange={(e) =>
                          books.finance.updateAlert(rule.id, {
                            threshold: Number(e.target.value) || 0,
                          })
                        }
                      />
                    </label>
                  ) : null}
                  <label className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={(e) =>
                        books.finance.updateAlert(rule.id, { enabled: e.target.checked })
                      }
                    />
                    {rule.enabled ? "Đang bật" : "Đang tắt"}
                  </label>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : null}
    </AppShell>
  );
}
