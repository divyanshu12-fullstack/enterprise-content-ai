"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Search, PenTool, Shield, ImageIcon, CheckCircle2 } from "lucide-react"

const pipelineStages = [
  {
    id: "research",
    name: "Researcher Agent",
    description: "Gathering market trends and data...",
    icon: Search,
  },
  {
    id: "writing",
    name: "Writer Agent",
    description: "Crafting compelling content...",
    icon: PenTool,
  },
  {
    id: "compliance",
    name: "Brand Governance Agent",
    description: "Reviewing compliance rules...",
    icon: Shield,
  },
  {
    id: "visual",
    name: "Visual Agent",
    description: "Generating image prompts...",
    icon: ImageIcon,
  },
  {
    id: "complete",
    name: "Pipeline Complete",
    description: "All agents finished processing",
    icon: CheckCircle2,
  },
]

interface PipelineStatusProps {
  isRunning: boolean
  currentStage?: number
}

export function PipelineStatus({ isRunning, currentStage = 0 }: PipelineStatusProps) {
  const [displayStage, setDisplayStage] = useState(0)
  const [dots, setDots] = useState("")

  useEffect(() => {
    if (!isRunning) {
      setDisplayStage(0)
      return
    }

    const stageInterval = setInterval(() => {
      setDisplayStage((prev) => {
        if (prev < pipelineStages.length - 1) {
          return prev + 1
        }
        return prev
      })
    }, 3000)

    return () => clearInterval(stageInterval)
  }, [isRunning])

  useEffect(() => {
    if (!isRunning) {
      setDots("")
      return
    }

    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."))
    }, 500)

    return () => clearInterval(dotsInterval)
  }, [isRunning])

  const currentStageData = pipelineStages[currentStage ?? displayStage]
  const Icon = currentStageData.icon

  if (!isRunning) return null

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
            <Icon className="h-7 w-7 text-primary" />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {(currentStage ?? displayStage) + 1}
          </span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">
            {currentStageData.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {currentStageData.description}
            {isRunning && dots}
          </p>
        </div>
      </div>

      {/* Progress indicators */}
      <div className="mt-6 flex items-center gap-2">
        {pipelineStages.slice(0, -1).map((stage, index) => {
          const stageIndex = currentStage ?? displayStage
          const isComplete = index < stageIndex
          const isCurrent = index === stageIndex
          const StageIcon = stage.icon

          return (
            <div key={stage.id} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300",
                  isComplete && "bg-success text-success-foreground",
                  isCurrent && "bg-primary text-primary-foreground animate-pulse",
                  !isComplete && !isCurrent && "bg-secondary text-muted-foreground"
                )}
              >
                <StageIcon className="h-4 w-4" />
              </div>
              {index < pipelineStages.length - 2 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 rounded-full transition-all duration-500",
                    isComplete ? "bg-success" : "bg-border"
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
