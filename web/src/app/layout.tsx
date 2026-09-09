import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { CookieNotice } from "@/components/CookieNotice";
import { PublicMobileBottomNav } from "@/components/home/PublicMobileBottomNav";
import { NetlifyDeployBanner } from "@/components/NetlifyDeployBanner";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteFooterGate } from "@/components/SiteFooterGate";
import { ScrollToTopOnNavigate } from "@/components/shared/ScrollToTopOnNavigate";
import { ThemeInitScript } from "@/components/theme/ThemeInitScript";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { getSessionAccount } from "@/lib/auth";
import { rootMetadata } from "@/lib/seo/metadata";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = rootMetadata();

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSessionAccount();

  return (
    <html lang="en-BZ" className={`${geistSans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full min-w-0 max-w-full flex-col overflow-x-clip bg-background font-sans text-foreground">
        <ThemeInitScript />
        <ThemeProvider>
          <ScrollToTopOnNavigate />
          <NetlifyDeployBanner />
          <div className="flex min-h-0 flex-1 flex-col pb-[var(--brp-mobile-bottom-nav-offset,0px)] lg:pb-0">
            {children}
            <SiteFooterGate>
              <SiteFooter />
            </SiteFooterGate>
          </div>
          <CookieNotice />
          <PublicMobileBottomNav
            signedIn={Boolean(session)}
            panelistRegistered={Boolean(session?.panelistRegistered)}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
