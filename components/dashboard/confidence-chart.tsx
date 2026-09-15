import { CircleCheck, TriangleAlert, OctagonX } from "lucide-react";

/**
 * Distribution of recent search confidence by band — a metric that cannot
 * exist in their product, because their search never measures confidence.
 * Status colours only, never colour alone: every column carries an icon,
 * a label, and a count.
 */
export function ConfidenceChart({
  distribution,
}: {
  distribution: { low: number; medium: number; high: number };
}) {
  const columns = [
    {
      key: "low",
      label: "Blocked",
      sub: "< 60%",
      n: distribution.low,
      icon: OctagonX,
      bar: "bg-conf-low",
      text: "text-conf-low",
    },
    {
      key: "medium",
      label: "Flagged",
      sub: "60–84%",
      n: distribution.medium,
      icon: TriangleAlert,
      bar: "bg-conf-med",
      text: "text-conf-med",
    },
    {
      key: "high",
      label: "Confident",
      sub: "≥ 85%",
      n: distribution.high,
      icon: CircleCheck,
      bar: "bg-conf-high",
      text: "text-conf-high",
    },
  ] as const;

  const max = Math.max(1, ...columns.map((c) => c.n));
  const total = columns.reduce((sum, c) => sum + c.n, 0);

  if (total === 0) {
    return (
      <p className="py-8 text-center text-sm text-text-2">
        Run a few searches and the confidence distribution appears here.
      </p>
    );
  }

  return (
    <div>
      <div
        className="flex h-36 items-end justify-around gap-4 px-2"
        role="img"
        aria-label={`Search confidence distribution: ${columns
          .map((c) => `${c.label} ${c.n}`)
          .join(", ")}`}
      >
        {columns.map((col) => (
          <div key={col.key} className="flex w-full max-w-24 flex-col items-center gap-1">
            <span className="font-mono text-sm font-medium tnum">{col.n}</span>
            <div className="flex h-24 w-full items-end rounded-sm bg-surface-2/60">
              {col.n > 0 && (
                <div
                  className={`w-full rounded-[4px] ${col.bar}`}
                  style={{ height: `${Math.max(6, (col.n / max) * 100)}%` }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-around gap-4 px-2">
        {columns.map((col) => {
          const Icon = col.icon;
          return (
            <div key={col.key} className="flex w-full max-w-24 flex-col items-center">
              <span className={`inline-flex items-center gap-1 text-xs font-medium ${col.text}`}>
                <Icon className="size-3.5" aria-hidden />
                {col.label}
              </span>
              <span className="font-mono text-[11px] text-text-3 tnum">{col.sub}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
