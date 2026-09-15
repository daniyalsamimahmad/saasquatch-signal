import { Hammer } from "lucide-react";

/** Placeholder body for routes whose sprint hasn't landed yet. */
export function ComingSoon({ sprint, what }: { sprint: number; what: string }) {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed py-24 text-center">
      <div className="max-w-sm px-4">
        <Hammer className="mx-auto size-8 text-text-3" aria-hidden />
        <p className="mt-4 text-sm font-medium">{what}</p>
        <p className="mt-1 text-sm text-text-2">
          Lands in Sprint {sprint} of the build plan.
        </p>
      </div>
    </div>
  );
}
