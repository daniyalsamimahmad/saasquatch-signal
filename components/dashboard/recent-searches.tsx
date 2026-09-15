import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { INDUSTRIES } from "@/lib/taxonomy/resolve";
import { BandPill } from "@/components/resolver/band-pill";

const industryById = new Map(INDUSTRIES.map((i) => [i.id, i]));

type SearchRow = {
  query: string;
  resolvedIndustryId: string | null;
  confidence: number | null;
  band: string | null;
  resultCount: number;
  createdAt: string;
};

function rerunHref(row: SearchRow): string {
  if (!row.resolvedIndustryId) return "/find";
  return `/find/results?q=${encodeURIComponent(row.query)}&i=${row.resolvedIndustryId}`;
}

export function RecentSearches({ searches }: { searches: SearchRow[] }) {
  if (searches.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-text-2">
        Your searches will show up here, each with its confidence score.
      </p>
    );
  }

  return (
    <ul className="divide-y">
      {searches.map((row, index) => {
        const industry = row.resolvedIndustryId
          ? industryById.get(row.resolvedIndustryId)
          : null;
        return (
          <li key={index}>
            <Link
              href={rerunHref(row)}
              className="group flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 transition-colors hover:bg-surface-2/50"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-mono text-sm">
                  &quot;{row.query}&quot;
                </span>
                <span className="block truncate text-xs text-text-3">
                  {industry
                    ? `→ ${industry.label} · ${row.resultCount} results`
                    : "blocked at low confidence"}
                </span>
              </span>
              {row.band && row.confidence !== null && (
                <BandPill
                  band={row.band as "high" | "medium" | "low"}
                  confidence={row.confidence}
                  className="px-2 py-0.5 text-xs"
                />
              )}
              <RotateCcw
                className="size-3.5 text-text-3 opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
