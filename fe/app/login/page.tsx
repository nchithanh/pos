"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fish } from "lucide-react";
import { notify } from "@/lib/notify";
import { getDemoAccounts } from "@/lib/seed";
import { getStoredVertical, VERTICAL_OPTIONS } from "@/lib/vertical";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const loginWithPin = useAuthStore((s) => s.loginWithPin);
  const loginWithPassword = useAuthStore((s) => s.loginWithPassword);
  const openShift = useAuthStore((s) => s.openShift);
  const [mode, setMode] = useState<"pin" | "password">("pin");
  const [pin, setPin] = useState("");
  const vertical = getStoredVertical();
  const accounts = useMemo(() => getDemoAccounts(vertical), [vertical]);
  const verticalMeta = VERTICAL_OPTIONS.find((v) => v.id === vertical);
  const [email, setEmail] = useState(accounts[2]?.email ?? accounts[0]?.email ?? "");
  const [password, setPassword] = useState(
    accounts[2]?.password ?? accounts[0]?.password ?? "",
  );
  const [loading, setLoading] = useState(false);

  const afterLogin = async () => {
    await openShift(500_000, "Tự mở ca khi đăng nhập demo");
    notify.success("Đăng nhập thành công");
    router.replace("/");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "pin") await loginWithPin(pin);
      else await loginWithPassword(email, password);
      await afterLogin();
    } catch (err) {
      notify.fromError(err, "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-slate-100 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
      <Card className="w-full max-w-md p-6">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[12px] bg-emerald-500 text-white">
            <Fish size={28} />
          </div>
          <h1 className="text-2xl font-bold">Dolphin POS</h1>
          <p className="mt-1 text-sm text-slate-500">
            {verticalMeta
              ? `${verticalMeta.emoji} ${verticalMeta.label}`
              : "Local-first"}{" "}
            · Đăng nhập
          </p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 rounded-[10px] bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            className={`rounded-[8px] py-2 text-sm font-semibold ${mode === "pin" ? "bg-white shadow dark:bg-slate-900" : ""}`}
            onClick={() => setMode("pin")}
          >
            Mã PIN
          </button>
          <button
            type="button"
            className={`rounded-[8px] py-2 text-sm font-semibold ${mode === "password" ? "bg-white shadow dark:bg-slate-900" : ""}`}
            onClick={() => setMode("password")}
          >
            Email
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {mode === "pin" ? (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-500">
                PIN (4 số)
              </span>
              <Input
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="0000"
                autoFocus
              />
            </label>
          ) : (
            <>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-500">
                  Email
                </span>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-500">
                  Mật khẩu
                </span>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            </>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Đang đăng nhập…" : "Đăng nhập & mở ca"}
          </Button>
        </form>

        <div className="mt-5 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Tài khoản demo
          </p>
          {accounts.map((acc) => (
            <button
              key={acc.email}
              type="button"
              className="flex w-full items-center justify-between rounded-[10px] border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              onClick={() => {
                setMode("pin");
                setPin(acc.pin);
                setEmail(acc.email);
                setPassword(acc.password);
              }}
            >
              <span className="font-medium">{acc.label}</span>
              <span className="text-xs text-slate-400">PIN {acc.pin}</span>
            </button>
          ))}
        </div>

        <Link
          href="/chon-linh-vuc"
          className="mt-5 block text-center text-sm font-semibold text-emerald-600 hover:underline"
        >
          Đổi lĩnh vực cửa hàng
        </Link>
      </Card>
    </div>
  );
}
