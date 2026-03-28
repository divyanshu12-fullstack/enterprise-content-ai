"use client";

import { Linkedin, Twitter, Globe, MoreHorizontal, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner"; import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ContentPreviewProps {
  platform: "linkedin" | "twitter";
  content: string;
  username?: string;
  timestamp?: string;
  className?: string;
}

const platformConfig = {
  linkedin: {
    icon: Linkedin,
    name: "LinkedIn",
    username: "ContentAI",
    color: "text-[#0A66C2]",
    bgColor: "bg-[#0A66C2]/10",
    maxChars: null,
  },
  twitter: {
    icon: Twitter,
    name: "X / Twitter",
    username: "@contentai",
    color: "text-foreground",
    bgColor: "bg-foreground/10",
    maxChars: 280,
  },
};

export function ContentPreview({
  platform,
  content,
  username,
  timestamp = "Just now",
  className,
}: ContentPreviewProps) {
  const config = platformConfig[platform];
  const Icon = config.icon;
  const isOverLimit = config.maxChars && content.length > config.maxChars;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", config.bgColor)}>
            <Icon className={cn("h-4 w-4", config.color)} />
          </div>
          <span className="text-sm font-medium text-foreground">{config.name}</span>
        </div>
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
            <DropdownMenuItem>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open in {config.name}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Author info */}
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {username || config.username}
            </p>
            <p className="text-xs text-muted-foreground">{timestamp}</p>
          </div>
        </div>

        {/* Post content */}
        <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
          {content}
        </div>

        {/* Character count for Twitter */}
        {config.maxChars && (
          <div className="mt-3 flex items-center justify-end">
            <span
              className={cn(
                "text-xs font-medium",
                isOverLimit ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {content.length} / {config.maxChars}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface ImagePreviewProps {
  prompt: string;
  className?: string;
}

export function ImagePreview({ prompt, className }: ImagePreviewProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleGenerateImage = () => {
    navigator.clipboard.writeText(prompt);
    setDialogOpen(true);
  };

  return (
    <>
      <div
        className={cn(
          "rounded-xl border border-border bg-card overflow-hidden",
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-medium text-foreground">Visual direction</span>
        </div>
        <div className="p-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Image Prompt</p>
          <p className="text-sm text-foreground line-clamp-3 mb-4">{prompt}</p>
          <Button variant="default" size="sm" onClick={handleGenerateImage}>
            <ExternalLink className="mr-1.5 h-3 w-3" />
            Generate in Gemini
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ready to Generate Image</DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <p>
                We've copied your image prompt to the clipboard! Since Gemini doesn't support pre-filling the prompt via URL, you'll need to paste it in manually.
              </p>
              <div className="bg-secondary/50 rounded-md p-4 text-sm flex flex-col gap-2 font-mono border text-left">
                <div><span className="text-muted-foreground mr-2">1.</span> Click the button below to open Gemini.</div>
                <div><span className="text-muted-foreground mr-2">2.</span> Focus the prompt input area.</div>
                <div><span className="text-muted-foreground mr-2">3.</span> Press <strong>Ctrl+V</strong> (or Cmd+V) to paste.</div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end mt-4">
            <Button
              type="button"
              onClick={() => {
                window.open("https://gemini.google.com/", "_blank");
                setDialogOpen(false);
              }}
            >
              Open Gemini
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
