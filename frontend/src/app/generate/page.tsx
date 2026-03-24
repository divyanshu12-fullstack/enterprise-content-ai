import ContentCard from "@/components/ContentCard";

const stages = ["INIT", "RESEARCH", "WRITING", "COMPLIANCE", "VISUAL", "FINALIZE"];

export default function GeneratePage() {
    return (
        <div className="space-y-6">
            <header className="animate-reveal">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-mint">Pipeline Input</p>
                <h1 className="mt-2 font-display text-3xl font-semibold text-white">Generate Multi-Channel Content</h1>
            </header>

            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                <ContentCard title="Request Details" subtitle="Ready for API in Phase 4">
                    <form className="space-y-4">
                        <label className="block text-sm">
                            <span className="mb-2 block text-slate-200">Topic</span>
                            <input
                                placeholder="Example: AI in healthcare operations"
                                className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-white outline-none transition focus:border-mint/70"
                            />
                        </label>
                        <label className="block text-sm">
                            <span className="mb-2 block text-slate-200">Audience</span>
                            <input
                                placeholder="Example: Enterprise innovation leaders"
                                className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-white outline-none transition focus:border-mint/70"
                            />
                        </label>
                        <button
                            type="button"
                            className="rounded-xl bg-gradient-to-r from-flare to-mint px-4 py-2 font-semibold text-ink transition hover:scale-[1.01]"
                        >
                            Start Generation
                        </button>
                    </form>
                </ContentCard>

                <ContentCard title="Live Stage Preview" subtitle="Rotating status shell">
                    <ul className="space-y-2">
                        {stages.map((stage, index) => (
                            <li
                                key={stage}
                                className="animate-reveal rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-xs tracking-wide text-slate-200"
                                style={{ animationDelay: `${index * 90}ms` }}
                            >
                                {stage}
                            </li>
                        ))}
                    </ul>
                    <p className="mt-4 text-xs text-slate-300">Duration meter and backend stream will be connected in the next phase.</p>
                </ContentCard>
            </div>
        </div>
    );
}
