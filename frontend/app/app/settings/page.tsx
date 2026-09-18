"use client";

import { useEffect, useState } from "react";
import {
    AlertTriangle,
    CheckCircle2,
    Eye,
    EyeOff,
    ExternalLink,
    Key,
    Plus,
    RefreshCw,
    Save,
    Shield,
    SlidersHorizontal,
    CircleDollarSign,
    Sparkles,
    Trash2,
    X,
    Cpu,
    Check,
    Zap,
    Lock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { clearGenerations, getSettings, setApiKey, testApiKey, updateSettings } from "@/lib/api";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Model definitions — free (no key) vs paid (user key required)     */
/* ------------------------------------------------------------------ */

const freeModels = [
    { value: "deepseek/deepseek-v4-flash-0731:free", label: "DeepSeek V4 Flash", provider: "DeepSeek", tag: "Fast & Efficient", description: "DeepSeek's fast cost-efficient flash model (free tier)" },
    { value: "z-ai/glm-5.2:free", label: "GLM 5.2", provider: "Z-AI", tag: "Reasoning", description: "Z-AI's GLM reasoning model (free tier)" },
    { value: "nvidia/nemotron-3.5-lightning:free", label: "Nemotron 3.5 Lightning", provider: "Nvidia", tag: "Low Latency", description: "Nvidia's low-latency Nemotron model (free tier)" },
    { value: "openrouter/free", label: "Any Free", provider: "OpenRouter", tag: "Auto Fallback", description: "OpenRouter free-model fallback router" },
];

const paidModels = [
    { value: "deepseek/deepseek-flash-latest", label: "DeepSeek Flash Latest", provider: "DeepSeek", tag: "Latest Flash", description: "DeepSeek's latest flash model" },
    { value: "minimax/minimax-m3", label: "MiniMax M3", provider: "MiniMax", tag: "Flagship", description: "MiniMax's M3 flagship model" },
    { value: "meta/muse-spark-1.3-contributor", label: "Muse Spark 1.3", provider: "Meta", tag: "Contributor", description: "Meta's Muse Spark contributor model" },
    { value: "qwen/qwen3.8-flash", label: "Qwen 3.8 Flash", provider: "Qwen", tag: "Fast", description: "Qwen's fast flash model" },
];

const allModels = [...freeModels, ...paidModels];
const DEFAULT_MODEL = "deepseek/deepseek-v4-flash-0731:free";

function isPaidModel(modelValue: string): boolean {
    return !modelValue.endsWith(":free") && modelValue !== "openrouter/auto" && modelValue !== "openrouter/free";
}

const defaultBlockedWords = ["guarantee", "promise", "investment advice", "guaranteed returns", "risk-free", "100% safe"];

export default function SettingsPage() {
    const [apiKey, setApiKeyValue] = useState("");
    const [showApiKey, setShowApiKey] = useState(false);
    const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
    const [customWordsList, setCustomWordsList] = useState<string[]>([]);
    const [newWordInput, setNewWordInput] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isTestingApiKey, setIsTestingApiKey] = useState(false);
    const [hasStoredApiKey, setHasStoredApiKey] = useState(false);
    const [apiKeyTestResult, setApiKeyTestResult] = useState<{
        status: "idle" | "success" | "error";
        message: string;
    }>({ status: "idle", message: "" });

    const [generationSettings, setGenerationSettings] = useState({
        autoRetry: true,
        maxRetries: 2,
        includeSourceUrls: true,
        autoGenerateImage: true,
        strictCompliance: true,
    });

    const selectedIsPaid = isPaidModel(selectedModel);

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const settings = await getSettings();
                if (!active) return;

                const knownModel = allModels.find((m) => m.value === settings.selected_model);
                setSelectedModel(knownModel ? settings.selected_model : DEFAULT_MODEL);

                setGenerationSettings({
                    autoRetry: settings.auto_retry,
                    maxRetries: settings.max_retries,
                    includeSourceUrls: settings.include_source_urls,
                    autoGenerateImage: settings.auto_generate_image,
                    strictCompliance: settings.strict_compliance,
                });
                setCustomWordsList(settings.custom_blocked_words || []);
                setHasStoredApiKey(settings.has_api_key);
            } catch {
                toast.error("Unable to load settings");
            }
        };

        load();
        return () => {
            active = false;
        };
    }, []);

    const handleAddWord = () => {
        const trimmed = newWordInput.trim();
        if (!trimmed) return;
        if (customWordsList.some((w) => w.toLowerCase() === trimmed.toLowerCase())) {
            toast.info("Term already in list");
            return;
        }
        setCustomWordsList([...customWordsList, trimmed]);
        setNewWordInput("");
    };

    const handleRemoveWord = (wordToRemove: string) => {
        setCustomWordsList(customWordsList.filter((w) => w !== wordToRemove));
    };

    const handleSave = async () => {
        if (selectedIsPaid && !apiKey.trim() && !hasStoredApiKey) {
            toast.error("API key required", {
                description: "You must provide your own OpenRouter API key to use paid models.",
            });
            return;
        }

        setIsSaving(true);
        try {
            await updateSettings({
                selected_model: selectedModel,
                auto_retry: generationSettings.autoRetry,
                max_retries: generationSettings.maxRetries,
                include_source_urls: generationSettings.includeSourceUrls,
                auto_generate_image: generationSettings.autoGenerateImage,
                strict_compliance: generationSettings.strictCompliance,
                custom_blocked_words: customWordsList,
            });

            if (apiKey.trim()) {
                await setApiKey(apiKey.trim());
                setHasStoredApiKey(true);
            }

            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("draftly_settings_update", { detail: { selected_model: selectedModel } }));
            }

            toast.success("Settings saved successfully");
        } catch {
            toast.error("Save failed", { description: "Please try again." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestConnection = async () => {
        const typedKey = apiKey.trim();
        if (!typedKey && !hasStoredApiKey) {
            setApiKeyTestResult({
                status: "error",
                message: "API key cannot be empty.",
            });
            toast.error("Enter an API key first");
            return;
        }

        setIsTestingApiKey(true);
        setApiKeyTestResult({ status: "idle", message: "Testing connection..." });

        try {
            if (typedKey) {
                await setApiKey(typedKey);
                setHasStoredApiKey(true);
            }
            const result = await testApiKey();
            if (result.ok) {
                setApiKeyTestResult({ status: "success", message: result.detail || "OpenRouter connection verified." });
                toast.success("Connection successful");
            }
        } catch {
            setApiKeyTestResult({ status: "error", message: "Failed to connect. Check your OpenRouter key." });
            toast.error("Failed to connect. Check your API key.");
        } finally {
            setIsTestingApiKey(false);
        }
    };

    const handleResetDefaults = async () => {
        setSelectedModel(DEFAULT_MODEL);
        setGenerationSettings({
            autoRetry: true,
            maxRetries: 2,
            includeSourceUrls: true,
            autoGenerateImage: true,
            strictCompliance: true,
        });
        setCustomWordsList([]);
        setApiKeyValue("");
        setHasStoredApiKey(false);
        setApiKeyTestResult({ status: "idle", message: "" });
        try {
            await setApiKey("");
        } catch (error) {
            console.error("Failed to clear API key on backend");
        }
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("draftly_settings_update", { detail: { selected_model: DEFAULT_MODEL } }));
        }
        toast.success("Defaults restored");
    };

    const selectedModelMeta = allModels.find((m) => m.value === selectedModel);

    return (
        <div className="min-h-screen bg-transparent">
            {/* Header */}
            <header className="app-header-glass sticky top-0 z-30 border-b border-border/80">
                <div className="flex min-h-20 flex-wrap items-center justify-between gap-3 px-4 py-5 pl-14 sm:px-6 lg:px-8 xl:px-10 md:min-h-24 md:flex-nowrap md:pl-6">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight md:text-xl">Workspace & Model Settings</h1>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <span className="text-foreground">Configure AI engines, compliance guardrails, and pipeline behavior</span>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleResetDefaults} className="h-9 border-border bg-card/60">
                            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                            Reset Defaults
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={isSaving} className="h-9 shadow-md">
                            <Save className="mr-1.5 h-3.5 w-3.5" />
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </header>

            <div className="px-4 py-6 sm:px-6 lg:px-8 xl:px-10 md:py-8 lg:pb-16 max-md:pb-24">
                <div className="mx-auto grid w-full max-w-[1600px] 2xl:max-w-[1720px] gap-6 xl:gap-8 lg:grid-cols-[1fr_1fr]">
                    
                    {/* LEFT COLUMN: Model Engine & API Key */}
                    <div className="space-y-6">
                        
                        {/* AI Engine & API Access */}
                        <Card className="app-panel border-border/80 shadow-lg">
                            <CardHeader className="border-b border-border/60 pb-4">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <Cpu className="h-4 w-4 text-primary" />
                                    AI Model Engine
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Select the underlying model for multi-agent brief analysis and copywriting
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 p-6">
                                
                                {/* Model Selector */}
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium">Selected Model</Label>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "text-[10px] font-mono",
                                                selectedIsPaid
                                                    ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
                                                    : "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                                            )}
                                        >
                                            {selectedIsPaid ? "Paid Tier" : "Free Model Available"}
                                        </Badge>
                                    </div>
                                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                                        <SelectTrigger className="border-border bg-input h-11">
                                            <SelectValue placeholder="Choose model" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
                                                    <Sparkles className="h-3 w-3" />
                                                    Free Models (No API Key Required)
                                                </SelectLabel>
                                                {freeModels.map((model) => (
                                                    <SelectItem key={model.value} value={model.value}>
                                                        <div className="flex items-center justify-between gap-3 w-full py-0.5">
                                                            <span className="font-medium text-foreground">{model.label}</span>
                                                            <div className="flex items-center gap-1.5 ml-auto">
                                                                <span className="text-xs text-muted-foreground">({model.provider})</span>
                                                                <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-500 text-[10px] px-1.5 py-0">
                                                                    Free
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                            <SelectGroup>
                                                <SelectLabel className="flex items-center gap-1.5 text-xs font-semibold text-amber-500 mt-2">
                                                    <CircleDollarSign className="h-3 w-3" />
                                                    Paid Flagship Models (Requires OpenRouter Key)
                                                </SelectLabel>
                                                {paidModels.map((model) => (
                                                    <SelectItem key={model.value} value={model.value}>
                                                        <div className="flex items-center justify-between gap-3 w-full py-0.5">
                                                            <span className="font-medium text-foreground">{model.label}</span>
                                                            <div className="flex items-center gap-1.5 ml-auto">
                                                                <span className="text-xs text-muted-foreground">({model.provider})</span>
                                                                <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-500 text-[10px] px-1.5 py-0">
                                                                    Paid
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    <div className="rounded-lg border border-border/60 bg-secondary/30 p-2.5 text-xs text-muted-foreground">
                                        <strong className="text-foreground">{selectedModelMeta?.label}</strong>: {selectedModelMeta?.description}
                                    </div>
                                </div>

                                <Separator />

                                {/* API Key Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="apiKey" className="text-sm font-medium flex items-center gap-1.5">
                                            <Key className="h-3.5 w-3.5 text-primary" />
                                            OpenRouter API Key
                                        </Label>
                                        {hasStoredApiKey && (
                                            <Badge variant="outline" className="border-success/40 bg-success/10 text-success text-[10px] flex items-center gap-1">
                                                <Check className="h-2.5 w-2.5" />
                                                Key Active
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <div className="relative flex-1">
                                            <Input
                                                id="apiKey"
                                                type={showApiKey ? "text" : "password"}
                                                value={apiKey}
                                                onChange={(e) => {
                                                    setApiKeyValue(e.target.value);
                                                    if (apiKeyTestResult.message) {
                                                        setApiKeyTestResult({ status: "idle", message: "" });
                                                    }
                                                }}
                                                className="border-border bg-input pr-10 h-10"
                                                placeholder={hasStoredApiKey ? "••••••••••••••••••••••••" : "sk-or-v1-..."}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowApiKey((prev) => !prev)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={handleTestConnection}
                                            disabled={isTestingApiKey}
                                            className="h-10 border-border bg-card/60"
                                        >
                                            {isTestingApiKey ? "Testing..." : "Test Connection"}
                                        </Button>
                                    </div>

                                    {apiKeyTestResult.message && (
                                        <div
                                            className={cn(
                                                "rounded-lg border px-3 py-2.5 text-xs font-mono flex items-center gap-2",
                                                apiKeyTestResult.status === "success"
                                                    ? "border-success/40 bg-success/10 text-success"
                                                    : apiKeyTestResult.status === "error"
                                                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                                                    : "border-border bg-secondary text-muted-foreground"
                                            )}
                                        >
                                            {apiKeyTestResult.status === "success" ? (
                                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                            ) : (
                                                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                            )}
                                            {apiKeyTestResult.message}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                                        <span>Need an API key for premium models?</span>
                                        <a
                                            href="https://openrouter.ai/settings/keys"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-primary hover:underline"
                                        >
                                            <ExternalLink className="h-3 w-3" />
                                            Get OpenRouter Key
                                        </a>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Compliance & Guardrail Manager */}
                        <Card className="app-panel border-border/80 shadow-lg">
                            <CardHeader className="border-b border-border/60 pb-4">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <Shield className="h-4 w-4 text-primary" />
                                    Compliance & Banned Words Guard
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Deterministic blocklist that automatically rejects unverified claims or regulatory violations
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5 p-6">
                                <div>
                                    <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                                        Default Regulatory Guardrails (Built-in)
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {defaultBlockedWords.map((word) => (
                                            <Badge key={word} variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive text-xs py-1">
                                                <Lock className="mr-1 h-2.5 w-2.5" />
                                                {word}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-2.5">
                                    <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                                        Custom Workspace Blocked Terms
                                    </Label>
                                    
                                    {/* Add Term Input */}
                                    <div className="flex gap-2">
                                        <Input
                                            value={newWordInput}
                                            onChange={(e) => setNewWordInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    handleAddWord();
                                                }
                                            }}
                                            placeholder="Add banned term (e.g. 10x ROI, secret formula)..."
                                            className="border-border bg-input h-9 text-xs"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleAddWord}
                                            className="h-9 border-border bg-card/60 text-xs px-3"
                                        >
                                            <Plus className="mr-1 h-3.5 w-3.5" />
                                            Add
                                        </Button>
                                    </div>

                                    {/* Custom Chips Display */}
                                    {customWordsList.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5 pt-2">
                                            {customWordsList.map((word) => (
                                                <Badge
                                                    key={word}
                                                    variant="secondary"
                                                    className="bg-secondary border border-border/80 text-foreground text-xs py-1 pr-1 pl-2.5 flex items-center gap-1.5"
                                                >
                                                    <span>{word}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveWord(word)}
                                                        className="h-4 w-4 rounded-full flex items-center justify-center hover:bg-destructive/20 hover:text-destructive transition-colors"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground italic pt-1">
                                            No custom blocked terms added yet.
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: Generation Behavior & Danger Zone */}
                    <div className="space-y-6">
                        
                        {/* Generation Behavior */}
                        <Card className="app-panel border-border/80 shadow-lg">
                            <CardHeader className="border-b border-border/60 pb-4">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <SlidersHorizontal className="h-4 w-4 text-primary" />
                                    Pipeline Execution Behavior
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Fine-tune multi-agent behavior, retries, and visual generation
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 p-6">
                                
                                <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card/60 p-3.5">
                                    <div className="space-y-0.5 pr-2">
                                        <Label className="text-sm font-medium">Automatic Retry on Flag</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Automatically re-prompts copywriter agent if compliance detects policy issues
                                        </p>
                                    </div>
                                    <Switch
                                        checked={generationSettings.autoRetry}
                                        onCheckedChange={(checked) => setGenerationSettings({ ...generationSettings, autoRetry: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card/60 p-3.5">
                                    <div className="space-y-0.5 pr-2">
                                        <Label className="text-sm font-medium">AI Visual Direction Studio</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Generates cinematic 8K visual prompts for Gemini, Midjourney, and DALL-E
                                        </p>
                                    </div>
                                    <Switch
                                        checked={generationSettings.autoGenerateImage}
                                        onCheckedChange={(checked) =>
                                            setGenerationSettings({ ...generationSettings, autoGenerateImage: checked })
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card/60 p-3.5">
                                    <div className="space-y-0.5 pr-2">
                                        <Label className="text-sm font-medium">Strict Compliance Guardrails</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Enforces deterministic regulatory checks on all channels before publishing
                                        </p>
                                    </div>
                                    <Switch
                                        checked={generationSettings.strictCompliance}
                                        onCheckedChange={(checked) =>
                                            setGenerationSettings({ ...generationSettings, strictCompliance: checked })
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card/60 p-3.5">
                                    <div className="space-y-0.5 pr-2">
                                        <Label className="text-sm font-medium">Include Source Attribution</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Appends verified data references when research citations are available
                                        </p>
                                    </div>
                                    <Switch
                                        checked={generationSettings.includeSourceUrls}
                                        onCheckedChange={(checked) =>
                                            setGenerationSettings({ ...generationSettings, includeSourceUrls: checked })
                                        }
                                    />
                                </div>

                                <div className="rounded-xl border border-border/70 bg-card/60 p-3.5 flex items-center justify-between">
                                    <div>
                                        <Label className="text-sm font-medium">Max Pipeline Retries</Label>
                                        <p className="text-xs text-muted-foreground">Limit retry loops on complex briefs</p>
                                    </div>
                                    <Select
                                        value={generationSettings.maxRetries.toString()}
                                        onValueChange={(v) =>
                                            setGenerationSettings({ ...generationSettings, maxRetries: parseInt(v, 10) })
                                        }
                                    >
                                        <SelectTrigger className="w-28 border-border bg-input h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">1 retry</SelectItem>
                                            <SelectItem value="2">2 retries</SelectItem>
                                            <SelectItem value="3">3 retries</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Danger Zone */}
                        <Card className="app-panel border-destructive/40 shadow-lg">
                            <CardHeader className="border-b border-border/60 pb-3">
                                <CardTitle className="text-base text-destructive flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Danger Zone
                                </CardTitle>
                                <CardDescription className="text-xs">Irreversible workspace data operations</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5">
                                <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Clear Generation Archives</p>
                                        <p className="text-xs text-muted-foreground">Permanently delete all historical campaign packages</p>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="h-9 shadow-xs"
                                        onClick={async () => {
                                            try {
                                                const result = await clearGenerations();
                                                toast.success(`Cleared ${result.deleted} historical generation(s)`);
                                            } catch {
                                                toast.error("Failed to clear history");
                                            }
                                        }}
                                    >
                                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                        Clear History
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
