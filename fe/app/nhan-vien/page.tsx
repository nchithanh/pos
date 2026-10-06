"use client";

import { useState } from "react";
import { Pencil, Plus, Shield, UserRound } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  PERMISSION_LABELS,
  ROLE_LABELS,
} from "@/data/employees";
import type { Employee, EmployeeRole, PermissionKey } from "@/lib/types";
import { usePosStore } from "@/store/usePosStore";

const ROLES: EmployeeRole[] = ["owner", "manager", "cashier", "warehouse"];
const PERMS = Object.keys(PERMISSION_LABELS) as PermissionKey[];

const defaultPerms = (): Record<PermissionKey, boolean> => ({
  "ban-hang": true,
  "san-pham": false,
  kho: false,
  "nha-cung-cap": false,
  "cong-no": false,
  "doanh-thu": false,
  "nhan-vien": false,
});

export default function EmployeesPage() {
  const employees = usePosStore((s) => s.employees);
  const addEmployee = usePosStore((s) => s.addEmployee);
  const updateEmployee = usePosStore((s) => s.updateEmployee);
  const toggleEmployeeStatus = usePosStore((s) => s.toggleEmployeeStatus);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [permEmp, setPermEmp] = useState<Employee | null>(null);
  const [toggleId, setToggleId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<EmployeeRole>("cashier");

  const openCreate = () => {
    setEditing(null);
    setName("");
    setEmail("");
    setPhone("");
    setRole("cashier");
    setFormOpen(true);
  };

  const openEdit = (e: Employee) => {
    setEditing(e);
    setName(e.name);
    setEmail(e.email);
    setPhone(e.phone);
    setRole(e.role);
    setFormOpen(true);
  };

  const save = () => {
    if (!name.trim() || !email.trim()) return;
    if (editing) {
      updateEmployee(editing.id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role,
      });
    } else {
      addEmployee({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role,
        status: "active",
        avatarColor: "#22C55E",
        permissions: defaultPerms(),
      });
    }
    setFormOpen(false);
  };

  return (
    <AppShell>
      <PageHeader
        title="Nhân viên"
        description="Phân quyền và quản lý trạng thái làm việc"
        actions={
          <button type="button" className="pos-btn pos-btn-primary" onClick={openCreate}>
            <Plus size={16} />
            Thêm nhân viên
          </button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {employees.map((e) => (
          <article key={e.id} className="pos-card p-4">
            <div className="flex items-start gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: e.avatarColor }}
              >
                {e.name
                  .split(" ")
                  .slice(-2)
                  .map((w) => w[0])
                  .join("")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-bold">{e.name}</h2>
                    <p className="truncate text-xs text-slate-500">{e.email}</p>
                  </div>
                  <StatusBadge status={e.status} />
                </div>
                <p className="mt-2 text-sm text-slate-600">{ROLE_LABELS[e.role]}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                type="button"
                className="pos-btn pos-btn-outline !min-h-10 !rounded-[10px] !px-2 text-xs"
                onClick={() => openEdit(e)}
              >
                <Pencil size={14} />
                Sửa
              </button>
              <button
                type="button"
                className="pos-btn pos-btn-outline !min-h-10 !rounded-[10px] !px-2 text-xs"
                onClick={() => setPermEmp(e)}
              >
                <Shield size={14} />
                Quyền
              </button>
              <button
                type="button"
                className="pos-btn pos-btn-outline !min-h-10 !rounded-[10px] !px-2 text-xs"
                onClick={() => setToggleId(e.id)}
              >
                <UserRound size={14} />
                {e.status === "active" ? "Tắt" : "Bật"}
              </button>
            </div>
          </article>
        ))}
      </div>

      {formOpen ? (
        <div className="pos-modal-backdrop" role="dialog" aria-modal="true">
          <div className="pos-modal p-5">
            <h2 className="text-lg font-bold">
              {editing ? "Sửa nhân viên" : "Thêm nhân viên"}
            </h2>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="pos-label">Họ tên</span>
                <input
                  className="pos-input pos-input-rect"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="pos-label">Email</span>
                <input
                  className="pos-input pos-input-rect"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="pos-label">Số điện thoại</span>
                <input
                  className="pos-input pos-input-rect"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="pos-label">Vai trò</span>
                <select
                  className="pos-input pos-input-rect"
                  value={role}
                  onChange={(e) => setRole(e.target.value as EmployeeRole)}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className="pos-btn pos-btn-outline flex-1"
                onClick={() => setFormOpen(false)}
              >
                Hủy
              </button>
              <button type="button" className="pos-btn pos-btn-primary flex-1" onClick={save}>
                Lưu
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {permEmp ? (
        <div className="pos-modal-backdrop" role="dialog" aria-modal="true">
          <div className="pos-modal p-5">
            <h2 className="text-lg font-bold">Phân quyền · {permEmp.name}</h2>
            <ul className="mt-4 space-y-2">
              {PERMS.map((key) => (
                <li
                  key={key}
                  className="flex items-center justify-between rounded-[10px] border border-[var(--pos-border)] px-3 py-3"
                >
                  <span className="text-sm font-medium">{PERMISSION_LABELS[key]}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={permEmp.permissions[key]}
                    className={`relative h-7 w-12 rounded-full transition ${
                      permEmp.permissions[key]
                        ? "bg-[var(--pos-green)]"
                        : "bg-slate-200"
                    }`}
                    onClick={() => {
                      const next = {
                        ...permEmp.permissions,
                        [key]: !permEmp.permissions[key],
                      };
                      updateEmployee(permEmp.id, { permissions: next });
                      setPermEmp({ ...permEmp, permissions: next });
                    }}
                  >
                    <span
                      className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                        permEmp.permissions[key] ? "left-5" : "left-0.5"
                      }`}
                    />
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="pos-btn pos-btn-primary mt-5 w-full"
              onClick={() => setPermEmp(null)}
            >
              Xong
            </button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={!!toggleId}
        title="Đổi trạng thái nhân viên?"
        description="Nhân viên tạm nghỉ sẽ không thể đăng nhập khi hệ thống có auth thật."
        onCancel={() => setToggleId(null)}
        onConfirm={() => {
          if (toggleId) toggleEmployeeStatus(toggleId);
          setToggleId(null);
        }}
      />
    </AppShell>
  );
}
