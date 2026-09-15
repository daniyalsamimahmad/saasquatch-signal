import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/session";
import { apiFetch } from "@/lib/api";
import type { UserProfile } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { BriefForm } from "@/components/campaigns/brief-form";

export const metadata: Metadata = { title: "New campaign" };

export default async function NewCampaignPage() {
  const session = await requireSession();
  const profile = await apiFetch<UserProfile>("/auth/me", {
    token: session.apiToken,
  });

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
        title="New campaign"
        description="Four fields in, a whole sequence out. You review and edit every step before anything sends."
      />
      <div className="max-w-2xl">
        <BriefForm savedBrief={profile.aiBrief} />
      </div>
    </>
  );
}
