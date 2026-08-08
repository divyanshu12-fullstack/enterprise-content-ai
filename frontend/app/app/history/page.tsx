"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    Activity,
    ArrowUpRight,
    Calendar,
    CheckCircle2,
    Clock,
    Copy,
    Download,
    ExternalLink,
    FileCode,
    FileJson,
    FileText,
    Filter,
    Linkedin,
    Loader2,
    MoreHorizontal,
    Search,
    ShieldCheck,
    Sparkles,
    Trash2,
    Twitter,
    XCircle,
    Zap,
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deleteGeneration, getGenerationMetrics, listGenerations } from "@/lib/api";
import type { Generation, GenerationMetrics } from "@/lib/schemas";
import { formatRichText } from "@/components/content-preview";

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

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`Copied ${label} to clipboard`);
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteGeneration(id);
            setGenerations((prev) => prev.filter((g) => g.id !== id));
            const updatedMetrics = await getGenerationMetrics();
            setMetrics(updatedMetrics);
            toast.success("Generation deleted from history");
        } catch {
            toast.error("Delete failed");
        }
    };

    const handleExportSingle = (gen: Generation, format: "txt" | "md" | "json") => {
        let content = "";
        const filename = `draftly-${gen.id}.${format}`;
        let mimeType = "text/plain";

        if (format === "md") {
            content = `# Draftly Content Package: ${gen.topic}\n\n**Audience**: ${gen.audience}\n**Tone**: ${gen.tone || "Default"}\n**Generated**: ${new Date(gen.created_at).toLocaleString()}\n\n---\n\n## LinkedIn Post\n\n${gen.linkedin_post || ""}\n\n---\n\n## Twitter / X Post\n\n${gen.twitter_post || ""}\n\n---\n\n## Visual Direction & AI Image Prompt\n\n\`\`\`\n${gen.image_prompt || ""}\n\`\`\`\n\n---\n\n## Compliance Audit\n- **Status**: ${gen.compliance_status}\n- **Notes**: ${gen.compliance_notes || "Passed checks"}\n`;
            mimeType = "text/markdown";
        } else if (format === "json") {
            content = JSON.stringify(gen, null, 2);
            mimeType = "application/json";
        } else {
            content = `DRAFTLY CONTENT PACKAGE\nTopic: ${gen.topic}\nAudience: ${gen.audience}\nCreated: ${new Date(gen.created_at).toLocaleString()}\n\n====================\nLINKEDIN POST\n====================\n${gen.linkedin_post || ""}\n\n====================\nTWITTER / X POST\n====================\n${gen.twitter_post || ""}\n\n====================\nIMAGE PROMPT\n====================\n${gen.image_prompt || ""}\n\n====================\nCOMPLIANCE: ${gen.compliance_status}\n${gen.compliance_notes || ""}\n`;
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported package as ${format.toUpperCase()}`);
    };

    return (
        <div className="min-h-screen bg-transparent">
            {/* Header */}
            <header className="app-header-glass sticky top-0 z-30 border-b border-border/80">
                <div className="flex min-h-20 flex-wrap items-center justify-between gap-3 px-4 py-5 pl-14 sm:px-6 lg:px-8 xl:px-10 md:min-h-24 md:flex-nowrap md:pl-6">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight md:text-xl">Content Package Archives</h1>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <span className="text-foreground">Search, review, re-export, and audit generated campaigns</span>
                        </p>
                    </div>
                    <Button asChild className="shadow-md">
                        <Link href="/app">
                            <Sparkles className="mr-1.5 h-4 w-4" />
                            New generation
                        </Link>
                    </Button>
                </div>
            </header>

            <div className="px-4 py-6 sm:px-6 lg:px-8 xl:px-10 md:py-8 lg:pb-16 max-md:pb-24">
                <div className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1720px] space-y-6">
                    
                    {/* KPI Metric Summary Row */}
                    <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="app-panel border-border/80 shadow-md">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-mono">Total Runs</p>
                                    <p className="mt-1 text-2xl font-bold tracking-tight">{stats.total}</p>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                                    <Activity className="h-5 w-5" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="app-panel border-border/80 shadow-md">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-mono">Compliance Pass</p>
                                    <p className="mt-1 text-2xl font-bold tracking-tight text-success">{stats.passRate.toFixed(1)}%</p>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15 text-success">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="app-panel border-border/80 shadow-md">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-mono">Flagged Rate</p>
                                    <p className="mt-1 text-2xl font-bold tracking-tight text-destructive">{stats.rejectionRate.toFixed(1)}%</p>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
                                    <XCircle className="h-5 w-5" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="app-panel border-border/80 shadow-md">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-mono">Median Latency</p>
                                    <p className="mt-1 text-2xl font-bold tracking-tight">
                                        {stats.medianDurationMs == null ? "-" : `${(stats.medianDurationMs / 1000).toFixed(1)}s`}
                                    </p>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                                    <Clock className="h-5 w-5" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Search & Filter Controls */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border/80 bg-card/60 p-3 shadow-md">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="border-border/70 bg-input pl-10 h-10"
                                placeholder="Search by campaign topic, audience, or keyword..."
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-44 border-border/70 bg-input h-10">
                                    <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All statuses</SelectItem>
                                    <SelectItem value="APPROVED">Approved only</SelectItem>
                                    <SelectItem value="REJECTED">Flagged only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Generation List */}
                    {loading ? (
                        <Card className="app-panel border-border/80">
                            <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                <p className="text-sm">Loading historical content packages...</p>
                            </CardContent>
                        </Card>
                    ) : generations.length === 0 ? (
                        <Card className="app-panel border-border/80 shadow-lg">
                            <CardContent className="py-16 text-center space-y-3">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-semibold">No campaign packages found</h3>
                                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                    {searchQuery || statusFilter !== "all"
                                        ? "No records matched your search query. Try clearing your filters."
                                        : "Start your first multi-agent content generation to build your package archive."}
                                </p>
                                <Button asChild className="mt-4">
                                    <Link href="/app">
                                        <Sparkles className="mr-1.5 h-4 w-4" />
                                        Launch Generation
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {generations.map((gen) => {
                                const twitterLen = (gen.twitter_post || "").length;
                                const isExtendedTwitter = twitterLen > 280;
                                const durationSec = Math.max(1, Math.round((gen.duration_ms ?? 0) / 1000));

                                return (
                                    <Card
                                        key={gen.id}
                                        className="app-panel border-border/80 transition-all duration-300 hover:border-border hover:shadow-xl group"
                                    >
                                        <CardContent className="p-5 md:p-6 space-y-4">
                                            {/* Item Header */}
                                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3.5">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "font-semibold text-xs",
                                                            gen.compliance_status === "APPROVED"
                                                                ? "border-success/40 bg-success/15 text-success"
                                                                : "border-destructive/40 bg-destructive/15 text-destructive"
                                                        )}
                                                    >
                                                        {gen.compliance_status === "APPROVED" ? (
                                                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                                        ) : (
                                                            <XCircle className="mr-1 h-3.5 w-3.5" />
                                                        )}
                                                        {gen.compliance_status}
                                                    </Badge>

                                                    <Badge variant="secondary" className="bg-secondary/70 text-xs font-normal">
                                                        Audience: <strong className="ml-1 font-medium text-foreground">{gen.audience}</strong>
                                                    </Badge>

                                                    {gen.content_type && (
                                                        <Badge variant="outline" className="border-border/60 text-xs text-muted-foreground font-normal">
                                                            {gen.content_type}
                                                        </Badge>
                                                    )}

                                                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-mono ml-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {formatDate(gen.created_at)}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="border-border/60 bg-secondary/30 text-[11px] font-mono text-muted-foreground">
                                                        <Zap className="mr-1 h-3 w-3 text-amber-400" />
                                                        {durationSec}s
                                                    </Badge>
                                                    <Button variant="default" size="sm" asChild className="h-8 text-xs font-medium shadow-xs">
                                                        <Link href={`/app/approval?id=${gen.id}`}>
                                                            Open Studio
                                                            <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                                                        </Link>
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuItem onClick={() => handleCopy(gen.linkedin_post || "", "LinkedIn copy")}>
                                                                <Copy className="mr-2 h-4 w-4" />
                                                                Copy LinkedIn
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleCopy(gen.twitter_post || "", "Twitter / X copy")}>
                                                                <Copy className="mr-2 h-4 w-4" />
                                                                Copy Twitter / X
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleCopy(gen.image_prompt || "", "Image prompt")}>
                                                                <Copy className="mr-2 h-4 w-4" />
                                                                Copy Image Prompt
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => handleExportSingle(gen, "md")}>
                                                                <FileCode className="mr-2 h-4 w-4 text-purple-400" />
                                                                Export Markdown (.md)
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleExportSingle(gen, "json")}>
                                                                <FileJson className="mr-2 h-4 w-4 text-emerald-400" />
                                                                Export JSON (.json)
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(gen.id)}
                                                                className="text-destructive focus:text-destructive"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete Record
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>

                                            {/* Topic Title */}
                                            <h3 className="text-base md:text-lg font-semibold tracking-tight leading-snug text-foreground">
                                                {gen.topic}
                                            </h3>

                                            {/* Dual Channel Snippets */}
                                            <div className="grid gap-3.5 md:grid-cols-2">
                                                {/* LinkedIn Preview Box */}
                                                <div className="rounded-xl border border-border/70 bg-card/80 p-3.5 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0A66C2]">
                                                            <Linkedin className="h-3.5 w-3.5" />
                                                            LinkedIn Post
                                                        </div>
                                                        <span className="text-[11px] font-mono text-muted-foreground">
                                                            {(gen.linkedin_post || "").length} chars
                                                        </span>
                                                    </div>
                                                    <div className="line-clamp-3 text-xs text-foreground/90 leading-relaxed select-text">
                                                        {formatRichText(gen.linkedin_post || "No content generated", "linkedin")}
                                                    </div>
                                                </div>

                                                {/* Twitter / X Preview Box */}
                                                <div className="rounded-xl border border-border/70 bg-card/80 p-3.5 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                                                            <Twitter className="h-3.5 w-3.5" />
                                                            Twitter / X Post
                                                        </div>
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "text-[10px] font-mono px-1.5 py-0",
                                                                isExtendedTwitter
                                                                    ? "border-primary/40 bg-primary/10 text-primary"
                                                                    : "border-border text-muted-foreground"
                                                            )}
                                                        >
                                                            {isExtendedTwitter
                                                                ? `${twitterLen} chars (X Long-form)`
                                                                : `${twitterLen}/280 chars`}
                                                        </Badge>
                                                    </div>
                                                    <div className="line-clamp-3 text-xs text-foreground/90 leading-relaxed select-text">
                                                        {formatRichText(gen.twitter_post || "No content generated", "twitter")}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
