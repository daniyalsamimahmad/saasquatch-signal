"use server";

import { apiFetch, ApiError } from "@/lib/api";
import { requireSession } from "@/lib/session";
import type { EmailVerdict, PhoneVerdict } from "@/lib/types";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function fail(err: unknown): { ok: false; error: string } {
  return {
    ok: false,
    error: err instanceof ApiError ? err.message : "Validation failed. Try again.",
  };
}

export async function validateEmail(
  email: string,
  deep = false,
): Promise<Result<EmailVerdict>> {
  const session = await requireSession();
  try {
    const data = await apiFetch<EmailVerdict>("/validate/email", {
      method: "POST",
      body: { email, deep },
      token: session.apiToken,
    });
    return { ok: true, data };
  } catch (err) {
    return fail(err);
  }
}

export async function validatePhone(
  phone: string,
  country = "US",
): Promise<Result<PhoneVerdict>> {
  const session = await requireSession();
  try {
    const data = await apiFetch<PhoneVerdict>("/validate/phone", {
      method: "POST",
      body: { phone, country },
      token: session.apiToken,
    });
    return { ok: true, data };
  } catch (err) {
    return fail(err);
  }
}

export async function validateBulk(
  kind: "email" | "phone",
  values: string[],
): Promise<Result<{ results: Array<EmailVerdict | PhoneVerdict> }>> {
  const session = await requireSession();
  try {
    const data = await apiFetch<{ results: Array<EmailVerdict | PhoneVerdict> }>(
      "/validate/bulk",
      { method: "POST", body: { kind, values }, token: session.apiToken },
    );
    return { ok: true, data };
  } catch (err) {
    return fail(err);
  }
}
