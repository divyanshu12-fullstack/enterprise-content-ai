import ComplianceBadge from "@/components/ComplianceBadge";
import ContentCard from "@/components/ContentCard";

export default function ApprovalPage() {
  return (
    <div className="space-y-6">
      <header className="animate-reveal">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-mint">Human In The Loop</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-white">Approval Queue</h1>
      </header>

      <ContentCard title="Compliance Review" subtitle="Deterministic status">
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-sm text-slate-200">No blocked language detected in this placeholder response.</p>
          <ComplianceBadge status="APPROVED" />
        </div>
      </ContentCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ContentCard title="LinkedIn Preview" subtitle="3 paragraph format">
          <p>
            Enterprise teams are adopting AI content operations to reduce campaign lead times while improving governance and consistency.
          </p>
          <p className="mt-3">
            Structured agent pipelines provide transparent checkpoints for research, writing, compliance, and visual strategy across channels.
          </p>
          <p className="mt-3">Review your current workflow and start with one pilot process this quarter to unlock measurable productivity gains.</p>
        </ContentCard>

        <ContentCard title="X/Twitter Preview" subtitle="<= 280 chars">
          <p>
            AI content pipelines are moving from experimentation to operations. With structured stages and compliance gating, teams ship faster,
            safer, and with clearer ROI. Start one pilot workflow this quarter.
          </p>
        </ContentCard>
      </div>

      <div className="flex flex-wrap gap-3">
        <button className="rounded-xl bg-gradient-to-r from-mint to-flare px-4 py-2 font-semibold text-ink">Publish to Channels</button>
        <button className="rounded-xl border border-rose-400/60 bg-rose-500/10 px-4 py-2 font-semibold text-rose-200">Reject / Rewrite</button>
      </div>
    </div>
  );
}
