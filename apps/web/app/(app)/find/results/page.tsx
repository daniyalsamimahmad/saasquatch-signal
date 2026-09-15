import type { Metadata } from "next";
import Link from "next/link";
import { OctagonX } from "lucide-react";
import { auth } from "@/auth";
import { searchCompanies, logSearch, getContactsForCompany } from "@/lib/search";
import { getListsForUser } from "@/lib/queries";
import { resolveIndustry, INDUSTRIES } from "@/lib/taxonomy/resolve";
import { TransparencyPanel } from "@/components/resolver/transparency-panel";
import { ResultsTable } from "@/components/results/results-table";
import type { ContactRow } from "@/components/results/company-drawer";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import type { SortKey } from "@/lib/search";

export const metadata: Metadata = { title: "Results" };

type Params = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;
const num = (v: string | string[] | undefined) => {
  const n = Number(first(v));
  return Number.isFinite(n) && first(v) !== undefined && first(v) !== ""
    ? n
    : undefined;
};

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const session = await auth();
  const params = await searchParams;

  const q = first(params.q) ?? "";
  const industryId = first(params.i);
  const keywordOnly = first(params.anyway) === "1";

  const resolution = resolveIndustry(q);
  const applied = industryId
    ? (INDUSTRIES.find((ind) => ind.id === industryId) ?? null)
    : null;

  // Direct-URL access with a low-confidence query and no explicit industry:
  // block here too — the refusal must hold at every entry point (F-01).
  if (!applied && !keywordOnly) {
    return (
      <div className="max-w-2xl">
        <PageHeader title="Search blocked" />
        <div className="rounded-lg border border-conf-low/40 bg-conf-low-subtle p-5" role="alert">
          <p className="flex items-center gap-2 font-medium text-conf-low">
            <OctagonX className="size-4" aria-hidden />
            Couldn&apos;t confidently work out what{" "}
            <span className="font-mono">&quot;{q.trim() || "(empty)"}&quot;</span> means.
          </p>
          <p className="mt-2 text-sm text-text-2">
            Rather than guess, pick what you meant:
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {resolution.alternatives.map((alt) => (
              <Button key={alt.industry.id} asChild variant="outline" size="sm">
                <Link href={`/find/results?q=${encodeURIComponent(q)}&i=${alt.industry.id}`}>
                  {alt.industry.label}
                </Link>
              </Button>
            ))}
            <Button asChild variant="ghost" size="sm">
              <Link href="/find">Back to search</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const result = searchCompanies({
    industryId: applied?.id,
    city: first(params.city),
    state: first(params.state),
    employeesMin: num(params.emin),
    employeesMax: num(params.emax),
    revenueBand: first(params.rev),
    foundedMin: num(params.fmin),
    foundedMax: num(params.fmax),
    keyword: first(params.kw),
    sort: (first(params.sort) as SortKey) ?? "name",
    dir: first(params.dir) === "desc" ? "desc" : "asc",
    page: num(params.page) ?? 1,
    perPage: num(params.per) ?? 25,
  });

  if (session?.user?.id && (num(params.page) ?? 1) === 1) {
    logSearch({
      userId: session.user.id,
      query: q || (applied?.label ?? ""),
      resolvedIndustryId: applied?.id ?? null,
      confidence: keywordOnly ? null : resolution.confidence,
      band: keywordOnly ? null : resolution.band,
      resultCount: result.total,
    });
  }

  const contactsByCompany: Record<string, ContactRow[]> = {};
  for (const row of result.rows) {
    contactsByCompany[row.id] = getContactsForCompany(row.id);
  }

  const location = first(params.city)
    ? `${first(params.city)}, ${first(params.state)}`
    : "all metros";

  return (
    <div>
      <PageHeader
        title="Results"
        description={`${result.total.toLocaleString("en-US")} companies · ${location}`}
      />
      <div className="space-y-4">
        <TransparencyPanel
          resolution={resolution}
          applied={applied}
          keywordOnly={keywordOnly}
          changeHref="/find"
        />
        <ResultsTable
          rows={result.rows}
          contactsByCompany={contactsByCompany}
          total={result.total}
          page={result.page}
          perPage={result.perPage}
          lists={
            session?.user?.id
              ? getListsForUser(session.user.id).map((l) => ({
                  id: l.id,
                  name: l.name,
                  count: l.count,
                }))
              : []
          }
        />
      </div>
    </div>
  );
}
