"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileDown, Send, X, Globe } from "lucide-react";
import { LinkedinIcon } from "@/components/icons/linkedin";
import { toast } from "sonner";
import type { CampaignSummary, ListDetail } from "@/lib/types";
import { removeListItem } from "@/lib/actions/list-actions";
import { buildCsv, downloadCsv } from "@/lib/csv";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmailStatusBadge, SignalChip } from "@/components/find/lead-badges";
import { AddToCampaignDialog } from "@/components/find/add-to-campaign-dialog";

/** Header actions: lives in the PageHeader so the table starts right away. */
export function ListToolbar({
  list,
  campaigns,
}: {
  list: ListDetail;
  campaigns: CampaignSummary[];
}) {
  const router = useRouter();
  const [campaignOpen, setCampaignOpen] = React.useState(false);

  const contactIds = list.items
    .map((item) => item.contact?.id)
    .filter((id): id is string => !!id);

  const exportCsv = () => {
    if (list.kind === "people") {
      const csv = buildCsv(
        ["First name", "Last name", "Title", "Company", "Email", "Email status", "City", "State", "LinkedIn"],
        list.items
          .filter((item) => item.contact)
          .map((item) => {
            const c = item.contact!;
            return [
              c.firstName,
              c.lastName,
              c.title ?? "",
              c.company?.name ?? "",
              c.email ?? "",
              c.emailStatus,
              c.city ?? c.company?.city ?? "",
              c.state ?? c.company?.state ?? "",
              c.linkedinUrl ?? "",
            ];
          }),
      );
      downloadCsv(`${list.name}.csv`, csv);
    } else {
      const csv = buildCsv(
        ["Company", "Domain", "Industry", "Employees", "City", "State"],
        list.items
          .filter((item) => item.company)
          .map((item) => {
            const c = item.company!;
            return [
              c.name,
              c.domain ?? "",
              c.industry ?? "",
              c.employeeCount ?? "",
              c.city ?? "",
              c.state ?? "",
            ];
          }),
      );
      downloadCsv(`${list.name}.csv`, csv);
    }
  };

  if (list.items.length === 0) return null;

  return (
    <>
      {list.kind === "people" && contactIds.length > 0 && (
        <Button size="sm" onClick={() => setCampaignOpen(true)}>
          <Send className="size-3.5" aria-hidden />
          Add all to campaign
        </Button>
      )}
      <Button size="sm" variant="outline" onClick={exportCsv}>
        <FileDown className="size-3.5" aria-hidden />
        Export CSV
      </Button>
      <AddToCampaignDialog
        open={campaignOpen}
        onOpenChange={setCampaignOpen}
        campaigns={campaigns}
        contactIds={contactIds}
        onAdded={() => router.refresh()}
      />
    </>
  );
}

export function ListItemsTable({ list }: { list: ListDetail }) {
  const router = useRouter();

  const remove = async (itemId: string) => {
    const result = await removeListItem(list.id, itemId);
    if (!result.ok) toast.error(result.error);
    else router.refresh();
  };

  if (list.items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-14 text-center">
        <p className="text-sm font-medium">This list is empty</p>
        <p className="mt-1 text-sm text-text-2">
          Select leads in a search and save them here.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-3">
          <Link href={list.kind === "companies" ? "/find?tab=companies" : "/find"}>
            Find {list.kind === "people" ? "people" : "companies"}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border">
        {list.kind === "people" ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Signal</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items
                .filter((item) => item.contact)
                .map((item) => {
                  const contact = item.contact!;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <p className="font-medium">
                          {contact.firstName} {contact.lastName}
                        </p>
                        <p className="text-xs text-text-2">{contact.title}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{contact.company?.name ?? "—"}</p>
                        <p className="text-xs text-text-3">{contact.company?.industry}</p>
                      </TableCell>
                      <TableCell className="max-w-56">
                        <EmailStatusBadge status={contact.emailStatus} email={contact.email} />
                      </TableCell>
                      <TableCell>
                        <SignalChip signal={contact.signal} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {contact.linkedinUrl && (
                            <a
                              href={contact.linkedinUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-text-3 hover:text-brand-600"
                              aria-label="LinkedIn profile"
                            >
                              <LinkedinIcon className="size-4" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => remove(item.id)}
                            className="p-1 text-text-3 hover:text-conf-low"
                            aria-label={`Remove ${contact.firstName} ${contact.lastName}`}
                          >
                            <X className="size-4" aria-hidden />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items
                .filter((item) => item.company)
                .map((item) => {
                  const company = item.company!;
                  return (
                    <TableRow key={item.id}>
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
                        <button
                          type="button"
                          onClick={() => remove(item.id)}
                          className="p-1 text-text-3 hover:text-conf-low"
                          aria-label={`Remove ${company.name}`}
                        >
                          <X className="size-4" aria-hidden />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
}
