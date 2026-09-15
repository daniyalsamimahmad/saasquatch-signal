"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/lib/api";
import { requireSession } from "@/lib/session";
import type { Plan, WritingBrief } from "@/lib/types";

type Result = { ok: true } | { ok: false; error: string };

function fail(err: unknown): { ok: false; error: string } {
  return {
    ok: false,
    error: err instanceof ApiError ? err.message : "Something went wrong. Try again.",
  };
}

export async function updateProfile(name: string): Promise<Result> {
  const session = await requireSession();
  try {
    await apiFetch("/auth/profile", {
      method: "PATCH",
      body: { name },
      token: session.apiToken,
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function changePassword(
  current: string,
  next: string,
): Promise<Result> {
  const session = await requireSession();
  try {
    await apiFetch("/auth/password", {
      method: "PATCH",
      body: { current, next },
      token: session.apiToken,
    });
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

export async function changePlan(plan: Plan): Promise<Result> {
  const session = await requireSession();
  try {
    await apiFetch("/auth/plan", {
      method: "PATCH",
      body: { plan: plan.toUpperCase() },
      token: session.apiToken,
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}

/** Persist the reusable AI writing brief (Apollo "AI Content Center" pattern). */
export async function saveBrief(brief: WritingBrief): Promise<Result> {
  const session = await requireSession();
  try {
    await apiFetch("/ai/brief", {
      method: "PUT",
      body: brief,
      token: session.apiToken,
    });
    revalidatePath("/settings");
    return { ok: true };
  } catch (err) {
    return fail(err);
  }
}
