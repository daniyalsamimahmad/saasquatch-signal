import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-md bg-primary font-display text-base font-bold text-primary-foreground",
        className,
      )}
      aria-hidden
    >
      S
    </span>
  );
}

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-base font-bold tracking-tight">
            SaaSquatch <span className="text-brand-600">Leads</span>
          </span>
          <Badge
            variant="outline"
            className="mt-1 w-fit rounded-sm px-1 py-0 text-[10px] tracking-[0.08em] text-text-3"
          >
            PROTOTYPE
          </Badge>
        </span>
      )}
    </span>
  );
}
