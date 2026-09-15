import Link from "next/link";
import type { Metadata } from "next";
import { FolderOpen, Users, Building2 } from "lucide-react";
import { requireSession } from "@/lib/session";
import { apiFetch } from "@/lib/api";
import type { ListSummary } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreateListDialog } from "@/components/lists/create-list-dialog";
import { ListCardMenu } from "@/components/lists/list-card-menu";

export const metadata: Metadata = { title: "Lists" };

function relativeDay(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export default async function ListsPage() {
  const session = await requireSession();
  const lists = await apiFetch<ListSummary[]>("/lists", { token: session.apiToken });

  return (
    <>
      <PageHeader
        title="Lists"
        description="Saved leads, organized. Every list can feed a campaign in two clicks."
        actions={<CreateListDialog />}
      />

      {lists.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <FolderOpen className="mx-auto size-8 text-text-3" aria-hidden />
          <p className="mt-3 text-sm font-medium">No lists yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-text-2">
            Run a search, select the leads you like, and save them here.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href="/find">Find leads</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <Card key={list.id} className="group relative transition-colors hover:border-brand-500/40">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-50/10 dark:text-brand-500">
                    {list.kind === "people" ? (
                      <Users className="size-4" aria-hidden />
                    ) : (
                      <Building2 className="size-4" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/lists/${list.id}`} className="after:absolute after:inset-0">
                      <p className="truncate font-medium group-hover:text-brand-600 dark:group-hover:text-brand-500">
                        {list.name}
                      </p>
                    </Link>
                    <p className="mt-0.5 text-xs text-text-2">
                      <span className="font-mono tnum">{list._count.items}</span>{" "}
                      {list.kind === "people" ? "leads" : "companies"} · updated{" "}
                      {relativeDay(list.updatedAt)}
                    </p>
                  </div>
                  <div className="relative z-10">
                    <ListCardMenu listId={list.id} name={list.name} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
