"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { getMe } from "@/lib/api";

export default function AppLayout({ children }: { children: React.ReactNode; }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (pathname === "/app/login") {
        setReady(true);
        return;
      }

      const token = window.localStorage.getItem("contentai_access_token");
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        await getMe();
        if (active) {
          setReady(true);
        }
      } catch {
        window.localStorage.removeItem("contentai_access_token");
        window.localStorage.removeItem("contentai_user_email");
        router.replace("/login");
      }
    };

    run();
    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="app-shell-bg flex min-h-screen items-center justify-center px-6">
        <div className="rounded-2xl border border-border/80 bg-card/90 px-6 py-4 text-sm text-muted-foreground shadow-2xl">
          Checking secure session...
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="app-shell-bg min-h-screen w-full">
        <AppSidebar />
        <main className="min-h-screen overflow-x-hidden md:pl-72">
          {children}
        </main>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
