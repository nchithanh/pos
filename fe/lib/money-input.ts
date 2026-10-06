/** Parse "295.000" / "295000" → number */
export function parseMoneyInput(raw: string): number {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return 0;
  return Number(digits);
}

/** Format number as Vietnamese thousands while typing */
export function formatMoneyInput(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "";
  return Math.round(amount).toLocaleString("vi-VN");
}
