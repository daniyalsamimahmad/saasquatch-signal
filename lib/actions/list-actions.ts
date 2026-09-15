"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

type ActionResult<T = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

async function requireUser(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

const DEMO_RESET_MSG =
  "The demo database reset — sign in again and retry (hosted demo resets periodically).";

/**
 * F-04: their app discards search results — 150 found, dashboard reads 0,
 * nothing is saveable. This is the fix: the missing middle of the loop.
 */
export async function saveToList(args: {
  listId?: string;
  newListName?: string;
  companyIds: string[];
}): Promise<
  ActionResult<{
    listId: string;
    listName: string;
    added: number;
    /** exactly the companies this save inserted — the only ones Undo may remove */
    insertedIds: string[];
  }>
> {
  const userId = await requireUser();
  if (!userId) return { ok: false, error: "Not signed in." };
  if (args.companyIds.length === 0)
    return { ok: false, error: "Nothing selected." };

  try {
    let listId = args.listId;
    let listName = "";

    if (listId) {
      const list = db()
        .prepare("SELECT name FROM lists WHERE id = ? AND userId = ?")
        .get(listId, userId) as { name: string } | undefined;
      if (!list) return { ok: false, error: "List not found." };
      listName = list.name;
    } else {
      const name = (args.newListName ?? "").trim();
      if (!name) return { ok: false, error: "Give the new list a name." };
      if (name.length > 120) return { ok: false, error: "List name is too long." };
      listId = `ls_${crypto.randomUUID()}`;
      listName = name;
    }

    // SELECT-sourced insert: a companyId that no longer exists (stale client
    // after a demo reset) is skipped rather than aborting the whole batch on
    // the FK; the explicit conflict target means only a genuine duplicate
    // membership is ignored — an id collision would still error loudly.
    const insert = db().prepare(
      `INSERT INTO list_items (id, listId, companyId)
       SELECT @itemId, @listId, id FROM companies WHERE id = @companyId
       ON CONFLICT(listId, companyId) DO NOTHING`,
    );
    const insertedIds: string[] = [];
    const run = db().transaction(() => {
      if (!args.listId) {
        db()
          .prepare("INSERT INTO lists (id, userId, name) VALUES (?, ?, ?)")
          .run(listId, userId, listName);
      }
      for (const companyId of args.companyIds) {
        const result = insert.run({
          itemId: `li_${crypto.randomUUID()}`,
          listId,
          companyId,
        });
        if (result.changes === 1) insertedIds.push(companyId);
      }
      db()
        .prepare("UPDATE lists SET updatedAt = datetime('now') WHERE id = ?")
        .run(listId);
    });
    run();

    revalidatePath("/lists");
    revalidatePath("/dashboard");
    return {
      ok: true,
      listId,
      listName,
      added: insertedIds.length,
      insertedIds,
    };
  } catch {
    return { ok: false, error: DEMO_RESET_MSG };
  }
}

/** Undo for the save toast: remove exactly the companies that were added. */
export async function undoSaveToList(args: {
  listId: string;
  companyIds: string[];
  deleteListIfEmpty?: boolean;
}): Promise<ActionResult> {
  const userId = await requireUser();
  if (!userId) return { ok: false, error: "Not signed in." };
  try {
    const owned = db()
      .prepare("SELECT id FROM lists WHERE id = ? AND userId = ?")
      .get(args.listId, userId);
    if (!owned) return { ok: false, error: "List not found." };

    const remove = db().prepare(
      "DELETE FROM list_items WHERE listId = ? AND companyId = ?",
    );
    const run = db().transaction(() => {
      for (const companyId of args.companyIds) remove.run(args.listId, companyId);
      if (args.deleteListIfEmpty) {
        const left = db()
          .prepare("SELECT COUNT(*) AS n FROM list_items WHERE listId = ?")
          .get(args.listId) as { n: number };
        if (left.n === 0) {
          db().prepare("DELETE FROM lists WHERE id = ?").run(args.listId);
        }
      }
    });
    run();
    revalidatePath("/lists");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch {
    return { ok: false, error: DEMO_RESET_MSG };
  }
}

export async function renameList(
  listId: string,
  name: string,
): Promise<ActionResult> {
  const userId = await requireUser();
  if (!userId) return { ok: false, error: "Not signed in." };
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Name can't be empty." };
  try {
    const changed = db()
      .prepare(
        "UPDATE lists SET name = ?, updatedAt = datetime('now') WHERE id = ? AND userId = ?",
      )
      .run(trimmed, listId, userId).changes;
    if (!changed) return { ok: false, error: "List not found." };
    revalidatePath("/lists");
    revalidatePath(`/lists/${listId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: DEMO_RESET_MSG };
  }
}

export async function duplicateList(
  listId: string,
): Promise<ActionResult<{ newListId: string }>> {
  const userId = await requireUser();
  if (!userId) return { ok: false, error: "Not signed in." };
  try {
    const list = db()
      .prepare("SELECT name FROM lists WHERE id = ? AND userId = ?")
      .get(listId, userId) as { name: string } | undefined;
    if (!list) return { ok: false, error: "List not found." };

    const newListId = `ls_${crypto.randomUUID()}`;
    const run = db().transaction(() => {
      db()
        .prepare("INSERT INTO lists (id, userId, name) VALUES (?, ?, ?)")
        .run(newListId, userId, `${list.name} (copy)`);
      const items = db()
        .prepare("SELECT companyId, note FROM list_items WHERE listId = ?")
        .all(listId) as Array<{ companyId: string; note: string | null }>;
      const insert = db().prepare(
        "INSERT INTO list_items (id, listId, companyId, note) VALUES (?, ?, ?, ?)",
      );
      for (const item of items) {
        insert.run(`li_${crypto.randomUUID()}`, newListId, item.companyId, item.note);
      }
    });
    run();
    revalidatePath("/lists");
    return { ok: true, newListId };
  } catch {
    return { ok: false, error: DEMO_RESET_MSG };
  }
}

export async function deleteList(listId: string): Promise<ActionResult> {
  const userId = await requireUser();
  if (!userId) return { ok: false, error: "Not signed in." };
  try {
    const changed = db()
      .prepare("DELETE FROM lists WHERE id = ? AND userId = ?")
      .run(listId, userId).changes;
    if (!changed) return { ok: false, error: "List not found." };
    revalidatePath("/lists");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch {
    return { ok: false, error: DEMO_RESET_MSG };
  }
}

export async function removeFromList(
  listId: string,
  companyId: string,
): Promise<ActionResult> {
  const userId = await requireUser();
  if (!userId) return { ok: false, error: "Not signed in." };
  try {
    const owned = db()
      .prepare("SELECT id FROM lists WHERE id = ? AND userId = ?")
      .get(listId, userId);
    if (!owned) return { ok: false, error: "List not found." };
    db()
      .prepare("DELETE FROM list_items WHERE listId = ? AND companyId = ?")
      .run(listId, companyId);
    revalidatePath(`/lists/${listId}`);
    revalidatePath("/lists");
    return { ok: true };
  } catch {
    return { ok: false, error: DEMO_RESET_MSG };
  }
}
