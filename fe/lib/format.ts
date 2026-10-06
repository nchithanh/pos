export function formatVnd(amount: number): string {
  const rounded = Math.round(amount);
  return `${rounded.toLocaleString("vi-VN")}đ`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const date = formatDate(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${date} ${h}:${m}`;
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function daysAgoLabel(iso: string, today = "2026-10-06"): string {
  const a = new Date(today);
  const b = new Date(iso);
  const diff = Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "Hôm nay";
  if (diff === 1) return "1 ngày trước";
  return `${diff} ngày trước`;
}
