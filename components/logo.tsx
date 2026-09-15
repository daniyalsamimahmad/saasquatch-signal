import { cn } from "@/lib/utils";

/**
 * Original mark, designed for this prototype (their sasquatch illustration is
 * their asset). Concept: a magnifying glass over a footprint — you track a
 * sasquatch by its footprints, and a footprint is literally a lead. Teal
 * brand DNA kept; the amber lens is a nod to the original logo's magnifier.
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
      <circle cx="14" cy="14" r="10.5" fill="var(--logo-lens, #F7D354)" />
      <circle
        cx="14"
        cy="14"
        r="10.5"
        stroke="var(--brand-600)"
        strokeWidth="2.6"
      />
      {/* footprint: sole + heel + toes */}
      <ellipse cx="13.6" cy="13.2" rx="3.6" ry="4.6" fill="var(--brand-600)" />
      <ellipse cx="14.4" cy="19.2" rx="2.5" ry="2.1" fill="var(--brand-600)" />
      <circle cx="9.6" cy="8.9" r="1.55" fill="var(--brand-600)" />
      <circle cx="13.1" cy="6.9" r="1.35" fill="var(--brand-600)" />
      <circle cx="16.6" cy="7.3" r="1.2" fill="var(--brand-600)" />
      <circle cx="19.2" cy="9.3" r="1.05" fill="var(--brand-600)" />
      {/* handle */}
      <path
        d="M21.8 21.8 L28 28"
        stroke="var(--brand-600)"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
