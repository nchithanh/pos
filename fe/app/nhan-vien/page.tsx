"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Shield } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { formatDateTime, uid } from "@/lib/utils";
import type { PermissionKey, Role, User } from "@/types";

const PERMS: PermissionKey[] = [
  "ban-hang", "san-pham", "kho", "khach-hang", "nha-cung-cap", "cong-no", "doanh-thu", "nhan-vien", "cai-dat",
];
const PERM_LABEL: Record<PermissionKey, string> = {
  "ban-hang": "Bán hàng",
  "san-pham": "Sản phẩm",
  kho: "Kho",
  "khach-hang": "Khách hàng",
  "nha-cung-cap": "Nhà cung cấp",
  "cong-no": "Công nợ",
  "doanh-thu": "Doanh thu",
  "nhan-vien": "Nhân viên",
  "cai-dat": "Cài đặt",
};

export default function EmployeesPage() {
  const users = useLiveQuery(() => db.users.toArray()) ?? [];
  const shifts = useLiveQuery(() => db.shifts.orderBy("openedAt").reverse().limit(20).toArray()) ?? [];
  const [open, setOpen] = useState(false);
  const [permUser, setPermUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("1111");
  const [role, setRole] = useState<Role>("cashier");

  return (
    <AppShell>
      <PageHeader
        title="Nhân viên"
        description="Phân quyền · lịch sử ca"
        actions={<Button onClick={() => setOpen(true)}><Plus size={16} /> Thêm</Button>}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {users.map((u) => (
          <Card key={u.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: u.avatarColor }}>
                {u.name.split(" ").slice(-1)[0]?.[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <p className="font-bold">{u.name}</p>
                  <Badge status={u.status} />
                </div>
                <p className="text-xs text-slate-500">{u.email}</p>
                <Badge status={u.role} className="mt-2" />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={() => setPermUser(u)}>
                <Shield size={14} /> Quyền
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await db.users.update(u.id, {
                    status: u.status === "active" ? "inactive" : "active",
                  });
                  toast.success("Đã đổi trạng thái");
                }}
              >
                {u.status === "active" ? "Tắt" : "Bật"}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-4 p-4">
        <h2 className="mb-3 font-bold">Lịch sử ca làm</h2>
        <ul className="space-y-2 text-sm">
          {shifts.map((s) => (
            <li key={s.id} className="flex justify-between rounded-[10px] bg-slate-50 px-3 py-2 dark:bg-slate-800">
              <span>{s.userName} · {formatDateTime(s.openedAt)}</span>
              <Badge status={s.status} />
            </li>
          ))}
        </ul>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} title="Thêm nhân viên">
        <div className="space-y-3">
          <Input placeholder="Họ tên" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="PIN" value={pin} onChange={(e) => setPin(e.target.value)} />
          <select className="h-11 w-full rounded-[10px] border px-3 dark:bg-slate-900" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="owner">Chủ cửa hàng</option>
            <option value="manager">Quản lý</option>
            <option value="cashier">Thu ngân</option>
          </select>
          <Button
            className="w-full"
            onClick={async () => {
              if (!name.trim() || !email.trim()) return toast.error("Thiếu thông tin");
              const permissions = Object.fromEntries(PERMS.map((p) => [p, role !== "cashier" || p === "ban-hang" || p === "san-pham" || p === "khach-hang"])) as Record<PermissionKey, boolean>;
              await db.users.add({
                id: uid("u"),
                name: name.trim(),
                email: email.trim(),
                phone: "",
                role,
                status: "active",
                pin,
                password: "123456",
                avatarColor: "#10B981",
                permissions,
                createdAt: new Date().toISOString(),
              });
              toast.success("Đã thêm nhân viên");
              setOpen(false);
            }}
          >
            Lưu
          </Button>
        </div>
      </Dialog>

      <Dialog open={!!permUser} onClose={() => setPermUser(null)} title={`Quyền · ${permUser?.name ?? ""}`}>
        <ul className="space-y-2">
          {PERMS.map((key) => (
            <li key={key} className="flex items-center justify-between rounded-[10px] border px-3 py-3">
              <span className="text-sm font-medium">{PERM_LABEL[key]}</span>
              <button
                type="button"
                className={`h-7 w-12 rounded-full ${permUser?.permissions[key] ? "bg-emerald-500" : "bg-slate-200"}`}
                onClick={async () => {
                  if (!permUser) return;
                  const next = {
                    ...permUser.permissions,
                    [key]: !permUser.permissions[key],
                  };
                  await db.users.update(permUser.id, { permissions: next });
                  setPermUser({ ...permUser, permissions: next });
                }}
              />
            </li>
          ))}
        </ul>
      </Dialog>
    </AppShell>
  );
}
