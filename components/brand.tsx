import { LogoMark } from "@/components/logo";

export function BrandMark({ className }: { className?: string }) {
  return <LogoMark className={className} />;
}

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      {!compact && (
        <span className="font-display text-base font-bold tracking-tight">
          SaaSquatch <span className="text-brand-600">Leads</span>
        </span>
      )}
    </span>
  );
}
