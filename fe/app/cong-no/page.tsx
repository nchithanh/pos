"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DebtRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/finance/debts");
  }, [router]);
  return null;
}
