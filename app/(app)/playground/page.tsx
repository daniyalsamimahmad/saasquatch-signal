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
    <div className="max-w-6xl">
      <PageHeader
        title="Resolver playground"
        description="Type any industry, typos and all, and watch it resolve to a NAICS code."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(280px,380px)_1fr]">
        <div>
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
          </div>
          <p className="label-caps mt-4 mb-2">Try one of these</p>
          <div className="flex flex-wrap gap-2 lg:flex-col lg:items-start" aria-label="Example queries">
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
          <p className="mt-6 hidden font-mono text-xs text-text-3 tnum lg:block">
            {m.rawStrings} raw strings → {m.canonicalIndustries} canonical ·{" "}
            {m.typosCorrected} typos fixed · 100% NAICS-mapped
          </p>
        </div>

        <Card className="shadow-lift">
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
                  Too uncertain to apply. A real search would be blocked here.
                </p>
              )}
            </div>
            <DerivationChain result={result} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
