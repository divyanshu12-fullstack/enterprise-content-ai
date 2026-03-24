"use client"

import { Linkedin, Twitter, Globe, MoreHorizontal, Copy, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ContentPreviewProps {
  platform: "linkedin" | "twitter"
  content: string
  username?: string
  timestamp?: string
  className?: string
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
}

export function ContentPreview({
  platform,
  content,
  username,
  timestamp = "Just now",
  className,
}: ContentPreviewProps) {
  const config = platformConfig[platform]
  const Icon = config.icon
  const isOverLimit = config.maxChars && content.length > config.maxChars

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
  }

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
  )
}

interface ImagePreviewProps {
  prompt: string
  className?: string
}

export function ImagePreview({ prompt, className }: ImagePreviewProps) {
  // Generate Pollinations URL from prompt
  const encodedPrompt = encodeURIComponent(prompt)
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=600&nologo=true`

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-medium text-foreground">Generated Visual</span>
        <Button variant="ghost" size="sm" className="h-7 text-xs">
          <ExternalLink className="mr-1.5 h-3 w-3" />
          Open full size
        </Button>
      </div>
      <div className="relative aspect-video bg-secondary">
        <img
          src={imageUrl}
          alt="AI-generated content visual"
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="border-t border-border p-4">
        <p className="text-xs font-medium text-muted-foreground mb-2">Image Prompt</p>
        <p className="text-sm text-foreground line-clamp-3">{prompt}</p>
      </div>
    </div>
  )
}
