import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Edge-safe: authConfig has no database imports (see auth.config.ts).
export default NextAuth(authConfig).auth;

export const config = {
  // Protect everything except Auth.js routes, Next internals, and static files.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|ico|webmanifest)$).*)"],
};
