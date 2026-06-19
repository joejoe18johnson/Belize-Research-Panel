import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { NetlifyDeployBanner } from "@/components/NetlifyDeployBanner";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteFooterGate } from "@/components/SiteFooterGate";
import { ThemeInitScript } from "@/components/theme/ThemeInitScript";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Belize Research Panel",
  description:
    "Qualified panelists earn rewards for sharing their opinions — redeem points for cash, phone credit, utility credit, and more. Public opinion polling, market research, and governance studies in Belize.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <ThemeInitScript />
        <ThemeProvider>
          <NetlifyDeployBanner />
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          <SiteFooterGate>
            <SiteFooter />
          </SiteFooterGate>
        </ThemeProvider>
      </body>
    </html>
  );
}
