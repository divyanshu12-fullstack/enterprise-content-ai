"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  XCircle,
  Copy,
  Linkedin,
  Twitter,
  Image as ImageIcon,
  AlertTriangle,
  Clock,
  Users,
  RotateCcw,
  Send,
  FileText,
  ExternalLink,
  ChevronLeft,
  Sparkles,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface GenerationResult {
  id: string;
  topic: string;
  audience: string;
  contentType?: string;
  tone?: string;
  createdAt: string;
  duration: number;
  linkedin_post: string;
  twitter_post: string;
  image_prompt: string;
  compliance_status: "APPROVED" | "REJECTED";
  compliance_notes: string;
}

// Default mock data
const defaultResult: GenerationResult = {
  id: "demo",
  topic: "The Future of AI in Business",
  audience: "professionals",
  createdAt: new Date().toISOString(),
  duration: 12,
  linkedin_post: `Excited to share insights on the transformative power of AI in modern business!

In today's rapidly evolving landscape, staying ahead means embracing change and leveraging new opportunities. Here's what I've learned from working with leading organizations:

1. Innovation starts with understanding your audience
2. Data-driven decisions lead to better outcomes
3. Collaboration across teams accelerates growth

The future belongs to those who prepare for it today. What strategies are you implementing to stay competitive?

#AIInnovation #BusinessTransformation #Leadership`,
  twitter_post: "AI is transforming how we do business. Innovation + collaboration = growth. What's your strategy for staying competitive? #AI #Business",
  image_prompt: "Professional, modern business visualization for AI transformation, featuring abstract geometric shapes representing growth and innovation, clean corporate aesthetic, subtle gradient background in deep blue and purple tones, minimalist style, no text",
  compliance_status: "APPROVED",
  compliance_notes: "Content meets all brand guidelines. No prohibited terms detected. CTA is clear and professional.",
};

export default function ApprovalPage() {
  const router = useRouter();
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [activeTab, setActiveTab] = useState("linkedin");
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    // Try to get the latest result from localStorage
    const stored = localStorage.getItem("contentai_latest_result");
    if (stored) {
      try {
        setResult(JSON.parse(stored));
      } catch {
        setResult(defaultResult);
      }
    } else {
      setResult(defaultResult);
    }
  }, []);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} content copied to clipboard`);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    // Simulate publishing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsPublishing(false);
    toast.success("Content published successfully!", {
      description: "Your posts have been scheduled for publishing.",
    });
  };

  const handleReject = () => {
    toast.info("Content rejected", {
      description: "Redirecting to generate page for revisions...",
    });
    router.push("/app");
  };

  const getPollinationsUrl = (prompt: string) => {
    const encodedPrompt = encodeURIComponent(prompt);
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=600&nologo=true`;
  };

  if (!result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 pl-14 md:h-16 md:flex-nowrap md:px-6 md:py-0 md:pl-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/app">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Separator orientation="vertical" className="hidden h-6 sm:block" />
            <div>
              <h1 className="text-lg font-semibold md:text-xl">Content Approval</h1>
              <p className="text-sm text-muted-foreground">Review and publish your generated content</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {result.duration}s generation
            </Badge>
          </div>
        </div>
      </header>

      <div className="px-4 py-5 md:p-6">
        <div className="mx-auto max-w-6xl">
          {/* Compliance Banner */}
          <div
            className={cn(
              "mb-6 rounded-xl border p-4",
              result.compliance_status === "APPROVED"
                ? "border-success/30 bg-success/5"
                : "border-destructive/30 bg-destructive/5"
            )}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                  result.compliance_status === "APPROVED"
                    ? "bg-success/20"
                    : "bg-destructive/20"
                )}
              >
                {result.compliance_status === "APPROVED" ? (
                  <CheckCircle2 className="h-6 w-6 text-success" />
                ) : (
                  <XCircle className="h-6 w-6 text-destructive" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3
                    className={cn(
                      "text-lg font-semibold",
                      result.compliance_status === "APPROVED"
                        ? "text-success"
                        : "text-destructive"
                    )}
                  >
                    Compliance: {result.compliance_status}
                  </h3>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {result.compliance_notes}
                </p>
              </div>
              {result.compliance_status === "REJECTED" && (
                <Button variant="outline" onClick={() => router.push("/app")}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Regenerate
                </Button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Content Preview */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Content Preview
                    </CardTitle>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="w-full sm:w-auto">
                        <TabsTrigger value="linkedin" className="flex-1 gap-2 sm:flex-none">
                          <Linkedin className="h-4 w-4" />
                          LinkedIn
                        </TabsTrigger>
                        <TabsTrigger value="twitter" className="flex-1 gap-2 sm:flex-none">
                          <Twitter className="h-4 w-4" />
                          Twitter
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <CardDescription>
                    Topic: {result.topic}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activeTab === "linkedin" ? (
                    <div className="space-y-4">
                      {/* LinkedIn mock preview */}
                      <div className="rounded-lg border border-border bg-card p-4">
                        <div className="mb-3 flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                            CA
                          </div>
                          <div>
                            <p className="font-semibold">ContentAI User</p>
                            <p className="text-xs text-muted-foreground">
                              Marketing Professional | Content Creator
                            </p>
                            <p className="text-xs text-muted-foreground">Just now</p>
                          </div>
                        </div>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {result.linkedin_post}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">
                          {result.linkedin_post.length} characters
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(result.linkedin_post, "LinkedIn")}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Twitter mock preview */}
                      <div className="rounded-lg border border-border bg-card p-4">
                        <div className="mb-3 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                            CA
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">ContentAI</p>
                              <p className="text-muted-foreground">@contentai</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm leading-relaxed">
                          {result.twitter_post}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge
                          variant={result.twitter_post.length <= 280 ? "secondary" : "destructive"}
                        >
                          {result.twitter_post.length}/280 characters
                          {result.twitter_post.length > 280 && (
                            <AlertTriangle className="ml-1 h-3 w-3" />
                          )}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(result.twitter_post, "Twitter")}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Meta information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Generation Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-secondary/50 p-3">
                      <p className="text-xs text-muted-foreground">Topic</p>
                      <p className="text-sm font-medium">{result.topic}</p>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-3">
                      <p className="text-xs text-muted-foreground">Target Audience</p>
                      <p className="text-sm font-medium capitalize">{result.audience}</p>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-3">
                      <p className="text-xs text-muted-foreground">Created At</p>
                      <p className="text-sm font-medium">
                        {new Date(result.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-3">
                      <p className="text-xs text-muted-foreground">Generation Time</p>
                      <p className="text-sm font-medium">{result.duration} seconds</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Image Preview */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    Generated Visual
                  </CardTitle>
                  <CardDescription>
                    AI-generated image based on your content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative aspect-4/3 overflow-hidden rounded-lg border border-border bg-secondary">
                    <Image
                      src={getPollinationsUrl(result.image_prompt)}
                      alt="Generated visual"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 opacity-0 transition-opacity hover:opacity-100">
                      <Button variant="secondary" size="sm">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Full Size
                      </Button>
                    </div>
                  </div>

                  {/* Image prompt */}
                  <div className="rounded-lg border border-border bg-secondary/50 p-4">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      Image Prompt
                    </p>
                    <p className="text-sm leading-relaxed">{result.image_prompt}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3"
                      onClick={() => handleCopy(result.image_prompt, "Image prompt")}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Prompt
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.compliance_status === "APPROVED" ? (
                    <>
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={handlePublish}
                        disabled={isPublishing}
                      >
                        {isPublishing ? (
                          <>Publishing...</>
                        ) : (
                          <>
                            <Send className="mr-2 h-5 w-5" />
                            Publish to Channels
                          </>
                        )}
                      </Button>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Button variant="outline" onClick={handleReject}>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Regenerate
                        </Button>
                        <Button variant="outline">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => router.push("/app")}
                      >
                        <RotateCcw className="mr-2 h-5 w-5" />
                        Regenerate Content
                      </Button>
                      <p className="text-center text-sm text-muted-foreground">
                        Content was rejected due to compliance issues. Please regenerate with adjusted parameters.
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
