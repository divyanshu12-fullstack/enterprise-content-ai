"use client";

import { useState, useCallback } from "react";
import {
  Sparkles,
  Users,
  Target,
  AlertCircle,
  Loader2,
  Clock,
  Upload,
  FileText,
  X,
  ChevronRight,
  Briefcase,
  GraduationCap,
  Heart,
  Lightbulb,
  Megaphone,
  Building2,
  Zap,
  Bot,
  Search,
  FileCheck,
  Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
  { id: "research", label: "Researching trends", icon: Search, agent: "Researcher Agent" },
  { id: "writing", label: "Crafting content", icon: FileCheck, agent: "Writer Agent" },
  { id: "compliance", label: "Reviewing compliance", icon: FileCheck, agent: "Governance Agent" },
  { id: "visual", label: "Creating visuals", icon: Palette, agent: "Visual Agent" },
];

const statusMessages = [
  "Analyzing topic relevance...",
  "Scanning latest industry trends...",
  "Gathering credible sources...",
  "Crafting compelling headlines...",
  "Writing LinkedIn post...",
  "Optimizing for engagement...",
  "Creating Twitter version...",
  "Checking brand compliance...",
  "Validating content guidelines...",
  "Generating image prompt...",
  "Finalizing visual direction...",
  "Preparing final output...",
];

export default function GeneratePage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [contentType, setContentType] = useState("");
  const [tone, setTone] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [policyFile, setPolicyFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [errors, setErrors] = useState<{ topic?: string; audience?: string; }>({});

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File too large", { description: "Maximum file size is 5MB" });
        return;
      }
      setPolicyFile(file);
      toast.success("Policy document uploaded", { description: file.name });
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

    // Timer for elapsed time
    const timerInterval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    // Simulate pipeline stages
    const stageInterval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev >= pipelineStages.length - 1) {
          clearInterval(stageInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 3000);

    // Rotate status messages
    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % statusMessages.length);
    }, 1500);

    // Simulate API call
    setTimeout(() => {
      clearInterval(timerInterval);
      clearInterval(stageInterval);
      clearInterval(messageInterval);
      setIsGenerating(false);

      // Store mock result in localStorage for approval page
      const mockResult = {
        id: Date.now().toString(),
        topic,
        audience,
        contentType,
        tone,
        createdAt: new Date().toISOString(),
        duration: elapsedTime || 12,
        linkedin_post: `Excited to share insights on ${topic}!\n\nIn today's rapidly evolving landscape, staying ahead means embracing change and leveraging new opportunities. Here's what I've learned from working with leading organizations:\n\n1. Innovation starts with understanding your audience\n2. Data-driven decisions lead to better outcomes\n3. Collaboration across teams accelerates growth\n\nThe future belongs to those who prepare for it today. What strategies are you implementing to stay competitive?\n\n#${topic.replace(/\s+/g, '')} #Innovation #Leadership`,
        twitter_post: `Key insight on ${topic}: Innovation + collaboration = growth. The future belongs to those who prepare today. What's your strategy? #${topic.replace(/\s+/g, '').slice(0, 10)}`,
        image_prompt: `Professional, modern business visualization for ${topic}, featuring abstract geometric shapes representing growth and innovation, clean corporate aesthetic, subtle gradient background in deep blue and purple tones, minimalist style, no text`,
        compliance_status: "APPROVED",
        compliance_notes: "Content meets all brand guidelines. No prohibited terms detected. CTA is clear and professional.",
      };

      localStorage.setItem("contentai_latest_result", JSON.stringify(mockResult));
      toast.success("Content generated successfully!", {
        description: `Completed in ${elapsedTime || 12} seconds`,
      });
      router.push("/app/approval");
    }, 12000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 pl-14 md:h-16 md:flex-nowrap md:px-6 md:py-0 md:pl-6">
          <div>
            <h1 className="text-lg font-semibold md:text-xl">Generate Content</h1>
            <p className="text-sm text-muted-foreground">Create AI-powered social media content</p>
          </div>
          {isGenerating && (
            <div className="flex items-center gap-3 rounded-lg bg-primary/10 px-4 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium">{formatTime(elapsedTime)}</span>
            </div>
          )}
        </div>
      </header>

      <div className="px-4 py-5 md:p-6">
        <div className="mx-auto max-w-5xl">
          {/* Generation Form */}
          {!isGenerating ? (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Campaign Details
                    </CardTitle>
                    <CardDescription>
                      Define what content you want to generate
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Topic */}
                    <div className="space-y-2">
                      <Label htmlFor="topic">Topic / Subject *</Label>
                      <Textarea
                        id="topic"
                        placeholder="e.g., The future of AI in enterprise software, or How remote work is reshaping company culture..."
                        value={topic}
                        onChange={(e) => {
                          setTopic(e.target.value);
                          if (errors.topic) setErrors({ ...errors, topic: undefined });
                        }}
                        className={cn(
                          "min-h-25 resize-none",
                          errors.topic && "border-destructive"
                        )}
                      />
                      {errors.topic && (
                        <p className="flex items-center gap-1 text-sm text-destructive">
                          <AlertCircle className="h-3 w-3" />
                          {errors.topic}
                        </p>
                      )}
                    </div>

                    {/* Audience Selection */}
                    <div className="space-y-2">
                      <Label>Target Audience *</Label>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {audiences.map((aud) => (
                          <button
                            key={aud.value}
                            type="button"
                            onClick={() => {
                              setAudience(aud.value);
                              if (errors.audience) setErrors({ ...errors, audience: undefined });
                            }}
                            className={cn(
                              "flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-all",
                              audience === aud.value
                                ? "border-primary bg-primary/10 text-foreground"
                                : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:bg-secondary"
                            )}
                          >
                            <aud.icon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{aud.label}</span>
                          </button>
                        ))}
                      </div>
                      {errors.audience && (
                        <p className="flex items-center gap-1 text-sm text-destructive">
                          <AlertCircle className="h-3 w-3" />
                          {errors.audience}
                        </p>
                      )}
                    </div>

                    {/* Content Type & Tone */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="contentType">Content Type</Label>
                        <Select value={contentType} onValueChange={setContentType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type..." />
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
                        <Label htmlFor="tone">Tone</Label>
                        <Select value={tone} onValueChange={setTone}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select tone..." />
                          </SelectTrigger>
                          <SelectContent>
                            {tones.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Additional Context */}
                    <div className="space-y-2">
                      <Label htmlFor="context">Additional Context (Optional)</Label>
                      <Textarea
                        id="context"
                        placeholder="Any specific points to include, company news to mention, or angles to explore..."
                        value={additionalContext}
                        onChange={(e) => setAdditionalContext(e.target.value)}
                        className="min-h-20 resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Policy Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Brand Guidelines
                    </CardTitle>
                    <CardDescription>
                      Upload your company policies for compliance checking
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {policyFile ? (
                      <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{policyFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(policyFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPolicyFile(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary/50 hover:bg-secondary/50">
                        <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
                        <p className="mb-1 text-sm font-medium">
                          Drop your policy document here
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF, DOC, or TXT up to 5MB
                        </p>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={handleFileUpload}
                        />
                      </label>
                    )}
                  </CardContent>
                </Card>

                {/* Generate Button */}
                <Button
                  size="lg"
                  className="w-full h-14 text-base"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Content
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Agent Pipeline Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Bot className="h-4 w-4 text-primary" />
                      AI Agent Pipeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {pipelineStages.map((stage, i) => (
                      <div
                        key={stage.id}
                        className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <stage.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{stage.agent}</p>
                          <p className="text-xs text-muted-foreground truncate">{stage.label}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {i + 1}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Quick Examples */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Quick Start Topics</CardTitle>
                    <CardDescription>Click to use as template</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      "The impact of AI on customer experience",
                      "Building high-performing remote teams",
                      "Sustainable business practices in 2026",
                    ].map((example, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setTopic(example)}
                        className="w-full rounded-lg border border-border bg-card p-3 text-left text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-secondary hover:text-foreground"
                      >
                        {example}
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            /* Generation Progress */
            <Card className="mx-auto max-w-2xl">
              <CardContent className="py-12">
                <div className="text-center mb-8">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Generating Your Content</h2>
                  <p className="text-muted-foreground animate-pulse">
                    {statusMessages[currentMessage]}
                  </p>
                </div>

                {/* Pipeline Progress */}
                <div className="space-y-4">
                  {pipelineStages.map((stage, i) => {
                    const isComplete = i < currentStage;
                    const isActive = i === currentStage;
                    const isPending = i > currentStage;

                    return (
                      <div
                        key={stage.id}
                        className={cn(
                          "flex items-center gap-4 rounded-lg border p-4 transition-all",
                          isComplete && "border-success/50 bg-success/5",
                          isActive && "border-primary bg-primary/5",
                          isPending && "border-border bg-secondary/30 opacity-50"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full",
                            isComplete && "bg-success",
                            isActive && "bg-primary",
                            isPending && "bg-muted"
                          )}
                        >
                          {isActive ? (
                            <Loader2 className="h-5 w-5 animate-spin text-primary-foreground" />
                          ) : (
                            <stage.icon
                              className={cn(
                                "h-5 w-5",
                                isComplete && "text-success-foreground",
                                isPending && "text-muted-foreground"
                              )}
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{stage.agent}</p>
                          <p className="text-sm text-muted-foreground">{stage.label}</p>
                        </div>
                        {isComplete && (
                          <Badge className="bg-success text-success-foreground">
                            Complete
                          </Badge>
                        )}
                        {isActive && (
                          <Badge className="bg-primary text-primary-foreground">
                            Processing
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 text-center">
                  <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Elapsed: {formatTime(elapsedTime)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
