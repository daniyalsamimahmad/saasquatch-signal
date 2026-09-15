"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getCompany } from "@/lib/queries";
import { getContactsForCompany } from "@/lib/search";
import { INDUSTRIES } from "@/lib/taxonomy/resolve";
import { generateContextPoints, generateEmail } from "@/lib/outreach/templates";

const industryById = new Map(INDUSTRIES.map((i) => [i.id, i]));

type ActionResult<T = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

const DEMO_RESET_MSG =
  "Could not reach your account data. Sign in again and retry.";

/**
 * F-05: their Email Generator asks the human to type 60+ words of context
 * per lead, then paraphrases it. Here the tool writes the first draft from
 * data it already holds — deterministically, no LLM — and the human edits.
 */
export async function draftOutreach(
  companyIds: string[],
): Promise<ActionResult<{ created: number; firstDraftId: string | null }>> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "Not signed in." };
  if (companyIds.length === 0) return { ok: false, error: "Nothing selected." };

  try {
    const insert = db().prepare(
      `INSERT INTO drafts (id, userId, companyId, contactId, subject, body, contextPoints, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')`,
    );
    let created = 0;
    let firstDraftId: string | null = null;

    const run = db().transaction(() => {
      for (const companyId of companyIds) {
        const company = getCompany(companyId);
        if (!company) continue;
        // Skip if any un-sent draft for this company already exists — repeat
        // clicks must not fill the queue with duplicates (a 'ready' draft is
        // still in the queue).
        const existing = db()
          .prepare(
            "SELECT id FROM drafts WHERE userId = ? AND companyId = ? AND status IN ('draft','ready')",
          )
          .get(userId, companyId) as { id: string } | undefined;
        if (existing) {
          firstDraftId = firstDraftId ?? existing.id;
          continue;
        }

        const contacts = getContactsForCompany(companyId);
        const contact = contacts[0] ?? null;
        const canonical = industryById.get(company.industryId) ?? null;
        const points = generateContextPoints(company, canonical, 0);
        const email = generateEmail(company, contact, canonical, points, 0);

        const draftId = `dr_${crypto.randomUUID()}`;
        insert.run(
          draftId,
          userId,
          companyId,
          contact?.id ?? null,
          email.subject,
          email.body,
          JSON.stringify(points),
        );
        created++;
        firstDraftId = firstDraftId ?? draftId;
      }
    });
    run();

    revalidatePath("/outreach");
    revalidatePath("/dashboard");
    return { ok: true, created, firstDraftId };
  } catch {
    return { ok: false, error: DEMO_RESET_MSG };
  }
}

/** "Draft outreach for all" from a list page — then jump to the queue. */
export async function draftOutreachForList(listId: string): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  const companyIds = (
    db()
      .prepare(
        `SELECT li.companyId FROM list_items li
         JOIN lists l ON l.id = li.listId
         WHERE li.listId = ? AND l.userId = ?`,
      )
      .all(listId, userId) as Array<{ companyId: string }>
  ).map((r) => r.companyId);
  await draftOutreach(companyIds);
  redirect("/outreach");
}

export async function updateDraft(args: {
  draftId: string;
  subject: string;
  body: string;
  contextPoints: [string, string, string];
  status?: "draft" | "ready";
}): Promise<ActionResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "Not signed in." };

  // Server actions are public POST endpoints — the TypeScript signature
  // validates nothing at runtime. Reject malformed payloads outright.
  const status = args.status ?? "draft";
  if (!["draft", "ready"].includes(status))
    return { ok: false, error: "Invalid status." };
  if (
    !Array.isArray(args.contextPoints) ||
    args.contextPoints.length !== 3 ||
    args.contextPoints.some((p) => typeof p !== "string" || p.length > 5000)
  )
    return { ok: false, error: "Invalid context points." };
  if (typeof args.subject !== "string" || args.subject.length > 500)
    return { ok: false, error: "Subject too long." };
  if (typeof args.body !== "string" || args.body.length > 20000)
    return { ok: false, error: "Body too long." };

  try {
    const changed = db()
      .prepare(
        `UPDATE drafts SET subject = ?, body = ?, contextPoints = ?, status = ?
         WHERE id = ? AND userId = ?`,
      )
      .run(
        args.subject,
        args.body,
        JSON.stringify(args.contextPoints),
        status,
        args.draftId,
        userId,
      ).changes;
    if (!changed) return { ok: false, error: "Draft not found." };
    revalidatePath("/outreach");
    revalidatePath("/dashboard"); // draft/ready flips move the sidebar + stat counts
    return { ok: true };
  } catch {
    return { ok: false, error: DEMO_RESET_MSG };
  }
}

export async function deleteDraft(draftId: string): Promise<ActionResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "Not signed in." };
  try {
    const changed = db()
      .prepare("DELETE FROM drafts WHERE id = ? AND userId = ?")
      .run(draftId, userId).changes;
    if (!changed) return { ok: false, error: "Draft not found." };
    revalidatePath("/outreach");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch {
    return { ok: false, error: DEMO_RESET_MSG };
  }
}
