"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, SlidersHorizontal, ChevronDown, OctagonX } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveIndustry } from "@/lib/taxonomy/resolve";
import type { CanonicalIndustry, ResolveResult } from "@/lib/taxonomy/types";
import type { Metro } from "@/lib/metros";
import { EMPLOYEE_PRESETS, REVENUE_BANDS } from "@/lib/metros";
import { IndustryPicker } from "./industry-picker";
import { LocationPicker } from "./location-picker";
import { BandPill } from "@/components/resolver/band-pill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Their real production strings — the differentiators must fire without the
// reviewer having to invent a typo (one is nonsense, to show the refusal).
const EXAMPLE_CHIPS = [
  { text: "computr software", hint: "typo → corrected" },
  { text: "Verical Saas – Landscaping Software", hint: "their shipped typo" },
  { text: "lawnkare softwear", hint: "watch it refuse" },
];

export function SearchForm() {
  const router = useRouter();
  const [industry, setIndustry] = React.useState<CanonicalIndustry | null>(null);
  const [resolution, setResolution] = React.useState<ResolveResult | null>(null);
  const [location, setLocation] = React.useState<Metro | null>(null);
  const [refineOpen, setRefineOpen] = React.useState(false);
  const [employees, setEmployees] = React.useState<string>("any");
  const [revenue, setRevenue] = React.useState<string>("any");
  const [foundedMin, setFoundedMin] = React.useState("");
  const [foundedMax, setFoundedMax] = React.useState("");
  const [keyword, setKeyword] = React.useState("");
  const [blocked, setBlocked] = React.useState<ResolveResult | null>(null);
  const [touched, setTouched] = React.useState(false);

  const applyChip = (text: string) => {
    const result = resolveIndustry(text);
    if (result.band === "low") {
      // F-01: refuse to guess. Block with alternatives + escape hatch.
      setIndustry(null);
      setResolution(result);
      setBlocked(result);
    } else {
      setIndustry(result.match);
      setResolution(result);
      setBlocked(null);
    }
  };

  const params = (extra: Record<string, string>) => {
    const p = new URLSearchParams();
    if (location) {
      p.set("city", location.city);
      p.set("state", location.state);
    }
    if (employees !== "any") {
      const preset = EMPLOYEE_PRESETS[Number(employees)];
      p.set("emin", String(preset.min));
      p.set("emax", String(preset.max));
    }
    if (revenue !== "any") p.set("rev", revenue);
    if (foundedMin) p.set("fmin", foundedMin);
    if (foundedMax) p.set("fmax", foundedMax);
    if (keyword.trim()) p.set("kw", keyword.trim());
    for (const [k, v] of Object.entries(extra)) p.set(k, v);
    return p;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!industry || !location) return;
    const q = resolution ? resolution.query : industry.label;
    router.push(`/find/results?${params({ q, i: industry.id }).toString()}`);
  };

  const searchAnyway = () => {
    if (!blocked) return;
    // Honest escape hatch: no industry filter is applied — the results page
    // says so instead of quietly guessing (contrast with F-01).
    const p = params({ q: blocked.query, anyway: "1" });
    if (!p.get("kw")) p.set("kw", blocked.normalised.split(" ")[0] ?? "");
    router.push(`/find/results?${p.toString()}`);
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_auto] lg:items-end">
        <div className="space-y-2">
          <Label htmlFor="industry-picker">Industry</Label>
          <IndustryPicker
            id="industry-picker"
            value={industry}
            onSelect={(ind, res) => {
              setIndustry(ind);
              setResolution(res ?? null);
              setBlocked(null);
            }}
          />
          {touched && !industry && !blocked && (
            <p className="text-sm text-conf-low" role="alert">
              Pick an industry — or type anything and let the resolver match it.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="location-picker">Location</Label>
          <LocationPicker id="location-picker" value={location} onSelect={setLocation} />
          {touched && !location && (
            <p className="text-sm text-conf-low" role="alert">
              Pick a metro.
            </p>
          )}
        </div>
        <Button type="submit" size="lg" className="h-10">
          <SearchIcon className="size-4" aria-hidden />
          Find companies
        </Button>
      </div>

      {/* Resolution feedback — the resolver showing its work inline */}
      {resolution && industry && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm" aria-live="polite">
          <BandPill band={resolution.band} confidence={resolution.confidence} />
          {resolution.query.trim().toLowerCase() !== industry.label.toLowerCase() && (
            <span className="text-text-2">
              matched from{" "}
              <span className="font-mono text-xs">&quot;{resolution.query.trim()}&quot;</span>
              {resolution.corrections.length > 0 && (
                <span className="ml-1.5 rounded-sm bg-conf-med-subtle px-1.5 py-0.5 font-mono text-xs text-conf-med">
                  {resolution.corrections.join(" · ")}
                </span>
              )}
            </span>
          )}
          <button
            type="button"
            className="text-brand-600 underline-offset-4 hover:underline"
            onClick={() => {
              setIndustry(null);
              setResolution(null);
            }}
          >
            Change
          </button>
        </div>
      )}

      {/* F-01 fix, visible: low confidence blocks the search */}
      {blocked && (
        <div
          className="mt-3 rounded-lg border border-conf-low/40 bg-conf-low-subtle p-4"
          role="alert"
        >
          <div className="flex flex-wrap items-center gap-2">
            <OctagonX className="size-4 text-conf-low" aria-hidden />
            <p className="text-sm font-medium text-conf-low">
              Not confident enough to guess ({blocked.confidence}% for{" "}
              <span className="font-mono">&quot;{blocked.query.trim()}&quot;</span>) — search blocked.
            </p>
          </div>
          <p className="mt-2 text-sm text-text-2">
            Their app would return 150 wrong companies here. Pick what you meant instead:
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {blocked.alternatives.map((alt) => (
              <Button
                key={alt.industry.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIndustry(alt.industry);
                  setBlocked(null);
                }}
              >
                {alt.industry.label}
                <span className="font-mono text-xs text-text-3 tnum">{alt.confidence}%</span>
              </Button>
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={searchAnyway}>
              Search anyway (keyword only)
            </Button>
          </div>
        </div>
      )}

      {/* Example chips */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="label-caps">Try</span>
        {EXAMPLE_CHIPS.map((chip) => (
          <button
            key={chip.text}
            type="button"
            onClick={() => applyChip(chip.text)}
            className="group rounded-md border bg-surface px-2.5 py-1 font-mono text-xs text-text-2 transition-colors hover:border-brand-500 hover:text-foreground"
          >
            {chip.text}
            <span className="ml-1.5 hidden text-text-3 group-hover:inline">· {chip.hint}</span>
          </button>
        ))}
      </div>

      {/* Refine — collapsed by default so the primary path stays two fields */}
      <div className="mt-6 border-t pt-4">
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-medium text-text-2 hover:text-foreground"
          aria-expanded={refineOpen}
          onClick={() => setRefineOpen((v) => !v)}
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          Refine
          <ChevronDown
            className={cn("size-4 transition-transform", refineOpen && "rotate-180")}
            aria-hidden
          />
        </button>
        {refineOpen && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="employees">Employees</Label>
              <Select value={employees} onValueChange={setEmployees}>
                <SelectTrigger id="employees" className="w-full bg-surface">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any size</SelectItem>
                  {EMPLOYEE_PRESETS.map((preset, idx) => (
                    <SelectItem key={preset.label} value={String(idx)}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="revenue">Revenue band</Label>
              <Select value={revenue} onValueChange={setRevenue}>
                <SelectTrigger id="revenue" className="w-full bg-surface">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any revenue</SelectItem>
                  {REVENUE_BANDS.map((band) => (
                    <SelectItem key={band} value={band}>
                      {band}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="founded-min">Founded between</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="founded-min"
                  type="number"
                  inputMode="numeric"
                  placeholder="1990"
                  min={1980}
                  max={2026}
                  value={foundedMin}
                  onChange={(e) => setFoundedMin(e.target.value)}
                  className="tnum"
                />
                <span className="text-text-3">–</span>
                <Input
                  id="founded-max"
                  type="number"
                  inputMode="numeric"
                  placeholder="2024"
                  min={1980}
                  max={2026}
                  value={foundedMax}
                  onChange={(e) => setFoundedMax(e.target.value)}
                  className="tnum"
                  aria-label="Founded, latest year"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kw">Keyword</Label>
              <Input
                id="kw"
                placeholder="Matches name + description"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
