"use server";

import { apiFetch, ApiError } from "@/lib/api";
import { requireSession } from "@/lib/session";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function fail(err: unknown): { ok: false; error: string } {
  return {
    ok: false,
    error: err instanceof ApiError ? err.message : "Something went wrong. Try again.",
  };
}

export type NlFilters = Record<string, string | number | string[] | undefined>;

/** Natural-language prompt → filter state (Apollo's NL search pattern). */
export async function nlSearch(
  prompt: string,
  tab: "people" | "companies",
): Promise<Result<NlFilters>> {
  const session = await requireSession();
  try {
    const data = await apiFetch<NlFilters>("/search/nl", {
      method: "POST",
      body: { prompt, tab },
      token: session.apiToken,
    });
    return { ok: true, data };
  } catch (err) {
    return fail(err);
  }
}

export type EnrichReport = {
  company: {
    id: string;
    name: string;
    industry: string | null;
    employeeCount: number | null;
    city: string | null;
    state: string | null;
    _count: { contacts: number };
  } | null;
  report: Record<string, string>;
};

/** Live import of real data for one domain (Apollo org + Hunter people). */
export async function enrichDomain(domain: string): Promise<Result<EnrichReport>> {
  const session = await requireSession();
  try {
    const data = await apiFetch<EnrichReport>("/search/enrich-domain", {
      method: "POST",
      body: { domain },
      token: session.apiToken,
    });
    return { ok: true, data };
  } catch (err) {
    return fail(err);
  }
}
