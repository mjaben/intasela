import type { Metadata, Viewport } from "next";
import Script from "next/script";
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

import NextTopLoader from 'nextjs-toploader';
import PWAInstallBanner from "@/components/PWAInstallBanner";
import PermissionsOnboarding from "@/components/PermissionsOnboarding";
import SplashScreen from "@/components/SplashScreen";
import VignetteSafeAreaFix from "@/components/VignetteSafeAreaFix";
import HapticProvider from "@/components/HapticProvider";


export const metadata: Metadata = {
  metadataBase: new URL("https://naijanews360.com.ng"),
  title: {
    default: "Intasela | Premium Social Network",
    template: "%s | Intasela"
  },
  description: "Intasela (formerly Naijanews360) Africa's social network & creator economy platform. Share content, engage with followers, and monetize your passion.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
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
    description: "Intasela (formerly Naijanews360) Africa's social network & creator economy platform. Share content, engage with followers, and monetize your passion.",
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
    description: "Intasela (formerly Naijanews360) Africa's social network & creator economy platform. Share content, engage with followers, and monetize your passion.",
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
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1173851541726956" crossOrigin="anonymous" strategy="afterInteractive"></Script>
        {/* Google tag (gtag.js) */}
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-QSYKXCWEME" strategy="afterInteractive"></Script>
        <Script
          id="google-analytics"
          strategy="afterInteractive"
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
        <NextTopLoader color="#ACC8A2" showSpinner={false} shadow="0 0 10px #ACC8A2,0 0 5px #ACC8A2" />
        <div className="relative min-h-screen flex flex-col w-full">
          <SplashScreen />
          <VignetteSafeAreaFix />
          <HapticProvider />
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
