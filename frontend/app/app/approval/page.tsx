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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    const [copyDialog, setCopyDialog] = useState<{ open: boolean; type: "linkedin" | "image"; url: string; } | null>(null);

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

    const handlePublish = async (platform: "linkedin" | "twitter") => {
        if (!result) return;

        setIsPublishing(true);
        try {
            await publishGeneration(result.id);
            if (platform === "twitter") {
                toast.success("Published to X (Twitter)", {
                    description: "The platform has been opened in a new tab.",
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

    const handleGenerateImage = () => {
        if (!result) return;
        navigator.clipboard.writeText(result.image_prompt);
        setCopyDialog({ open: true, type: "image", url: "https://gemini.google.com/" });
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
                <div className="flex min-h-20 flex-wrap items-center justify-between gap-3 px-4 py-5 pl-14 md:min-h-24 md:flex-nowrap md:px-6 md:py-6 md:pl-6">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight md:text-xl">Approval</h1>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <span className="text-foreground">Review copy, compliance, and visual package</span>
                        </p>
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
                                        <TabsList className="grid w-55 grid-cols-2 border border-border bg-card">
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
                                    Image Prompt
                                </CardTitle>
                                <CardDescription>Recommended visual directions for your post</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="rounded-lg border border-border bg-secondary p-3">
                                    <p className="text-xs text-muted-foreground">Prompt</p>
                                    <p className="mt-1 text-sm leading-relaxed">{result.image_prompt}</p>
                                    <div className="mt-3 flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleCopy(result.image_prompt, "Prompt")}>
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copy Prompt
                                        </Button>
                                        <Button variant="default" size="sm" onClick={handleGenerateImage}>
                                            <ExternalLink className="mr-2 h-4 w-4" />
                                            Generate Image in Gemini
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
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button
                                                variant="default"
                                                className="w-full bg-[#0077b5] text-white hover:bg-[#0077b5]/90"
                                                onClick={() => handlePublish("linkedin")}
                                                disabled={isPublishing}
                                            >
                                                <Linkedin className="mr-2 h-4 w-4" />
                                                Post to LinkedIn
                                            </Button>
                                            <Button
                                                variant="default"
                                                className="w-full bg-black text-white hover:bg-black/90"
                                                onClick={() => handlePublish("twitter")}
                                                disabled={isPublishing}
                                            >
                                                <Twitter className="mr-2 h-4 w-4" />
                                                Post to X (Twitter)
                                            </Button>
                                        </div>
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

            <Dialog open={!!copyDialog?.open} onOpenChange={(open) => !open && setCopyDialog(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {copyDialog?.type === "linkedin" ? "Ready to Share on LinkedIn" : "Ready to Generate Image"}
                        </DialogTitle>
                        <DialogDescription className="space-y-3 pt-2">
                            <p>
                                {copyDialog?.type === "linkedin"
                                    ? "We've copied your approved post to the clipboard! LinkedIn doesn't support pre-filling text, so you'll need to manually paste it."
                                    : "We've copied your image prompt to the clipboard! Since Gemini doesn't support pre-filling the prompt via URL, you'll need to paste it in."}
                            </p>
                            <div className="bg-secondary/50 rounded-md p-4 text-sm flex flex-col gap-2 font-mono border text-left">
                                <div><span className="text-muted-foreground mr-2">1.</span> Click the button below to open the platform.</div>
                                <div><span className="text-muted-foreground mr-2">2.</span> Focus the text input area.</div>
                                <div><span className="text-muted-foreground mr-2">3.</span> Press <strong>Ctrl+V</strong> (or Cmd+V) to paste.</div>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-end mt-4">
                        <Button
                            type="button"
                            onClick={() => {
                                if (copyDialog) window.open(copyDialog.url, "_blank");
                                setCopyDialog(null);
                            }}
                        >
                            Open {copyDialog?.type === "linkedin" ? "LinkedIn" : "Gemini"}
                            <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
