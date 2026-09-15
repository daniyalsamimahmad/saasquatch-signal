import { CircleCheck, TriangleAlert, OctagonX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConfidenceBand } from "@/lib/taxonomy/types";

// Confidence is never colour alone: colour + icon + label, always (spec §9.5).
const BAND_CONFIG = {
  high: {
    icon: CircleCheck,
    label: "High confidence",
    cls: "bg-conf-high-subtle text-conf-high",
  },
  medium: {
    icon: TriangleAlert,
    label: "Medium confidence",
    cls: "bg-conf-med-subtle text-conf-med",
  },
  low: {
    icon: OctagonX,
    label: "Low confidence",
    cls: "bg-conf-low-subtle text-conf-low",
  },
} as const;

export function BandPill({
  band,
  confidence,
  className,
}: {
  band: ConfidenceBand;
  confidence: number;
  className?: string;
}) {
  const { icon: Icon, label, cls } = BAND_CONFIG[band];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium",
        cls,
        className,
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {label}
      <span className="font-mono text-xs tnum">· {confidence}%</span>
    </span>
  );
}
