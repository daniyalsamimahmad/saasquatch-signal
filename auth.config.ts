import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js configuration.
 *
 * middleware.ts compiles for the Edge runtime, which cannot load
 * better-sqlite3 (native module). So this file carries only the JWT/session
 * logic and route authorization — zero database imports. The full config
 * with the Credentials provider (bcrypt + SQLite) lives in auth.ts and runs
 * only in the Node.js runtime (server actions, route handlers).
 */

const PUBLIC_PATHS = ["/login", "/signup"];

export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  trustHost: true,
  providers: [], // filled in by auth.ts (Node runtime only)
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublic = PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p));
      if (isPublic) {
        // Signed-in users skip the auth screens.
        return isLoggedIn
          ? Response.redirect(new URL("/dashboard", nextUrl))
          : true;
      }
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
