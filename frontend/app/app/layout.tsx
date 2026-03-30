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
      } catch (err: any) {
        if (err?.response?.status === 401) {
          window.localStorage.removeItem("contentai_access_token");
          window.localStorage.removeItem("contentai_user_email");
          router.replace("/login");
        } else {
          // If it's a network error or 500, we don't necessarily want to bump them out 
          // of the UI entirely to the login screen. They might just have bad wifi.
          if (active) setReady(true);
        }
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
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background/95 px-6 backdrop-blur">
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes auth-progress {
              0% { transform: translateX(-110%); }
              55% { transform: translateX(10%); }
              100% { transform: translateX(120%); }
            }
            @keyframes auth-breathe {
              0%, 100% { opacity: 0.4; transform: scale(0.98); }
              50% { opacity: 0.75; transform: scale(1); }
            }
            .auth-progress-track::after {
              content: "";
              position: absolute;
              inset: 0;
              width: 45%;
              border-radius: inherit;
              background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.85), transparent);
              animation: auth-progress 1.4s ease-in-out infinite;
            }
            .auth-breathe {
              animation: auth-breathe 2.2s ease-in-out infinite;
            }
          `,
        }} />

        <div className="pointer-events-none absolute left-1/2 top-1/2 h-120 w-120 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[96px]" />

        <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border/80 bg-card/80 p-6 shadow-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary auth-breathe">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Secure session handoff
          </div>

          <h3 className="text-lg font-semibold tracking-tight text-foreground">Signing you in</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Verifying credentials and preparing your workspace.
          </p>

          <div className="relative mt-5 h-2 overflow-hidden rounded-full bg-secondary/80 auth-progress-track" />

          <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
            <div className="rounded-md border border-border/70 bg-background/60 px-2 py-1 text-center">Token</div>
            <div className="rounded-md border border-border/70 bg-background/60 px-2 py-1 text-center">Session</div>
            <div className="rounded-md border border-border/70 bg-background/60 px-2 py-1 text-center">Workspace</div>
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
