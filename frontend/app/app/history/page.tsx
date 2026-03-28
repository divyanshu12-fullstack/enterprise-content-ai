"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    Calendar,
    CheckCircle2,
    Copy,
    Filter,
    Loader2,
    MoreHorizontal,
    Search,
    Trash2,
    XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deleteGeneration, getGenerationMetrics, listGenerations } from "@/lib/api";
import type { Generation, GenerationMetrics } from "@/lib/schemas";

export default function HistoryPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [generations, setGenerations] = useState<Generation[]>([]);
    const [metrics, setMetrics] = useState<GenerationMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        const run = async () => {
            try {
                setLoading(true);
                const [response, metricResponse] = await Promise.all([
                    listGenerations({
                        search: searchQuery || undefined,
                        status: statusFilter === "all" ? undefined : statusFilter,
                        limit: 100,
                        offset: 0,
                    }),
                    getGenerationMetrics(),
                ]);
                if (active) {
                    setGenerations(response.items);
                    setMetrics(metricResponse);
                }
            } catch {
                toast.error("Failed to load history", {
                    description: "Please log in again if your session expired.",
                });
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        run();
        return () => {
            active = false;
        };
    }, [searchQuery, statusFilter]);

    const stats = useMemo(() => {
        const approved = generations.filter((g) => g.compliance_status === "APPROVED").length;
        const rejected = generations.filter((g) => g.compliance_status === "REJECTED").length;
        return {
            total: metrics?.total_runs ?? generations.length,
            approved: metrics?.approved_runs ?? approved,
            rejected: metrics?.rejected_runs ?? rejected,
            passRate: metrics?.pass_rate ?? (generations.length ? (approved / generations.length) * 100 : 0),
            rejectionRate: metrics?.rejection_rate ?? (generations.length ? (rejected / generations.length) * 100 : 0),
            medianDurationMs: metrics?.median_duration_ms ?? null,
        };
    }, [generations, metrics]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteGeneration(id);
            setGenerations((prev) => prev.filter((g) => g.id !== id));
            const updatedMetrics = await getGenerationMetrics();
            setMetrics(updatedMetrics);
            toast.success("Generation deleted");
        } catch {
            toast.error("Delete failed");
        }
    };

    return (
        <div className="min-h-screen bg-transparent">
            <header className="app-header-glass sticky top-0 z-30 border-b border-border/80">
                <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 pl-14 md:h-16 md:flex-nowrap md:px-8 md:py-0 md:pl-8">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight md:text-xl">History</h1>
                        <p className="text-sm text-muted-foreground">Search, review, and manage generated packages</p>
                    </div>
                    <Button asChild>
                        <Link href="/app">New generation</Link>
                    </Button>
                </div>
            </header>

            <div className="px-4 py-6 md:px-8 md:py-8">
                <div className="mx-auto w-full max-w-7xl space-y-6">
                    <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="border-border bg-input pl-10"
                                placeholder="Search by topic or audience"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full border-border bg-input md:w-44">
                                <Filter className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="app-panel border-border/80">
                            <CardContent className="p-4">
                                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Total runs</p>
                                <p className="mt-1 text-2xl font-semibold">{stats.total}</p>
                            </CardContent>
                        </Card>
                        <Card className="app-panel border-border/80">
                            <CardContent className="p-4">
                                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Pass rate</p>
                                <p className="mt-1 text-2xl font-semibold text-success">{stats.passRate.toFixed(1)}%</p>
                            </CardContent>
                        </Card>
                        <Card className="app-panel border-border/80">
                            <CardContent className="p-4">
                                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Rejection rate</p>
                                <p className="mt-1 text-2xl font-semibold text-destructive">{stats.rejectionRate.toFixed(1)}%</p>
                            </CardContent>
                        </Card>
                        <Card className="app-panel border-border/80">
                            <CardContent className="p-4">
                                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Median runtime</p>
                                <p className="mt-1 text-2xl font-semibold">
                                    {stats.medianDurationMs == null ? "-" : `${(stats.medianDurationMs / 1000).toFixed(1)}s`}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {loading ? (
                        <Card className="app-panel border-border/80">
                            <CardContent className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading history
                            </CardContent>
                        </Card>
                    ) : generations.length === 0 ? (
                        <Card className="app-panel border-border/80">
                            <CardContent className="py-12 text-center">
                                <h3 className="text-lg font-medium">No records found</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {searchQuery || statusFilter !== "all"
                                        ? "Adjust your search or filters."
                                        : "Run your first generation to create history."}
                                </p>
                                <Button asChild className="mt-5">
                                    <Link href="/app">Create generation</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {generations.map((gen) => (
                                <Card key={gen.id} className="app-panel border-border/80 transition-colors hover:border-foreground/25">
                                    <CardContent className="p-4 md:p-5">
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="min-w-0 flex-1 space-y-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            gen.compliance_status === "APPROVED"
                                                                ? "border-success/40 bg-success/10 text-success"
                                                                : "border-destructive/40 bg-destructive/10 text-destructive"
                                                        )}
                                                    >
                                                        {gen.compliance_status === "APPROVED" ? (
                                                            <CheckCircle2 className="mr-1 h-3 w-3" />
                                                        ) : (
                                                            <XCircle className="mr-1 h-3 w-3" />
                                                        )}
                                                        {gen.compliance_status}
                                                    </Badge>
                                                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        {formatDate(gen.created_at)}
                                                    </span>
                                                    <Badge variant="secondary" className="bg-secondary text-muted-foreground">
                                                        {gen.audience}
                                                    </Badge>
                                                </div>

                                                <h3 className="line-clamp-2 text-base font-medium leading-tight md:text-lg">{gen.topic}</h3>

                                                <div className="grid gap-2 md:grid-cols-2">
                                                    <div className="rounded-lg border border-border bg-card p-3">
                                                        <p className="text-xs text-muted-foreground">LinkedIn</p>
                                                        <p className="mt-1 line-clamp-2 text-sm">{gen.linkedin_post || "-"}</p>
                                                    </div>
                                                    <div className="rounded-lg border border-border bg-card p-3">
                                                        <p className="text-xs text-muted-foreground">Twitter</p>
                                                        <p className="mt-1 line-clamp-2 text-sm">{gen.twitter_post || "-"}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 lg:flex-col">
                                                <Button variant="outline" size="sm" asChild className="lg:w-28">
                                                    <Link href={`/app/approval?id=${gen.id}`}>View</Link>
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="lg:w-28">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleCopy(gen.linkedin_post || "")}>
                                                            <Copy className="mr-2 h-4 w-4" />
                                                            Copy LinkedIn
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleCopy(gen.twitter_post || "")}>
                                                            <Copy className="mr-2 h-4 w-4" />
                                                            Copy Twitter
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(gen.id)}
                                                            className="text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
