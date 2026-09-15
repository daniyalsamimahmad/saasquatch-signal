"use server";

import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { db } from "@/lib/db";

type ActionResult = { ok: true } | { ok: false; error: string };

const DEMO_RESET_MSG =
  "The demo database reset — sign in again and retry (hosted demo resets periodically).";

export async function updateProfile(name: string): Promise<ActionResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "Not signed in." };
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (trimmed.length < 2 || trimmed.length > 80)
    return { ok: false, error: "Name must be 2–80 characters." };
  try {
    const changed = db()
      .prepare("UPDATE users SET name = ? WHERE id = ?")
      .run(trimmed, userId).changes;
    if (!changed) return { ok: false, error: DEMO_RESET_MSG };
    return { ok: true };
  } catch {
    return { ok: false, error: DEMO_RESET_MSG };
  }
}

export async function changePassword(
  current: string,
  next: string,
): Promise<ActionResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "Not signed in." };
  if (typeof next !== "string" || next.length < 8)
    return { ok: false, error: "New password must be at least 8 characters." };
  try {
    const user = db()
      .prepare("SELECT passwordHash FROM users WHERE id = ?")
      .get(userId) as { passwordHash: string } | undefined;
    if (!user) return { ok: false, error: DEMO_RESET_MSG };
    const valid = await bcrypt.compare(current ?? "", user.passwordHash);
    if (!valid) return { ok: false, error: "Current password doesn't match." };
    db()
      .prepare("UPDATE users SET passwordHash = ? WHERE id = ?")
      .run(bcrypt.hashSync(next, 10), userId);
    return { ok: true };
  } catch {
    return { ok: false, error: DEMO_RESET_MSG };
  }
}
