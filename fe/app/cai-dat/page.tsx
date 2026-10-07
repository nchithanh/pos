"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Building2,
  CheckCircle2,
  FileText,
  Shield,
  Users,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useConfirm } from "@/hooks/use-confirm";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import {
  DEFAULT_EINVOICE_CONFIG,
  EINVOICE_STORES,
  EINVOICE_TEMPLATES,
  getInvoiceSeriesOptions,
  normalizeEInvoiceConfig,
} from "@/lib/einvoice-config";
import { resetDatabase } from "@/lib/seed";
import { checkEInvoiceConnection } from "@/lib/services/einvoice";
import {
  VERTICAL_OPTIONS,
  clearStoredVertical,
  getStoredVertical,
} from "@/lib/vertical";
import { cn, formatDateTime } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import type { EInvoiceConfig, StoreVertical } from "@/types";
import { useRouter } from "next/navigation";

type SettingsTab = "store" | "einvoice" | "staff";

const TABS: { id: SettingsTab; label: string; icon: typeof Building2 }[] = [
  { id: "store", label: "Cửa hàng", icon: Building2 },
  { id: "einvoice", label: "Hóa đơn điện tử", icon: FileText },
  { id: "staff", label: "Nhân viên & phân quyền", icon: Users },
];

export default function SettingsPage() {
  const { confirm, dialog: confirmDialog } = useConfirm();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const clearCart = useCartStore((s) => s.clear);
  const settings = useLiveQuery(() => db.settings.get("store"));
  const users = useLiveQuery(() => db.users.toArray()) ?? [];
  const { setTheme } = useTheme();
  const [tab, setTab] = useState<SettingsTab>("store");
  const activeVertical = getStoredVertical();
  const verticalLabel =
    VERTICAL_OPTIONS.find((v) => v.id === activeVertical)?.label ??
    settings?.vertical;

  const [name, setName] = useState("");
  const [slogan, setSlogan] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [legalName, setLegalName] = useState("");
  const [taxCode, setTaxCode] = useState("");
  const [billFooter, setBillFooter] = useState("");
  const [logoEmoji, setLogoEmoji] = useState("🐬");
  const [taxRate, setTaxRate] = useState("0");
  const [vertical, setVertical] = useState<StoreVertical>("pet");
  const [receiptWidth, setReceiptWidth] = useState<"58" | "80">("80");

  const [ei, setEi] = useState<EInvoiceConfig>(DEFAULT_EINVOICE_CONFIG);
  const [checking, setChecking] = useState(false);

  const seriesOptions = useMemo(() => getInvoiceSeriesOptions(), []);

  useEffect(() => {
    if (!settings) return;
    setName(settings.name);
    setSlogan(settings.slogan);
    setPhone(settings.phone);
    setEmail(settings.email ?? "");
    setAddress(settings.address);
    setLegalName(settings.legalName ?? "");
    setTaxCode(settings.taxCode ?? "");
    setBillFooter(settings.billFooter ?? "");
    setLogoEmoji(settings.logoEmoji ?? "🐬");
    setTaxRate(String(settings.taxRate));
    setVertical(settings.vertical);
    setReceiptWidth(String(settings.receiptWidth) as "58" | "80");
    setEi(normalizeEInvoiceConfig(settings.eInvoice));
  }, [settings]);

  const persistStore = async (extra?: Partial<{ eInvoice: EInvoiceConfig }>) => {
    await db.settings.put({
      id: "store",
      name: name.trim() || "Pet Dolphin Store",
      slogan,
      phone,
      email: email.trim() || undefined,
      address,
      legalName: legalName.trim() || undefined,
      taxCode: taxCode.trim() || undefined,
      billFooter: billFooter.trim() || undefined,
      taxRate: Number(taxRate) || 0,
      vertical,
      currency: "VND",
      receiptWidth: Number(receiptWidth) as 58 | 80,
      logoEmoji: logoEmoji || "🐬",
      theme: settings?.theme ?? "light",
      eInvoice: extra?.eInvoice ?? normalizeEInvoiceConfig(ei),
      updatedAt: new Date().toISOString(),
    });
  };

  const saveStore = async () => {
    await persistStore();
    notify.success("Đã lưu thông tin cửa hàng");
  };

  const saveEInvoice = async () => {
    const next = normalizeEInvoiceConfig(ei);
    setEi(next);
    await persistStore({ eInvoice: next });
    notify.success("Đã lưu cấu hình hóa đơn điện tử (demo)");
  };

  const checkConnection = async () => {
    setChecking(true);
    try {
      const nextBase = normalizeEInvoiceConfig({ ...ei, provider: "sepay" });
      setEi(nextBase);
      await persistStore({ eInvoice: nextBase });
      const res = await checkEInvoiceConnection();
      const next: EInvoiceConfig = {
        ...nextBase,
        connected: res.ok,
        lastCheckedAt: new Date().toISOString(),
        mode: res.ok ? "simulator" : nextBase.mode,
      };
      if (res.ok) {
        setEi(next);
        await persistStore({ eInvoice: next });
        notify.success(res.message);
      } else {
        notify.warning(res.message);
      }
    } catch (e) {
      notify.fromError(e, "Không kiểm tra được kết nối");
    } finally {
      setChecking(false);
    }
  };

  const backup = async () => {
    const data = {
      settings: await db.settings.toArray(),
      users: await db.users.toArray(),
      products: await db.products.toArray(),
      categories: await db.categories.toArray(),
      customers: await db.customers.toArray(),
      suppliers: await db.suppliers.toArray(),
      orders: await db.orders.toArray(),
      movements: await db.movements.toArray(),
      debts: await db.debts.toArray(),
      debtPayments: await db.debtPayments.toArray(),
      shifts: await db.shifts.toArray(),
      meta: await db.meta.toArray(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dolphin-pos-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify.success("Đã tải backup");
  };

  const restore = async (file: File) => {
    const text = await file.text();
    const data = JSON.parse(text) as Record<string, unknown[]>;
    await db.transaction("rw", db.tables, async () => {
      for (const table of db.tables) await table.clear();
      if (data.settings) await db.settings.bulkPut(data.settings as never[]);
      if (data.users) await db.users.bulkPut(data.users as never[]);
      if (data.products) await db.products.bulkPut(data.products as never[]);
      if (data.categories) await db.categories.bulkPut(data.categories as never[]);
      if (data.customers) await db.customers.bulkPut(data.customers as never[]);
      if (data.suppliers) await db.suppliers.bulkPut(data.suppliers as never[]);
      if (data.orders) await db.orders.bulkPut(data.orders as never[]);
      if (data.movements) await db.movements.bulkPut(data.movements as never[]);
      if (data.debts) await db.debts.bulkPut(data.debts as never[]);
      if (data.debtPayments)
        await db.debtPayments.bulkPut(data.debtPayments as never[]);
      if (data.shifts) await db.shifts.bulkPut(data.shifts as never[]);
      if (data.meta) await db.meta.bulkPut(data.meta as never[]);
    });
    notify.success("Đã khôi phục dữ liệu");
    window.location.reload();
  };

  const selectClass =
    "h-11 w-full rounded-[10px] border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900";

  return (
    <AppShell>
      {confirmDialog}
      <PageHeader
        title="Cài đặt"
        description="Cửa hàng · hóa đơn điện tử · nhân viên"
      />

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-[12px] bg-white p-1 dark:bg-slate-900">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={cn(
              "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[10px] px-3 text-sm font-semibold whitespace-nowrap",
              tab === id
                ? "bg-emerald-500 text-white"
                : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800",
            )}
            onClick={() => setTab(id)}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">
              {id === "store" ? "Shop" : id === "einvoice" ? "HĐĐT" : "NV"}
            </span>
          </button>
        ))}
      </div>

      {tab === "store" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="space-y-3 p-4">
            <h2 className="font-bold">Thông tin cửa hàng</h2>
            <p className="text-xs text-slate-500">
              Thông tin hiển thị trên Dolphin POS / bill — khác với tài khoản
              phát hành HĐĐT của nhà cung cấp.
            </p>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-500">Tên cửa hàng</span>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-500">Logo (emoji)</span>
              <Input
                value={logoEmoji}
                onChange={(e) => setLogoEmoji(e.target.value)}
                maxLength={4}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-500">Địa chỉ</span>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-500">Số điện thoại</span>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-500">Email</span>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-500">
                Slogan / dòng phụ trên bill
              </span>
              <Input
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-500">
                Lời cảm ơn cuối bill
              </span>
              <Input
                value={billFooter}
                onChange={(e) => setBillFooter(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-500">Ngành hàng</span>
              <select
                className={selectClass}
                value={vertical}
                onChange={(e) => setVertical(e.target.value as StoreVertical)}
              >
                <option value="pet">Pet shop</option>
                <option value="cafe">Cafe</option>
                <option value="tra-sua">Trà sữa</option>
                <option value="thoi-trang">Thời trang</option>
                <option value="nha-hang">Nhà hàng</option>
                <option value="tap-hoa">Tạp hóa</option>
                <option value="dien-thoai">Điện thoại & laptop</option>
                <option value="clothing">Clothing (legacy)</option>
                <option value="general">General (legacy)</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-500">Khổ in bill</span>
              <select
                className={selectClass}
                value={receiptWidth}
                onChange={(e) =>
                  setReceiptWidth(e.target.value as "58" | "80")
                }
              >
                <option value="58">In nhiệt 58mm</option>
                <option value="80">In nhiệt 80mm</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-500">Thuế % (POS)</span>
              <Input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
            </label>
            <Button onClick={saveStore} className="w-full">
              Lưu cửa hàng
            </Button>
          </Card>

          <div className="space-y-4">
            <Card className="space-y-3 p-4">
              <h2 className="font-bold">Thông tin pháp lý</h2>
              <p className="text-xs text-slate-500">
                Hồ sơ nội bộ cửa hàng. Phát hành HĐĐT dùng cấu hình tài khoản
                SePay ở tab riêng.
              </p>
              <label className="block text-sm">
                <span className="mb-1 block text-slate-500">Tên pháp nhân</span>
                <Input
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="CÔNG TY TNHH …"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-slate-500">Mã số thuế</span>
                <Input
                  value={taxCode}
                  onChange={(e) => setTaxCode(e.target.value)}
                  placeholder="031xxxxxxx"
                  inputMode="numeric"
                />
              </label>
            </Card>

            <Card className="space-y-3 p-4">
              <h2 className="font-bold">Giao diện</h2>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setTheme("light")}>
                  Light
                </Button>
                <Button variant="outline" onClick={() => setTheme("dark")}>
                  Dark
                </Button>
                <Button variant="outline" onClick={() => setTheme("system")}>
                  System
                </Button>
              </div>
            </Card>

            <Card className="space-y-3 p-4">
              <h2 className="font-bold">Lĩnh vực demo</h2>
              <p className="text-sm text-slate-500">
                Hiện tại:{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {verticalLabel ?? "—"}
                </span>
              </p>
              <p className="text-xs text-slate-400">
                Đổi lĩnh vực sẽ đăng xuất và mở màn chọn (data mỗi lĩnh vực lưu
                IndexedDB riêng).
              </p>
              <Button
                className="w-full"
                variant="outline"
                onClick={async () => {
                  const ok = await confirm({
                    title: "Đổi lĩnh vực?",
                    description:
                      "Bạn sẽ đăng xuất và chọn lại Pet shop hoặc Cafe. Data lĩnh vực hiện tại vẫn giữ trên máy.",
                    confirmLabel: "Đổi lĩnh vực",
                  });
                  if (!ok) return;
                  clearStoredVertical();
                  logout();
                  clearCart();
                  router.replace("/chon-linh-vuc");
                }}
              >
                Đổi lĩnh vực cửa hàng
              </Button>
            </Card>

            <Card className="space-y-3 p-4">
              <h2 className="font-bold">Backup / Restore</h2>
              <Button className="w-full" variant="outline" onClick={backup}>
                Tải backup JSON
              </Button>
              <label className="block">
                <span className="mb-1 block text-sm text-slate-500">
                  Khôi phục từ file
                </span>
                <Input
                  type="file"
                  accept="application/json"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void restore(f);
                  }}
                />
              </label>
              <Button
                variant="danger"
                className="w-full"
                onClick={async () => {
                  const ok = await confirm({
                    title: "Reset dữ liệu demo?",
                    description:
                      "Toàn bộ dữ liệu local sẽ bị xóa và seed lại từ đầu. Không thể hoàn tác.",
                    confirmLabel: "Reset",
                    variant: "danger",
                  });
                  if (!ok) return;
                  await resetDatabase();
                  notify.success("Đã reset DB");
                  window.location.href = "/login";
                }}
              >
                Reset dữ liệu demo
              </Button>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "einvoice" ? (
        <Card className="mx-auto max-w-xl space-y-4 p-4 sm:p-5">
          <div>
            <h2 className="text-lg font-bold">Hóa đơn điện tử</h2>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
              Mode Simulator theo contract docs SePay — không phát hành hóa đơn
              pháp lý. Sandbox thật cần credential + API server (TODO).
            </p>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-500">Mode</span>
            <select
              className={selectClass}
              value={ei.mode}
              onChange={(e) =>
                setEi((s) => ({
                  ...s,
                  mode: e.target.value as EInvoiceConfig["mode"],
                  connected: e.target.value === "simulator" ? s.connected : false,
                }))
              }
            >
              <option value="simulator">Simulator (docs / demo)</option>
              <option value="sandbox">Sandbox thật (cần credential)</option>
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-500">
              Nhà cung cấp
            </span>
            <select
              className={selectClass}
              value={ei.provider}
              onChange={(e) =>
                setEi((s) => ({
                  ...s,
                  provider: e.target.value as EInvoiceConfig["provider"],
                  connected:
                    e.target.value === "none" ? false : s.connected,
                }))
              }
            >
              <option value="sepay">SePay</option>
              <option value="none">Chưa chọn</option>
            </select>
          </label>

          <div className="rounded-[10px] bg-slate-50 px-3 py-3 dark:bg-slate-800">
            <p className="text-sm font-medium text-slate-500">Trạng thái</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold">
              {ei.provider !== "none" && ei.connected ? (
                <>
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Đã kết nối
                </>
              ) : (
                <>
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-400" />
                  Chưa kết nối
                </>
              )}
            </p>
            {ei.lastCheckedAt ? (
              <p className="mt-1 text-xs text-slate-400">
                Kiểm tra lần cuối: {formatDateTime(ei.lastCheckedAt)}
              </p>
            ) : null}
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-500">
              Tài khoản hóa đơn
            </span>
            <Input
              value={ei.accountLabel}
              onChange={(e) =>
                setEi((s) => ({ ...s, accountLabel: e.target.value }))
              }
              disabled={ei.provider === "none"}
            />
            <p className="mt-1 text-[11px] text-slate-400">
              provider_account_id: {ei.providerAccountId}
            </p>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-500">
              Mẫu hóa đơn
            </span>
            <select
              className={selectClass}
              value={ei.invoiceTemplateId}
              disabled={ei.provider === "none"}
              onChange={(e) => {
                const tpl = EINVOICE_TEMPLATES.find(
                  (t) => t.id === e.target.value,
                );
                setEi((s) => ({
                  ...s,
                  invoiceTemplateId: e.target.value,
                  invoiceTemplateLabel: tpl?.label ?? s.invoiceTemplateLabel,
                }));
              }}
            >
              {EINVOICE_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-500">
              Ký hiệu hóa đơn
            </span>
            <select
              className={selectClass}
              value={ei.invoiceSeries}
              disabled={ei.provider === "none"}
              onChange={(e) =>
                setEi((s) => ({ ...s, invoiceSeries: e.target.value }))
              }
            >
              {seriesOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-400">
              Chọn từ tài khoản demo (theo năm hiện tại). Không nhập tự do.
            </p>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-500">
              Địa điểm kinh doanh
            </span>
            <select
              className={selectClass}
              value={ei.sellerStoreXid}
              disabled={ei.provider === "none"}
              onChange={(e) => {
                const store = EINVOICE_STORES.find(
                  (s) => s.xid === e.target.value,
                );
                setEi((s) => ({
                  ...s,
                  sellerStoreXid: e.target.value,
                  storeLabel: store?.label ?? s.storeLabel,
                }));
              }}
            >
              {EINVOICE_STORES.map((s) => (
                <option key={s.xid} value={s.xid}>
                  {s.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-400">
              seller_store_xid: {ei.sellerStoreXid}
            </p>
          </label>

          <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1"
              onClick={checkConnection}
              disabled={checking || ei.provider === "none"}
            >
              {checking ? "Đang kiểm tra…" : "Kiểm tra kết nối"}
            </Button>
            <Button
              className="flex-1"
              onClick={saveEInvoice}
              disabled={ei.provider === "none"}
            >
              Lưu cấu hình
            </Button>
          </div>
        </Card>
      ) : null}

      {tab === "staff" ? (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold">Nhân viên & phân quyền</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Owner / Quản lý / Thu ngân — quản lý chi tiết tại màn Nhân
                  viên.
                </p>
              </div>
              <Link href="/nhan-vien">
                <Button>
                  <Shield size={16} /> Mở quản lý nhân viên
                </Button>
              </Link>
            </div>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {users.map((u) => (
              <Card key={u.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: u.avatarColor }}
                  >
                    {u.name.trim().charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{u.name}</p>
                    <p className="truncate text-xs text-slate-500">{u.email}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge status={u.role} />
                      <Badge status={u.status} />
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      {
                        Object.values(u.permissions).filter(Boolean).length
                      }
                      /{Object.keys(u.permissions).length} quyền bật
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="space-y-2 p-4 text-sm text-slate-600 dark:text-slate-300">
            <p className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
              <CheckCircle2 size={16} className="text-emerald-500" /> Vai trò
              mẫu
            </p>
            <ul className="list-inside list-disc space-y-1 text-slate-500">
              <li>
                <strong>Chủ cửa hàng</strong> — toàn quyền, gồm Cài đặt & HĐĐT
              </li>
              <li>
                <strong>Quản lý</strong> — bán hàng, kho, công nợ; hạn chế nhân
                viên/cài đặt
              </li>
              <li>
                <strong>Thu ngân</strong> — bán hàng & xem cần thiết
              </li>
            </ul>
          </Card>
        </div>
      ) : null}
    </AppShell>
  );
}
