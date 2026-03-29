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
      <div className="flex min-h-screen flex-col items-center justify-center bg-background/95 backdrop-blur px-6 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative flex flex-col items-center gap-6 z-10">
          <div className="relative">
            {/* Outer spinning ring */}
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" style={{ animationDuration: '3s' }} />
            {/* Middle counter-spinning ring */}
            <div className="absolute inset-2 rounded-full border-2 border-primary/30 border-b-primary animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
            {/* Inner pulsing core */}
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center p-4">
              <div className="w-full h-full bg-primary/40 rounded-full animate-pulse blur-sm" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <h3 className="text-lg font-medium tracking-tight text-foreground/90">Authenticating</h3>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span>Establishing secure connection</span>
              <span className="flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-1 h-1 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-1 h-1 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </span>
            </div>
          </div>
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
