"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  perPage,
  total,
}: {
  page: number;
  perPage: number;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (pages <= 1) return null;

  const go = (next: number) => {
    const search = new URLSearchParams(params);
    if (next <= 1) search.delete("page");
    else search.set("page", String(next));
    router.push(`${pathname}?${search.toString()}`, { scroll: false });
  };

  const from = (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);

  return (
    <div className="flex items-center justify-between gap-3 pt-3">
      <p className="text-xs text-text-2">
        <span className="font-mono tnum">{from.toLocaleString()}-{to.toLocaleString()}</span> of{" "}
        <span className="font-mono tnum">{total.toLocaleString()}</span>
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          disabled={page <= 1}
          onClick={() => go(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Button>
        <span className="px-2 font-mono text-xs text-text-2 tnum">
          {page} / {pages}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          disabled={page >= pages}
          onClick={() => go(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
