import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getDraft, getCompany } from "@/lib/queries";
import { getContactsForCompany } from "@/lib/search";
import { INDUSTRIES } from "@/lib/taxonomy/resolve";
import { ComposeForm } from "@/components/outreach/compose-form";

export const metadata: Metadata = { title: "Compose" };

export default async function ComposePage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const session = await auth();
  const { leadId } = await params;
  const draft = getDraft(leadId, session!.user!.id!);
  if (!draft) notFound();

  const company = getCompany(draft.companyId);
  if (!company) notFound();

  const contacts = getContactsForCompany(draft.companyId);
  const contact =
    contacts.find((c) => c.id === draft.contactId) ?? contacts[0] ?? null;
  const canonical =
    INDUSTRIES.find((ind) => ind.id === company.industryId) ?? null;

  let points: [string, string, string];
  try {
    const parsed = JSON.parse(draft.contextPoints);
    points =
      Array.isArray(parsed) && parsed.length === 3
        ? (parsed as [string, string, string])
        : ["", "", ""];
  } catch {
    points = ["", "", ""];
  }

  return (
    <ComposeForm
      draftId={draft.id}
      company={company}
      contact={contact}
      canonical={canonical}
      initialSubject={draft.subject}
      initialBody={draft.body}
      initialPoints={points}
      initialStatus={draft.status}
    />
  );
}
