import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/session";
import { apiFetch, ApiError } from "@/lib/api";
import type {
  CampaignDetail,
  ListSummary,
  Message,
} from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { StepsEditor } from "@/components/campaigns/steps-editor";
import { CampaignRunPanel } from "@/components/campaigns/run-panel";
import { MessagesTable } from "@/components/campaigns/messages-table";
import { LinkedInTasks } from "@/components/campaigns/linkedin-tasks";

export const metadata: Metadata = { title: "Campaign" };

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const token = session.apiToken;

  let campaign: CampaignDetail;
  let messages: Message[];
  let linkedinTasks: Message[];
  let lists: ListSummary[];
  try {
    [campaign, messages, linkedinTasks, lists] = await Promise.all([
      apiFetch<CampaignDetail>(`/campaigns/${id}`, { token }),
      apiFetch<Message[]>(`/campaigns/${id}/messages`, { token }),
      apiFetch<Message[]>(`/campaigns/${id}/linkedin-tasks`, { token }),
      apiFetch<ListSummary[]>("/lists", { token }),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <>
      <Link
        href="/campaigns"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-text-2 hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        All campaigns
      </Link>
      <PageHeader
        title={campaign.name}
        description={campaign.brief?.offer}
        actions={
          <Badge variant="outline" className="capitalize">
            {campaign.status}
          </Badge>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <StepsEditor campaignId={campaign.id} steps={campaign.steps} />
          {messages.filter((m) => m.channel === "EMAIL" && m.status !== "DRAFT").length > 0 && (
            <MessagesTable messages={messages} />
          )}
        </div>
        <div className="space-y-6">
          <CampaignRunPanel
            campaign={campaign}
            lists={lists.filter((l) => l.kind === "people")}
          />
          {linkedinTasks.length > 0 && (
            <LinkedInTasks campaignId={campaign.id} tasks={linkedinTasks} />
          )}
        </div>
      </div>
    </>
  );
}
