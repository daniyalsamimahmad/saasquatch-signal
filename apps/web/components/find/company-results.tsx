"use client";

import * as React from "react";
import Link from "next/link";
import { FolderPlus, FileDown, SearchX, Globe, Users } from "lucide-react";
import type { CompanyRow, ListSummary, SearchResult } from "@/lib/types";
import { buildCsv, downloadCsv } from "@/lib/csv";
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
import { SaveToListDialog } from "./save-to-list-dialog";
import { Pagination } from "./pagination";

export function CompanyResults({
  result,
  lists,
}: {
  result: SearchResult<CompanyRow>;
  lists: ListSummary[];
}) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [listOpen, setListOpen] = React.useState(false);

  const rowIds = React.useMemo(() => result.rows.map((r) => r.id), [result.rows]);
  React.useEffect(() => setSelected(new Set()), [rowIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const allChecked = rowIds.length > 0 && rowIds.every((id) => selected.has(id));
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(rowIds));
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const exportCsv = () => {
    const rows = result.rows.filter((r) => selected.has(r.id));
    const csv = buildCsv(
      ["Company", "Domain", "Industry", "Employees", "Founded", "City", "State", "Tech stack", "Contacts"],
      rows.map((r) => [
        r.name,
        r.domain ?? "",
        r.industry ?? "",
        r.employeeCount ?? "",
        r.foundedYear ?? "",
        r.city ?? "",
        r.state ?? "",
        r.techStack.join("; "),
        r._count.contacts,
      ]),
    );
    downloadCsv("companies.csv", csv);
  };

  if (result.total === 0) {
    return (
      <div className="rounded-lg border border-dashed py-14 text-center">
        <SearchX className="mx-auto size-8 text-text-3" aria-hidden />
        <p className="mt-3 text-sm font-medium">No companies match these filters</p>
        <p className="mt-1 text-sm text-text-2">
          Loosen a filter or two, or import one live with the button above.
        </p>
      </div>
    );
  }

  return (
    <>
      {selected.size > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-2 rounded-md border bg-surface px-3 py-2">
          <p className="text-sm font-medium">{selected.size} selected</p>
          <div className="flex-1" />
          <Button size="sm" variant="outline" onClick={() => setListOpen(true)}>
            <FolderPlus className="size-3.5" aria-hidden />
            Save to list
          </Button>
          <Button size="sm" variant="outline" onClick={exportCsv}>
            <FileDown className="size-3.5" aria-hidden />
            Export CSV
          </Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allChecked}
                  onCheckedChange={toggleAll}
                  aria-label="Select all on this page"
                />
              </TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead className="text-right">Size</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Tech</TableHead>
              <TableHead className="text-right">People</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.rows.map((company) => (
              <TableRow
                key={company.id}
                data-state={selected.has(company.id) ? "selected" : undefined}
              >
                <TableCell>
                  <Checkbox
                    checked={selected.has(company.id)}
                    onCheckedChange={() => toggleOne(company.id)}
                    aria-label={`Select ${company.name}`}
                  />
                </TableCell>
                <TableCell>
                  <p className="font-medium">{company.name}</p>
                  {company.domain && (
                    <a
                      href={`https://${company.domain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-text-3 hover:text-brand-600"
                    >
                      <Globe className="size-3" aria-hidden />
                      {company.domain}
                    </a>
                  )}
                </TableCell>
                <TableCell className="text-sm text-text-2">
                  {company.industry ?? "—"}
                </TableCell>
                <TableCell className="text-right font-mono text-sm tnum">
                  {company.employeeCount?.toLocaleString() ?? "—"}
                </TableCell>
                <TableCell className="text-sm text-text-2">
                  {company.city ?? "—"}
                  {company.state && `, ${company.state}`}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {company.techStack.slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="rounded-sm bg-surface-2 px-1.5 py-0.5 text-[11px] text-text-2"
                      >
                        {tech}
                      </span>
                    ))}
                    {company.techStack.length > 3 && (
                      <span className="text-[11px] text-text-3">
                        +{company.techStack.length - 3}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {/* Jump to the People tab pre-filtered to this company */}
                  <Link
                    href={`/find?q=${encodeURIComponent(company.name)}`}
                    className="inline-flex items-center gap-1 font-mono text-sm text-brand-600 tnum hover:underline dark:text-brand-500"
                    title={`View people at ${company.name}`}
                  >
                    <Users className="size-3.5" aria-hidden />
                    {company._count.contacts}
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination page={result.page} perPage={result.perPage} total={result.total} />

      <SaveToListDialog
        open={listOpen}
        onOpenChange={setListOpen}
        lists={lists}
        kind="companies"
        companyIds={Array.from(selected)}
        onSaved={() => setSelected(new Set())}
      />
    </>
  );
}
