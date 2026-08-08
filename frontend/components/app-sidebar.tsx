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
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getSettings } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const modelLabels: Record<string, { name: string; isFree: boolean }> = {
  "google/gemma-4-31b-it:free": { name: "Gemma 4 31B", isFree: true },
  "nex-agi/nex-n2-pro:free": { name: "Nex-N2-Pro", isFree: true },
  "meta-llama/llama-3.3-70b-instruct:free": { name: "Llama 3.3 70B", isFree: true },
  "anthropic/claude-3.5-haiku": { name: "Claude 3.5 Haiku", isFree: false },
  "openai/chatgpt-4o-latest": { name: "ChatGPT-4o", isFree: false },
  "deepseek/deepseek-v4-pro": { name: "DeepSeek V4 Pro", isFree: false },
  "google/gemma-4-26b-a4b-it": { name: "Gemma 4 26B", isFree: false },
};

function formatModelName(modelId: string) {
  if (modelLabels[modelId]) return modelLabels[modelId];
  const parts = modelId.split("/");
  const rawName = parts[parts.length - 1].replace(":free", "");
  return {
    name: rawName.length > 18 ? rawName.slice(0, 16) + "..." : rawName,
    isFree: modelId.includes(":free"),
  };
}

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

function NavItem({ item, pathname, navLinkClasses, setOpen }: any) {
  const isActive = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));
  const [hasTopic, setHasTopic] = useState(false);

  useEffect(() => {
    if (item.href !== "/app") return;
    const handleTopicEvent = (e: any) => {
      const nextHasTopic = Boolean(e?.detail?.hasTopic);
      setHasTopic((prev) => (prev === nextHasTopic ? prev : nextHasTopic));
    };
    window.addEventListener("draftly_topic_change", handleTopicEvent);
    return () => window.removeEventListener("draftly_topic_change", handleTopicEvent);
  }, [item.href]);

  return (
    <Link
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
      {isActive && pathname === "/app" ? (
        <div
          className={cn("ml-auto h-2 w-2 rounded-full transition-all duration-300", hasTopic ? "bg-white opacity-100 scale-100 shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "bg-primary-foreground opacity-50 scale-75")}
          title="Unsaved changes"
        />
      ) : isActive && (
        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground" />
      )}
    </Link>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [activeModel, setActiveModel] = useState<string>("google/gemma-4-31b-it:free");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserEmail(window.localStorage.getItem("draftly_user_email") ?? "team@company.com");
    }

    let mounted = true;
    getSettings()
      .then((res) => {
        if (mounted && res?.selected_model) {
          setActiveModel(res.selected_model);
        }
      })
      .catch(() => {});

    const handleSettingsUpdate = (e: any) => {
      if (e?.detail?.selected_model) {
        setActiveModel(e.detail.selected_model);
      }
    };
    window.addEventListener("draftly_settings_update", handleSettingsUpdate);
    return () => {
      mounted = false;
      window.removeEventListener("draftly_settings_update", handleSettingsUpdate);
    };
  }, []);

  const handleLogout = () => {
    window.localStorage.removeItem("draftly_access_token");
    window.localStorage.removeItem("draftly_user_email");
    setOpen(false);
    window.location.href = "/";
  };

  const navLinkClasses =
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring";

  const navLinks = (
    <nav className="space-y-1 px-4 py-4">
      <div className="mb-3 px-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Workspace
      </div>
      {navItems.map((item) => (
        <NavItem key={item.href} item={item} pathname={pathname} navLinkClasses={navLinkClasses} setOpen={setOpen} />
      ))}
    </nav>
  );

  const modelInfo = formatModelName(activeModel);

  const statusAndActions = (
    <>
      <div className="border-t border-sidebar-border px-4 py-3.5">
        <Link
          href="/app/settings"
          onClick={() => setOpen(false)}
          className="group block rounded-xl border border-border/80 bg-card/70 p-3 shadow-xs transition-all hover:border-primary/40 hover:bg-card/90"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Active Model</span>
            </div>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[9px] font-medium border font-mono leading-none",
                modelInfo.isFree
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-500"
              )}
            >
              {modelInfo.isFree ? "Free Tier" : "Pro Model"}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="truncate text-xs font-semibold text-sidebar-foreground group-hover:text-primary transition-colors">
              {modelInfo.name}
            </span>
            <span className="text-[11px] text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all">
              →
            </span>
          </div>
        </Link>
      </div>

      <div className="border-t border-sidebar-border p-4">
        <div className="mb-2.5 rounded-xl border border-border/80 bg-card/60 p-3 shadow-xs">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
            <span>Workspace</span>
            <span className="text-primary font-semibold">Pro Tier</span>
          </div>
          <div className="mt-1 truncate text-xs font-medium text-sidebar-foreground">{userEmail}</div>
        </div>
        <Link
          href="/app/settings"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="app-panel fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar/90 md:flex">
        <div className="flex h-18 flex-col items-start justify-center border-b border-sidebar-border px-6">
          <div className="flex items-center justify-between w-full">
            <span className="gradient-text text-base font-bold tracking-wide">
              Draftly
            </span>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-mono text-primary border border-primary/20">
              v2 AI
            </span>
          </div>
          <span className="text-xs text-muted-foreground">Enterprise Content Suite</span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto">{navLinks}</div>
          <div className="shrink-0 border-t border-sidebar-border bg-sidebar/95">{statusAndActions}</div>
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
            className="app-panel w-[85vw] max-w-[320px] overflow-hidden border-sidebar-border bg-sidebar/95 p-0"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
              <SheetDescription>Access workspace navigation and account actions.</SheetDescription>
            </SheetHeader>
            <div className="flex h-18 flex-col items-start justify-center border-b border-sidebar-border px-6">
              <span className="gradient-text text-sm font-semibold tracking-wide">
                Draftly
              </span>
              <span className="text-xs text-muted-foreground">Enterprise Content Workspace</span>
            </div>
            <div className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto">{navLinks}</div>
              <div className="shrink-0 border-t border-sidebar-border bg-sidebar/95">{statusAndActions}</div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
