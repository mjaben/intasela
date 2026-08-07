import type { Metadata, Viewport } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { GeistPixelSquare, GeistPixelGrid, GeistPixelCircle, GeistPixelTriangle, GeistPixelLine } from 'geist/font/pixel';
import "./globals.css";
import SidebarNav from "@/components/SidebarNav";
import RightSidebar from "@/components/RightSidebar";
import ToastProvider from "@/components/ToastProvider";
import MobileHeader from "@/components/MobileHeader";
import MobileBottomNav from "@/components/MobileBottomNav";
import MobileFAB from "@/components/MobileFAB";
import MediaViewerModal from "@/components/MediaViewerModal";
import AppShell from "@/components/AppShell";
import { useEffect } from "react";
import { useUserStore } from "@/store/useUserStore";
import { useSystemSettingsStore } from "@/store/useSystemSettingsStore";

import PWAInstallBanner from "@/components/PWAInstallBanner";
import PermissionsOnboarding from "@/components/PermissionsOnboarding";
import SplashScreen from "@/components/SplashScreen";

export const metadata: Metadata = {
  metadataBase: new URL("https://naijanews360.com.ng"),
  title: {
    default: "Intasela | Premium Social Network",
    template: "%s | Intasela"
  },
  description: "Premium Social Network and Creator Economy Platform",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Intasela",
  },
  icons: {
    apple: '/apple-touch-icon.png',
    icon: '/icon-192x192.png',
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://naijanews360.com.ng",
    siteName: "Intasela",
    title: "Intasela | Premium Social Network",
    description: "Premium Social Network and Creator Economy Platform where creators earn.",
    images: [
      {
        url: "/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "Intasela Logo",
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Intasela | Premium Social Network",
    description: "Premium Social Network and Creator Economy Platform",
    images: ["/icon-512x512.png"],
    creator: "@intasela",
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ACC8A2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1173851541726956" crossOrigin="anonymous"></script>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-QSYKXCWEME"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-QSYKXCWEME');
            `,
          }}
        />
      </head>
      <body className={`${GeistSans.className} ${GeistSans.variable} ${GeistMono.variable} antialiased min-h-screen bg-background text-foreground`} suppressHydrationWarning>
        <div className="relative min-h-screen flex flex-col w-full">
          <SplashScreen />
          <AppShell>
            {children}
          </AppShell>
          <ToastProvider />
          <MediaViewerModal />
          <PermissionsOnboarding />
          <PWAInstallBanner />
        </div>
      </body>
    </html>
  );
}
