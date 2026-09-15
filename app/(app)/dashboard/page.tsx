import type { Metadata } from "next";
import { auth } from "@/auth";
import { getDashboardStats } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/coming-soon";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const firstName = (session?.user?.name ?? "there").split(" ")[0];
  const stats = getDashboardStats(userId);

  const tiles = [
    { label: "Total leads", value: stats.totalLeads },
    { label: "Saved lists", value: stats.lists },
    { label: "Drafts queued", value: stats.drafts },
    { label: "Searches this week", value: stats.searchesThisWeek },
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Pipeline overview — these numbers update the moment you save a search result. In the original product they read 0 forever."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {tiles.map((tile) => (
          <Card key={tile.label} className="shadow-lift">
            <CardContent>
              <p className="label-caps">{tile.label}</p>
              <p className="mt-2 font-display text-2xl font-bold tnum">
                {tile.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <ComingSoon
          sprint={5}
          what="Industry mix, match-confidence histogram, and recent searches"
        />
      </div>
    </div>
  );
}
