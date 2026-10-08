"use client";

import { useSyncExternalStore } from "react";
import {
  PRIMARY_BRANCH_ID,
  readBranchId,
  subscribeBranch,
} from "@/lib/branch";

export function useBranchId(): string {
  return useSyncExternalStore(
    subscribeBranch,
    readBranchId,
    () => PRIMARY_BRANCH_ID,
  );
}
