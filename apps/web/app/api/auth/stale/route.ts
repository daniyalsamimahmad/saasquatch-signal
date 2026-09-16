import { signOut } from "@/auth";

/**
 * Clears a stale session, one whose JWT outlived the demo database reset
 * (the layout redirects here when the session's user no longer exists).
 * Cookie mutation is only allowed in route handlers / server actions,
 * which is why this isn't done in the layout itself.
 */
export async function GET() {
  return signOut({ redirectTo: "/login", redirect: true });
}
