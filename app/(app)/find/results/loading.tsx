import { Skeleton } from "@/components/ui/skeleton";

// Skeleton rows, not a spinner — the layout holds its shape while loading.
export default function ResultsLoading() {
  return (
    <div>
      <div className="pb-6">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <Skeleton className="h-36 w-full rounded-lg" />
      <div className="mt-4 overflow-hidden rounded-lg border">
        <Skeleton className="h-10 w-full rounded-none" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-t px-4 py-3">
            <Skeleton className="size-4 rounded-sm" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="ml-auto h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
