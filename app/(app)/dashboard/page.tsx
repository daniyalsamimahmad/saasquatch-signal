import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Scale } from "lucide-react";
import { auth } from "@/auth";
import {
  getDashboardStats,
  getIndustryMix,
  getConfidenceDistribution,
  getRecentSearches,
  getUserProfile,
} from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { IndustryMix } from "@/components/dashboard/industry-mix";
import { ConfidenceChart } from "@/components/dashboard/confidence-chart";
import { RecentSearches } from "@/components/dashboard/recent-searches";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard" };

// The demo's hero search, pre-run: misspelled input, resolved and corrected.
const HERO_SEARCH_URL =
  "/find/results?city=Austin&state=TX&q=computr+software&i=software-development";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const firstName = (getUserProfile(userId)?.name ?? "there").split(" ")[0];
  const stats = getDashboardStats(userId);
  const mix = getIndustryMix(userId);
  const distribution = getConfidenceDistribution(userId);
  const searches = getRecentSearches(userId, 5);

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
        description="Your pipeline at a glance."
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

      {/* The wow-moment, one click away — no typing required */}
      <Link
        href={HERO_SEARCH_URL}
        className="group mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-500/40 bg-brand-50/40 px-4 py-3 transition-colors hover:bg-brand-50/70 dark:bg-brand-50/20 dark:hover:bg-brand-50/30"
      >
        <span className="flex items-center gap-3">
          <Scale className="size-5 shrink-0 text-brand-600" aria-hidden />
          <span>
            <span className="block text-sm font-semibold">
              Watch the resolver handle a misspelled search
            </span>
            <span className="block text-xs text-text-2">
              “computr software” in Austin, corrected and resolved to NAICS
              541511 in one step.
            </span>
          </span>
        </span>
        <ArrowRight
          className="size-4 shrink-0 text-brand-600 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="text-base font-semibold">Industry mix of saved leads</h2>
            <p className="mt-0.5 text-xs text-text-3">
              Clean categories, straight from the resolver.
            </p>
            <div className="mt-4">
              <IndustryMix mix={mix} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="text-base font-semibold">Search confidence</h2>
            <p className="mt-0.5 text-xs text-text-3">
              How sure the resolver was on your recent searches.
            </p>
            <div className="mt-4">
              <ConfidenceChart distribution={distribution} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardContent>
          <h2 className="text-base font-semibold">Recent searches</h2>
          <p className="mt-0.5 text-xs text-text-3">
            Click a row to run it again.
          </p>
          <div className="mt-2">
            <RecentSearches searches={searches} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
