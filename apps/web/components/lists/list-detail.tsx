"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Pencil,
  Copy,
  Trash2,
  Download,
  Send,
  Loader2,
  X,
  ArrowRight,
} from "lucide-react";
import type { CompanyRow } from "@/lib/search";
import { INDUSTRIES } from "@/lib/taxonomy/resolve";
import { buildCsv, downloadCsv } from "@/lib/csv";
import {
  renameList,
  duplicateList,
  deleteList,
  removeFromList,
} from "@/lib/actions/list-actions";
import { draftOutreach } from "@/lib/actions/outreach-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const industryById = new Map(INDUSTRIES.map((i) => [i.id, i]));

type ListCompany = CompanyRow & { addedAt: string };

function exportListCsv(name: string, rows: ListCompany[]) {
  const csv = buildCsv(
    [
      "Company", "Canonical Industry", "NAICS", "Raw Industry (as stored)",
      "City", "State", "Employees", "Revenue Band", "Founded", "Website", "Added",
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
      r.addedAt,
    ]),
  );
  downloadCsv(`${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`, csv);
}

export function ListDetail({
  list,
}: {
  list: { id: string; name: string; companies: ListCompany[] };
}) {
  const router = useRouter();
  const [renaming, setRenaming] = React.useState(false);
  const [name, setName] = React.useState(list.name);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);

  const doRename = async () => {
    if (name.trim() === list.name) {
      setRenaming(false);
      return;
    }
    const result = await renameList(list.id, name);
    if (result.ok) {
      setRenaming(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const doDuplicate = async () => {
    setBusy("duplicate");
    const result = await duplicateList(list.id);
    setBusy(null);
    if (result.ok) {
      toast.success(`Duplicated as “${list.name} (copy)”`);
      router.push(`/lists/${result.newListId}`);
    } else {
      toast.error(result.error);
    }
  };

  const doDelete = async () => {
    setBusy("delete");
    const result = await deleteList(list.id);
    setBusy(null);
    if (result.ok) {
      toast.success(`Deleted “${list.name}”`);
      router.push("/lists");
    } else {
      toast.error(result.error);
    }
  };

  const doDraftAll = async () => {
    setBusy("draft");
    const result = await draftOutreach(list.companies.map((c) => c.id));
    setBusy(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(
      result.created > 0
        ? `${result.created} outreach draft${result.created === 1 ? "" : "s"} prefilled`
        : "Drafts already exist for every company in this list",
    );
    router.push("/outreach");
  };

  const doRemove = async (companyId: string, companyName: string) => {
    const result = await removeFromList(list.id, companyId);
    if (result.ok) {
      toast(`Removed ${companyName}`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 pb-6">
        <div className="flex items-center gap-2">
          {renaming ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                doRename();
              }}
              className="flex items-center gap-2"
            >
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 w-64 font-display text-lg font-bold"
                autoFocus
                aria-label="List name"
              />
              <Button type="submit" size="sm">
                Save
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setName(list.name);
                  setRenaming(false);
                }}
              >
                Cancel
              </Button>
            </form>
          ) : (
            <>
              <h1 className="text-xl font-bold">{list.name}</h1>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Rename list"
                onClick={() => setRenaming(true)}
              >
                <Pencil className="size-4" aria-hidden />
              </Button>
            </>
          )}
          <span className="rounded-sm bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-text-2 tnum">
            {list.companies.length}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportListCsv(list.name, list.companies)}
            disabled={list.companies.length === 0}
          >
            <Download className="size-4" aria-hidden />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={doDuplicate} disabled={busy !== null}>
            {busy === "duplicate" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Copy className="size-4" aria-hidden />
            )}
            Duplicate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            disabled={busy !== null}
            className="text-conf-low hover:text-conf-low"
          >
            <Trash2 className="size-4" aria-hidden />
            Delete
          </Button>
          <Button size="sm" onClick={doDraftAll} disabled={busy !== null || list.companies.length === 0}>
            {busy === "draft" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Send className="size-4" aria-hidden />
            )}
            Draft outreach for all
          </Button>
        </div>
      </div>

      {list.companies.length === 0 ? (
        <div className="grid place-items-center rounded-lg border border-dashed py-20 text-center">
          <p className="text-sm text-text-2">
            This list is empty. Save companies from a search to fill it.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table>
            <TableHeader className="bg-surface-2/80">
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Employees</TableHead>
                <TableHead className="text-right">Founded</TableHead>
                <TableHead className="w-10" aria-label="Remove" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.companies.map((company) => {
                const canonical = industryById.get(company.industryId);
                const rawDiffers =
                  canonical &&
                  company.rawIndustry.toLowerCase().trim() !==
                    canonical.label.toLowerCase();
                return (
                  <TableRow key={company.id}>
                    <TableCell>
                      <p className="font-medium">{company.name}</p>
                      <p className="text-xs text-text-3">
                        {company.website.replace("https://", "")}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        {rawDiffers && (
                          <>
                            <span className="max-w-32 truncate font-mono text-xs text-text-3 line-through decoration-conf-low/50">
                              {company.rawIndustry}
                            </span>
                            <ArrowRight className="size-3 text-text-3" aria-hidden />
                          </>
                        )}
                        <span className="text-sm">
                          {canonical?.label ?? company.industryId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {company.city}, {company.state}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm tnum">
                      {company.employeeCount.toLocaleString("en-US")}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm tnum">
                      {company.foundedYear}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${company.name} from list`}
                        onClick={() => doRemove(company.id, company.name)}
                      >
                        <X className="size-4" aria-hidden />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete “{list.name}”?</DialogTitle>
            <DialogDescription>
              Removes the list and its {list.companies.length} saved{" "}
              {list.companies.length === 1 ? "company" : "companies"}. The
              companies themselves stay in the dataset.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={doDelete}
              disabled={busy === "delete"}
            >
              {busy === "delete" && (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              )}
              Delete list
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
