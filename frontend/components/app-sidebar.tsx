"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  CheckSquare,
  Settings,
  Activity,
  History,
  Home,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  {
    title: "Generate",
    href: "/app",
    icon: Sparkles,
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

  const navLinkClasses =
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring";

  const navContent = (
    <>
      <nav className="flex-1 space-y-1 px-3 py-4">
        <div className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Content Studio
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                navLinkClasses,
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
              {item.title}
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 px-3 py-2.5">
          <div className="relative">
            <Activity className="h-4 w-4 text-success" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-success animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-sidebar-foreground">
              System Status
            </span>
            <span className="text-xs text-muted-foreground">All agents online</span>
          </div>
        </div>
      </div>

      <div className="border-t border-sidebar-border p-4">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        >
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
        <Link
          href="/app/settings"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </>
  );

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-16 flex-col items-start justify-center border-b border-sidebar-border px-6">
          <span className="text-sm font-semibold text-sidebar-foreground">
            ContentAI
          </span>
          <span className="text-xs text-muted-foreground">Multi-Agent Platform</span>
        </div>
        {navContent}
      </aside>

      <div className="fixed left-4 top-4 z-50 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="h-10 w-10 border-sidebar-border bg-sidebar text-sidebar-foreground"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[85vw] max-w-[320px] border-sidebar-border bg-sidebar p-0"
          >
            <div className="flex h-16 flex-col items-start justify-center border-b border-sidebar-border px-6">
              <span className="text-sm font-semibold text-sidebar-foreground">
                ContentAI
              </span>
              <span className="text-xs text-muted-foreground">Multi-Agent Platform</span>
            </div>
            <div className="flex h-[calc(100dvh-4rem)] flex-col">{navContent}</div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
