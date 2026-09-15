import Link from "next/link";
import { INDUSTRIES } from "@/lib/taxonomy/resolve";

const industryById = new Map(INDUSTRIES.map((i) => [i.id, i]));

/**
 * Industry mix of saved leads — a ranked bar list. One hue for all bars
 * (identity lives in the row label, magnitude in the length); their version
 * of this chart is unreadable because the taxonomy is dirty. Ours is clean
 * *because* of the resolver — which is the point of showing it.
 */
export function IndustryMix({
  mix,
}: {
  mix: Array<{ industryId: string; n: number }>;
}) {
  if (mix.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-text-2">
        Save companies to a list and the mix appears here.{" "}
        <Link href="/find" className="text-brand-600 underline-offset-4 hover:underline">
          Start a search
        </Link>
      </p>
    );
  }

  const max = Math.max(...mix.map((m) => m.n));

  return (
    <ul className="space-y-2.5">
      {mix.map((entry) => {
        const industry = industryById.get(entry.industryId);
        const label = industry?.label ?? entry.industryId;
        return (
          <li key={entry.industryId} title={`${label} — ${entry.n} saved`}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate">{label}</span>
              <span className="font-mono text-xs text-text-2 tnum">{entry.n}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-surface-2">
              <div
                className="h-2 rounded-full bg-brand-600 dark:bg-brand-500"
                style={{ width: `${Math.max(4, (entry.n / max) * 100)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
