import { redirect } from "next/navigation";
import { auth } from "@/auth";

/**
 * Server-side session guard. Every (app) page and server action calls this.
 * No session at all → /login (middleware backstop). A session WITHOUT an
 * apiToken is a cookie from before the API cutover: it must be signed out
 * through the stale route, or the middleware (which only checks that a
 * session exists) would bounce /login straight back here in a loop.
 */
export async function requireSession() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!session.apiToken) redirect("/api/auth/stale");
  return session;
}
