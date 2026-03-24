import ContentCard from "@/components/ContentCard";

const kpis = [
  { label: "Pass rate", value: "92%", detail: "+4% this week" },
  { label: "Avg run time", value: "38s", detail: "Target under 45s" },
  { label: "Reject rate", value: "11%", detail: "Policy tuning active" }
];

const roiBars = [
  { day: "Mon", hours: 5 },
  { day: "Tue", hours: 4 },
  { day: "Wed", hours: 4 },
  { day: "Thu", hours: 4 },
  { day: "Fri", hours: 4 }
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header className="animate-reveal">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-mint">Operations Overview</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-white">Content Intelligence Dashboard</h1>
        <p className="mt-2 max-w-2xl text-slate-300">
          A bold, componentry-inspired control room for monitoring pipeline reliability and business impact.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {kpis.map((kpi, index) => (
          <ContentCard key={kpi.label} title={kpi.label} subtitle={`KPI-${index + 1}`}>
            <p className="font-display text-3xl text-white">{kpi.value}</p>
            <p className="mt-2 text-xs text-slate-300">{kpi.detail}</p>
          </ContentCard>
        ))}
      </section>

      <ContentCard title="ROI Time Shift" subtitle="5 days to 4 hours">
        <div className="grid grid-cols-5 gap-3">
          {roiBars.map((item, idx) => (
            <div key={item.day} className="flex flex-col items-center gap-2">
              <div className="flex h-36 w-full items-end rounded-xl border border-white/10 bg-black/20 p-2">
                <div
                  className="w-full rounded-md bg-gradient-to-t from-flare to-mint/70 animate-drift"
                  style={{ height: `${(6 - item.hours) * 18 + 20}%`, animationDelay: `${idx * 110}ms` }}
                />
              </div>
              <span className="font-mono text-xs text-slate-300">{item.day}</span>
            </div>
          ))}
        </div>
      </ContentCard>
    </div>
  );
}
