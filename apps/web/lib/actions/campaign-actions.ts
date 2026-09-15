"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { requireSession } from "@/lib/session";
import type { WritingBrief } from "@/lib/types";

type Result<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function fail(err: unknown): { ok: false; error: string } {
  return {
    ok: false,
    error: err instanceof ApiError ? err.message : "Something went wrong. Try again.",
  };
}

/**
 * Create a campaign from the 4-field brief (lemlist pattern) and jump
 * straight into it. AI generates the step sequence when providers exist;
 * the API falls back to solid templates otherwise.
 */
export async function createCampaign(input: {
  name?: string;
  brief: WritingBrief;
  steps?: number;
}): Promise<Result> {
  const session = await requireSession();
  let id: string;
  try {
    const campaign = await apiFetch<{ id: string }>("/campaigns", {
      method: "POST",
      body: { ...input, aiGenerate: true },
      token: session.apiToken,
    });
    id = campaign.id;
  } catch (err) {
    return fail(err);
  }
  revalidatePath("/campaigns");
  redirect(`/campaigns/${id}`);
}

export async function updateStep(
  campaignId: string,
  stepId: string,
  patch: { subjectTpl?: string; bodyTpl?: string; waitDays?: number },
): Promise<Result> {
  const session = await requireSession();
  try {
    await apiFetch(`/campaigns/${campaignId}/steps/${stepId}`, {
      method: "PATCH",
      body: patch,
      token: session.apiToken,
    });
    revalidatePath(`/campaigns/${campaignId}`);
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function addContactsToCampaign(
  campaignId: string,
  input: { contactIds?: string[]; listId?: string },
): Promise<Result<{ added: number }>> {
  const session = await requireSession();
  try {
    const data = await apiFetch<{ added: number }>(
      `/campaigns/${campaignId}/contacts`,
      { method: "POST", body: input, token: session.apiToken },
    );
    revalidatePath(`/campaigns/${campaignId}`);
    return { ok: true, data };
  } catch (err) {
    return fail(err);
  }
}

export async function generateDrafts(
  campaignId: string,
): Promise<Result<{ queued: number }>> {
  const session = await requireSession();
  try {
    const data = await apiFetch<{ queued: number }>(
      `/campaigns/${campaignId}/generate`,
      { method: "POST", token: session.apiToken },
    );
    revalidatePath(`/campaigns/${campaignId}`);
    return { ok: true, data };
  } catch (err) {
    return fail(err);
  }
}

export async function launchCampaign(
  campaignId: string,
): Promise<Result<{ queued: number }>> {
  const session = await requireSession();
  try {
    const data = await apiFetch<{ queued: number }>(
      `/campaigns/${campaignId}/launch`,
      { method: "POST", token: session.apiToken },
    );
    revalidatePath(`/campaigns/${campaignId}`);
    return { ok: true, data };
  } catch (err) {
    return fail(err);
  }
}

/** Compliant LinkedIn flow: mark a drafted message as copied to clipboard. */
export async function markLinkedInCopied(
  campaignId: string,
  messageId: string,
): Promise<Result> {
  const session = await requireSession();
  try {
    await apiFetch(`/campaigns/${campaignId}/linkedin-tasks/${messageId}/copied`, {
      method: "POST",
      token: session.apiToken,
    });
    revalidatePath(`/campaigns/${campaignId}`);
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}
