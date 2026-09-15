"use client";

import * as React from "react";
import { ChevronsUpDown, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { INDUSTRIES, resolveIndustry } from "@/lib/taxonomy/resolve";
import type { CanonicalIndustry, ResolveResult } from "@/lib/taxonomy/types";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

/**
 * The industry combobox — the direct fix for F-02.
 *
 * Their picker: 287 raw options, never closes on Escape or outside click,
 * no ARIA, and the open list covers the submit button.
 * This one: canonical entries grouped by sector with NAICS codes inline,
 * full keyboard support (↑ ↓ Enter Esc via cmdk), closes on Escape /
 * outside click / blur / selection (Radix), and renders in a portal with
 * collision detection so it can never cover the submit button.
 */

const RECENTS_KEY = "industry-recents";

function loadRecents(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveRecent(id: string) {
  try {
    const next = [id, ...loadRecents().filter((r) => r !== id)].slice(0, 4);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {}
}

const SECTOR_ORDER = [
  "Software & IT",
  "Vertical SaaS",
  "Data & Infrastructure",
  "Commerce & Distribution",
  "Professional Services",
];

export function IndustryPicker({
  value,
  onSelect,
  id,
}: {
  value: CanonicalIndustry | null;
  /** resolution is present when the choice came from free-text resolving */
  onSelect: (industry: CanonicalIndustry, resolution?: ResolveResult) => void;
  id?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [recents, setRecents] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (open) setRecents(loadRecents());
  }, [open]);

  const choose = React.useCallback(
    (industry: CanonicalIndustry, resolution?: ResolveResult) => {
      saveRecent(industry.id);
      onSelect(industry, resolution);
      setOpen(false); // closes on selection — one of the four F-02 behaviours
      setQuery("");
    },
    [onSelect],
  );

  // Free-text resolution for anything the list filter doesn't surface —
  // typos included. Computed live so CommandEmpty can offer real options.
  const resolution = React.useMemo(
    () => (query.trim() ? resolveIndustry(query) : null),
    [query],
  );

  const bySector = React.useMemo(() => {
    const groups = new Map<string, CanonicalIndustry[]>();
    for (const ind of INDUSTRIES) {
      if (!groups.has(ind.sector)) groups.set(ind.sector, []);
      groups.get(ind.sector)!.push(ind);
    }
    return SECTOR_ORDER.filter((s) => groups.has(s)).map(
      (s) => [s, groups.get(s)!] as const,
    );
  }, []);

  const recentIndustries = recents
    .map((rid) => INDUSTRIES.find((i) => i.id === rid))
    .filter(Boolean) as CanonicalIndustry[];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          className={cn(
            "h-10 w-full justify-between bg-surface px-3 font-normal",
            !value && "text-text-3",
          )}
        >
          {value ? (
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate">{value.label}</span>
              <span className="shrink-0 rounded-sm bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-text-2 tnum">
                {value.naicsCode}
              </span>
            </span>
          ) : (
            "e.g. computer software"
          )}
          <ChevronsUpDown className="size-4 shrink-0 text-text-3" aria-hidden />
        </Button>
      </PopoverTrigger>
      {/* Portal + collision detection: physically cannot cover the submit button (F-02) */}
      <PopoverContent
        className="w-[--radix-popover-trigger-width] min-w-[340px] p-0"
        align="start"
        collisionPadding={12}
      >
        <Command shouldFilter>
          <CommandInput
            placeholder="Type an industry — typos welcome"
            value={query}
            onValueChange={setQuery}
          />
          {/* Resolver row — pinned above cmdk's filtered list so typo input
              always gets a first-class answer, not just loose text matches. */}
          {resolution && query.trim() && resolution.method !== "exact-label" && (
            <div className="border-b px-2 py-2">
              {resolution.match && resolution.band !== "low" ? (
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-md border border-brand-500/50 bg-brand-50/40 px-3 py-2 text-sm font-medium hover:bg-brand-50 dark:bg-brand-50/20"
                  onClick={() => choose(resolution.match!, resolution)}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Sparkles className="size-4 shrink-0 text-brand-600" aria-hidden />
                    <span className="truncate">{resolution.match.label}</span>
                    {resolution.corrections.length > 0 && (
                      <span className="hidden shrink-0 rounded-sm bg-conf-med-subtle px-1.5 py-0.5 font-mono text-[11px] text-conf-med sm:inline">
                        {resolution.corrections.join(" · ")}
                      </span>
                    )}
                  </span>
                  <span className="ml-2 shrink-0 font-mono text-xs text-text-2 tnum">
                    {resolution.confidence}%
                  </span>
                </button>
              ) : (
                <p className="px-2 py-1 text-sm text-conf-low">
                  No confident match for{" "}
                  <span className="font-mono text-xs">&quot;{query}&quot;</span>. A search
                  would be blocked rather than guessed.
                </p>
              )}
            </div>
          )}
          <CommandList className="max-h-72">
            <CommandEmpty className="p-0">
              <div className="px-4 py-3 text-left">
                <p className="text-sm text-text-2">
                  Nothing in the list matches{" "}
                  <span className="font-mono">&quot;{query}&quot;</span>
                  {resolution && resolution.alternatives.length > 0
                    ? ". Closest:"
                    : "."}
                </p>
                {resolution && resolution.alternatives.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {resolution.alternatives.map((alt) => (
                      <li key={alt.industry.id}>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm hover:bg-accent"
                          onClick={() => choose(alt.industry)}
                        >
                          <span>{alt.industry.label}</span>
                          <span className="font-mono text-xs text-text-3 tnum">
                            {alt.confidence}%
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CommandEmpty>

            {recentIndustries.length > 0 && !query && (
              <>
                <CommandGroup heading="Recent">
                  {recentIndustries.map((ind) => (
                    <CommandItem
                      key={`recent-${ind.id}`}
                      value={`recent ${ind.label}`}
                      onSelect={() => choose(ind)}
                    >
                      <span className="flex-1 truncate">{ind.label}</span>
                      <span className="font-mono text-xs text-text-3 tnum">
                        {ind.naicsCode}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {bySector.map(([sector, industries]) => (
              <CommandGroup key={sector} heading={sector}>
                {industries.map((ind) => (
                  <CommandItem
                    key={ind.id}
                    value={`${ind.label} ${ind.aliases.slice(0, 6).join(" ")}`}
                    onSelect={() => choose(ind)}
                  >
                    <Check
                      className={cn(
                        "size-4",
                        value?.id === ind.id ? "opacity-100" : "opacity-0",
                      )}
                      aria-hidden
                    />
                    <span className="flex-1 truncate">{ind.label}</span>
                    <span className="font-mono text-xs text-text-3 tnum">
                      {ind.naicsCode}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
