import Link from "next/link";
import type { Metadata } from "next";
import { Send, Sparkles, Users, Layers, Mail } from "lucide-react";
import { requireSession } from "@/lib/session";
import { apiFetch } from "@/lib/api";
import type { CampaignSummary } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Campaigns" };

const STATUS_STYLE: Record<string, string> = {
  draft: "text-text-2",
  active: "border-conf-high/40 text-conf-high",
  paused: "border-conf-mid/40 text-conf-mid",
};

export default async function CampaignsPage() {
  const session = await requireSession();
  const campaigns = await apiFetch<CampaignSummary[]>("/campaigns", {
    token: session.apiToken,
  });

  return (
    <>
      <PageHeader
        title="Campaigns"
        description="Multi-step sequences: AI writes the drafts, you approve, the queue delivers."
        actions={
          <Button asChild>
            <Link href="/campaigns/new">
              <Sparkles className="size-4" aria-hidden />
              New campaign
            </Link>
          </Button>
        }
      />

      {campaigns.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <Send className="mx-auto size-8 text-text-3" aria-hidden />
          <p className="mt-3 text-sm font-medium">No campaigns yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-text-2">
            Describe your offer in four fields and the AI designs the whole
            sequence: emails, a LinkedIn touch, and the follow-up cadence.
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link href="/campaigns/new">
              <Sparkles className="size-3.5" aria-hidden />
              Create your first campaign
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {campaigns.map((campaign) => (
            <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
              <Card className="h-full transition-colors hover:border-brand-500/40">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 truncate font-medium">{campaign.name}</p>
                    <Badge
                      variant="outline"
                      className={STATUS_STYLE[campaign.status] ?? "text-text-2"}
                    >
                      {campaign.status}
                    </Badge>
                  </div>
                  <div className="mt-3 flex gap-4 text-xs text-text-2">
                    <span className="flex items-center gap-1">
                      <Layers className="size-3.5" aria-hidden />
                      <span className="font-mono tnum">{campaign._count.steps}</span> steps
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="size-3.5" aria-hidden />
                      <span className="font-mono tnum">{campaign._count.contacts}</span> contacts
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="size-3.5" aria-hidden />
                      <span className="font-mono tnum">{campaign._count.messages}</span> messages
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
