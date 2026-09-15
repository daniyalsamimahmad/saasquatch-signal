"use client";

import * as React from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Facets, FacetEntry } from "@/lib/types";
import { useFilters } from "./use-filters";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

const SENIORITY_LABEL: Record<string, string> = {
  owner: "Owner",
  founder: "Founder",
  c_suite: "C-suite",
  vp: "VP",
  director: "Director",
  manager: "Manager",
  senior: "Senior IC",
  entry: "Entry",
};

const EMPLOYEE_RANGES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];

const EMAIL_STATUSES = [
  { value: "verified", label: "Verified" },
  { value: "guessed", label: "Guessed" },
  { value: "unavailable", label: "No email" },
];

function Section({
  title,
  activeCount,
  defaultOpen = false,
  children,
}: {
  title: string;
  activeCount: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="border-b py-1 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 py-2 text-sm font-medium"
      >
        <span className="flex-1 text-left">{title}</span>
        {activeCount > 0 && (
          <span className="rounded-full bg-brand-500 px-1.5 py-px font-mono text-[10px] font-semibold text-white tnum">
            {activeCount}
          </span>
        )}
        <ChevronDown
          className={cn("size-4 text-text-3 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open && <div className="space-y-1 pb-3">{children}</div>}
    </div>
  );
}

function CheckboxList({
  entries,
  paramKey,
  labelMap,
  searchable,
}: {
  entries: FacetEntry[];
  paramKey: string;
  labelMap?: Record<string, string>;
  searchable?: boolean;
}) {
  const { params, toggle } = useFilters();
  const selected = params.getAll(paramKey);
  const [filter, setFilter] = React.useState("");
  const shown = filter.trim()
    ? entries.filter((e) => e.value.toLowerCase().includes(filter.trim().toLowerCase()))
    : entries.slice(0, 12);

  return (
    <>
      {searchable && entries.length > 12 && (
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter…"
          className="mb-1.5 h-7 text-xs"
        />
      )}
      {shown.map((entry) => {
        const id = `${paramKey}-${entry.value}`;
        return (
          <label
            key={entry.value}
            htmlFor={id}
            className="flex cursor-pointer items-center gap-2 rounded-sm px-1 py-1 text-sm text-text-2 hover:bg-surface-2/60"
          >
            <Checkbox
              id={id}
              checked={selected.includes(entry.value)}
              onCheckedChange={() => toggle(paramKey, entry.value)}
            />
            <span className="min-w-0 flex-1 truncate">
              {labelMap?.[entry.value] ?? entry.value}
            </span>
            <span className="font-mono text-[11px] text-text-3 tnum">{entry.count}</span>
          </label>
        );
      })}
      {shown.length === 0 && (
        <p className="px-1 py-1 text-xs text-text-3">No match.</p>
      )}
    </>
  );
}

export function FilterRail({ tab, facets }: { tab: "people" | "companies"; facets: Facets }) {
  const { params, set, clearAll, activeCount } = useFilters();
  const employees = params.get("employees");

  return (
    <aside className="w-full shrink-0 lg:w-60">
      <div className="flex items-center justify-between pb-1">
        <p className="label-caps">Filters</p>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={clearAll}>
            <X className="size-3" aria-hidden />
            Clear all
          </Button>
        )}
      </div>

      {tab === "people" && (
        <>
          <Section title="Job title" activeCount={params.getAll("titles").length} defaultOpen>
            <TitleFilter />
          </Section>
          <Section title="Seniority" activeCount={params.getAll("seniorities").length} defaultOpen>
            <CheckboxList
              entries={facets.seniorities}
              paramKey="seniorities"
              labelMap={SENIORITY_LABEL}
            />
          </Section>
          <Section title="Department" activeCount={params.getAll("departments").length}>
            <CheckboxList entries={facets.departments} paramKey="departments" />
          </Section>
          <Section title="Email status" activeCount={params.getAll("emailStatus").length}>
            {EMAIL_STATUSES.map((status) => (
              <EmailStatusCheckbox key={status.value} {...status} />
            ))}
          </Section>
        </>
      )}

      <Section title="Industry" activeCount={params.getAll("industries").length} defaultOpen={tab === "companies"}>
        <CheckboxList entries={facets.industries} paramKey="industries" searchable />
      </Section>
      <Section title="Location" activeCount={params.getAll("locations").length}>
        <CheckboxList entries={facets.locations} paramKey="locations" searchable />
      </Section>
      <Section title="Company size" activeCount={employees ? 1 : 0}>
        <div className="flex flex-wrap gap-1.5 px-1">
          {EMPLOYEE_RANGES.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => set("employees", employees === range ? undefined : range)}
              className={cn(
                "rounded-full border px-2.5 py-1 font-mono text-xs tnum transition-colors",
                employees === range
                  ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-50/10 dark:text-brand-500"
                  : "text-text-2 hover:bg-surface-2",
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </Section>
      <Section title="Technology" activeCount={params.getAll("tech").length}>
        <CheckboxList entries={facets.tech} paramKey="tech" searchable />
      </Section>
    </aside>
  );
}

/** Free-text title chips: type, press Enter, chip lands in the URL. */
function TitleFilter() {
  const { params, toggle } = useFilters();
  const titles = params.getAll("titles");
  const [draft, setDraft] = React.useState("");

  const add = () => {
    const value = draft.trim();
    if (!value || titles.includes(value)) return;
    toggle("titles", value);
    setDraft("");
  };

  return (
    <div className="px-1">
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
        placeholder="e.g. CTO — press Enter"
        className="h-8 text-sm"
      />
      {titles.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {titles.map((title) => (
            <button
              key={title}
              type="button"
              onClick={() => toggle("titles", title)}
              className="flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700 hover:bg-brand-100 dark:bg-brand-50/10 dark:text-brand-500"
            >
              {title}
              <X className="size-3" aria-hidden />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EmailStatusCheckbox({ value, label }: { value: string; label: string }) {
  const { params, toggle } = useFilters();
  const selected = params.getAll("emailStatus");
  const id = `emailStatus-${value}`;
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-2 rounded-sm px-1 py-1 text-sm text-text-2 hover:bg-surface-2/60"
    >
      <Checkbox
        id={id}
        checked={selected.includes(value)}
        onCheckedChange={() => toggle("emailStatus", value)}
      />
      {label}
    </label>
  );
}
