"use client";

import * as React from "react";
import { resolveIndustry, TAXONOMY } from "@/lib/taxonomy/resolve";
import { PageHeader } from "@/components/page-header";
import { BandPill } from "@/components/resolver/band-pill";
import { DerivationChain } from "@/components/resolver/derivation-chain";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

// Their real production strings (captured 2026-09-15) plus one nonsense
// input — so the refuse-to-guess behaviour is one click away, not a secret.
const EXAMPLES = [
  "computr software",
  "Busines software",
  "Verical Saas – Landscaping Software",
  "Legalattorney",
  "lawnkare softwear",
];

export default function PlaygroundPage() {
  const [query, setQuery] = React.useState("computr software");
  const result = React.useMemo(() => resolveIndustry(query), [query]);
  const m = TAXONOMY.metrics;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Resolver playground"
        description="Type any industry — including their production typos — and watch it normalise, correct, resolve, and map to a real NAICS code. This exact engine powers the search."
      />

      <div className="space-y-2">
        <Label htmlFor="resolver-input">Industry phrase</Label>
        <Input
          id="resolver-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. computr software"
          className="h-11 font-mono text-base"
          autoComplete="off"
          spellCheck={false}
        />
        <div className="flex flex-wrap gap-2 pt-1" aria-label="Example queries">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setQuery(ex)}
              className="rounded-md border bg-surface px-2.5 py-1 font-mono text-xs text-text-2 transition-colors hover:border-brand-500 hover:text-foreground"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      <Card className="mt-6 shadow-lift">
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-3 pb-5">
            <BandPill band={result.band} confidence={result.confidence} />
            {result.match && result.band !== "low" && (
              <p className="text-sm">
                {result.band === "high" ? "Showing" : "Suggesting"}{" "}
                <span className="font-semibold">{result.match.label}</span>
                <span className="ml-2 font-mono text-xs text-text-3">
                  {result.match.sector}
                </span>
              </p>
            )}
            {result.band === "low" && (
              <p className="text-sm text-conf-low">
                Search would be blocked — not confident enough to guess.
              </p>
            )}
          </div>
          <DerivationChain result={result} />
        </CardContent>
      </Card>

      <p className="mt-4 font-mono text-xs text-text-3 tnum">
        Taxonomy: {m.rawStrings} raw production strings →{" "}
        {m.canonicalIndustries} canonical industries ·{" "}
        {m.caseDuplicatesCollapsed} case-duplicates collapsed ·{" "}
        {m.typosCorrected} typos corrected · 100% NAICS-mapped
      </p>
    </div>
  );
}
