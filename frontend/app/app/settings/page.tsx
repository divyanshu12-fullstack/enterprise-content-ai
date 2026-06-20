"use client";

import { useEffect, useState } from "react";
import {
    AlertTriangle,
    CheckCircle2,
    Eye,
    EyeOff,
    ExternalLink,
    Key,
    RefreshCw,
    Save,
    Shield,
    SlidersHorizontal,
    CircleDollarSign,
    Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { clearGenerations, getSettings, setApiKey, testApiKey, updateSettings } from "@/lib/api";

/* ------------------------------------------------------------------ */
/*  Model definitions — free (no key) vs paid (user key required)     */
/* ------------------------------------------------------------------ */

const freeModels = [
    { value: "openrouter/auto", label: "Auto (Best Free)", description: "Auto-selects the best available free model" },
    { value: "google/gemini-2.5-flash:free", label: "Gemini 2.5 Flash", description: "Google's fast model" },
    { value: "deepseek/deepseek-chat-v3:free", label: "DeepSeek V3", description: "Strong reasoning model" },
    { value: "qwen/qwen3-235b-a22b:free", label: "Qwen 3 235B", description: "Alibaba's large model" },
    { value: "microsoft/mai-ds-r1:free", label: "Microsoft MAI DS R1", description: "Microsoft's reasoning model" },
];

const paidModels = [
    { value: "openai/gpt-4o", label: "GPT-4o", description: "OpenAI's flagship model" },
    { value: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4", description: "Anthropic's balanced model" },
    { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", description: "Google's most capable" },
    { value: "deepseek/deepseek-r1", label: "DeepSeek R1", description: "Advanced reasoning" },
    { value: "x-ai/grok-3", label: "Grok 3", description: "xAI's latest model" },
];

const allModels = [...freeModels, ...paidModels];

const DEFAULT_MODEL = "openrouter/auto";

function isPaidModel(modelValue: string): boolean {
    return !modelValue.endsWith(":free") && modelValue !== "openrouter/auto";
}

const blockedWords = ["guarantee", "promise", "investment advice", "guaranteed returns", "risk-free", "100% safe"];

export default function SettingsPage() {
    const [apiKey, setApiKeyValue] = useState("");
    const [showApiKey, setShowApiKey] = useState(false);
    const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
    const [customBlockedWords, setCustomBlockedWords] = useState("");
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

                // If the saved model is not in our list (e.g. old gemini model),
                // fall back to the default.
                const knownModel = allModels.find((m) => m.value === settings.selected_model);
                setSelectedModel(knownModel ? settings.selected_model : DEFAULT_MODEL);

                setGenerationSettings({
                    autoRetry: settings.auto_retry,
                    maxRetries: settings.max_retries,
                    includeSourceUrls: settings.include_source_urls,
                    autoGenerateImage: settings.auto_generate_image,
                    strictCompliance: settings.strict_compliance,
                });
                setCustomBlockedWords(settings.custom_blocked_words.join("\n"));
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

    const handleSave = async () => {
        // Block saving a paid model without an API key
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
                custom_blocked_words: customBlockedWords
                    .split("\n")
                    .map((word) => word.trim())
                    .filter(Boolean),
            });

            if (apiKey.trim()) {
                await setApiKey(apiKey.trim());
                setHasStoredApiKey(true);
            }

            toast.success("Settings saved");
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
                setApiKeyTestResult({ status: "success", message: result.detail || "Connection successful." });
                toast.success("Connection successful");
            }
        } catch {
            setApiKeyTestResult({ status: "error", message: "Failed to connect. Check your API key." });
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
        setCustomBlockedWords(blockedWords.join("\n"));
        setApiKeyValue("");
        setHasStoredApiKey(false);
        setApiKeyTestResult({ status: "idle", message: "" });
        try {
            await setApiKey("");
        } catch (error) {
            console.error("Failed to clear API key on backend");
        }
        toast.success("Defaults restored and API key cleared");
    };

    // Find the currently-selected model's metadata for the description line
    const selectedModelMeta = allModels.find((m) => m.value === selectedModel);

    return (
        <div className="min-h-screen bg-transparent">
            <header className="app-header-glass sticky top-0 z-30 border-b border-border/80">
                <div className="flex min-h-20 flex-wrap items-center justify-between gap-3 px-4 py-5 pl-14 md:min-h-24 md:flex-nowrap md:px-6 md:py-6 md:pl-6">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight md:text-xl">Settings</h1>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <span className="text-foreground">Model, governance, and workspace behavior</span>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleResetDefaults}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reset
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            <Save className="mr-2 h-4 w-4" />
                            {isSaving ? "Saving" : "Save"}
                        </Button>
                    </div>
                </div>
            </header>

            <div className="px-4 py-6 md:px-6 md:py-8 lg:pb-16 max-md:pb-24">
                <div className="mx-auto grid w-full max-w-350 gap-6 lg:grid-cols-[1fr_1fr]">
                    <div className="space-y-6">
                        <Card className="app-panel border-border/80">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Key className="h-4 w-4" />
                                    API access
                                </CardTitle>
                                <CardDescription>Set your OpenRouter API key and model choice</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="apiKey">OpenRouter API key</Label>
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
                                                className="border-border bg-input pr-10"
                                                placeholder="Paste API key"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowApiKey((prev) => !prev)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        <Button variant="outline" onClick={handleTestConnection} disabled={isTestingApiKey}>
                                            {isTestingApiKey ? "Testing..." : "Test key"}
                                        </Button>
                                    </div>
                                    {hasStoredApiKey && !apiKey.trim() && (
                                        <p className="text-xs text-muted-foreground">
                                            A key is saved in settings. Enter a new key to run a fresh test.
                                        </p>
                                    )}
                                    {apiKeyTestResult.message && (
                                        <div
                                            className={`rounded-md border px-3 py-2 text-xs ${apiKeyTestResult.status === "success"
                                                ? "border-success/40 bg-success/10 text-success"
                                                : apiKeyTestResult.status === "error"
                                                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                                                    : "border-border bg-secondary text-muted-foreground"
                                                }`}
                                        >
                                            {apiKeyTestResult.message}
                                        </div>
                                    )}
                                    <a
                                        href="https://openrouter.ai/settings/keys"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                                    >
                                        <ExternalLink className="h-3 w-3" />
                                        Open OpenRouter Keys
                                    </a>
                                </div>

                                <Separator />

                                {/* Model selector with free/paid groups */}
                                <div className="space-y-2">
                                    <Label>Model</Label>
                                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                                        <SelectTrigger className="border-border bg-input">
                                            <SelectValue placeholder="Choose model" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
                                                    <Sparkles className="h-3 w-3" />
                                                    Free Models
                                                </SelectLabel>
                                                {freeModels.map((model) => (
                                                    <SelectItem key={model.value} value={model.value}>
                                                        <span className="flex items-center gap-2">
                                                            {model.label}
                                                            <Badge variant="outline" className="ml-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-500 text-[10px] px-1.5 py-0">
                                                                Free
                                                            </Badge>
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                            <SelectGroup>
                                                <SelectLabel className="flex items-center gap-1.5 text-xs font-semibold text-amber-500">
                                                    <CircleDollarSign className="h-3 w-3" />
                                                    Paid Models — Requires API Key
                                                </SelectLabel>
                                                {paidModels.map((model) => (
                                                    <SelectItem key={model.value} value={model.value}>
                                                        <span className="flex items-center gap-2">
                                                            {model.label}
                                                            <Badge variant="outline" className="ml-1 border-amber-500/40 bg-amber-500/10 text-amber-500 text-[10px] px-1.5 py-0">
                                                                Paid
                                                            </Badge>
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        {selectedModelMeta?.description ?? selectedModel}
                                    </p>
                                </div>

                                {/* Billing warning for paid models */}
                                {selectedIsPaid && (
                                    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
                                        <p className="flex items-start gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                            <span>
                                                This model is paid. Usage will be billed to your OpenRouter API key.
                                                Make sure you have sufficient credits on{" "}
                                                <a
                                                    href="https://openrouter.ai/settings/credits"
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-300"
                                                >
                                                    your OpenRouter account
                                                </a>.
                                            </span>
                                        </p>
                                    </div>
                                )}

                                {/* Error if paid model selected but no key */}
                                {selectedIsPaid && !hasStoredApiKey && !apiKey.trim() && (
                                    <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3">
                                        <p className="flex items-center gap-2 text-sm font-medium text-destructive">
                                            <AlertTriangle className="h-4 w-4 shrink-0" />
                                            You must provide your own OpenRouter API key to use paid models.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="app-panel border-border/80">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Shield className="h-4 w-4" />
                                    Compliance
                                </CardTitle>
                                <CardDescription>Default and custom blocked language</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div>
                                    <p className="mb-2 text-sm font-medium">Default blocked words</p>
                                    <div className="flex flex-wrap gap-2">
                                        {blockedWords.map((word) => (
                                            <Badge key={word} variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive">
                                                <AlertTriangle className="mr-1 h-3 w-3" />
                                                {word}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="customBlocked">Custom blocked words</Label>
                                    <Textarea
                                        id="customBlocked"
                                        value={customBlockedWords}
                                        onChange={(e) => setCustomBlockedWords(e.target.value)}
                                        className="min-h-28 resize-none border-border bg-input"
                                        placeholder="One word or phrase per line"
                                    />
                                </div>

                                <div className="rounded-lg border border-success/30 bg-success/10 p-3">
                                    <p className="flex items-center gap-2 text-sm font-medium text-success">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Governance checks enabled
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                    <div className="space-y-6">

                        <Card className="app-panel border-border/80">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <SlidersHorizontal className="h-4 w-4" />
                                    Generation behavior
                                </CardTitle>
                                <CardDescription>Configure retry, sources, imagery, and strictness</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-lg border border-border bg-card p-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm">Auto retry</Label>
                                        <Switch
                                            checked={generationSettings.autoRetry}
                                            onCheckedChange={(checked) => setGenerationSettings({ ...generationSettings, autoRetry: checked })}
                                        />
                                    </div>
                                </div>

                                <div className="rounded-lg border border-border bg-card p-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm">Include source URLs</Label>
                                        <Switch
                                            checked={generationSettings.includeSourceUrls}
                                            onCheckedChange={(checked) =>
                                                setGenerationSettings({ ...generationSettings, includeSourceUrls: checked })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="rounded-lg border border-border bg-card p-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm">Auto-generate image prompts</Label>
                                        <Switch
                                            checked={generationSettings.autoGenerateImage}
                                            onCheckedChange={(checked) =>
                                                setGenerationSettings({ ...generationSettings, autoGenerateImage: checked })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="rounded-lg border border-border bg-card p-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm">Strict compliance</Label>
                                        <Switch
                                            checked={generationSettings.strictCompliance}
                                            onCheckedChange={(checked) =>
                                                setGenerationSettings({ ...generationSettings, strictCompliance: checked })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="rounded-lg border border-border bg-card p-3 sm:col-span-2">
                                    <Label className="mb-2 block text-sm">Max retry attempts</Label>
                                    <Select
                                        value={generationSettings.maxRetries.toString()}
                                        onValueChange={(v) =>
                                            setGenerationSettings({ ...generationSettings, maxRetries: parseInt(v, 10) })
                                        }
                                    >
                                        <SelectTrigger className="w-full border-border bg-input sm:w-44">
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

                        <Card className="app-panel border-destructive/40">
                            <CardHeader>
                                <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
                                <CardDescription>Irreversible workspace actions</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm font-medium">Clear generation history</p>
                                        <p className="text-xs text-muted-foreground">Delete all generated records</p>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={async () => {
                                            try {
                                                const result = await clearGenerations();
                                                toast.success(`Cleared ${result.deleted} generation(s)`);
                                            } catch {
                                                toast.error("Failed to clear history");
                                            }
                                        }}
                                    >
                                        Clear history
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
