import type { Metadata } from "next";
import Link from "next/link";
import { FolderOpen, ArrowRight } from "lucide-react";
import { auth } from "@/auth";
import { getListsForUser } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { IndustrySparkline } from "@/components/lists/industry-sparkline";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Saved Lists" };

function timeAgo(iso: string): string {
  const then = new Date(iso + "Z").getTime();
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default async function ListsPage() {
  const session = await auth();
  const lists = getListsForUser(session!.user!.id!);

  return (
    <div>
      <PageHeader
        title="Saved lists"
        description="Everything you save from a search lands here."
      />

      {lists.length === 0 ? (
        <div className="grid place-items-center rounded-lg border border-dashed py-24 text-center">
          <div className="max-w-sm px-4">
            <FolderOpen className="mx-auto size-8 text-text-3" aria-hidden />
            <p className="mt-4 text-sm font-medium">No lists yet</p>
            <p className="mt-1 text-sm text-text-2">
              Run a search, select a few companies, and save them. They&apos;ll
              show up here.
            </p>
            <Button asChild className="mt-4" variant="outline">
              <Link href="/find">
                Start a search
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <Link key={list.id} href={`/lists/${list.id}`} className="group">
              <Card className="h-full transition-colors group-hover:border-brand-500/60">
                <CardContent>
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-display text-base font-semibold">
                      {list.name}
                    </p>
                    <span className="shrink-0 rounded-sm bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-text-2 tnum">
                      {list.count}
                    </span>
                  </div>
                  <div className="mt-4">
                    <IndustrySparkline mix={list.industryMix} total={list.count} />
                  </div>
                  <p className="mt-3 text-xs text-text-3">
                    Updated {timeAgo(list.updatedAt)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
