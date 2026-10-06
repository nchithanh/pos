"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RevenueRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/finance/revenue");
  }, [router]);
  return null;
}
