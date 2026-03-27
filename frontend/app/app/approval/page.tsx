"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ArrowLeft,
    CheckCircle2,
    Copy,
    Download,
    ExternalLink,
    Image as ImageIcon,
    Linkedin,
    Loader2,
    RotateCcw,
    Send,
    Twitter,
    XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getGeneration, publishGeneration, rejectGeneration } from "@/lib/api";
import type { Generation } from "@/lib/schemas";

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
    topic: "The Future of AI in Business",
    audience: "professionals",
    createdAt: new Date().toISOString(),
    duration: 12,
    linkedin_post:
        "AI is changing how enterprise teams ship value. The teams who win are combining experimentation speed with strong governance. How is your team balancing both?",
    twitter_post:
        "Enterprise AI success = faster experimentation + reliable governance. The balance matters. #AI #Enterprise",
    image_prompt:
        "Minimal monochrome enterprise visual with geometric lines and soft studio lighting, no text",
    compliance_status: "APPROVED",
    compliance_notes: "Content meets configured compliance rules.",
};

export default function ApprovalPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [result, setResult] = useState<GenerationResult | null>(null);
    const [activeTab, setActiveTab] = useState("linkedin");
    const [isPublishing, setIsPublishing] = useState(false);

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
        compliance_notes: g.compliance_notes || "No compliance notes.",
    });

    useEffect(() => {
        const id = searchParams.get("id");
        if (!id) {
            setResult(defaultResult);
            return;
        }

        const run = async () => {
            try {
                const generation = await getGeneration(id);
                setResult(mapGeneration(generation));
            } catch {
                toast.error("Unable to load generation");
                setResult(defaultResult);
            }
        };

        run();
    }, [searchParams]);

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied`);
    };

    const handlePublish = async () => {
        if (!result) return;

        setIsPublishing(true);
        try {
            await publishGeneration(result.id);
            toast.success("Published", {
                description: "Your approved content has been sent for publishing.",
            });
        } catch {
            toast.error("Publish failed", { description: "Please try again." });
        } finally {
            setIsPublishing(false);
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

    const getPollinationsUrl = (prompt: string) => {
        const encodedPrompt = encodeURIComponent(prompt);
        return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1000&height=700&nologo=true`;
    };

    if (!result) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent">
            <header className="app-header-glass sticky top-0 z-30 border-b border-border/80">
                <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 pl-14 md:h-16 md:flex-nowrap md:px-8 md:py-0 md:pl-8">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/app">
                                <ArrowLeft className="mr-1 h-4 w-4" />
                                Back
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-lg font-semibold tracking-tight md:text-xl">Approval</h1>
                            <p className="text-sm text-muted-foreground">Review copy, compliance, and visual package</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="border-border bg-card/70 text-muted-foreground">
                        {result.duration}s generation
                    </Badge>
                </div>
            </header>

            <div className="px-4 py-6 md:px-8 md:py-8">
                <div className="mx-auto grid w-full max-w-7xl gap-6 xl:grid-cols-[1.35fr_1fr]">
                    <div className="space-y-6">
                        <Card
                            className={cn(
                                "app-panel border-border/80",
                                result.compliance_status === "APPROVED"
                                    ? "border-success/40"
                                    : "border-destructive/40"
                            )}
                        >
                            <CardContent className="flex items-start gap-3 p-5">
                                {result.compliance_status === "APPROVED" ? (
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                                ) : (
                                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                                )}
                                <div>
                                    <p className="text-sm font-medium">
                                        Compliance status: <span className="ml-1">{result.compliance_status}</span>
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">{result.compliance_notes}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="app-panel border-border/80">
                            <CardHeader className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <CardTitle className="text-xl">Channel copy</CardTitle>
                                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                                        <TabsList className="grid w-[220px] grid-cols-2 border border-border bg-card">
                                            <TabsTrigger value="linkedin" className="gap-1">
                                                <Linkedin className="h-4 w-4" />
                                                LinkedIn
                                            </TabsTrigger>
                                            <TabsTrigger value="twitter" className="gap-1">
                                                <Twitter className="h-4 w-4" />
                                                Twitter
                                            </TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>
                                <CardDescription>{result.topic}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="rounded-xl border border-border bg-card p-4">
                                    {activeTab === "linkedin" ? (
                                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{result.linkedin_post}</p>
                                    ) : (
                                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{result.twitter_post}</p>
                                    )}
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <Badge variant="secondary" className="bg-secondary text-muted-foreground">
                                        {activeTab === "linkedin"
                                            ? `${result.linkedin_post.length} chars`
                                            : `${result.twitter_post.length}/280 chars`}
                                    </Badge>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            handleCopy(activeTab === "linkedin" ? result.linkedin_post : result.twitter_post, activeTab)
                                        }
                                    >
                                        <Copy className="mr-2 h-4 w-4" />
                                        Copy text
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="app-panel border-border/80">
                            <CardHeader>
                                <CardTitle className="text-base">Generation metadata</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-lg border border-border bg-secondary px-3 py-2">
                                    <p className="text-xs text-muted-foreground">Audience</p>
                                    <p className="text-sm font-medium capitalize">{result.audience}</p>
                                </div>
                                <div className="rounded-lg border border-border bg-secondary px-3 py-2">
                                    <p className="text-xs text-muted-foreground">Created</p>
                                    <p className="text-sm font-medium">{new Date(result.createdAt).toLocaleString()}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="app-panel border-border/80">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <ImageIcon className="h-4 w-4" />
                                    Visual direction
                                </CardTitle>
                                <CardDescription>Auto-generated preview and prompt</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-card">
                                    <Image
                                        src={getPollinationsUrl(result.image_prompt)}
                                        alt="Generated visual"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                </div>
                                <div className="rounded-lg border border-border bg-secondary p-3">
                                    <p className="text-xs text-muted-foreground">Prompt</p>
                                    <p className="mt-1 text-sm leading-relaxed">{result.image_prompt}</p>
                                    <div className="mt-3 flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleCopy(result.image_prompt, "Prompt")}>
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copy
                                        </Button>
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={getPollinationsUrl(result.image_prompt)} target="_blank" rel="noreferrer">
                                                <ExternalLink className="mr-2 h-4 w-4" />
                                                Open
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="app-panel border-border/80">
                            <CardHeader>
                                <CardTitle className="text-base">Actions</CardTitle>
                                <CardDescription>Finalize this package or send back for revision</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {result.compliance_status === "APPROVED" ? (
                                    <>
                                        <Button className="w-full" onClick={handlePublish} disabled={isPublishing}>
                                            {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                            {isPublishing ? "Publishing" : "Publish approved package"}
                                        </Button>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button variant="outline" onClick={handleReject}>
                                                <RotateCcw className="mr-2 h-4 w-4" />
                                                Regenerate
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    const blob = new Blob([
                                                        `LinkedIn:\n${result.linkedin_post}\n\nTwitter:\n${result.twitter_post}\n\nImage Prompt:\n${result.image_prompt}`,
                                                    ]);
                                                    const url = URL.createObjectURL(blob);
                                                    const link = document.createElement("a");
                                                    link.href = url;
                                                    link.download = `generation-${result.id}.txt`;
                                                    link.click();
                                                    URL.revokeObjectURL(url);
                                                }}
                                            >
                                                <Download className="mr-2 h-4 w-4" />
                                                Export
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <Button className="w-full" onClick={() => router.push("/app")}>
                                        <RotateCcw className="mr-2 h-4 w-4" />
                                        Create revised version
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
