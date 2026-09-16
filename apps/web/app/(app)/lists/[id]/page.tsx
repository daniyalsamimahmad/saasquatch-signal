import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/session";
import { apiFetch, ApiError } from "@/lib/api";
import type { CampaignSummary, ListDetail } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { ListCardMenu } from "@/components/lists/list-card-menu";
import { ListItemsTable, ListToolbar } from "@/components/lists/list-items-table";

export const metadata: Metadata = { title: "List" };

export default async function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;

  let list: ListDetail;
  let campaigns: CampaignSummary[];
  try {
    [list, campaigns] = await Promise.all([
      apiFetch<ListDetail>(`/lists/${id}`, { token: session.apiToken }),
      apiFetch<CampaignSummary[]>("/campaigns", { token: session.apiToken }),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <>
      <Link
        href="/lists"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-text-2 hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        All lists
      </Link>
      <PageHeader
        title={list.name}
        description={`${list.items.length} ${list.kind === "people" ? "leads" : "companies"} · saved ${new Date(list.createdAt).toLocaleDateString()}`}
        actions={
          <>
            <ListToolbar list={list} campaigns={campaigns} />
            <ListCardMenu listId={list.id} name={list.name} redirectOnDelete />
          </>
        }
      />
      <ListItemsTable list={list} />
    </>
  );
}
