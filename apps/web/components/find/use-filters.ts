"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * URL-driven filter state (Apollo pattern): every filter lives in the query
 * string, so searches are shareable, back-button friendly, and rendered on
 * the server. Any change resets pagination.
 */
export function useFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const push = useCallback(
    (next: URLSearchParams) => {
      next.delete("page");
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [router, pathname],
  );

  const toggle = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params);
      const current = next.getAll(key);
      next.delete(key);
      const kept = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      for (const v of kept) next.append(key, v);
      push(next);
    },
    [params, push],
  );

  const set = useCallback(
    (key: string, value: string | undefined) => {
      const next = new URLSearchParams(params);
      if (value === undefined || value === "") next.delete(key);
      else next.set(key, value);
      push(next);
    },
    [params, push],
  );

  const replaceAll = useCallback(
    (entries: Record<string, string | string[] | number | undefined>) => {
      const next = new URLSearchParams();
      const tab = params.get("tab");
      if (tab) next.set("tab", tab);
      for (const [key, value] of Object.entries(entries)) {
        if (value === undefined || value === "") continue;
        if (Array.isArray(value)) for (const v of value) next.append(key, v);
        else next.set(key, String(value));
      }
      push(next);
    },
    [params, push],
  );

  const clearAll = useCallback(() => {
    const next = new URLSearchParams();
    const tab = params.get("tab");
    if (tab) next.set("tab", tab);
    push(next);
  }, [params, push]);

  const activeCount = Array.from(params.keys()).filter(
    (k) => !["tab", "page"].includes(k),
  ).length;

  return { params, toggle, set, replaceAll, clearAll, activeCount };
}
