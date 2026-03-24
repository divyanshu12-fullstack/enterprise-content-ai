"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bot, CheckCheck, Layers3 } from "lucide-react";

const navItems = [
    { href: "/", label: "Dashboard", icon: BarChart3 },
    { href: "/generate", label: "Generate", icon: Bot },
    { href: "/approval", label: "Approval", icon: CheckCheck }
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="glass-panel shell-grid sticky top-4 h-[calc(100vh-2rem)] rounded-3xl p-4">
            <div className="flex h-full flex-col">
                <div className="mb-8 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-mint">Enterprise AI</p>
                    <div className="mt-2 flex items-center gap-2">
                        <Layers3 className="h-4 w-4 text-flare" />
                        <h1 className="font-display text-lg font-semibold">Content Ops Studio</h1>
                    </div>
                    <p className="mt-2 text-xs text-slate-300">Componentry-inspired shell with animated highlights.</p>
                </div>

                <nav className="space-y-2">
                    {navItems.map(({ href, label, icon: Icon }, index) => {
                        const active = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`group flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-300 ${active
                                        ? "border-flare/70 bg-flare/15 text-white"
                                        : "border-white/10 bg-white/[0.03] text-slate-200 hover:-translate-y-0.5 hover:border-mint/50 hover:bg-mint/10"
                                    }`}
                                style={{ animationDelay: `${index * 90}ms` }}
                            >
                                <Icon className={`h-4 w-4 ${active ? "text-flare" : "text-mint"}`} />
                                <span className="font-medium">{label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto rounded-2xl border border-white/10 bg-gradient-to-br from-flare/20 to-mint/10 p-4">
                    <p className="text-xs text-slate-100">Pipeline status</p>
                    <p className="mt-1 text-sm font-semibold">Scaffold ready for API wiring</p>
                </div>
            </div>
        </aside>
    );
}
