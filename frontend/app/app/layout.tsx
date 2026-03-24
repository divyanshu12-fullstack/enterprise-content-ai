"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";

export default function AppLayout({ children }: { children: React.ReactNode; }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="min-h-screen overflow-x-hidden md:pl-64">
          {children}
        </main>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
