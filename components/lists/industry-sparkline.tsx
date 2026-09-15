import { INDUSTRIES } from "@/lib/taxonomy/resolve";

const industryById = new Map(INDUSTRIES.map((i) => [i.id, i]));
const CHART_VARS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

/** Proportional industry-mix bar — clean because the taxonomy is clean. */
export function IndustrySparkline({
  mix,
  total,
}: {
  mix: Array<{ industryId: string; n: number }>;
  total: number;
}) {
  if (total === 0 || mix.length === 0) {
    return <div className="h-1.5 rounded-full bg-surface-2" aria-hidden />;
  }
  const shown = mix.reduce((sum, m) => sum + m.n, 0);
  const label = mix
    .map(
      (m) =>
        `${industryById.get(m.industryId)?.label ?? m.industryId}: ${m.n}`,
    )
    .join(", ");
  return (
    <div
      className="flex h-1.5 w-full gap-px overflow-hidden rounded-full"
      role="img"
      aria-label={`Industry mix — ${label}`}
    >
      {mix.map((m, idx) => (
        <div
          key={m.industryId}
          style={{
            width: `${(m.n / total) * 100}%`,
            background: CHART_VARS[idx % CHART_VARS.length],
          }}
        />
      ))}
      {shown < total && (
        <div className="flex-1 bg-surface-2" aria-hidden />
      )}
    </div>
  );
}
