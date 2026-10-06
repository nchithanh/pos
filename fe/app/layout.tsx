import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dolphin POS — Pet Dolphin Store",
  description:
    "Prototype bán hàng và quản lý vận hành cửa hàng thú cưng — Dolphin POS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
