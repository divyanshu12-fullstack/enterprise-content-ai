"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  WandSparkles,
  CheckSquare,
  Settings,
  Circle,
  History,
  Home,
  Menu,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  {
    title: "Generate",
    href: "/app",
    icon: WandSparkles,
  },
  {
    title: "Previous",
    href: "/app/history",
    icon: History,
  },
  {
    title: "Approval",
    href: "/app/approval",
    icon: CheckSquare,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserEmail(window.localStorage.getItem("contentai_user_email") ?? "team@company.com");
    }
  }, []);

  const handleLogout = () => {
    window.localStorage.removeItem("contentai_access_token");
    window.localStorage.removeItem("contentai_user_email");
    setOpen(false);
    window.location.href = "/login";
  };

  const navLinkClasses =
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring";

  const navLinks = (
    <nav className="space-y-1 px-4 py-4">
        <div className="mb-3 px-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Workspace
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                navLinkClasses,
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className={cn("h-4 w-4", isActive && "text-primary-foreground")} />
              {item.title}
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground" />
              )}
            </Link>
          );
        })}
      </nav>
  );

  const statusAndActions = (
    <>
      <div className="border-t border-sidebar-border px-4 py-4">
        <div className="rounded-xl border border-border bg-secondary p-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-success" />
            <span className="text-xs font-medium text-sidebar-foreground">System healthy</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Circle className="h-2.5 w-2.5 fill-success text-success" />
            All agents online
          </div>
        </div>
      </div>

      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 rounded-xl border border-border bg-secondary p-3">
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Signed in</div>
          <div className="mt-1 truncate text-sm text-sidebar-foreground">{userEmail}</div>
        </div>
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
        <Link
          href="/app/settings"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="app-panel fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar/90 md:flex">
        <div className="flex h-18 flex-col items-start justify-center border-b border-sidebar-border px-6">
          <span className="gradient-text text-sm font-semibold tracking-wide">
            ContentAI
          </span>
          <span className="text-xs text-muted-foreground">Enterprise Content Workspace</span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto">{navLinks}</div>
          <div className="shrink-0">{statusAndActions}</div>
        </div>
      </aside>

      <div className="fixed left-4 top-4 z-50 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="h-10 w-10 border-sidebar-border bg-sidebar/90 text-sidebar-foreground shadow-lg"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="app-panel w-[85vw] max-w-[320px] border-sidebar-border bg-sidebar/95 p-0"
          >
            <div className="flex h-18 flex-col items-start justify-center border-b border-sidebar-border px-6">
              <span className="gradient-text text-sm font-semibold tracking-wide">
                ContentAI
              </span>
              <span className="text-xs text-muted-foreground">Enterprise Content Workspace</span>
            </div>
            <div className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto">{navLinks}</div>
              <div className="shrink-0">{statusAndActions}</div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
