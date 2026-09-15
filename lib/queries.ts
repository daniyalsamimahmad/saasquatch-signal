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
