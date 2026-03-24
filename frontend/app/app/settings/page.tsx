"use client";

import { useState } from "react";
import {
  Settings,
  Key,
  Eye,
  EyeOff,
  Save,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Shield,
  Bell,
  Palette,
  Database,
  Zap,
  RotateCcw,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const models = [
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash", description: "Fast, efficient for most tasks" },
  { value: "gemini-2.0-pro", label: "Gemini 2.0 Pro", description: "Best quality, slower" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash", description: "Previous gen, very fast" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro", description: "Previous gen, high quality" },
];

const blockedWords = [
  "guarantee",
  "promise",
  "investment advice",
  "guaranteed returns",
  "risk-free",
  "100% safe",
];

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash");
  const [customBlockedWords, setCustomBlockedWords] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Notification settings
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    slack: false,
    onApproval: true,
    onRejection: true,
    weeklyReport: true,
  });

  // Generation settings
  const [generationSettings, setGenerationSettings] = useState({
    autoRetry: true,
    maxRetries: 2,
    includeSourceUrls: true,
    autoGenerateImage: true,
    strictCompliance: true,
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success("Settings saved successfully");
  };

  const handleTestConnection = async () => {
    if (!apiKey) {
      toast.error("Please enter an API key first");
      return;
    }
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: "Testing connection...",
        success: "API key is valid and connected!",
        error: "Failed to connect. Check your API key.",
      }
    );
  };

  const handleResetDefaults = () => {
    setSelectedModel("gemini-2.0-flash");
    setGenerationSettings({
      autoRetry: true,
      maxRetries: 2,
      includeSourceUrls: true,
      autoGenerateImage: true,
      strictCompliance: true,
    });
    toast.success("Settings reset to defaults");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 pl-14 md:h-16 md:flex-nowrap md:px-6 md:py-0 md:pl-6">
          <div>
            <h1 className="text-lg font-semibold md:text-xl">Settings</h1>
            <p className="text-sm text-muted-foreground">Configure your ContentAI preferences</p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
            <Button variant="outline" onClick={handleResetDefaults}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Defaults
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 py-5 md:p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                API Configuration
              </CardTitle>
              <CardDescription>
                Configure your Gemini API key and model preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Key */}
              <div className="space-y-2">
                <Label htmlFor="apiKey">Gemini API Key</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Input
                      id="apiKey"
                      type={showApiKey ? "text" : "password"}
                      placeholder="Enter your Gemini API key..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <Button variant="outline" onClick={handleTestConnection} className="w-full sm:w-auto">
                    Test Connection
                  </Button>
                </div>
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ExternalLink className="h-3 w-3" />
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    Get your API key from Google AI Studio
                  </a>
                </p>
              </div>

              <Separator />

              {/* Model Selection */}
              <div className="space-y-2">
                <Label htmlFor="model">AI Model</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select model..." />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        <div className="flex flex-col">
                          <span>{model.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {model.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Model info */}
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Current Model: {models.find(m => m.value === selectedModel)?.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {models.find(m => m.value === selectedModel)?.description}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generation Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Generation Settings
              </CardTitle>
              <CardDescription>
                Configure how content is generated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <Label className="text-sm font-medium">Auto Retry on Failure</Label>
                    <p className="text-xs text-muted-foreground">Automatically retry if generation fails</p>
                  </div>
                  <Switch
                    checked={generationSettings.autoRetry}
                    onCheckedChange={(checked) =>
                      setGenerationSettings({ ...generationSettings, autoRetry: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <Label className="text-sm font-medium">Include Source URLs</Label>
                    <p className="text-xs text-muted-foreground">Add research sources to output</p>
                  </div>
                  <Switch
                    checked={generationSettings.includeSourceUrls}
                    onCheckedChange={(checked) =>
                      setGenerationSettings({ ...generationSettings, includeSourceUrls: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <Label className="text-sm font-medium">Auto Generate Images</Label>
                    <p className="text-xs text-muted-foreground">Create visual prompts automatically</p>
                  </div>
                  <Switch
                    checked={generationSettings.autoGenerateImage}
                    onCheckedChange={(checked) =>
                      setGenerationSettings({ ...generationSettings, autoGenerateImage: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <Label className="text-sm font-medium">Strict Compliance</Label>
                    <p className="text-xs text-muted-foreground">Enforce stricter brand rules</p>
                  </div>
                  <Switch
                    checked={generationSettings.strictCompliance}
                    onCheckedChange={(checked) =>
                      setGenerationSettings({ ...generationSettings, strictCompliance: checked })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Max Retry Attempts</Label>
                <Select
                  value={generationSettings.maxRetries.toString()}
                  onValueChange={(v) => setGenerationSettings({ ...generationSettings, maxRetries: parseInt(v) })}
                >
                  <SelectTrigger className="w-full sm:w-50">
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

          {/* Compliance Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Compliance Rules
              </CardTitle>
              <CardDescription>
                Configure brand governance and blocked content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Default blocked words */}
              <div className="space-y-3">
                <Label>Default Blocked Words</Label>
                <div className="flex flex-wrap gap-2">
                  {blockedWords.map((word, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="bg-destructive/10 text-destructive border-destructive/20"
                    >
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      {word}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  These words will cause content to be rejected automatically
                </p>
              </div>

              <Separator />

              {/* Custom blocked words */}
              <div className="space-y-2">
                <Label htmlFor="customBlocked">Custom Blocked Words</Label>
                <Textarea
                  id="customBlocked"
                  placeholder="Enter additional blocked words or phrases, one per line..."
                  value={customBlockedWords}
                  onChange={(e) => setCustomBlockedWords(e.target.value)}
                  className="min-h-25 resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Add your company-specific terms that should be flagged
                </p>
              </div>

              {/* Compliance status */}
              <div className="rounded-lg border border-success/20 bg-success/5 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <div>
                    <p className="text-sm font-medium text-success">Compliance Active</p>
                    <p className="text-xs text-muted-foreground">
                      All content will be reviewed by the Brand Governance Agent
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configure how you receive updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <Label className="text-sm font-medium">Email Notifications</Label>
                    <p className="text-xs text-muted-foreground">Receive updates via email</p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, email: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <Label className="text-sm font-medium">Push Notifications</Label>
                    <p className="text-xs text-muted-foreground">Browser push notifications</p>
                  </div>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, push: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <Label className="text-sm font-medium">Slack Integration</Label>
                    <p className="text-xs text-muted-foreground">Post to Slack channel</p>
                  </div>
                  <Switch
                    checked={notifications.slack}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, slack: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <Label className="text-sm font-medium">Weekly Report</Label>
                    <p className="text-xs text-muted-foreground">Get weekly analytics summary</p>
                  </div>
                  <Switch
                    checked={notifications.weeklyReport}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, weeklyReport: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions - proceed with caution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-start gap-3 rounded-lg border border-destructive/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">Clear Generation History</p>
                  <p className="text-xs text-muted-foreground">
                    Delete all previous content generations
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  Clear History
                </Button>
              </div>
              <div className="flex flex-col items-start gap-3 rounded-lg border border-destructive/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">Delete Account</p>
                  <p className="text-xs text-muted-foreground">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
