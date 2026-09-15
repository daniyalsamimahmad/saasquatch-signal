import { Badge } from "@/components/ui/badge";
import { LogoMark } from "@/components/logo";

export function BrandMark({ className }: { className?: string }) {
  return <LogoMark className={className} />;
}

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
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
