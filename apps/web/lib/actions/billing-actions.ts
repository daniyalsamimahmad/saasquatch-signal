"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

type ActionResult = { ok: true } | { ok: false; error: string };

const PLANS = ["free", "pro", "team"] as const;
export type Plan = (typeof PLANS)[number];

/**
 * Plan changes are simulated end to end: no card is collected and no money
 * moves. The dialog says so before this ever runs.
 */
export async function changePlan(plan: Plan): Promise<ActionResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "Not signed in." };
  if (!PLANS.includes(plan)) return { ok: false, error: "Unknown plan." };
  try {
    const changed = db()
      .prepare("UPDATE users SET plan = ? WHERE id = ?")
      .run(plan, userId).changes;
    if (!changed) return { ok: false, error: "Sign in again and retry." };
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong. Try again." };
  }
}
