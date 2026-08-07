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

export const metadata: Metadata = {
  title: "Intasela",
  description: "Premium Social Network and Creator Economy Platform",
  manifest: "/manifest.json",
  themeColor: "#ACC8A2",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
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
      </head>
      <body className={`${GeistSans.className} ${GeistSans.variable} ${GeistMono.variable} antialiased min-h-screen bg-background text-foreground`} suppressHydrationWarning>
        <div className="relative min-h-screen flex flex-col w-full">
          <AppShell>
            {children}
          </AppShell>
          <ToastProvider />
          <MediaViewerModal />
        </div>
      </body>
    </html>
  );
}
