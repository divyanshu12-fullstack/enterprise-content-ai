"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, Lock } from "lucide-react";

const agents = [
  {
    id: "research",
    title: "Research Agent",
    subtitle: "Research signals",
  },
  {
    id: "writer",
    title: "Writer Agent",
    subtitle: "Write platform drafts",
  },
  {
    id: "governance",
    title: "Governance Agent",
    subtitle: "Compliance checks",
  },
  {
    id: "visual",
    title: "Visual Agent",
    subtitle: "Visual prompt generation",
  },
];

interface PipelineStatusProps {
  isRunning: boolean;
  currentStage: number;
  stageElapsed: number;
}

export function PipelineStatus({ isRunning, currentStage, stageElapsed }: PipelineStatusProps) {
  if (!isRunning) return null;

  const isComplete = currentStage >= agents.length;
  const currentActionText = isComplete ? "Generation complete" : agents[currentStage]?.subtitle || "Finalizing...";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-800/60 bg-[#0a0a0a] p-8 shadow-2xl">

        {/* Header Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Generating Package</h2>
          <p className="text-sm text-zinc-400">{currentActionText}</p>
        </div>

        {/* Progress Bars */}
        <div className="flex gap-2 mb-8">
          {agents.map((_, idx) => {
            const completed = idx < currentStage;
            const current = idx === currentStage;
            return (
              <div key={idx} className="h-2 flex-1 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    completed ? "bg-[#4ade80]" : current ? "bg-white" : "bg-transparent"
                  )}
                  style={{ width: completed || current ? "100%" : "0%" }}
                />
              </div>
            );
          })}
        </div>

        {/* Agents List */}
        <div className="space-y-3">
          {agents.map((agent, index) => {
            const isActive = index === currentStage;
            const isFinished = index < currentStage;

            return (
              <div
                key={agent.id}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-4 transition-all duration-300",
                  isFinished
                    ? "border-[#4ade80]/30 bg-transparent"
                    : isActive
                      ? "border-zinc-600 bg-zinc-900/30"
                      : "border-zinc-800 bg-transparent opacity-50"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex shrink-0 items-center justify-center",
                    isFinished ? "text-[#4ade80]" : isActive ? "text-zinc-300" : "text-zinc-600"
                  )}>
                    {isActive ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : isFinished ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Lock className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <h3 className={cn(
                      "font-semibold text-sm",
                      isFinished ? "text-[#4ade80]" : isActive ? "text-zinc-200" : "text-zinc-400"
                    )}>
                      {agent.title}
                    </h3>
                    <p className={cn(
                      "text-xs mt-0.5",
                      isFinished ? "text-[#4ade80]/80" : "text-zinc-500"
                    )}>
                      {agent.subtitle}
                    </p>
                  </div>
                </div>

                {/* Duration */}
                <div className={cn(
                  "font-mono text-sm",
                  isFinished ? "text-[#4ade80]" : isActive ? "text-zinc-400" : "text-zinc-600"
                )}>
                  {isActive ? <span>0:{stageElapsed.toString().padStart(2, "0")}</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
