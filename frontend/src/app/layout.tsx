import type { Metadata } from "next";
import "./globals.css";
import SidebarNav from "@/components/SidebarNav";
import RightSidebar from "@/components/RightSidebar";

export const metadata: Metadata = {
  title: "Intasela - The Creator Economy Platform",
  description: "A social platform where creators earn.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background text-foreground flex justify-center" suppressHydrationWarning>
        <div className="flex w-full max-w-[1280px] mx-auto px-4">
          <SidebarNav />
          
          <main className="flex-1 min-h-screen min-w-0 pb-20">
            {children}
          </main>

          <RightSidebar />
        </div>
      </body>
    </html>
  );
}
