"use client";

import { ExternalLink, ArrowRight } from "lucide-react";
import type { CompanyRow } from "@/lib/search";
import type { CanonicalIndustry } from "@/lib/taxonomy/types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

export type ContactRow = {
  id: string;
  companyId: string;
  name: string;
  title: string;
  email: string;
};

export function CompanyDrawer({
  company,
  industry,
  contacts,
  open,
  onOpenChange,
}: {
  company: CompanyRow | null;
  industry: CanonicalIndustry | null;
  contacts: ContactRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-6 sm:max-w-md">
        {company && (
          <>
            <SheetHeader className="p-0">
              <SheetTitle className="text-lg">{company.name}</SheetTitle>
              <SheetDescription className="text-sm">
                {company.description}
              </SheetDescription>
            </SheetHeader>

            {/* The thesis in one cell: messy source string → canonical entry */}
            <div className="mt-5 rounded-md border bg-surface-2/50 p-3">
              <p className="label-caps">Industry, stored vs resolved</p>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-mono text-xs text-text-3 line-through decoration-conf-low/60">
                  {company.rawIndustry}
                </span>
                <ArrowRight className="size-3.5 text-text-3" aria-hidden />
                <span className="font-medium">{industry?.label ?? company.industryId}</span>
              </p>
              <p className="mt-1.5 font-mono text-xs text-text-2 tnum">
                NAICS {company.naicsCode}
                {industry ? ` · ${industry.naicsTitle}` : ""}
              </p>
              <p className="mt-2 text-xs text-text-3">
                The struck-through text is how this industry is stored in the
                source data. The resolver mapped it automatically.
              </p>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="label-caps">Location</dt>
                <dd className="mt-1">
                  {company.city}, {company.state}
                </dd>
              </div>
              <div>
                <dt className="label-caps">Employees</dt>
                <dd className="mt-1 font-mono tnum">{company.employeeCount.toLocaleString("en-US")}</dd>
              </div>
              <div>
                <dt className="label-caps">Revenue band</dt>
                <dd className="mt-1 font-mono tnum">{company.revenueBand}</dd>
              </div>
              <div>
                <dt className="label-caps">Founded</dt>
                <dd className="mt-1 font-mono tnum">{company.foundedYear}</dd>
              </div>
              <div className="col-span-2">
                <dt className="label-caps">Website</dt>
                <dd className="mt-1">
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-brand-600 underline-offset-4 hover:underline"
                  >
                    {company.website.replace("https://", "")}
                    <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                </dd>
              </div>
            </dl>

            <Separator className="my-5" />

            <p className="label-caps">Contacts</p>
            {contacts.length === 0 ? (
              <p className="mt-2 text-sm text-text-3">No contacts on record.</p>
            ) : (
              <ul className="mt-2 space-y-3">
                {contacts.map((contact) => (
                  <li key={contact.id} className="text-sm">
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-text-2">{contact.title}</p>
                    <p className="font-mono text-xs text-text-3">{contact.email}</p>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
