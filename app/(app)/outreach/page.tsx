import type { Metadata } from "next";
import Link from "next/link";
import { Send, ArrowRight } from "lucide-react";
import { auth } from "@/auth";
import { getDraftsForUser } from "@/lib/queries";
import { INDUSTRIES } from "@/lib/taxonomy/resolve";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Outreach" };

const industryById = new Map(INDUSTRIES.map((i) => [i.id, i]));

export default async function OutreachPage() {
  const session = await auth();
  const drafts = getDraftsForUser(session!.user!.id!);

  return (
    <div>
      <PageHeader
        title="Outreach"
        description="First drafts written from lead data the app already holds — industry, size, location, NAICS sector. You edit; nothing is hand-researched twice."
      />

      {drafts.length === 0 ? (
        <div className="grid place-items-center rounded-lg border border-dashed py-24 text-center">
          <div className="max-w-sm px-4">
            <Send className="mx-auto size-8 text-text-3" aria-hidden />
            <p className="mt-4 text-sm font-medium">No drafts queued</p>
            <p className="mt-1 text-sm text-text-2">
              Select companies in a search or open a list and hit “Draft
              outreach” — the compose screen arrives prefilled.
            </p>
            <Button asChild className="mt-4" variant="outline">
              <Link href="/lists">
                Open your lists
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {drafts.map((draft) => (
            <li key={draft.id}>
              <Link
                href={`/outreach/${draft.id}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:bg-surface-2/60"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {draft.companyName}
                    <span className="ml-2 font-normal text-text-3">
                      {draft.contactName
                        ? `${draft.contactName} · ${draft.contactTitle}`
                        : "no contact on record"}
                    </span>
                  </p>
                  <p className="mt-0.5 truncate text-sm text-text-2">
                    {draft.subject}
                  </p>
                </div>
                <span className="hidden text-xs text-text-3 sm:block">
                  {industryById.get(draft.industryId)?.label}
                </span>
                <Badge
                  variant="secondary"
                  className={
                    draft.status === "ready"
                      ? "bg-conf-high-subtle text-conf-high"
                      : ""
                  }
                >
                  {draft.status}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
