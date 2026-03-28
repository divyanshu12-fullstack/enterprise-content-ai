"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowRight,
    Bot,
    Briefcase,
    Building2,
    FileCheck,
    FileText,
    GraduationCap,
    Lightbulb,
    Loader2,
    Megaphone,
    Search,
    Upload,
    Users,
    WandSparkles,
    X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createGeneration, generateContent, uploadPolicyFile } from "@/lib/api";

const audiences = [
    { value: "professionals", label: "Professionals", icon: Briefcase },
    { value: "executives", label: "C-Level Executives", icon: Building2 },
    { value: "developers", label: "Developers & Engineers", icon: Lightbulb },
    { value: "marketers", label: "Marketers", icon: Megaphone },
    { value: "students", label: "Students & Graduates", icon: GraduationCap },
    { value: "general", label: "General Audience", icon: Users },
];

const contentTypes = [
    { value: "thought-leadership", label: "Thought Leadership" },
    { value: "product-announcement", label: "Product Announcement" },
    { value: "industry-insights", label: "Industry Insights" },
    { value: "how-to-guide", label: "How-To Guide" },
    { value: "case-study", label: "Case Study" },
    { value: "company-news", label: "Company News" },
];

const tones = [
    { value: "professional", label: "Professional" },
    { value: "conversational", label: "Conversational" },
    { value: "inspirational", label: "Inspirational" },
    { value: "educational", label: "Educational" },
    { value: "persuasive", label: "Persuasive" },
];

const pipelineStages = [
    { id: "research", label: "Research signals", icon: Search, agent: "Research Agent" },
    { id: "writing", label: "Write platform drafts", icon: FileText, agent: "Writer Agent" },
    { id: "compliance", label: "Compliance checks", icon: FileCheck, agent: "Governance Agent" },
    { id: "visual", label: "Visual prompt generation", icon: WandSparkles, agent: "Visual Agent" },
];

const statusMessages = [
    "Reading your brief",
    "Collecting market context",
    "Writing LinkedIn and Twitter drafts",
    "Running policy checks",
    "Composing visual prompt",
    "Finalizing output",
];

const quickTemplates = [
    "How AI copilots are changing enterprise productivity",
    "A practical framework for GTM alignment in B2B teams",
    "How to build trust in AI-first customer experiences",
];

export default function GeneratePage() {
    const router = useRouter();
    const [topic, setTopic] = useState("");
    const [audience, setAudience] = useState("");
    const [contentType, setContentType] = useState("");
    const [tone, setTone] = useState("");
    const [additionalContext, setAdditionalContext] = useState("");
    const [policyFile, setPolicyFile] = useState<File | null>(null);
    const [policyText, setPolicyText] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentStage, setCurrentStage] = useState(0);
    const [currentMessage, setCurrentMessage] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [errors, setErrors] = useState<{ topic?: string; audience?: string; }>({});

    const progress = useMemo(() => {
        if (!isGenerating) return 0;
        return ((currentStage + 1) / pipelineStages.length) * 100;
    }, [isGenerating, currentStage]);

    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File too large", { description: "Maximum file size is 5MB" });
            return;
        }

        try {
            const extracted = await uploadPolicyFile(file);
            setPolicyFile(file);
            setPolicyText(extracted.policy_text);
            toast.success("Policy document parsed", {
                description: `${file.name} (${extracted.char_count} chars)` + (extracted.truncated ? " - truncated" : ""),
            });
        } catch {
            setPolicyFile(null);
            setPolicyText("");
            toast.error("Policy parsing failed", {
                description: "Use a readable TXT, PDF, or DOCX file.",
            });
        }
    }, []);

    const validateForm = () => {
        const newErrors: { topic?: string; audience?: string; } = {};
        if (!topic.trim()) newErrors.topic = "Topic is required";
        if (!audience) newErrors.audience = "Please select an audience";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleGenerate = async () => {
        if (!validateForm()) return;

        setIsGenerating(true);
        setCurrentStage(0);
        setCurrentMessage(0);
        setElapsedTime(0);

        const timerInterval = setInterval(() => {
            setElapsedTime((prev) => prev + 1);
        }, 1000);

        const stageInterval = setInterval(() => {
            setCurrentStage((prev) => {
                if (prev >= pipelineStages.length - 1) {
                    clearInterval(stageInterval);
                    return prev;
                }
                return prev + 1;
            });
        }, 2600);

        const messageInterval = setInterval(() => {
            setCurrentMessage((prev) => (prev + 1) % statusMessages.length);
        }, 1400);

        try {
            const started = Date.now();

            const output = await generateContent({
                topic,
                audience,
                content_type: contentType || undefined,
                tone: tone || undefined,
                additional_context: additionalContext || undefined,
                policy_text: policyText || undefined,
            });

            const record = await createGeneration({
                topic,
                audience,
                content_type: contentType || undefined,
                tone: tone || undefined,
                additional_context: additionalContext || undefined,
                linkedin_post: output.linkedin_post,
                twitter_post: output.twitter_post,
                image_prompt: output.image_prompt,
                compliance_status: output.compliance_status,
                compliance_notes: output.compliance_notes,
                status: output.compliance_status,
                duration_ms: Date.now() - started,
            });

            toast.success("Content package generated", {
                description: `Completed in ${Math.max(1, Math.round((Date.now() - started) / 1000))} seconds`,
            });
            router.push(`/app/approval?id=${record.id}`);
        } catch {
            toast.error("Generation failed", {
                description: "Please make sure you are logged in and try again.",
            });
        } finally {
            clearInterval(timerInterval);
            clearInterval(stageInterval);
            clearInterval(messageInterval);
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent">
            <header className="app-header-glass sticky top-0 z-30 border-b border-border/80">
                <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 pl-14 md:h-16 md:flex-nowrap md:px-8 md:py-0 md:pl-8">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight md:text-xl">Generate Content</h1>
                        <p className="text-sm text-muted-foreground">Create approved social copy in one guided workflow</p>
                    </div>
                    <Badge variant="outline" className="border-border bg-card/70 text-muted-foreground">
                        Multi-Agent Pipeline
                    </Badge>
                </div>
            </header>

            <div className="px-4 py-6 md:px-8 md:py-8">
                {!isGenerating ? (
                    <div className="mx-auto grid w-full max-w-7xl gap-6 xl:grid-cols-[1.8fr_1fr]">
                        <Card className="app-panel border-border/80">
                            <CardHeader className="space-y-2">
                                <CardTitle className="text-xl">Campaign Brief</CardTitle>
                                <CardDescription>Define the brief once. The system handles drafting, policy validation, and packaging.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="topic">Topic or narrative</Label>
                                    <Textarea
                                        id="topic"
                                        value={topic}
                                        onChange={(e) => {
                                            setTopic(e.target.value);
                                            if (errors.topic) setErrors({ ...errors, topic: undefined });
                                        }}
                                        placeholder="Example: Practical lessons from deploying AI copilots in enterprise support teams"
                                        className={cn("min-h-28 resize-none border-border bg-input", errors.topic && "border-destructive")}
                                    />
                                    {errors.topic && <p className="text-sm text-destructive">{errors.topic}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Target audience</Label>
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                        {audiences.map((aud) => (
                                            <button
                                                key={aud.value}
                                                type="button"
                                                onClick={() => {
                                                    setAudience(aud.value);
                                                    if (errors.audience) setErrors({ ...errors, audience: undefined });
                                                }}
                                                className={cn(
                                                    "flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm transition-colors",
                                                    audience === aud.value
                                                        ? "border-primary bg-primary text-primary-foreground"
                                                        : "border-border bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                                                )}
                                            >
                                                <aud.icon className="h-4 w-4 shrink-0" />
                                                <span className="truncate">{aud.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    {errors.audience && <p className="text-sm text-destructive">{errors.audience}</p>}
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Content type</Label>
                                        <Select value={contentType} onValueChange={setContentType}>
                                            <SelectTrigger className="border-border bg-input">
                                                <SelectValue placeholder="Choose a format" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {contentTypes.map((type) => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Tone</Label>
                                        <Select value={tone} onValueChange={setTone}>
                                            <SelectTrigger className="border-border bg-input">
                                                <SelectValue placeholder="Choose a tone" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {tones.map((item) => (
                                                    <SelectItem key={item.value} value={item.value}>
                                                        {item.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="context">Additional context</Label>
                                    <Textarea
                                        id="context"
                                        value={additionalContext}
                                        onChange={(e) => setAdditionalContext(e.target.value)}
                                        placeholder="Optional notes: campaign angle, brand statements, regulatory constraints"
                                        className="min-h-24 resize-none border-border bg-input"
                                    />
                                </div>

                                <div className="space-y-3 rounded-xl border border-border bg-secondary p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium">Policy document</p>
                                            <p className="text-xs text-muted-foreground">Attach brand/compliance files for stricter review</p>
                                        </div>
                                        {policyFile && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setPolicyFile(null);
                                                    setPolicyText("");
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>

                                    {policyFile ? (
                                        <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
                                            <span className="font-medium">{policyFile.name}</span>
                                            <span className="ml-2 text-muted-foreground">{(policyFile.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                    ) : (
                                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-5 text-sm text-muted-foreground hover:border-foreground/30 hover:text-foreground">
                                            <Upload className="h-4 w-4" />
                                            Upload PDF, DOC, DOCX, or TXT (max 5MB)
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept=".pdf,.doc,.docx,.txt"
                                                onChange={handleFileUpload}
                                            />
                                        </label>
                                    )}
                                </div>

                                <Button className="h-12 w-full text-sm font-medium" onClick={handleGenerate}>
                                    Generate Content Package
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            <Card className="app-panel border-border/80">
                                <CardHeader>
                                    <CardTitle className="text-base">Pipeline</CardTitle>
                                    <CardDescription>Four agents produce a complete package.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {pipelineStages.map((stage, idx) => (
                                        <div key={stage.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary">
                                                <stage.icon className="h-4 w-4 text-foreground" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">{stage.agent}</p>
                                                <p className="truncate text-xs text-muted-foreground">{stage.label}</p>
                                            </div>
                                            <Badge variant="secondary" className="text-xs">{idx + 1}</Badge>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card className="app-panel border-border/80">
                                <CardHeader>
                                    <CardTitle className="text-base">Quick starts</CardTitle>
                                    <CardDescription>Use one of these briefs and edit as needed.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {quickTemplates.map((template) => (
                                        <button
                                            key={template}
                                            type="button"
                                            onClick={() => setTopic(template)}
                                            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                                        >
                                            {template}
                                        </button>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                ) : (
                    <Card className="app-panel mx-auto w-full max-w-3xl border-border/80">
                        <CardHeader className="space-y-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <CardTitle className="text-xl">Generating content package</CardTitle>
                                    <CardDescription>{statusMessages[currentMessage]}</CardDescription>
                                </div>
                                <div className="rounded-md border border-border bg-card px-3 py-1 text-sm text-muted-foreground">{elapsedTime}s</div>
                            </div>
                            <div className="h-2 rounded-full bg-secondary">
                                <div className="h-full rounded-full bg-foreground transition-all duration-500" style={{ width: `${progress}%` }} />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {pipelineStages.map((stage, idx) => {
                                const done = idx < currentStage;
                                const active = idx === currentStage;

                                return (
                                    <div
                                        key={stage.id}
                                        className={cn(
                                            "flex items-center gap-3 rounded-xl border px-4 py-3",
                                            done && "border-border bg-secondary text-muted-foreground",
                                            active && "border-foreground/40 bg-card text-foreground",
                                            !done && !active && "border-border bg-card/60 text-muted-foreground"
                                        )}
                                    >
                                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-background">
                                            {active ? <Loader2 className="h-4 w-4 animate-spin" /> : <stage.icon className="h-4 w-4" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{stage.agent}</p>
                                            <p className="text-xs text-muted-foreground">{stage.label}</p>
                                        </div>
                                        <Badge variant={done ? "secondary" : "outline"}>{done ? "Done" : active ? "Running" : "Queued"}</Badge>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
