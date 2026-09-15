"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ResultsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed py-24 text-center">
      <div className="max-w-sm px-4">
        <TriangleAlert className="mx-auto size-8 text-conf-med" aria-hidden />
        <p className="mt-4 text-sm font-medium">The search hit an error</p>
        <p className="mt-1 text-sm text-text-2">
          {error.digest ? `Reference: ${error.digest}` : "Something went wrong running this query."}
        </p>
        <Button className="mt-4" variant="outline" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
