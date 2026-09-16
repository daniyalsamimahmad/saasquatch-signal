import { cn } from "@/lib/utils";

/**
 * The brand mark: a magnifying glass over a footprint. You track a
 * sasquatch by its footprints, and a footprint is literally a lead.
 * Colors come from the --logo-* tokens, so the mark adapts per theme:
 * teal lens with a yellow footprint in light, mint lens in dark.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={cn("size-8", className)}
    >
      {/* lens */}
      <circle cx="14" cy="14" r="10.5" fill="var(--logo-lens)" />
      <circle
        cx="14"
        cy="14"
        r="10.5"
        stroke="var(--logo-ring)"
        strokeWidth="2.6"
      />
      {/* footprint: sole + heel + toes */}
      <ellipse cx="13.6" cy="13.2" rx="3.6" ry="4.6" fill="var(--logo-print)" />
      <ellipse cx="14.4" cy="19.2" rx="2.5" ry="2.1" fill="var(--logo-print)" />
      <circle cx="9.6" cy="8.9" r="1.55" fill="var(--logo-print)" />
      <circle cx="13.1" cy="6.9" r="1.35" fill="var(--logo-print)" />
      <circle cx="16.6" cy="7.3" r="1.2" fill="var(--logo-print)" />
      <circle cx="19.2" cy="9.3" r="1.05" fill="var(--logo-print)" />
      {/* handle */}
      <path
        d="M21.8 21.8 L28 28"
        stroke="var(--logo-ring)"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
