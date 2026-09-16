"use client";

import * as React from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { nlSearch } from "@/lib/actions/search-actions";
import { useFilters } from "./use-filters";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Natural-language search (Apollo pattern): describe the audience, the AI
 * turns it into the same filter state the rail uses — inspectable and
 * editable, never a black box.
 */
export function NlSearchBar({ tab }: { tab: "people" | "companies" }) {
  const { replaceAll } = useFilters();
  const [prompt, setPrompt] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const run = async () => {
    const text = prompt.trim();
    if (!text || busy) return;
    setBusy(true);
    const result = await nlSearch(text, tab);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    // Drop nulls and empty arrays; map employeesMin/Max onto the rail's
    // single "employees" range param.
    const { employeesMin, employeesMax, ...rest } = result.data as Record<string, unknown>;
    const entries: Record<string, string | string[] | number | undefined> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (value === null || value === undefined || value === "") continue;
      if (Array.isArray(value)) {
        if (value.length > 0) entries[key] = value.map(String);
      } else {
        entries[key] = String(value);
      }
    }
    const min = typeof employeesMin === "number" ? employeesMin : undefined;
    const max = typeof employeesMax === "number" ? employeesMax : undefined;
    if (min !== undefined || max !== undefined) {
      entries.employees = max !== undefined ? `${min ?? 1}-${max}` : `${min}+`;
    }
    const applied = Object.keys(entries).length;
    if (applied === 0) {
      toast.info("Couldn't map that to filters. Try naming a role, industry, or place.");
      return;
    }
    replaceAll(entries);
    toast.success(`Applied ${applied} filter${applied === 1 ? "" : "s"} from your prompt.`);
  };

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Sparkles className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-brand-500" aria-hidden />
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              run();
            }
          }}
          placeholder={
            tab === "people"
              ? 'Describe who you want, like "CTOs at 50-200 person fintech companies in Texas"'
              : 'Describe the companies, like "healthcare software companies in Austin using AWS"'
          }
          className="h-10 pl-9"
        />
      </div>
      <Button onClick={run} disabled={busy || !prompt.trim()} className="h-10">
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Search with AI"}
      </Button>
    </div>
  );
}
