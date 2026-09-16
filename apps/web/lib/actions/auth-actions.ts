"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { apiFetch, ApiError } from "@/lib/api";
import { loginSchema, signupSchema, DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/validators";

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
    throw err; // NEXT_REDIRECT on success, let Next handle it
  }
}

export async function demoLoginAction(): Promise<AuthFormState> {
  // The reviewer path: one click, zero typing.
  try {
    await signIn("credentials", {
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      redirectTo: "/dashboard",
    });
    return {};
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Demo sign-in failed. Is the API running with seed data?" };
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

  const { name, email, password } = parsed.data;
  try {
    await apiFetch("/auth/register", {
      method: "POST",
      body: { name, email, password },
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      return { fieldErrors: { email: ["An account with this email already exists"] } };
    }
    return { error: "Could not create the account. Is the API running?" };
  }

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
