import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js configuration.
 *
 * middleware.ts compiles for the Edge runtime, so this file carries only the
 * JWT/session logic and route authorization — zero API calls. The Credentials
 * provider (which talks to the NestJS API) lives in auth.ts and runs only in
 * the Node.js runtime.
 *
 * The API's own JWT rides inside the Auth.js session token; server components
 * and actions read it via session.apiToken and pass it as a Bearer header.
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
      if (user?.apiToken) token.apiToken = user.apiToken;
      if (user?.plan) token.plan = user.plan;
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.plan) session.user.plan = token.plan as string;
      session.apiToken = (token.apiToken as string) ?? "";
      return session;
    },
  },
} satisfies NextAuthConfig;
