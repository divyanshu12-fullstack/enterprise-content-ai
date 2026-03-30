"use client";

import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowRight,
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
    CheckCircle2,
    CloudUpload,
    Circle,
    ChevronRight,
    Sparkles,
    Lock,
    AlertTriangle,
    Info
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { createGeneration, generateContent, generateContentStream, getSettings, uploadPolicyFile } from "@/lib/api";
import type { FinalContentOutput } from "@/lib/schemas";
import { PipelineStatus } from "@/components/pipeline-status";
import axios from "axios";

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

const stageIndexById: Record<string, number> = {
    init: 0,
    retry: 0,
    research: 0,
    writing: 1,
    compliance: 2,
    visual: 3,
    done: 3,
};

const quickTemplates = [
    "The evolution of Prompt Engineering into Agentic Workflows",
    "How to maintain brand safety when scaling GenAI content",
    "Transitioning from RAG to autonomous multi-agent pipelines",
    "Measuring ROI on enterprise LLM deployments in 2026",
    "Top 5 cybersecurity pitfalls when adopting AI tooling"
];

export default function GeneratePage() {
    const normalizePipelineDetail = (text: string): string => {
        const raw = text.trim();

        if (raw.includes("RESOURCE_EXHAUSTED") || raw.includes("quota") || raw.includes("rate") || raw.includes("RateLimitError") || raw.includes("429")) {
            const retryMatch = raw.match(/retry in\s+([0-9.]+)s/i) || raw.match(/"retryDelay"\s*:\s*"([0-9]+)s"/i);
            const modelMatch = raw.match(/model[:=]\s*([a-zA-Z0-9._-]+)/i) || raw.match(/"model"\s*:\s*"([^"]+)"/i);

            const retrySeconds = retryMatch?.[1] ? Math.max(1, Math.ceil(Number(retryMatch[1]))) : null;
            const model = modelMatch?.[1] ?? "configured model";

            if (retrySeconds) {
                return `Rate limit reached for ${model}. Please retry in about ${retrySeconds}s, switch model, or use a key/project with higher quota.`;
            }
            return `Rate limit reached for ${model}. Please wait and retry, switch model, or use a key/project with higher quota.`;
        }

        if (raw.includes("validation_error") || raw.includes("ValidationError") || raw.includes("JSONDecodeError")) {
            return "The AI agents produced an output that could not be parsed into the expected format. Please try again with a different topic.";
        }

        if (raw.includes("API key not valid") || raw.includes("authentication") || raw.includes("invalid api key") || raw.includes("API_KEY_INVALID")) {
            return "Your API key is invalid or unauthorized. Please verify and update it in the Settings panel.";
        }

        if (raw.includes("DuckDuckGo") || raw.includes("DDGS") || raw.includes("Search tool")) {
            return "The search tool was temporarily blocked by the provider due to too many requests. Retrying usually fixes this issue.";
        }

        if (raw.includes("Failed to open generation stream") || raw.includes("Failed to fetch") || raw.includes("Network Error")) {
            return "The backend server is unreachable or timed out. Please check your connection or try again later.";
        }

        return raw;
    };

    const resolveErrorMessage = (error: unknown): string => {
        if (axios.isAxiosError(error)) {
            const detail = error.response?.data?.detail;
            if (typeof detail === "string") {
                return normalizePipelineDetail(detail);
            }
            if (detail != null) {
                return normalizePipelineDetail(JSON.stringify(detail));
            }
            return normalizePipelineDetail(error.message || "Request failed.");
        }
        if (error instanceof Error && error.message.trim()) {
            return normalizePipelineDetail(error.message);
        }
        return "Please check your API key/model settings and try again.";
    };

    const router = useRouter();
    const [topic, setTopic] = useState("");
    const [audience, setAudience] = useState("");
    const [contentType, setContentType] = useState("");
    const [tone, setTone] = useState("");
    const [enforceTwitterLimit, setEnforceTwitterLimit] = useState(true);
    const [additionalContext, setAdditionalContext] = useState("");
    const [policyFile, setPolicyFile] = useState<File | null>(null);
    const [policyText, setPolicyText] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentStage, setCurrentStage] = useState(0);
    const [progressMessage, setProgressMessage] = useState("Reading your brief");
    const [errors, setErrors] = useState<{ topic?: string; audience?: string; contentType?: string; tone?: string; }>({});
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [stageElapsed, setStageElapsed] = useState(0);
    const [hasAssignedApiKey, setHasAssignedApiKey] = useState<boolean | null>(null);

    const topicRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isGenerating && !generationError) {
            const stageStart = Date.now();
            const interval = setInterval(() => {
                setStageElapsed(Math.floor((Date.now() - stageStart) / 1000));
            }, 1000);
            return () => clearInterval(interval);
        } else {
            setStageElapsed(0);
        }
    }, [isGenerating, currentStage, generationError]);

    useEffect(() => {
        let active = true;

        const loadSettings = async () => {
            try {
                const settings = await getSettings();
                if (active) {
                    setHasAssignedApiKey(settings.has_api_key === true);
                }
            } catch {
                if (active) {
                    setHasAssignedApiKey(false);
                }
            }
        };

        void loadSettings();

        return () => {
            active = false;
        };
    }, []);

    const progress = useMemo(() => {
        if (!isGenerating) return 0;
        return ((currentStage + 1) / pipelineStages.length) * 100;
    }, [isGenerating, currentStage]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

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
        const newErrors: { topic?: string; audience?: string; contentType?: string; tone?: string; } = {};
        if (!topic.trim()) newErrors.topic = "Topic is required";
        if (!audience) newErrors.audience = "Please select an audience";
        if (!contentType) newErrors.contentType = "Select a format to guide the writer agent";
        if (!tone) newErrors.tone = "Select a tone";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleGenerate = async () => {
        if (!validateForm()) return;

        if (hasAssignedApiKey === false) {
            toast.error("API key not assigned", {
                description: "Submit an API key in Settings before generating content.",
            });
            router.push("/app/settings");
            return;
        }

        setIsGenerating(true);
        setCurrentStage(0);
        setProgressMessage("Reading your brief");
        setGenerationError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        try {
            const started = Date.now();

            const payload = {
                topic,
                audience,
                content_type: contentType || undefined,
                tone: tone || undefined,
                additional_context: additionalContext || undefined,
                policy_text: policyText || undefined,
                enforce_twitter_limit: enforceTwitterLimit,
            };

            let output: FinalContentOutput;
            output = await generateContentStream(payload, (event) => {
                setProgressMessage(event.message);
                const stageIdx = stageIndexById[event.stage];
                if (typeof stageIdx === "number") {
                    setCurrentStage(stageIdx);
                }
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
        } catch (error: unknown) {
            const errorMsg = resolveErrorMessage(error);
            setGenerationError(errorMsg);

            if (typeof window !== "undefined") {
                window.localStorage.setItem("contentai_last_error", JSON.stringify({
                    message: errorMsg,
                    timestamp: new Date().toISOString()
                }));
            }

            toast.error("Generation failed", {
                description: errorMsg,
            });
            // Do not reset isGenerating so the error is inline
        }
    };

    const renderRightPanel = () => {
        return (
            <div className="space-y-6">
                {isGenerating ? (
                    <Card className={cn("app-panel shadow-2xl relative overflow-hidden", generationError ? "border-destructive border-2" : "border-primary/30 shadow-primary/5 generating-bg")}>
                        {!generationError && <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-transparent via-primary/50 to-transparent animate-[shimmer_2s_infinite]" />}
                        <CardHeader className="space-y-4 pb-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <CardTitle className="text-xl">Generating Package</CardTitle>
                                    <CardDescription className="mt-1.5">{generationError ? "Pipeline halted" : progressMessage}</CardDescription>
                                </div>
                            </div>
                            <div className="flex gap-1 h-2 w-full">
                                {pipelineStages.map((_, idx) => {
                                    const done = idx < currentStage;
                                    const active = idx === currentStage && !generationError;
                                    const activePercentage = Math.min((stageElapsed / 2.6) * 100, 100);
                                    return (
                                        <div key={idx} className="h-full flex-1 overflow-hidden rounded-full bg-secondary">
                                            <div
                                                className={cn("h-full rounded-full transition-all ease-linear duration-300", done ? "bg-success" : active ? "bg-primary" : "bg-primary")}
                                                style={{ width: done ? "100%" : active ? `${activePercentage}%` : "0%" }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 relative z-10">
                            {generationError ? (
                                <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-5 flex flex-col items-center text-center gap-3">
                                    <AlertTriangle className="h-8 w-8 text-destructive" />
                                    <div className="space-y-1">
                                        <p className="font-semibold text-destructive">Pipeline Halted</p>
                                        <p className="text-sm font-medium text-destructive/90">{generationError}</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground mt-2 w-full"
                                        onClick={() => {
                                            setIsGenerating(false);
                                            setGenerationError(null);
                                            setTimeout(() => topicRef.current?.focus(), 100);
                                        }}
                                    >
                                        Modify Topic & Try Again
                                    </Button>
                                </div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {pipelineStages.map((stage, idx) => {
                                        const done = idx < currentStage;
                                        const active = idx === currentStage;

                                        return (
                                            <motion.div
                                                key={stage.id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={cn(
                                                    "flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-300",
                                                    done && "border-success/30 bg-success/5 text-success",
                                                    active && "border-l-4 border-l-primary border-y-primary/50 border-r-primary/50 bg-primary/10 text-foreground shadow-sm animate-pulse",
                                                    !done && !active && "border-border bg-card/40 text-muted-foreground opacity-60"
                                                )}
                                            >
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background/50 shadow-sm">
                                                    {done ? (
                                                        <CheckCircle2 className="h-5 w-5 text-success" />
                                                    ) : active ? (
                                                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                                                    ) : (
                                                        <Lock className="h-4 w-4 opacity-50" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={cn("text-sm font-medium truncate", done && "text-success", active && "text-foreground")}>{stage.agent}</p>
                                                    <p className={cn("text-xs opacity-80 truncate", done && "line-through")}>{stage.label}</p>
                                                </div>
                                                {active && (
                                                    <span className="text-xs font-mono font-medium text-primary">
                                                        {formatTime(stageElapsed)}
                                                    </span>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <Card className="app-panel border-border/80">
                            <CardHeader>
                                <CardTitle className="text-base">Pipeline</CardTitle>
                                <CardDescription>Four agents produce a complete package.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {pipelineStages.map((stage, idx) => (
                                    <div key={stage.id} className="group relative flex items-center justify-between rounded-lg border border-transparent border-l-[3px] border-l-muted-foreground bg-card px-3 py-2.5 transition-colors duration-150 hover:border-l-primary hover:bg-secondary/40">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary shrink-0">
                                                <stage.icon className="h-4 w-4 text-foreground" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">{stage.agent}</p>
                                                <p className="truncate text-xs text-muted-foreground">{stage.label}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-xs font-mono text-muted-foreground opacity-70 group-hover:opacity-100 transition-opacity">
                                                ~{stage.id === 'research' ? '6s' : stage.id === 'writing' ? '12s' : stage.id === 'compliance' ? '8s' : '5s'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <div className="flex items-center gap-3 px-1 py-1 overflow-hidden">
                            <div className="h-px flex-1 bg-border/60" />
                            <span className="shrink-0 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Or start from scratch</span>
                            <div className="h-px flex-1 bg-border/60" />
                        </div>

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
                                        onClick={(e) => {

                                            setTopic(template);
                                            if (typeof window !== "undefined") {
                                                const event = new CustomEvent("contentai_topic_change", { detail: { hasTopic: true } });
                                                window.dispatchEvent(event);
                                            }
                                        }}
                                        className="group flex w-full items-start gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left text-sm text-muted-foreground transition-all duration-200 hover:border-foreground/30 hover:text-foreground active:scale-[0.98] active:bg-primary/10 active:border-primary/30"
                                    >
                                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary/70 transition-colors group-hover:text-primary" />
                                        <span>{template}</span>
                                    </button>
                                ))}
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-transparent">
            <PipelineStatus isRunning={isGenerating && !generationError} currentStage={currentStage} />
            <header className="app-header-glass sticky top-0 z-30 border-b border-border/80">
                <div className="flex min-h-20 flex-wrap items-center justify-between gap-3 px-4 py-5 pl-14 md:min-h-24 md:flex-nowrap md:px-6 md:py-6 md:pl-6">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight md:text-xl">Generate Content</h1>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <span className="text-foreground">Brief</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                            <span>Generate</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                            <span>Review</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                            <span>Publish</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="sm" className="md:hidden h-8 gap-2 bg-secondary/20">
                                    <Info className="h-4 w-4" />
                                    Pipeline info
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-75 sm:w-100 overflow-y-auto pt-10">
                                {renderRightPanel()}
                            </SheetContent>
                        </Sheet>
                        {hasAssignedApiKey === null ? (
                            <Badge variant="outline" className="border-border bg-muted/50 text-muted-foreground gap-1.5 px-2.5 py-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Checking Pipeline
                            </Badge>
                        ) : hasAssignedApiKey === false ? (
                            <button
                                type="button"
                                onClick={() => router.push("/app/settings")}
                                className="inline-flex items-center gap-1.5 rounded-full border border-destructive bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
                                title="API key not assigned. Open Settings to add it before generating."
                            >
                                <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                                Pipeline Not Ready - Add API Key
                            </button>
                        ) : (
                            <Badge variant="outline" className="border-success/30 bg-success/10 text-success gap-1.5 px-2.5 py-1">
                                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                                Pipeline Ready
                            </Badge>
                        )}
                    </div>
                </div>
            </header>

            <div className="px-4 py-6 md:px-6 md:py-8 lg:pb-16 max-md:pb-24">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes hue-shift {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                    .generating-bg {
                        background: linear-gradient(-45deg, rgba(var(--primary), 0.05), rgba(var(--primary), 0.02), rgba(var(--primary), 0.06), rgba(var(--primary), 0.03));
                        background-size: 400% 400%;
                        animation: hue-shift 8s ease infinite;
                    }
                `}} />

                <div className={cn("mx-auto grid w-full max-w-350 gap-6", !isGenerating && "md:grid-cols-[1.8fr_1fr]", isGenerating && "md:grid-cols-[1.8fr_1.8fr]")}>
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={cn("transition-all duration-500 relative", isGenerating && "opacity-80 blur-[1px] grayscale-[0.3] select-none pointer-events-none")}
                    >
                        {isGenerating && <div className="absolute inset-0 z-50 pointer-events-none" />}
                        <Card className="app-panel border-border/80">
                            <CardHeader className="space-y-2">
                                <div className="flex flex-col gap-1.5">
                                    <span className="font-mono text-xs font-medium tracking-wider text-muted-foreground">01</span>
                                    <CardTitle className="text-xl">Campaign Brief</CardTitle>
                                </div>
                                <CardDescription>Define the brief once. The system handles drafting, policy validation, and packaging.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="topic">Topic or narrative</Label>
                                    <div className="relative">
                                        <Textarea
                                            id="topic"
                                            value={topic}
                                            onChange={(e) => {
                                                const newTopic = e.target.value;
                                                setTopic(newTopic);
                                                if (typeof window !== "undefined") {
                                                    const event = new CustomEvent("contentai_topic_change", { detail: { hasTopic: newTopic.trim().length > 0 } });
                                                    window.dispatchEvent(event);
                                                }
                                                if (errors.topic) setErrors({ ...errors, topic: undefined });
                                            }}
                                            placeholder="Example: Practical lessons from deploying AI copilots in enterprise support teams"
                                            className={cn("min-h-28 resize-none border-border bg-input pb-8 transition-colors", errors.topic && "border-destructive")}
                                            style={{ fieldSizing: "content" } as any}
                                        />
                                        <span className={cn("absolute bottom-2 right-3 text-xs", topic.length >= 280 && topic.length <= 300 ? "text-warning" : topic.length > 300 ? "text-destructive" : "text-muted-foreground")}>
                                            {topic.length} / 300
                                        </span>
                                    </div>
                                    {errors.topic && <p className="text-sm text-destructive">{errors.topic}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Target audience</Label>
                                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                                        {audiences.map((aud) => (
                                            <button
                                                key={aud.value}
                                                type="button"
                                                onClick={() => {
                                                    setAudience(aud.value);
                                                    if (errors.audience) setErrors({ ...errors, audience: undefined });
                                                }}
                                                className={cn(
                                                    "group flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm transition-all duration-200",
                                                    audience === aud.value
                                                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                                        : "border-border bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground hover:bg-secondary/40"
                                                )}
                                            >
                                                <div className="relative h-4 w-4 shrink-0">
                                                    <aud.icon className={cn("absolute inset-0 h-full w-full transition-opacity duration-150", audience === aud.value ? "opacity-0" : "opacity-100")} />
                                                    <CheckCircle2 className={cn("absolute inset-0 h-full w-full transition-opacity duration-150", audience === aud.value ? "opacity-100" : "opacity-0")} />
                                                </div>
                                                <span className="truncate">{aud.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    {errors.audience && <p className="text-sm text-destructive">{errors.audience}</p>}
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Content type</Label>
                                        <Select value={contentType} onValueChange={(val) => { setContentType(val); if (errors.contentType) setErrors({ ...errors, contentType: undefined }); }}>
                                            <SelectTrigger className={cn("border-border bg-input transition-colors", contentType && "border-l-2 border-l-primary", errors.contentType && "border-destructive")}>
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
                                        {errors.contentType && <p className="text-xs text-destructive">{errors.contentType}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Tone</Label>
                                        <Select value={tone} onValueChange={(val) => { setTone(val); if (errors.tone) setErrors({ ...errors, tone: undefined }); }}>
                                            <SelectTrigger className={cn("border-border bg-input transition-colors", tone && "border-l-2 border-l-primary", errors.tone && "border-destructive")}>
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
                                        {errors.tone && <p className="text-xs text-destructive">{errors.tone}</p>}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between rounded-lg border border-border bg-input p-3">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="enforce-twitter-limit" className="text-sm font-medium">Enforce Twitter/X Character Limit</Label>
                                            <p className="text-xs text-muted-foreground">Keep Twitter posts strictly under 280 characters</p>
                                        </div>
                                        <Switch
                                            id="enforce-twitter-limit"
                                            checked={enforceTwitterLimit}
                                            onCheckedChange={setEnforceTwitterLimit}
                                        />
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
                                        style={{ fieldSizing: "content" } as any}
                                    />
                                </div>

                                <div
                                    className={cn("space-y-3 rounded-xl border-2 border-dashed p-4 transition-colors duration-200", policyFile ? "border-border bg-secondary/30" : "border-border/50 bg-secondary/10 hover:border-border hover:bg-secondary/30")}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                    }}
                                    onDragLeave={(e) => {
                                        e.preventDefault();
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const file = e.dataTransfer.files?.[0];
                                        if (file) {
                                            const fakeEvent = { target: { files: [file] } } as any;
                                            handleFileUpload(fakeEvent);
                                        }
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium">Policy document</p>
                                            <p className="text-xs text-muted-foreground">Attach brand/compliance files for stricter review (Drag & Drop)</p>
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
                                        <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-primary" />
                                                <span className="font-medium">{policyFile.name}</span>
                                            </div>
                                            <span className="text-muted-foreground text-xs">{(policyFile.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                    ) : (
                                        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg py-4 text-sm text-muted-foreground hover:text-foreground">
                                            <CloudUpload className="h-6 w-6 mb-1 text-muted-foreground/70" />
                                            <span>Click to upload or drag and drop</span>
                                            <span className="text-xs">PDF, DOC, DOCX, or TXT (max 5MB)</span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept=".pdf,.doc,.docx,.txt"
                                                onChange={handleFileUpload}
                                            />
                                        </label>
                                    )}
                                </div>

                                <div className="sticky z-20 mt-8 rounded-2xl bg-card/80 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl border border-border/50" style={{ bottom: "1rem", paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
                                    <Button
                                        className="btn-shimmer relative h-14 w-full text-base font-medium group overflow-hidden"
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                    >
                                        <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                                        <span className="relative flex items-center justify-center">
                                            {isGenerating ? "Gathering requirements..." : "Generate Content Package"}
                                            {!isGenerating && <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />}
                                        </span>
                                    </Button>
                                    <p className="mt-3 text-center text-xs text-muted-foreground/80 balance-text mx-auto max-w-[90%]">
                                        Content generation works with the default shared API but offers limited capabilities. For faster, unrestricted, and highly personalized results, please configure your own personal API key in Settings.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div className="hidden md:block w-full max-w-full min-w-0" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.06 }}>
                        {renderRightPanel()}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
