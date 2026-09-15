"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/lib/api";
import { requireSession } from "@/lib/session";
import type { ListSummary } from "@/lib/types";

type Result<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function fail(err: unknown): { ok: false; error: string } {
  return {
    ok: false,
    error: err instanceof ApiError ? err.message : "Something went wrong. Try again.",
  };
}

export async function createList(
  name: string,
  kind: "people" | "companies",
): Promise<Result<ListSummary>> {
  const session = await requireSession();
  try {
    const list = await apiFetch<ListSummary>("/lists", {
      method: "POST",
      body: { name, kind },
      token: session.apiToken,
    });
    revalidatePath("/lists");
    return { ok: true, data: list };
  } catch (err) {
    return fail(err);
  }
}

export async function renameList(id: string, name: string): Promise<Result> {
  const session = await requireSession();
  try {
    await apiFetch(`/lists/${id}`, {
      method: "PATCH",
      body: { name },
      token: session.apiToken,
    });
    revalidatePath("/lists");
    revalidatePath(`/lists/${id}`);
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteList(id: string): Promise<Result> {
  const session = await requireSession();
  try {
    await apiFetch(`/lists/${id}`, { method: "DELETE", token: session.apiToken });
    revalidatePath("/lists");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

/** Save selected search rows into a list — optionally creating it first. */
export async function saveToList(input: {
  listId?: string;
  newListName?: string;
  kind: "people" | "companies";
  contactIds?: string[];
  companyIds?: string[];
}): Promise<Result<{ added: number; listId: string; listName: string }>> {
  const session = await requireSession();
  try {
    let listId = input.listId;
    let listName = "";
    if (!listId) {
      const created = await apiFetch<ListSummary>("/lists", {
        method: "POST",
        body: { name: input.newListName ?? "New list", kind: input.kind },
        token: session.apiToken,
      });
      listId = created.id;
      listName = created.name;
    }
    const { added } = await apiFetch<{ added: number }>(`/lists/${listId}/items`, {
      method: "POST",
      body: { contactIds: input.contactIds, companyIds: input.companyIds },
      token: session.apiToken,
    });
    revalidatePath("/lists");
    revalidatePath(`/lists/${listId}`);
    return { ok: true, data: { added, listId, listName } };
  } catch (err) {
    return fail(err);
  }
}

export async function removeListItem(listId: string, itemId: string): Promise<Result> {
  const session = await requireSession();
  try {
    await apiFetch(`/lists/${listId}/items/${itemId}`, {
      method: "DELETE",
      token: session.apiToken,
    });
    revalidatePath(`/lists/${listId}`);
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}
