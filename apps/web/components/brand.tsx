import { LogoMark } from "@/components/logo";

export function BrandMark({ className }: { className?: string }) {
  return <LogoMark className={className ?? "size-9"} />;
}

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <LogoMark className="size-10" />
      {!compact && (
        <span className="font-display text-lg font-bold tracking-tight">
          SaaSquatch <span className="text-brand-600">Leads</span>
        </span>
      )}
    </span>
  );
}
