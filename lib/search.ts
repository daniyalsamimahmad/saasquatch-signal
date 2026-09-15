import { db } from "@/lib/db";
import { REVENUE_BANDS } from "@/lib/metros";

export type SearchFilters = {
  industryId?: string; // canonical id — or undefined for keyword-only "search anyway"
  city?: string;
  state?: string;
  employeesMin?: number;
  employeesMax?: number;
  revenueBand?: string;
  foundedMin?: number;
  foundedMax?: number;
  keyword?: string;
  sort?: SortKey;
  dir?: "asc" | "desc";
  page?: number;
  perPage?: number;
};

export type CompanyRow = {
  id: string;
  name: string;
  website: string;
  linkedin: string;
  description: string;
  industryId: string;
  rawIndustry: string;
  naicsCode: string;
  city: string;
  state: string;
  employeeCount: number;
  revenueBand: string;
  foundedYear: number;
};

const SORTABLE = {
  name: "name",
  location: "state, city",
  employees: "employeeCount",
  revenue: "revenueBand",
  founded: "foundedYear",
} as const;
export type SortKey = keyof typeof SORTABLE;

export function searchCompanies(filters: SearchFilters): {
  rows: CompanyRow[];
  total: number;
  page: number;
  perPage: number;
} {
  const where: string[] = [];
  const params: Record<string, unknown> = {};

  if (filters.industryId) {
    where.push("industryId = @industryId");
    params.industryId = filters.industryId;
  }
  if (filters.city) {
    where.push("city = @city");
    params.city = filters.city;
  }
  if (filters.state) {
    where.push("state = @state");
    params.state = filters.state;
  }
  if (filters.employeesMin !== undefined) {
    where.push("employeeCount >= @employeesMin");
    params.employeesMin = filters.employeesMin;
  }
  if (filters.employeesMax !== undefined) {
    where.push("employeeCount <= @employeesMax");
    params.employeesMax = filters.employeesMax;
  }
  if (filters.revenueBand) {
    where.push("revenueBand = @revenueBand");
    params.revenueBand = filters.revenueBand;
  }
  if (filters.foundedMin !== undefined) {
    where.push("foundedYear >= @foundedMin");
    params.foundedMin = filters.foundedMin;
  }
  if (filters.foundedMax !== undefined) {
    where.push("foundedYear <= @foundedMax");
    params.foundedMax = filters.foundedMax;
  }
  if (filters.keyword) {
    where.push(
      "(name LIKE @kw OR description LIKE @kw OR rawIndustry LIKE @kw)",
    );
    params.kw = `%${filters.keyword}%`;
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  // Own-property check: `?sort=constructor` must not walk the prototype
  // chain into the interpolated ORDER BY (crash today, injection tomorrow).
  const sortKey: SortKey =
    filters.sort && Object.hasOwn(SORTABLE, filters.sort) ? filters.sort : "name";
  // Revenue bands are ordinal, not alphabetical — order by rank.
  const revenueCase = `CASE revenueBand ${REVENUE_BANDS.map(
    (band, rank) => `WHEN '${band.replace(/'/g, "''")}' THEN ${rank}`,
  ).join(" ")} ELSE ${REVENUE_BANDS.length} END`;
  const orderCol = sortKey === "revenue" ? revenueCase : SORTABLE[sortKey];
  const dir = filters.dir === "desc" ? "DESC" : "ASC";

  const perPage = [25, 50, 100].includes(filters.perPage ?? 25)
    ? (filters.perPage ?? 25)
    : 25;

  const total = (
    db()
      .prepare(`SELECT COUNT(*) AS n FROM companies ${whereSql}`)
      .get(params) as { n: number }
  ).n;

  // Integer-clamp (fractional OFFSET is a SQLite error) and never point past
  // the last real page — an out-of-range URL shows the final page, not a
  // false "no matches" dead end.
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(lastPage, Math.max(1, Math.trunc(filters.page ?? 1) || 1));

  const rows = db()
    .prepare(
      `SELECT * FROM companies ${whereSql}
       ORDER BY ${orderCol} ${dir}, name ASC
       LIMIT @limit OFFSET @offset`,
    )
    .all({ ...params, limit: perPage, offset: (page - 1) * perPage }) as CompanyRow[];

  return { rows, total, page, perPage };
}

export function logSearch(args: {
  userId: string;
  query: string;
  resolvedIndustryId: string | null;
  confidence: number | null;
  band: string | null;
  resultCount: number;
}) {
  // Renders replay (refresh, sort clicks, back/forward all re-render page 1)
  // — only log when this differs from the user's latest recent search, so
  // the history reflects searches, not renders.
  const recent = db()
    .prepare(
      `SELECT query, resolvedIndustryId FROM search_logs
       WHERE userId = ? AND createdAt >= datetime('now', '-10 minutes')
       ORDER BY createdAt DESC LIMIT 1`,
    )
    .get(args.userId) as
    | { query: string; resolvedIndustryId: string | null }
    | undefined;
  if (
    recent &&
    recent.query === args.query &&
    recent.resolvedIndustryId === args.resolvedIndustryId
  ) {
    return;
  }
  db()
    .prepare(
      `INSERT INTO search_logs (id, userId, query, resolvedIndustryId, confidence, band, resultCount)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      `sl_${crypto.randomUUID().slice(0, 10)}`,
      args.userId,
      args.query,
      args.resolvedIndustryId,
      args.confidence,
      args.band,
      args.resultCount,
    );
}

export function getContactsForCompany(companyId: string) {
  return db()
    .prepare("SELECT * FROM contacts WHERE companyId = ? ORDER BY name")
    .all(companyId) as Array<{
    id: string;
    companyId: string;
    name: string;
    title: string;
    email: string;
    linkedin: string | null;
  }>;
}
