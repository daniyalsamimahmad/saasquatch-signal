import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Outreach" };

export default function OutreachPage() {
  return (
    <div>
      <PageHeader
        title="Outreach"
        description="Drafts prefilled from lead data the app already holds — the tool writes the first draft, you edit it."
      />
      <ComingSoon sprint={4} what="The draft queue and prefilled compose screen" />
    </div>
  );
}
