"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Users, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Filters that apply to both tabs survive a tab switch. */
const SHARED_KEYS = ["q", "industries", "locations", "tech", "employees"];

export function FindTabs({
  tab,
  peopleTotal,
  companiesTotal,
}: {
  tab: "people" | "companies";
  peopleTotal?: number;
  companiesTotal?: number;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const switchTo = (next: "people" | "companies") => {
    if (next === tab) return;
    const kept = new URLSearchParams();
    if (next === "companies") kept.set("tab", "companies");
    for (const key of SHARED_KEYS) {
      for (const value of params.getAll(key)) kept.append(key, value);
    }
    router.push(`/find?${kept.toString()}`, { scroll: false });
  };

  const tabs = [
    { id: "people" as const, label: "People", icon: Users, total: peopleTotal },
    { id: "companies" as const, label: "Companies", icon: Building2, total: companiesTotal },
  ];

  return (
    <div className="mb-3 flex items-center gap-1 border-b">
      {tabs.map(({ id, label, icon: Icon, total }) => (
        <button
          key={id}
          type="button"
          onClick={() => switchTo(id)}
          aria-current={tab === id ? "page" : undefined}
          className={cn(
            "-mb-px flex items-center gap-2 border-b-2 border-transparent px-3 py-2 text-sm font-medium text-text-2 transition-colors hover:text-foreground",
            tab === id && "border-brand-500 text-foreground",
          )}
        >
          <Icon className="size-4" aria-hidden />
          {label}
          {tab === id && total !== undefined && (
            <span className="rounded-sm bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-text-3 tnum">
              {total.toLocaleString()}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
