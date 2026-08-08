"use client";

import { useState } from "react";
import {
  Linkedin,
  Twitter,
  Globe,
  MoreHorizontal,
  Copy,
  ExternalLink,
  Check,
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  BarChart2,
  Share2,
  ThumbsUp,
  Lightbulb,
  Sparkles,
  Palette,
  Eye,
  FileText,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ContentPreviewProps {
  platform: "linkedin" | "twitter";
  content: string;
  username?: string;
  handle?: string;
  timestamp?: string;
  className?: string;
  mode?: "card" | "clean";
}

/**
 * Highlights hashtags and links with interactive platform-specific colors
 */
export function formatRichText(text: string, platform: "linkedin" | "twitter") {
  if (!text) return null;

  // Split by whitespace and preserve newlines
  const lines = text.split("\n");

  return lines.map((line, lineIdx) => {
    // Regex for hashtags, mentions, or links
    const tokens = line.split(/(\B#[\w\d_]+|\B@[\w\d_]+|https?:\/\/[^\s]+)/g);

    return (
      <span key={lineIdx} className="block min-h-[1.4em]">
        {tokens.map((token, tokenIdx) => {
          if (token.startsWith("#")) {
            return (
              <span
                key={tokenIdx}
                className={cn(
                  "font-medium transition-colors cursor-pointer hover:underline",
                  platform === "linkedin"
                    ? "text-[#0A66C2] dark:text-[#70b5f9]"
                    : "text-[#1D9BF0] hover:text-[#1a8cd8]"
                )}
                onClick={() => {
                  const query = encodeURIComponent(token);
                  const url =
                    platform === "linkedin"
                      ? `https://www.linkedin.com/search/results/all/?keywords=${query}`
                      : `https://twitter.com/search?q=${query}`;
                  window.open(url, "_blank");
                }}
              >
                {token}
              </span>
            );
          }
          if (token.startsWith("@")) {
            return (
              <span
                key={tokenIdx}
                className={cn(
                  "font-medium transition-colors",
                  platform === "linkedin"
                    ? "text-[#0A66C2] dark:text-[#70b5f9]"
                    : "text-[#1D9BF0]"
                )}
              >
                {token}
              </span>
            );
          }
          if (token.startsWith("http://") || token.startsWith("https://")) {
            return (
              <a
                key={tokenIdx}
                href={token}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline hover:opacity-80"
              >
                {token}
              </a>
            );
          }
          return <span key={tokenIdx}>{token}</span>;
        })}
      </span>
    );
  });
}

const platformConfig = {
  linkedin: {
    icon: Linkedin,
    name: "LinkedIn",
    authorName: "Draftly Enterprise",
    authorRole: "Enterprise AI Content Suite • 24,800 followers",
    timestamp: "1h • Edited • 🌐",
    color: "text-[#0A66C2]",
    bgColor: "bg-[#0A66C2]/10",
  },
  twitter: {
    icon: Twitter,
    name: "X / Twitter",
    authorName: "Draftly AI",
    handle: "@draftly_ai",
    timestamp: "2h",
    color: "text-foreground",
    bgColor: "bg-foreground/10",
  },
};

export function ContentPreview({
  platform,
  content,
  username,
  handle,
  timestamp,
  className,
  mode = "card",
}: ContentPreviewProps) {
  const [copied, setCopied] = useState(false);
  const config = platformConfig[platform];
  const Icon = config.icon;

  const isTwitter = platform === "twitter";
  const isExtendedTwitter = isTwitter && content.length > 280;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success(`Copied ${config.name} copy`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (platform === "twitter") {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}`,
        "_blank"
      );
    } else {
      navigator.clipboard.writeText(content);
      window.open("https://www.linkedin.com/feed/?shareActive=true", "_blank");
    }
  };

  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-border/80 bg-card transition-all duration-300 shadow-lg hover:border-border",
        platform === "linkedin"
          ? "hover:shadow-[0_8px_30px_rgba(10,102,194,0.06)]"
          : "hover:shadow-[0_8px_30px_rgba(29,155,240,0.06)]",
        className
      )}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 bg-secondary/30">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg shadow-xs",
              config.bgColor
            )}
          >
            <Icon className={cn("h-4 w-4", config.color)} />
          </div>
          <div>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              {config.name}
            </span>
            <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">
              Live Mockup
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isTwitter && (
            <Badge
              variant="outline"
              className={cn(
                "text-[11px] font-mono",
                isExtendedTwitter
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-secondary text-muted-foreground"
              )}
            >
              {isExtendedTwitter
                ? `${content.length} chars (X Long-form)`
                : `${content.length}/280 chars`}
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            {copied ? (
              <Check className="mr-1 h-3.5 w-3.5 text-success" />
            ) : (
              <Copy className="mr-1 h-3.5 w-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" />
                Copy text
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Publish on {config.name}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Social Mockup Body */}
      <div className="p-5">
        {platform === "linkedin" ? (
          /* LinkedIn Post Mockup */
          <div className="space-y-3.5">
            {/* Author Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-linear-to-tr from-[#0A66C2] to-cyan-500 text-white font-semibold text-sm shadow-md">
                  D
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-foreground leading-none">
                      {username || config.authorName}
                    </p>
                    <span className="text-xs text-muted-foreground">• 1st</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {config.authorRole}
                  </p>
                  <p className="text-[11px] text-muted-foreground/80 flex items-center gap-1 mt-0.5">
                    {timestamp || config.timestamp}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>

            {/* Post Content */}
            <div className="text-sm text-foreground/95 leading-relaxed pt-1 select-text">
              {formatRichText(content, "linkedin")}
            </div>

            {/* Engagement Counts Bar */}
            <div className="flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="flex -space-x-1">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#0A66C2] text-[10px] text-white">
                    <ThumbsUp className="h-2.5 w-2.5" />
                  </span>
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] text-white">
                    <Lightbulb className="h-2.5 w-2.5" />
                  </span>
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                    <Heart className="h-2.5 w-2.5" />
                  </span>
                </div>
                <span className="ml-1 font-medium">184</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span>32 comments</span>
                <span>•</span>
                <span>14 reposts</span>
              </div>
            </div>

            {/* Interactive Action Buttons */}
            <div className="grid grid-cols-4 gap-1 border-t border-border/60 pt-2 text-muted-foreground">
              <button className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium hover:bg-secondary hover:text-foreground transition-colors">
                <ThumbsUp className="h-3.5 w-3.5" />
                <span>Like</span>
              </button>
              <button className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium hover:bg-secondary hover:text-foreground transition-colors">
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Comment</span>
              </button>
              <button className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium hover:bg-secondary hover:text-foreground transition-colors">
                <Repeat2 className="h-3.5 w-3.5" />
                <span>Repost</span>
              </button>
              <button className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium hover:bg-secondary hover:text-foreground transition-colors">
                <Share2 className="h-3.5 w-3.5" />
                <span>Send</span>
              </button>
            </div>
          </div>
        ) : (
          /* Twitter / X Post Mockup */
          <div className="space-y-3.5">
            {/* Author Header */}
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 border border-border text-white font-bold text-sm shadow-sm">
                𝕏
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-sm font-bold text-foreground">
                    {username || config.authorName}
                  </span>
                  <BadgeCheck className="h-4 w-4 text-[#1D9BF0] fill-[#1D9BF0]/20 inline shrink-0" />
                  <span className="text-xs text-muted-foreground">
                    {handle || config.handle}
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">
                    {timestamp || config.timestamp}
                  </span>
                </div>

                {/* Post Content */}
                <div className="text-sm text-foreground/95 leading-relaxed pt-2 select-text">
                  {formatRichText(content, "twitter")}
                </div>

                {/* Twitter Engagement Bar */}
                <div className="flex items-center justify-between border-t border-border/50 mt-4 pt-3 text-muted-foreground text-xs">
                  <div className="flex items-center gap-1.5 hover:text-[#1D9BF0] cursor-pointer transition-colors">
                    <MessageCircle className="h-4 w-4" />
                    <span>24</span>
                  </div>
                  <div className="flex items-center gap-1.5 hover:text-emerald-500 cursor-pointer transition-colors">
                    <Repeat2 className="h-4 w-4" />
                    <span>58</span>
                  </div>
                  <div className="flex items-center gap-1.5 hover:text-rose-500 cursor-pointer transition-colors">
                    <Heart className="h-4 w-4" />
                    <span>342</span>
                  </div>
                  <div className="flex items-center gap-1.5 hover:text-[#1D9BF0] cursor-pointer transition-colors">
                    <BarChart2 className="h-4 w-4" />
                    <span>18.5K</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bookmark className="h-4 w-4 hover:text-[#1D9BF0] cursor-pointer transition-colors" />
                    <Share2 className="h-4 w-4 hover:text-[#1D9BF0] cursor-pointer transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Interactive Visual Studio & Image Preview Component               */
/* ------------------------------------------------------------------ */

interface ImagePreviewProps {
  prompt: string;
  className?: string;
}

export function ImagePreview({ prompt, className }: ImagePreviewProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedGenerator, setSelectedGenerator] = useState<{
    name: string;
    url: string;
  }>({ name: "Google Gemini", url: "https://gemini.google.com/" });

  const generators = [
    { name: "Google Gemini / Imagen", url: "https://gemini.google.com/" },
    { name: "Midjourney", url: "https://discord.com/channels/@me" },
    { name: "Ideogram AI", url: "https://ideogram.ai/" },
    { name: "ChatGPT / DALL-E 3", url: "https://chatgpt.com/" },
  ];

  // Extract key stylistic tags from prompt
  const extractedTags = prompt
    ? prompt
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 2 && s.length < 30)
        .slice(0, 5)
    : [];

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    toast.success("Image prompt copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenGenerator = (gen: { name: string; url: string }) => {
    navigator.clipboard.writeText(prompt);
    setSelectedGenerator(gen);
    setDialogOpen(true);
  };

  return (
    <>
      <div
        className={cn(
          "rounded-2xl border border-border/80 bg-card overflow-hidden shadow-lg transition-all duration-300 hover:border-border",
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 bg-secondary/30">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-500/10 text-purple-400">
              <Palette className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              Visual Direction & Image Prompt
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyPrompt}
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            {copied ? (
              <Check className="mr-1 h-3.5 w-3.5 text-success" />
            ) : (
              <Copy className="mr-1 h-3.5 w-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        <div className="p-5 space-y-4">
          {/* Prompt Content */}
          <div className="rounded-xl border border-border/60 bg-secondary/30 p-3.5">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-purple-400" />
              AI Art Direction
            </p>
            <p className="text-sm text-foreground/90 leading-relaxed font-sans select-text">
              {prompt || "No visual prompt specified."}
            </p>
          </div>

          {/* Extracted Style Tags */}
          {extractedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {extractedTags.map((tag, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="bg-secondary/40 border-border/60 text-[11px] text-muted-foreground font-normal"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Quick Launch Actions */}
          <div className="space-y-2 pt-1">
            <p className="text-xs text-muted-foreground font-medium">
              Launch in AI Studio:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {generators.slice(0, 2).map((gen) => (
                <Button
                  key={gen.name}
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs justify-start border-border bg-card/60 hover:bg-secondary hover:text-foreground"
                  onClick={() => handleOpenGenerator(gen)}
                >
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate">{gen.name.split(" ")[0]}</span>
                </Button>
              ))}
              {generators.slice(2, 4).map((gen) => (
                <Button
                  key={gen.name}
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs justify-start border-border bg-card/60 hover:bg-secondary hover:text-foreground"
                  onClick={() => handleOpenGenerator(gen)}
                >
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate">{gen.name.split(" ")[0]}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Generator instructions modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              Generate Image on {selectedGenerator.name}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-muted-foreground text-sm space-y-3 pt-2">
                <p>
                  We've copied your cinematic visual prompt to your clipboard.
                </p>
                <div className="bg-secondary/50 rounded-xl p-4 text-sm flex flex-col gap-2 font-mono border text-left">
                  <div>
                    <span className="text-muted-foreground mr-2 font-bold">1.</span>
                    Click the button below to open{" "}
                    <strong>{selectedGenerator.name}</strong>.
                  </div>
                  <div>
                    <span className="text-muted-foreground mr-2 font-bold">2.</span>
                    Focus the prompt / message box.
                  </div>
                  <div>
                    <span className="text-muted-foreground mr-2 font-bold">3.</span>
                    Press <strong>Ctrl+V</strong> (or Cmd+V) to paste the prompt.
                  </div>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end mt-4">
            <Button
              type="button"
              onClick={() => {
                window.open(selectedGenerator.url, "_blank");
                setDialogOpen(false);
              }}
            >
              Open {selectedGenerator.name}
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
