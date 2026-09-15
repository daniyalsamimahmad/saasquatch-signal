import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { apiFetch } from "@/lib/api";
import type { Contact, ListSummary, CampaignSummary, SearchResult } from "@/lib/types";

/**
 * ⌘K palette backend: one debounced query fans out to the API's people
 * search plus the user's lists and campaigns (both small, filtered here).
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.apiToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ people: [], lists: [], campaigns: [] });
  }

  const token = session.apiToken;
  const [people, lists, campaigns] = await Promise.all([
    apiFetch<SearchResult<Contact>>("/search/people", {
      token,
      searchParams: { q, perPage: 5 },
    }).catch(() => ({ rows: [] as Contact[] })),
    apiFetch<ListSummary[]>("/lists", { token }).catch(() => [] as ListSummary[]),
    apiFetch<CampaignSummary[]>("/campaigns", { token }).catch(
      () => [] as CampaignSummary[],
    ),
  ]);

  const needle = q.toLowerCase();
  return NextResponse.json({
    people: people.rows.map((c) => ({
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
      title: c.title ?? "",
      companyName: c.company?.name ?? "",
    })),
    lists: lists
      .filter((l) => l.name.toLowerCase().includes(needle))
      .slice(0, 5)
      .map((l) => ({ id: l.id, name: l.name, count: l._count.items })),
    campaigns: campaigns
      .filter((c) => c.name.toLowerCase().includes(needle))
      .slice(0, 5)
      .map((c) => ({ id: c.id, name: c.name, status: c.status })),
  });
}
