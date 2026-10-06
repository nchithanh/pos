import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import { AuthGate } from "@/components/layout/auth-gate";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dolphin POS",
  description: "POS local-first cho pet shop & cafe — Dolphin Software",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Dolphin POS",
  },
};

export const viewport: Viewport = {
  themeColor: "#10B981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <Providers>
          <AuthGate>{children}</AuthGate>
        </Providers>
      </body>
    </html>
  );
}
