"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ArrowLeft,
    CheckCircle2,
    Copy,
    Download,
    Edit3,
    ExternalLink,
    Eye,
    FileCode,
    FileJson,
    FileText,
    Linkedin,
    Loader2,
    RotateCcw,
    Save,
    Send,
    Sparkles,
    Twitter,
    Undo2,
    XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getGeneration, publishGeneration, rejectGeneration } from "@/lib/api";
import type { Generation } from "@/lib/schemas";
import { ContentPreview, ImagePreview, formatRichText } from "@/components/content-preview";
import { ComplianceBadge } from "@/components/compliance-badge";

interface GenerationResult {
    id: string;
    topic: string;
    audience: string;
    contentType?: string | null;
    tone?: string | null;
    createdAt: string;
    duration: number;
    linkedin_post: string;
    twitter_post: string;
    image_prompt: string;
    compliance_status: "APPROVED" | "REJECTED";
    compliance_notes: string;
}

const defaultResult: GenerationResult = {
    id: "demo",
    topic: "Autonomous AI Agents transforming B2B enterprise workflows in 2026",
    audience: "Tech Executives & Enterprise Product Leaders",
    contentType: "Thought Leadership",
    tone: "Authoritative",
    createdAt: new Date().toISOString(),
    duration: 18,
    linkedin_post:
        "Unpopular opinion: Most wealth management automation is focused on the wrong metric.\n\nFor years, the industry has obsessed over \"automated rebalancing\" and chasing alpha. But in an era of unprecedented market volatility, chasing returns without a sophisticated defense mechanism is just gambling with better software.\n\nThe real shift happening right now isn't about who can grow a portfolio faster—it's about who can protect it more intelligently.\n\nKey takeaways for the modern professional:\n• Resilience > Efficiency: Prioritize downside protection.\n• Governance is the New Alpha: Managing model risk is the primary competitive edge.\n\n#WealthTech #RiskManagement #AIinFinance #FinTechTrends #AlgorithmicTrading",
    twitter_post:
        "Automation doesn't equal safety. In fact, without proper oversight, it can actually increase your tail risk. 📉\n\nThe \"set it and forget it\" era of robo-advisors is evolving into high-velocity #AlgorithmicTrading.\n\nWe need intelligent, scalable governance frameworks to manage risks that models introduce during market shifts.\n\nAre we democratizing the quant desk, or just automating exposure to volatility? 👇\n\n#WealthTech #RoboAdvisory #FinTechTrends #RiskManagement #SmartBeta",
    image_prompt:
        "Cinematic photography, a high-tech architectural structure of glowing translucent geometric glass shards forming a protective crystalline shield, a turbulent storm of dark liquid gold and deep indigo swirling violently in the background, dramatic rim lighting, 8k resolution, photorealistic.",
    compliance_status: "APPROVED",
    compliance_notes: "Passed deterministic compliance checks. All brand and regulatory constraints satisfied.",
};

const formatComplianceNotes = (notes: string) => {
    if (!notes) {
        return <p className="mt-1 text-sm text-muted-foreground">Passed all safety and brand policy checks.</p>;
    }
    if (notes.startsWith("{") && notes.endsWith("}")) {
        try {
            const inner = notes.slice(1, -1);
            const items = inner.split(/,\s*(?=['"][\w]+['"]\s*:)/);
            if (items.length > 0) {
                return (
                    <ul className="list-disc pl-4 mt-2 space-y-1 text-sm text-muted-foreground">
                        {items.map((item, idx) => {
                            const parts = item.split(":");
                            if (parts.length >= 2) {
                                const key = parts[0].replace(/['"]/g, "").trim().replace(/_/g, " ");
                                const value = parts.slice(1).join(":").replace(/^['"]|['"]$/g, "").trim();
                                return (
                                    <li key={idx}>
                                        <span className="font-medium capitalize">{key}:</span> {value}
                                    </li>
                                );
                            }
                            return <li key={idx}>{item}</li>;
                        })}
                    </ul>
                );
            }
        } catch {
            // fallback
        }
    }
    return <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{notes}</p>;
};

export default function ApprovalPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [result, setResult] = useState<GenerationResult | null>(null);
    const [activeTab, setActiveTab] = useState<"linkedin" | "twitter">("linkedin");
    const [isPublishing, setIsPublishing] = useState(false);
    const [copyDialog, setCopyDialog] = useState<{ open: boolean; type: "linkedin" | "image"; url: string } | null>(null);

    // In-place copy editing
    const [isEditing, setIsEditing] = useState(false);
    const [editedLinkedin, setEditedLinkedin] = useState("");
    const [editedTwitter, setEditedTwitter] = useState("");
    const [viewMode, setViewMode] = useState<"mockup" | "clean">("mockup");

    const mapGeneration = (g: Generation): GenerationResult => ({
        id: g.id,
        topic: g.topic,
        audience: g.audience,
        contentType: g.content_type,
        tone: g.tone,
        createdAt: g.created_at,
        duration: Math.max(1, Math.round((g.duration_ms ?? 0) / 1000)),
        linkedin_post: g.linkedin_post || "",
        twitter_post: g.twitter_post || "",
        image_prompt: g.image_prompt || "",
        compliance_status: g.compliance_status === "REJECTED" ? "REJECTED" : "APPROVED",
        compliance_notes: g.compliance_notes || "Passed deterministic compliance checks.",
    });

    useEffect(() => {
        const id = searchParams.get("id");
        if (!id) {
            setResult(defaultResult);
            setEditedLinkedin(defaultResult.linkedin_post);
            setEditedTwitter(defaultResult.twitter_post);
            return;
        }

        const run = async () => {
            try {
                const generation = await getGeneration(id);
                const mapped = mapGeneration(generation);
                setResult(mapped);
                setEditedLinkedin(mapped.linkedin_post);
                setEditedTwitter(mapped.twitter_post);
            } catch {
                toast.error("Unable to load generation, loaded preview demo");
                setResult(defaultResult);
                setEditedLinkedin(defaultResult.linkedin_post);
                setEditedTwitter(defaultResult.twitter_post);
            }
        };

        run();
    }, [searchParams]);

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    const handleSaveChanges = () => {
        if (!result) return;
        setResult({
            ...result,
            linkedin_post: editedLinkedin,
            twitter_post: editedTwitter,
        });
        setIsEditing(false);
        toast.success("Changes applied to content package");
    };

    const handleDiscardChanges = () => {
        if (!result) return;
        setEditedLinkedin(result.linkedin_post);
        setEditedTwitter(result.twitter_post);
        setIsEditing(false);
        toast.info("Edits reverted");
    };

    const handlePublish = async (platform: "linkedin" | "twitter") => {
        if (!result) return;

        setIsPublishing(true);
        try {
            await publishGeneration(result.id);
            if (platform === "twitter") {
                toast.success("Redirecting to X (Twitter)", {
                    description: "Your post is ready in the tweet composer.",
                });
            }
        } catch {
            console.error("Publish status update failed");
        } finally {
            setIsPublishing(false);
        }

        if (platform === "twitter") {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(result.twitter_post)}`, "_blank");
        } else if (platform === "linkedin") {
            navigator.clipboard.writeText(result.linkedin_post);
            setCopyDialog({ open: true, type: "linkedin", url: "https://www.linkedin.com/feed/?shareActive=true" });
        }
    };

    const handleReject = async () => {
        if (!result) return;

        try {
            await rejectGeneration(result.id, "Rejected from approval page");
            toast.info("Generation marked for revision");
            router.push("/app");
        } catch {
            toast.error("Reject failed", { description: "Please try again." });
        }
    };

    const handleExport = (format: "txt" | "md" | "json") => {
        if (!result) return;

        let content = "";
        let filename = `draftly-${result.id || "package"}.${format}`;
        let mimeType = "text/plain";

        if (format === "md") {
            content = `# Draftly Content Package: ${result.topic}\n\n**Audience**: ${result.audience}\n**Tone**: ${result.tone || "Default"}\n**Generated**: ${new Date(result.createdAt).toLocaleString()}\n\n---\n\n## LinkedIn Post\n\n${result.linkedin_post}\n\n---\n\n## Twitter / X Post\n\n${result.twitter_post}\n\n---\n\n## Visual Direction & AI Image Prompt\n\n\`\`\`\n${result.image_prompt}\n\`\`\`\n\n---\n\n## Compliance Audit\n- **Status**: ${result.compliance_status}\n- **Notes**: ${result.compliance_notes}\n`;
            mimeType = "text/markdown";
        } else if (format === "json") {
            content = JSON.stringify(result, null, 2);
            mimeType = "application/json";
        } else {
            content = `DRAFTLY CONTENT PACKAGE\nTopic: ${result.topic}\nAudience: ${result.audience}\nCreated: ${new Date(result.createdAt).toLocaleString()}\n\n====================\nLINKEDIN POST\n====================\n${result.linkedin_post}\n\n====================\nTWITTER / X POST\n====================\n${result.twitter_post}\n\n====================\nIMAGE PROMPT\n====================\n${result.image_prompt}\n\n====================\nCOMPLIANCE: ${result.compliance_status}\n${result.compliance_notes}\n`;
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported as ${format.toUpperCase()}`);
    };

    if (!result) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const currentPostContent = activeTab === "linkedin" ? result.linkedin_post : result.twitter_post;
    const currentEditedContent = activeTab === "linkedin" ? editedLinkedin : editedTwitter;
    const isTwitter = activeTab === "twitter";
    const isExtendedTwitter = isTwitter && currentPostContent.length > 280;

    return (
        <div className="min-h-screen bg-transparent">
            {/* Top Navigation Header */}
            <header className="app-header-glass sticky top-0 z-30 border-b border-border/80">
                <div className="flex min-h-20 flex-wrap items-center justify-between gap-3 px-4 py-5 pl-14 md:min-h-24 md:flex-nowrap md:px-6 md:py-6 md:pl-6">
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-lg font-semibold tracking-tight md:text-xl">Content Package Approval</h1>
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <span className="text-foreground">Review multichannel copy, compliance audit, and AI image prompts</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-border bg-card/70 text-muted-foreground font-mono">
                            ⚡ {result.duration}s generation
                        </Badge>
                    </div>
                </div>
            </header>

            {/* Main Content Layout */}
            <div className="px-4 py-6 md:px-8 md:py-8">
                <div className="mx-auto grid w-full max-w-7xl gap-6 xl:grid-cols-[1.35fr_1fr]">
                    
                    {/* LEFT COLUMN: Compliance Status & Main Multichannel Copy */}
                    <div className="space-y-6">
                        
                        {/* Compliance Card */}
                        <Card
                            className={cn(
                                "app-panel border-border/80 transition-all duration-300",
                                result.compliance_status === "APPROVED"
                                    ? "border-success/40 bg-linear-to-r from-success/5 to-transparent"
                                    : "border-destructive/40 bg-linear-to-r from-destructive/5 to-transparent"
                            )}
                        >
                            <CardContent className="flex items-start gap-3.5 p-5">
                                {result.compliance_status === "APPROVED" ? (
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                ) : (
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
                                        <XCircle className="h-5 w-5" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-foreground">
                                            Compliance Status:
                                        </p>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "font-semibold uppercase tracking-wider text-xs",
                                                result.compliance_status === "APPROVED"
                                                    ? "border-success/40 bg-success/15 text-success"
                                                    : "border-destructive/40 bg-destructive/15 text-destructive"
                                            )}
                                        >
                                            {result.compliance_status}
                                        </Badge>
                                    </div>
                                    {formatComplianceNotes(result.compliance_notes)}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Channel Copy Card */}
                        <Card className="app-panel border-border/80 overflow-hidden shadow-xl">
                            <CardHeader className="space-y-4 border-b border-border/60 pb-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <CardTitle className="text-xl">Channel Copy</CardTitle>
                                        <CardDescription className="line-clamp-1 mt-0.5">{result.topic}</CardDescription>
                                    </div>

                                    {/* Platform Selector Tabs */}
                                    <Tabs
                                        value={activeTab}
                                        onValueChange={(val) => {
                                            setActiveTab(val as "linkedin" | "twitter");
                                            setIsEditing(false);
                                        }}
                                    >
                                        <TabsList className="border border-border bg-card">
                                            <TabsTrigger value="linkedin" className="gap-1.5 data-[state=active]:bg-[#0A66C2]/15 data-[state=active]:text-[#70b5f9]">
                                                <Linkedin className="h-4 w-4" />
                                                LinkedIn
                                            </TabsTrigger>
                                            <TabsTrigger value="twitter" className="gap-1.5 data-[state=active]:bg-foreground/10 data-[state=active]:text-foreground">
                                                <Twitter className="h-4 w-4" />
                                                Twitter / X
                                            </TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>

                                {/* Sub-controls: Character count badge & View/Edit toggles */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant="secondary"
                                            className={cn(
                                                "font-mono text-xs",
                                                isTwitter && isExtendedTwitter
                                                    ? "bg-primary/10 text-primary border border-primary/30"
                                                    : "bg-secondary text-muted-foreground"
                                            )}
                                        >
                                            {activeTab === "linkedin"
                                                ? `${currentPostContent.length} chars`
                                                : isExtendedTwitter
                                                ? `${currentPostContent.length} chars (X Long-form)`
                                                : `${currentPostContent.length}/280 chars (Standard)`}
                                        </Badge>
                                        {activeTab === "linkedin" && (
                                            <span className="text-xs text-muted-foreground hidden sm:inline">
                                                • Optimal for thought-leadership
                                            </span>
                                        )}
                                        {isExtendedTwitter && (
                                            <span className="text-xs text-muted-foreground hidden sm:inline">
                                                • Rich storytelling with hashtags
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {!isEditing ? (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                                                    onClick={() => setViewMode(viewMode === "mockup" ? "clean" : "mockup")}
                                                >
                                                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                                                    {viewMode === "mockup" ? "Clean text" : "Social mockup"}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 text-xs border-border bg-card/60"
                                                    onClick={() => setIsEditing(true)}
                                                >
                                                    <Edit3 className="mr-1.5 h-3.5 w-3.5 text-primary" />
                                                    Edit copy
                                                </Button>
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-xs text-muted-foreground"
                                                    onClick={handleDiscardChanges}
                                                >
                                                    <Undo2 className="mr-1 h-3.5 w-3.5" />
                                                    Cancel
                                                </Button>
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    className="h-8 text-xs"
                                                    onClick={handleSaveChanges}
                                                >
                                                    <Save className="mr-1.5 h-3.5 w-3.5" />
                                                    Save changes
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-6 space-y-4">
                                {isEditing ? (
                                    /* In-place editor mode */
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>Editing {activeTab === "linkedin" ? "LinkedIn" : "Twitter"} copy</span>
                                            <span className="font-mono">
                                                {activeTab === "linkedin"
                                                    ? `${editedLinkedin.length} chars`
                                                    : `${editedTwitter.length} chars`}
                                            </span>
                                        </div>
                                        <Textarea
                                            value={activeTab === "linkedin" ? editedLinkedin : editedTwitter}
                                            onChange={(e) => {
                                                if (activeTab === "linkedin") setEditedLinkedin(e.target.value);
                                                else setEditedTwitter(e.target.value);
                                            }}
                                            rows={12}
                                            className="font-mono text-sm leading-relaxed border-border bg-input/80 resize-y"
                                            placeholder="Write or edit copy here..."
                                        />
                                    </div>
                                ) : viewMode === "mockup" ? (
                                    /* High-Fidelity Social Mockup */
                                    <ContentPreview
                                        platform={activeTab}
                                        content={currentPostContent}
                                        username={activeTab === "linkedin" ? "Draftly Enterprise" : "Draftly AI"}
                                        handle="@draftly_ai"
                                    />
                                ) : (
                                    /* Clean Text View */
                                    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                                        <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground select-text">
                                            {formatRichText(currentPostContent, activeTab)}
                                        </div>
                                        <div className="flex justify-end pt-2 border-t border-border/40">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs border-border"
                                                onClick={() => handleCopy(currentPostContent, activeTab === "linkedin" ? "LinkedIn" : "Twitter")}
                                            >
                                                <Copy className="mr-1.5 h-3.5 w-3.5" />
                                                Copy {activeTab === "linkedin" ? "LinkedIn" : "Twitter"} text
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: Visual Direction, Generation Metadata (Shifted Here!), and Actions */}
                    <div className="space-y-6">
                        
                        {/* 1. Visual Direction / Image Studio */}
                        <ImagePreview prompt={result.image_prompt} />

                        {/* 2. Generation Metadata (Shifted to right side as requested!) */}
                        <Card className="app-panel border-border/80 shadow-lg">
                            <CardHeader className="pb-3 border-b border-border/60">
                                <CardTitle className="text-base font-semibold">Generation Metadata</CardTitle>
                                <CardDescription className="text-xs">Campaign configuration and runtime metrics</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-3 sm:grid-cols-2 p-4 pt-4">
                                <div className="rounded-xl border border-border/70 bg-secondary/40 px-3.5 py-2.5">
                                    <p className="text-xs text-muted-foreground">Target Audience</p>
                                    <p className="text-sm font-medium capitalize text-foreground truncate mt-0.5" title={result.audience}>
                                        {result.audience}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-border/70 bg-secondary/40 px-3.5 py-2.5">
                                    <p className="text-xs text-muted-foreground">Created At</p>
                                    <p className="text-sm font-medium text-foreground truncate mt-0.5">
                                        {new Date(result.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-border/70 bg-secondary/40 px-3.5 py-2.5">
                                    <p className="text-xs text-muted-foreground">Content Type</p>
                                    <p className="text-sm font-medium capitalize text-foreground truncate mt-0.5">
                                        {result.contentType || "Thought Leadership"}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-border/70 bg-secondary/40 px-3.5 py-2.5">
                                    <p className="text-xs text-muted-foreground">Tone & Style</p>
                                    <p className="text-sm font-medium capitalize text-foreground truncate mt-0.5">
                                        {result.tone || "Professional"}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 3. Actions Panel */}
                        <Card className="app-panel border-border/80 shadow-lg">
                            <CardHeader className="pb-3 border-b border-border/60">
                                <CardTitle className="text-base font-semibold">Actions & Publishing</CardTitle>
                                <CardDescription className="text-xs">Publish to channels, export files, or request revisions</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 p-5">
                                {result.compliance_status === "APPROVED" ? (
                                    <>
                                        {/* Direct Platform Publish Buttons */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button
                                                variant="default"
                                                className="w-full bg-[#0077b5] text-white hover:bg-[#0077b5]/90 shadow-md font-medium"
                                                onClick={() => handlePublish("linkedin")}
                                                disabled={isPublishing}
                                            >
                                                <Linkedin className="mr-2 h-4 w-4" />
                                                Post to LinkedIn
                                            </Button>
                                            <Button
                                                variant="default"
                                                className="w-full bg-black text-white hover:bg-zinc-900 border border-border shadow-md font-medium"
                                                onClick={() => handlePublish("twitter")}
                                                disabled={isPublishing}
                                            >
                                                <Twitter className="mr-2 h-4 w-4" />
                                                Post to X (Twitter)
                                            </Button>
                                        </div>

                                        {/* Secondary Actions: Export & Regenerate */}
                                        <div className="grid grid-cols-2 gap-3 pt-1">
                                            <Button
                                                variant="outline"
                                                className="border-border bg-card/60 hover:bg-secondary"
                                                onClick={handleReject}
                                            >
                                                <RotateCcw className="mr-2 h-4 w-4" />
                                                Regenerate
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" className="border-border bg-card/60 hover:bg-secondary">
                                                        <Download className="mr-2 h-4 w-4" />
                                                        Export Package
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem onClick={() => handleExport("md")}>
                                                        <FileCode className="mr-2 h-4 w-4 text-purple-400" />
                                                        Markdown (.md)
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleExport("json")}>
                                                        <FileJson className="mr-2 h-4 w-4 text-emerald-400" />
                                                        JSON Package (.json)
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleExport("txt")}>
                                                        <FileText className="mr-2 h-4 w-4 text-cyan-400" />
                                                        Plain Text (.txt)
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-3">
                                        <Button className="w-full" onClick={() => router.push("/app")}>
                                            <RotateCcw className="mr-2 h-4 w-4" />
                                            Create revised version
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full border-border"
                                            onClick={() => handleExport("txt")}
                                        >
                                            <Download className="mr-2 h-4 w-4" />
                                            Export raw draft anyway
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* LinkedIn Copy Helper Dialog */}
            <Dialog open={!!copyDialog?.open} onOpenChange={(open) => !open && setCopyDialog(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Linkedin className="h-5 w-5 text-[#0A66C2]" />
                            Ready to Share on LinkedIn
                        </DialogTitle>
                        <DialogDescription asChild>
                            <div className="text-muted-foreground text-sm space-y-3 pt-2">
                                <p>
                                    We've copied your approved LinkedIn post to the clipboard! LinkedIn's API requires you to paste it into the composer.
                                </p>
                                <div className="bg-secondary/50 rounded-xl p-4 text-sm flex flex-col gap-2 font-mono border text-left">
                                    <div><span className="text-muted-foreground mr-2 font-bold">1.</span> Click the button below to open LinkedIn.</div>
                                    <div><span className="text-muted-foreground mr-2 font-bold">2.</span> Focus the "Start a post" input area.</div>
                                    <div><span className="text-muted-foreground mr-2 font-bold">3.</span> Press <strong>Ctrl+V</strong> (or Cmd+V) to paste.</div>
                                </div>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-end mt-4">
                        <Button
                            type="button"
                            className="bg-[#0A66C2] text-white hover:bg-[#0A66C2]/90"
                            onClick={() => {
                                if (copyDialog) window.open(copyDialog.url, "_blank");
                                setCopyDialog(null);
                            }}
                        >
                            Open LinkedIn Feed
                            <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
