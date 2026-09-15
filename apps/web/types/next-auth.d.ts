import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    apiToken: string;
    user: {
      id: string;
      plan: string;
    } & DefaultSession["user"];
  }

  interface User {
    apiToken?: string;
    plan?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    apiToken?: string;
    plan?: string;
  }
}
