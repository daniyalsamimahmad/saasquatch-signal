"use client";

import Link from "next/link";
import { HelpCircle, Pencil, Info } from "lucide-react";
import type { ResolveResult } from "@/lib/taxonomy/types";
import type { CanonicalIndustry } from "@/lib/taxonomy/types";
import { TAXONOMY } from "@/lib/taxonomy/resolve";
import { BandPill } from "./band-pill";
import { DerivationChain } from "./derivation-chain";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * The match transparency panel — always visible above results (spec §7.2.3).
 * Their product hides what it matched; this component *is* the thesis.
 */
export function TransparencyPanel({
  resolution,
  applied,
  keywordOnly,
  changeHref,
}: {
  resolution: ResolveResult;
  /** the industry actually used for the query (user may have overridden) */
  applied: CanonicalIndustry | null;
  /** true when the low-band escape hatch ran a keyword-only search */
  keywordOnly?: boolean;
  changeHref: string;
}) {
  const m = TAXONOMY.metrics;

  return (
    <section
      aria-label="Match transparency"
      className="rounded-lg border bg-card p-4 shadow-lift sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {keywordOnly ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-conf-med-subtle px-2.5 py-1 text-sm font-medium text-conf-med">
              <Info className="size-4" aria-hidden />
              Keyword search — no industry filter applied
            </span>
          ) : (
            <BandPill band={resolution.band} confidence={resolution.confidence} />
          )}
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href={changeHref}>
            <Pencil className="size-3.5" aria-hidden />
            Change
          </Link>
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1">
        {applied ? (
          <>
            <p className="text-lg font-semibold">
              Showing <span className="text-brand-600">{applied.label}</span>
            </p>
            <p className="font-mono text-sm text-text-2 tnum">
              NAICS {applied.naicsCode} · {applied.naicsTitle}
            </p>
          </>
        ) : (
          <p className="text-lg font-semibold">
            Matching <span className="font-mono">&quot;{resolution.query.trim()}&quot;</span>{" "}
            against names, descriptions and raw industry strings
          </p>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-text-2">
        {applied &&
          resolution.query.trim().toLowerCase() !== applied.label.toLowerCase() && (
            <span>
              matched from{" "}
              <span className="font-mono text-xs">
                &quot;{resolution.query.trim()}&quot;
              </span>
              {resolution.corrections.length > 0 && (
                <span className="ml-1.5 rounded-sm bg-conf-med-subtle px-1.5 py-0.5 font-mono text-xs text-conf-med">
                  {resolution.corrections.join(" · ")}
                </span>
              )}
            </span>
          )}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-brand-600 underline-offset-4 hover:underline"
            >
              <HelpCircle className="size-3.5" aria-hidden />
              Why this match?
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[420px] max-w-[92vw]" align="start" collisionPadding={12}>
            <DerivationChain result={resolution} />
          </PopoverContent>
        </Popover>
      </div>

      <p className="mt-4 border-t pt-3 font-mono text-xs text-text-3 tnum">
        Taxonomy: {m.rawStrings} raw production strings → {m.canonicalIndustries}{" "}
        canonical · {m.caseDuplicatesCollapsed} case-dupes collapsed ·{" "}
        {m.typosCorrected} typos corrected · 100% NAICS-mapped
      </p>
    </section>
  );
}
