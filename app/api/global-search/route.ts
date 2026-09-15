import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/** Header search: companies, the user's lists, and their drafts. */
export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json(
      { companies: [], lists: [], drafts: [] },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ companies: [], lists: [], drafts: [] });
  }
  const like = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;

  const companies = db()
    .prepare(
      `SELECT id, name, city, state FROM companies
       WHERE name LIKE ? ESCAPE '\\' ORDER BY name LIMIT 5`,
    )
    .all(like);

  const lists = db()
    .prepare(
      `SELECT l.id, l.name, COUNT(li.id) AS count
       FROM lists l LEFT JOIN list_items li ON li.listId = l.id
       WHERE l.userId = ? AND l.name LIKE ? ESCAPE '\\'
       GROUP BY l.id ORDER BY l.updatedAt DESC LIMIT 5`,
    )
    .all(userId, like);

  const drafts = db()
    .prepare(
      `SELECT d.id, d.subject, c.name AS companyName
       FROM drafts d JOIN companies c ON c.id = d.companyId
       WHERE d.userId = ? AND (d.subject LIKE ? ESCAPE '\\' OR c.name LIKE ? ESCAPE '\\')
       ORDER BY d.createdAt DESC LIMIT 5`,
    )
    .all(userId, like, like);

  return NextResponse.json({ companies, lists, drafts });
}
