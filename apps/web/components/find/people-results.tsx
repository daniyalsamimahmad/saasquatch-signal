"use client";

import * as React from "react";
import { FolderPlus, Send, FileDown, SearchX } from "lucide-react";
import { LinkedinIcon } from "@/components/icons/linkedin";
import type { Contact, ListSummary, CampaignSummary, SearchResult } from "@/lib/types";
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
import { EmailStatusBadge, SignalChip } from "./lead-badges";
import { SaveToListDialog } from "./save-to-list-dialog";
import { AddToCampaignDialog } from "./add-to-campaign-dialog";
import { Pagination } from "./pagination";

export function PeopleResults({
  result,
  lists,
  campaigns,
}: {
  result: SearchResult<Contact>;
  lists: ListSummary[];
  campaigns: CampaignSummary[];
}) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [listOpen, setListOpen] = React.useState(false);
  const [campaignOpen, setCampaignOpen] = React.useState(false);

  // Selection is per page of results; a new search clears it.
  const rowIds = React.useMemo(() => result.rows.map((r) => r.id), [result.rows]);
  React.useEffect(() => setSelected(new Set()), [rowIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const allChecked = rowIds.length > 0 && rowIds.every((id) => selected.has(id));
  const toggleAll = () =>
    setSelected(allChecked ? new Set() : new Set(rowIds));
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
      ["First name", "Last name", "Title", "Company", "Industry", "Email", "Email status", "Phone", "City", "State", "LinkedIn"],
      rows.map((r) => [
        r.firstName,
        r.lastName,
        r.title ?? "",
        r.company?.name ?? "",
        r.company?.industry ?? "",
        r.email ?? "",
        r.emailStatus,
        r.phone ?? "",
        r.city ?? r.company?.city ?? "",
        r.state ?? r.company?.state ?? "",
        r.linkedinUrl ?? "",
      ]),
    );
    downloadCsv("leads.csv", csv);
  };

  if (result.total === 0) {
    return (
      <div className="rounded-lg border border-dashed py-14 text-center">
        <SearchX className="mx-auto size-8 text-text-3" aria-hidden />
        <p className="mt-3 text-sm font-medium">No people match these filters</p>
        <p className="mt-1 text-sm text-text-2">
          Loosen a filter or two, or try the AI search bar above.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Bulk action bar appears with a selection */}
      {selected.size > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-2 rounded-md border bg-surface px-3 py-2">
          <p className="text-sm font-medium">
            {selected.size} selected
          </p>
          <div className="flex-1" />
          <Button size="sm" variant="outline" onClick={() => setListOpen(true)}>
            <FolderPlus className="size-3.5" aria-hidden />
            Save to list
          </Button>
          <Button size="sm" variant="outline" onClick={() => setCampaignOpen(true)}>
            <Send className="size-3.5" aria-hidden />
            Add to campaign
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
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Signal</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.rows.map((contact) => (
              <TableRow
                key={contact.id}
                data-state={selected.has(contact.id) ? "selected" : undefined}
              >
                <TableCell>
                  <Checkbox
                    checked={selected.has(contact.id)}
                    onCheckedChange={() => toggleOne(contact.id)}
                    aria-label={`Select ${contact.firstName} ${contact.lastName}`}
                  />
                </TableCell>
                <TableCell>
                  <p className="font-medium">
                    {contact.firstName} {contact.lastName}
                  </p>
                  <p className="text-xs text-text-2">{contact.title}</p>
                </TableCell>
                <TableCell>
                  <p className="text-sm">{contact.company?.name ?? "—"}</p>
                  <p className="text-xs text-text-3">
                    {contact.company?.industry}
                    {contact.company?.employeeCount
                      ? ` · ${contact.company.employeeCount.toLocaleString()} people`
                      : ""}
                  </p>
                </TableCell>
                <TableCell className="text-sm text-text-2">
                  {contact.city ?? contact.company?.city ?? "—"}
                  {(contact.state ?? contact.company?.state) &&
                    `, ${contact.state ?? contact.company?.state}`}
                </TableCell>
                <TableCell className="max-w-56">
                  <EmailStatusBadge status={contact.emailStatus} email={contact.email} />
                </TableCell>
                <TableCell>
                  <SignalChip signal={contact.signal} />
                </TableCell>
                <TableCell>
                  {contact.linkedinUrl && (
                    <a
                      href={contact.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-text-3 hover:text-brand-600"
                      aria-label={`${contact.firstName} ${contact.lastName} on LinkedIn`}
                    >
                      <LinkedinIcon className="size-4" />
                    </a>
                  )}
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
        kind="people"
        contactIds={Array.from(selected)}
        onSaved={() => setSelected(new Set())}
      />
      <AddToCampaignDialog
        open={campaignOpen}
        onOpenChange={setCampaignOpen}
        campaigns={campaigns}
        contactIds={Array.from(selected)}
        onAdded={() => setSelected(new Set())}
      />
    </>
  );
}
