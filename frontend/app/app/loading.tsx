import { Loader2 } from "lucide-react";

export default function AppLoading() {
    return (
        <div className="min-h-screen bg-transparent animate-in fade-in duration-500">
            <header className="app-header-glass sticky top-0 z-30 border-b border-border/80">
                <div className="flex min-h-20 flex-wrap items-center justify-between gap-3 px-4 py-5 pl-14 md:min-h-24 md:flex-nowrap md:px-6 md:py-6 md:pl-6">
                    <div className="w-full max-w-md space-y-3">
                        <div className="h-7 w-1/3 animate-pulse rounded-md bg-muted/80" />
                        <div className="h-4 w-2/3 animate-pulse rounded-md bg-muted/60" />
                    </div>
                </div>
            </header>

            <div className="px-4 py-6 md:px-6 md:py-8 lg:pb-16 max-md:pb-24">
                <div className="mx-auto w-full max-w-350">
                    <div className="grid gap-6 md:grid-cols-[1.8fr_1fr]">
                        <div className="space-y-6">
                            <div className="h-100 w-full animate-pulse rounded-xl border border-border/50 bg-card/50 shadow-sm" />
                            <div className="h-50 w-full animate-pulse rounded-xl border border-border/50 bg-card/50 shadow-sm" />
                        </div>
                        <div className="hidden space-y-6 md:block">
                            <div className="h-156 w-full animate-pulse rounded-xl border border-border/50 bg-card/50 shadow-sm" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Centered spinner overlay for clear feedback */}
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                <div className="rounded-xl border border-border/80 bg-card/80 p-4 shadow-2xl backdrop-blur-md">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            </div>
        </div>
    );
}
