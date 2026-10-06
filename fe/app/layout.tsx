import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Providers } from "@/components/providers";
import { AuthGate } from "@/components/layout/auth-gate";
import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Dolphin POS",
  description: "POS local-first cho pet shop & cafe — Dolphin Software",
  /** Absolute-from-origin paths must include Pages basePath (/pos). */
  manifest: `${basePath}/manifest.webmanifest`,
  icons: {
    icon: [
      { url: `${basePath}/favicon.ico`, sizes: "192x192", type: "image/png" },
      { url: `${basePath}/icon-192.png`, sizes: "192x192", type: "image/png" },
      { url: `${basePath}/icon-512.png`, sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: `${basePath}/icon-192.png`, sizes: "192x192", type: "image/png" }],
    shortcut: `${basePath}/favicon.ico`,
  },
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

/** Chống FOUC theme — không dùng <script> trong client component (React 19) */
const THEME_INIT = `(function(){try{var k='dolphin-pos-theme';var t=localStorage.getItem(k)||'light';var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var r=t==='system'?(d?'dark':'light'):t;var e=document.documentElement;e.classList.remove('light','dark');e.classList.add(r);e.style.colorScheme=r;}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <Script id="dolphin-theme-init" strategy="beforeInteractive">
          {THEME_INIT}
        </Script>
        <Providers>
          <AuthGate>{children}</AuthGate>
        </Providers>
      </body>
    </html>
  );
}
