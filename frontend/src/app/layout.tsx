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
import { GoogleAdSense } from "next-google-adsense";
import { useEffect } from "react";
import { useUserStore } from "@/store/useUserStore";
import { useSystemSettingsStore } from "@/store/useSystemSettingsStore";

export const metadata: Metadata = {
  title: "Intasela",
  description: "Premium Social Network and Creator Economy Platform",
  manifest: "/manifest.json",
  themeColor: "#3BC492",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.className} ${GeistSans.variable} ${GeistMono.variable} antialiased min-h-screen bg-background text-foreground flex flex-col items-center overflow-x-clip max-w-[100vw]`} suppressHydrationWarning>
        <GoogleAdSense publisherId="pub-1173851541726956" />
        <MobileHeader />
        <div className="flex w-full max-w-[1280px] mx-auto px-0 sm:px-4">
          <SidebarNav />
          
          <main className="flex-1 min-h-screen min-w-0 pb-[80px] sm:pb-0">
            {children}
          </main>

          <RightSidebar />
        </div>
        <MobileFAB />
        <MobileBottomNav />
        <ToastProvider />
        <MediaViewerModal />
      </body>
    </html>
  );
}
