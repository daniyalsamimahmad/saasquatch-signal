"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Download,
  FolderPlus,
  Send,
  SearchX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompanyRow, SortKey } from "@/lib/search";
import type { CanonicalIndustry } from "@/lib/taxonomy/types";
import { INDUSTRIES } from "@/lib/taxonomy/resolve";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CompanyDrawer, type ContactRow } from "./company-drawer";
import { buildCsv, downloadCsv } from "@/lib/csv";
import {
  SaveToListDialog,
  type ListOption,
} from "@/components/lists/save-to-list-dialog";
import { draftOutreach } from "@/lib/actions/outreach-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const industryById = new Map<string, CanonicalIndustry>(
  INDUSTRIES.map((i) => [i.id, i]),
);

function SortHeader({
  label,
  sortKey,
  className,
}: {
  label: string;
  sortKey: SortKey;
  className?: string;
}) {
  const params = useSearchParams();
  const current = params.get("sort") ?? "name";
  const dir = params.get("dir") ?? "asc";
  const active = current === sortKey;
  const nextDir = active && dir === "asc" ? "desc" : "asc";
  const next = new URLSearchParams(params.toString());
  next.set("sort", sortKey);
  next.set("dir", nextDir);
  next.delete("page");

  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <Link
      href={`/find/results?${next.toString()}`}
      className={cn(
        "inline-flex items-center gap-1 hover:text-foreground",
        active && "text-foreground",
        className,
      )}
      aria-label={`Sort by ${label}, ${nextDir}ending`}
    >
      {label}
      <Icon className="size-3.5" aria-hidden />
    </Link>
  );
}

function exportCsv(rows: CompanyRow[]) {
  const csv = buildCsv(
    [
      "Company", "Canonical Industry", "NAICS", "Raw Industry (as stored)",
      "City", "State", "Employees", "Revenue Band", "Founded", "Website",
    ],
    rows.map((r) => [
      r.name,
      industryById.get(r.industryId)?.label ?? r.industryId,
      r.naicsCode,
      r.rawIndustry,
      r.city,
      r.state,
      r.employeeCount,
      r.revenueBand,
      r.foundedYear,
      r.website,
    ]),
  );
  downloadCsv("saasquatch-leads-export.csv", csv);
}

export function ResultsTable({
  rows,
  contactsByCompany,
  total,
  page,
  perPage,
  lists = [],
}: {
  rows: CompanyRow[];
  contactsByCompany: Record<string, ContactRow[]>;
  total: number;
  page: number;
  perPage: number;
  lists?: ListOption[];
}) {
  const params = useSearchParams();
  const router = useRouter();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [drawerCompany, setDrawerCompany] = React.useState<CompanyRow | null>(null);
  const [saveOpen, setSaveOpen] = React.useState(false);
  const [drafting, setDrafting] = React.useState(false);

  const draftSelected = async () => {
    setDrafting(true);
    const result = await draftOutreach([...selected]);
    setDrafting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(
      result.created > 0
        ? `${result.created} outreach draft${result.created === 1 ? "" : "s"} prefilled from lead data`
        : "Drafts already exist for the selected companies",
      {
        action: {
          label: "Open outreach",
          onClick: () => router.push("/outreach"),
        },
      },
    );
    setSelected(new Set());
    router.refresh();
  };

  // Soft navigation preserves client state: without this, picks from a
  // previous page/sort survive invisibly and the CSV export silently drops
  // them (it only exports rows on the current page).
  const paramsKey = params.toString();
  React.useEffect(() => {
    setSelected(new Set());
  }, [paramsKey]);

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const pageHref = (p: number, per?: number) => {
    const next = new URLSearchParams(params.toString());
    next.set("page", String(p));
    if (per) {
      next.set("per", String(per));
      next.set("page", "1");
    }
    return `/find/results?${next.toString()}`;
  };

  if (rows.length === 0) {
    return (
      <div className="grid place-items-center rounded-lg border border-dashed py-20 text-center">
        <div className="max-w-sm px-4">
          <SearchX className="mx-auto size-8 text-text-3" aria-hidden />
          <p className="mt-4 text-sm font-medium">No companies match these filters</p>
          <p className="mt-1 text-sm text-text-2">
            Try widening the employee range, dropping the keyword, or picking a
            nearby metro.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile: stacked cards, not a squeezed table (refutes F-09 directly) */}
      <ul className="space-y-2 md:hidden">
        {rows.map((row) => {
          const canonical = industryById.get(row.industryId);
          const rawDiffers =
            canonical &&
            row.rawIndustry.toLowerCase().trim() !== canonical.label.toLowerCase();
          return (
            <li
              key={row.id}
              className="rounded-lg border bg-card p-3"
              onClick={() => setDrawerCompany(row)}
            >
              <div className="flex items-start gap-3">
                <span onClick={(e) => e.stopPropagation()} className="pt-0.5">
                  <Checkbox
                    checked={selected.has(row.id)}
                    onCheckedChange={() => toggle(row.id)}
                    aria-label={`Select ${row.name}`}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{row.name}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
                    {rawDiffers && (
                      <>
                        <span className="max-w-40 truncate font-mono text-xs text-text-3 line-through decoration-conf-low/50">
                          {row.rawIndustry}
                        </span>
                        <ArrowRight className="size-3 text-text-3" aria-hidden />
                      </>
                    )}
                    <span>{canonical?.label ?? row.industryId}</span>
                    <span className="rounded-sm bg-surface-2 px-1 py-0.5 font-mono text-[11px] text-text-2 tnum">
                      {row.naicsCode}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-text-2 tnum">
                    {row.city}, {row.state} · {row.employeeCount.toLocaleString("en-US")}{" "}
                    ppl · {row.revenueBand} · {row.foundedYear}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="hidden overflow-x-auto rounded-lg border bg-card md:block">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-surface-2/80 backdrop-blur">
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all rows on this page"
                />
              </TableHead>
              <TableHead><SortHeader label="Company" sortKey="name" /></TableHead>
              <TableHead>Industry</TableHead>
              <TableHead><SortHeader label="Location" sortKey="location" /></TableHead>
              <TableHead className="text-right"><SortHeader label="Employees" sortKey="employees" /></TableHead>
              <TableHead className="text-right"><SortHeader label="Revenue" sortKey="revenue" /></TableHead>
              <TableHead className="text-right"><SortHeader label="Founded" sortKey="founded" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const canonical = industryById.get(row.industryId);
              const rawDiffers =
                canonical &&
                row.rawIndustry.toLowerCase().trim() !==
                  canonical.label.toLowerCase();
              return (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => setDrawerCompany(row)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selected.has(row.id)}
                      onCheckedChange={() => toggle(row.id)}
                      aria-label={`Select ${row.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-text-3">
                      {row.website.replace("https://", "")}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                      {rawDiffers && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="max-w-36 truncate font-mono text-xs text-text-3 line-through decoration-conf-low/50">
                              {row.rawIndustry}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            Stored as “{row.rawIndustry}” in the source data.
                            The resolver mapped it.
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {rawDiffers && (
                        <ArrowRight className="size-3 text-text-3" aria-hidden />
                      )}
                      <span className="text-sm">{canonical?.label ?? row.industryId}</span>
                      <span className="rounded-sm bg-surface-2 px-1 py-0.5 font-mono text-[11px] text-text-2 tnum">
                        {row.naicsCode}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {row.city}, {row.state}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tnum">
                    {row.employeeCount.toLocaleString("en-US")}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tnum">
                    {row.revenueBand}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tnum">
                    {row.foundedYear}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-text-2">
        <p className="tnum">
          Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of{" "}
          {total.toLocaleString("en-US")} companies
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs">Per page</span>
          {[25, 50, 100].map((n) => (
            <Link
              key={n}
              href={pageHref(1, n)}
              className={cn(
                "rounded-md px-2 py-1 text-xs tnum hover:bg-surface-2",
                perPage === n && "bg-surface-2 font-semibold text-foreground",
              )}
            >
              {n}
            </Link>
          ))}
          <span className="mx-1 text-border">|</span>
          {/* disabled on asChild lands on an <a> and does nothing — render a
              genuinely inert button at the boundaries */}
          {page <= 1 ? (
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(page - 1)}>Previous</Link>
            </Button>
          )}
          <span className="font-mono text-xs tnum">
            {page} / {pageCount}
          </span>
          {page >= pageCount ? (
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(page + 1)}>Next</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Bulk bar — appears on selection */}
      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-30 mx-auto flex w-fit max-w-[94vw] items-center gap-2 rounded-lg border bg-card px-4 py-2.5 shadow-lift">
          <p className="pr-2 text-sm font-medium tnum">{selected.size} selected</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportCsv(rows.filter((r) => selected.has(r.id)))}
          >
            <Download className="size-4" aria-hidden />
            Export CSV
          </Button>
          <Button size="sm" onClick={() => setSaveOpen(true)}>
            <FolderPlus className="size-4" aria-hidden />
            Save to list
          </Button>
          <Button size="sm" variant="outline" onClick={draftSelected} disabled={drafting}>
            <Send className="size-4" aria-hidden />
            Draft outreach
          </Button>
        </div>
      )}

      <SaveToListDialog
        lists={lists}
        companyIds={[...selected]}
        open={saveOpen}
        onOpenChange={setSaveOpen}
        onSaved={() => setSelected(new Set())}
      />

      <CompanyDrawer
        company={drawerCompany}
        industry={
          drawerCompany ? (industryById.get(drawerCompany.industryId) ?? null) : null
        }
        contacts={drawerCompany ? (contactsByCompany[drawerCompany.id] ?? []) : []}
        open={drawerCompany !== null}
        onOpenChange={(open) => !open && setDrawerCompany(null)}
      />
    </div>
  );
}
