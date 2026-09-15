import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { apiFetch } from "@/lib/api";
import { loginSchema } from "@/lib/validators";

type LoginResponse = {
  token: string;
  user: { id: string; email: string; name: string; plan: string };
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        try {
          const res = await apiFetch<LoginResponse>("/auth/login", {
            method: "POST",
            body: parsed.data,
          });
          return {
            id: res.user.id,
            name: res.user.name,
            email: res.user.email,
            plan: res.user.plan,
            apiToken: res.token,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
});
