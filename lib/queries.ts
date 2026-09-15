import { db } from "@/lib/db";

// Small typed read-model helpers. Counts feed the sidebar and dashboard —
// the numbers that read `0` forever in the original product (F-04).

export function userExists(userId: string): boolean {
  return !!db().prepare("SELECT 1 FROM users WHERE id = ?").get(userId);
}

export function getNavCounts(userId: string) {
  const lists = db()
    .prepare("SELECT COUNT(*) AS n FROM lists WHERE userId = ?")
    .get(userId) as { n: number };
  const drafts = db()
    .prepare("SELECT COUNT(*) AS n FROM drafts WHERE userId = ? AND status = 'draft'")
    .get(userId) as { n: number };
  return { lists: lists.n, drafts: drafts.n };
}

export type ListSummary = {
  id: string;
  name: string;
  updatedAt: string;
  count: number;
  industryMix: Array<{ industryId: string; n: number }>;
};

export function getListsForUser(userId: string): ListSummary[] {
  const lists = db()
    .prepare(
      `SELECT l.id, l.name, l.updatedAt, COUNT(li.id) AS count
       FROM lists l LEFT JOIN list_items li ON li.listId = l.id
       WHERE l.userId = ? GROUP BY l.id ORDER BY l.updatedAt DESC`,
    )
    .all(userId) as Array<Omit<ListSummary, "industryMix">>;

  const mixStmt = db().prepare(
    `SELECT c.industryId, COUNT(*) AS n
     FROM list_items li JOIN companies c ON c.id = li.companyId
     WHERE li.listId = ? GROUP BY c.industryId ORDER BY n DESC LIMIT 5`,
  );
  return lists.map((list) => ({
    ...list,
    industryMix: mixStmt.all(list.id) as Array<{ industryId: string; n: number }>,
  }));
}

export function getList(listId: string, userId: string) {
  const list = db()
    .prepare("SELECT * FROM lists WHERE id = ? AND userId = ?")
    .get(listId, userId) as
    | { id: string; userId: string; name: string; createdAt: string; updatedAt: string }
    | undefined;
  if (!list) return null;
  const companies = db()
    .prepare(
      `SELECT c.*, li.addedAt FROM list_items li
       JOIN companies c ON c.id = li.companyId
       WHERE li.listId = ? ORDER BY li.addedAt DESC, c.name`,
    )
    .all(listId) as Array<
    import("@/lib/search").CompanyRow & { addedAt: string }
  >;
  return { ...list, companies };
}

export type DraftSummary = {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  companyName: string;
  companyId: string;
  contactName: string | null;
  contactTitle: string | null;
  industryId: string;
};

export function getDraftsForUser(userId: string): DraftSummary[] {
  return db()
    .prepare(
      `SELECT d.id, d.subject, d.status, d.createdAt,
              c.name AS companyName, c.id AS companyId, c.industryId,
              ct.name AS contactName, ct.title AS contactTitle
       FROM drafts d
       JOIN companies c ON c.id = d.companyId
       LEFT JOIN contacts ct ON ct.id = d.contactId
       WHERE d.userId = ? ORDER BY d.createdAt DESC`,
    )
    .all(userId) as DraftSummary[];
}

export function getDraft(draftId: string, userId: string) {
  return db()
    .prepare("SELECT * FROM drafts WHERE id = ? AND userId = ?")
    .get(draftId, userId) as
    | {
        id: string;
        userId: string;
        companyId: string;
        contactId: string | null;
        subject: string;
        body: string;
        contextPoints: string;
        status: string;
        createdAt: string;
      }
    | undefined;
}

export function getCompany(companyId: string) {
  return db().prepare("SELECT * FROM companies WHERE id = ?").get(companyId) as
    | import("@/lib/search").CompanyRow
    | undefined;
}

export function getIndustryMix(userId: string) {
  return db()
    .prepare(
      `SELECT c.industryId, COUNT(DISTINCT c.id) AS n
       FROM list_items li
       JOIN lists l ON l.id = li.listId
       JOIN companies c ON c.id = li.companyId
       WHERE l.userId = ?
       GROUP BY c.industryId ORDER BY n DESC LIMIT 8`,
    )
    .all(userId) as Array<{ industryId: string; n: number }>;
}

export function getConfidenceDistribution(userId: string) {
  const rows = db()
    .prepare(
      `SELECT band, COUNT(*) AS n FROM search_logs
       WHERE userId = ? AND band IS NOT NULL GROUP BY band`,
    )
    .all(userId) as Array<{ band: string; n: number }>;
  const byBand = Object.fromEntries(rows.map((r) => [r.band, r.n]));
  return {
    low: byBand.low ?? 0,
    medium: byBand.medium ?? 0,
    high: byBand.high ?? 0,
  };
}

export function getRecentSearches(userId: string, limit = 5) {
  return db()
    .prepare(
      `SELECT query, resolvedIndustryId, confidence, band, resultCount, createdAt
       FROM search_logs WHERE userId = ?
       ORDER BY createdAt DESC LIMIT ?`,
    )
    .all(userId, limit) as Array<{
    query: string;
    resolvedIndustryId: string | null;
    confidence: number | null;
    band: string | null;
    resultCount: number;
    createdAt: string;
  }>;
}

export function getDashboardStats(userId: string) {
  const totalLeads = db()
    .prepare(
      `SELECT COUNT(DISTINCT li.companyId) AS n
       FROM list_items li JOIN lists l ON l.id = li.listId
       WHERE l.userId = ?`,
    )
    .get(userId) as { n: number };
  const lists = db()
    .prepare("SELECT COUNT(*) AS n FROM lists WHERE userId = ?")
    .get(userId) as { n: number };
  const drafts = db()
    .prepare("SELECT COUNT(*) AS n FROM drafts WHERE userId = ? AND status = 'draft'")
    .get(userId) as { n: number };
  const searchesThisWeek = db()
    .prepare(
      `SELECT COUNT(*) AS n FROM search_logs
       WHERE userId = ? AND createdAt >= datetime('now', '-7 days')`,
    )
    .get(userId) as { n: number };
  return {
    totalLeads: totalLeads.n,
    lists: lists.n,
    drafts: drafts.n,
    searchesThisWeek: searchesThisWeek.n,
  };
}
