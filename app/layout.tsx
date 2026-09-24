import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/AppShell";
import { themeInitScript } from "@/lib/theme-script";
import "./globals.css";

export const metadata: Metadata = {
  title: "富迪斯 產業新聞庫",
  description: "內部行銷新聞搜尋工具",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant-TW" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
