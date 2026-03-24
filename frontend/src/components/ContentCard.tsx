import type { ReactNode } from "react";

type ContentCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function ContentCard({ title, subtitle, children }: ContentCardProps) {
  return (
    <section className="glass-panel animate-reveal rounded-2xl p-5 shadow-panel">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
        {subtitle ? <span className="font-mono text-xs text-mint">{subtitle}</span> : null}
      </div>
      <div className="text-sm text-slate-200">{children}</div>
    </section>
  );
}
