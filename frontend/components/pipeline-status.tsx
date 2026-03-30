"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Loader2, Lock } from "lucide-react";

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
  progressMessage?: string;
  errorMessage?: string | null;
  onReset?: () => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export function PipelineStatus({
  isRunning,
  currentStage,
  stageElapsed,
  progressMessage,
  errorMessage,
  onReset,
}: PipelineStatusProps) {
  if (!isRunning) return null;

  const isHalted = Boolean(errorMessage);
  const isComplete = currentStage >= agents.length;
  const currentActionText = isHalted
    ? "Pipeline halted"
    : progressMessage || (isComplete ? "Generation complete" : agents[currentStage]?.subtitle || "Finalizing...");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className={cn(
          "w-full max-w-3xl rounded-2xl border p-8 shadow-2xl",
          isHalted ? "border-red-500/40 bg-[#120707]" : "border-zinc-800/60 bg-[#0a0a0a]"
        )}
      >

        {/* Header Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Generating Package</h2>
          <p className={cn("text-sm", isHalted ? "text-red-300" : "text-zinc-400")}>{currentActionText}</p>
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
                    completed ? "bg-[#4ade80]" : current && !isHalted ? "bg-white" : current && isHalted ? "bg-red-400" : "bg-transparent"
                  )}
                  style={{ width: completed || current ? "100%" : "0%" }}
                />
              </div>
            );
          })}
        </div>

        {isHalted ? (
          <div className="rounded-2xl border border-red-500/50 bg-red-950/30 p-6 text-center">
            <div className="mb-3 flex justify-center">
              <AlertTriangle className="h-10 w-10 text-red-400" />
            </div>
            <h3 className="text-3xl font-semibold text-red-300">Pipeline Halted</h3>
            <p className="mt-3 text-base text-red-200/90">{errorMessage}</p>
            <Button
              variant="outline"
              className="mt-6 h-12 w-full border-red-500 text-red-200 hover:bg-red-500 hover:text-white"
              onClick={onReset}
            >
              Modify Topic & Try Again
            </Button>
          </div>
        ) : null}

        {/* Agents List */}
        <div className={cn("space-y-3", isHalted && "mt-6")}>
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
                  {isActive ? <span>{formatTime(stageElapsed)}</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
