import type { Metadata } from "next";
import { requireSession } from "@/lib/session";
import { apiFetch } from "@/lib/api";
import type {
  Contact,
  CompanyRow,
  Facets,
  ListSummary,
  CampaignSummary,
  SearchResult,
} from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { FindTabs } from "@/components/find/find-tabs";
import { FilterRail } from "@/components/find/filter-rail";
import { NlSearchBar } from "@/components/find/nl-search-bar";
import { EnrichDialog } from "@/components/find/enrich-dialog";
import { PeopleResults } from "@/components/find/people-results";
import { CompanyResults } from "@/components/find/company-results";

export const metadata: Metadata = { title: "Find leads" };

type Params = Record<string, string | string[] | undefined>;

const list = (v: string | string[] | undefined): string[] | undefined =>
  v === undefined ? undefined : Array.isArray(v) ? v : [v];

const one = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;

/** "51-200" | "1000+" → {min, max} */
function employeeRange(v?: string) {
  if (!v) return {};
  if (v.endsWith("+")) return { employeesMin: Number(v.slice(0, -1)) };
  const [min, max] = v.split("-").map(Number);
  return {
    ...(Number.isFinite(min) ? { employeesMin: min } : {}),
    ...(Number.isFinite(max) ? { employeesMax: max } : {}),
  };
}

export default async function FindPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const tab = one(params.tab) === "companies" ? "companies" : "people";
  const page = Math.max(1, Number(one(params.page)) || 1);

  const shared = {
    q: one(params.q),
    industries: list(params.industries),
    locations: list(params.locations),
    tech: list(params.tech),
    ...employeeRange(one(params.employees)),
    page,
    perPage: 25,
  };

  const token = session.apiToken;
  const [facets, lists, campaigns, people, companies] = await Promise.all([
    apiFetch<Facets>("/search/facets", { token }),
    apiFetch<ListSummary[]>("/lists", { token }),
    apiFetch<CampaignSummary[]>("/campaigns", { token }),
    tab === "people"
      ? apiFetch<SearchResult<Contact>>("/search/people", {
          token,
          searchParams: {
            ...shared,
            titles: list(params.titles),
            seniorities: list(params.seniorities),
            departments: list(params.departments),
            emailStatus: list(params.emailStatus),
          },
        })
      : null,
    tab === "companies"
      ? apiFetch<SearchResult<CompanyRow>>("/search/companies", {
          token,
          searchParams: shared,
        })
      : null,
  ]);

  return (
    <>
      <PageHeader
        title="Find leads"
        description="Filter the index by persona and company, or describe who you want in plain English."
        actions={<EnrichDialog />}
      />

      <NlSearchBar tab={tab} />

      <div className="mt-4 flex flex-col gap-6 lg:flex-row">
        <FilterRail tab={tab} facets={facets} />

        <div className="min-w-0 flex-1">
          <FindTabs
            tab={tab}
            peopleTotal={tab === "people" ? (people?.total ?? 0) : undefined}
            companiesTotal={tab === "companies" ? (companies?.total ?? 0) : undefined}
          />
          {tab === "people" && people && (
            <PeopleResults
              result={people}
              lists={lists.filter((l) => l.kind === "people")}
              campaigns={campaigns}
            />
          )}
          {tab === "companies" && companies && (
            <CompanyResults
              result={companies}
              lists={lists.filter((l) => l.kind === "companies")}
            />
          )}
        </div>
      </div>
    </>
  );
}
