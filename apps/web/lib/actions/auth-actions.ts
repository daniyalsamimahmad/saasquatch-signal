"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { loginSchema, signupSchema, DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";

export type AuthFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  if (!rateLimit(`login:${parsed.data.email}`, 5, 60_000)) {
    return { error: "Too many attempts. Wait a minute and try again." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
    return {};
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "That email and password don't match our records." };
    }
    throw err; // NEXT_REDIRECT on success — let Next handle it
  }
}

export async function demoLoginAction(): Promise<AuthFormState> {
  // The reviewer path: one click, zero typing. Rate limit still applies.
  if (!rateLimit(`login:${DEMO_EMAIL}`, 5, 60_000)) {
    return { error: "Too many attempts. Wait a minute and try again." };
  }
  try {
    await signIn("credentials", {
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      redirectTo: "/dashboard",
    });
    return {};
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Demo sign-in failed. Run npm run seed, then retry." };
    }
    throw err;
  }
}

export async function signupAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  if (!rateLimit(`signup:${parsed.data.email}`, 5, 60_000)) {
    return { error: "Too many attempts. Wait a minute and try again." };
  }

  const { name, email, password } = parsed.data;
  const existing = db()
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(email);
  if (existing) {
    return { fieldErrors: { email: ["An account with this email already exists"] } };
  }

  db()
    .prepare("INSERT INTO users (id, name, email, passwordHash) VALUES (?, ?, ?, ?)")
    .run(`user_${crypto.randomUUID().slice(0, 8)}`, name, email, bcrypt.hashSync(password, 10));

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
    return {};
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Account created. Sign in to continue." };
    }
    throw err;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
