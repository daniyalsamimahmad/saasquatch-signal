import { cn } from "@/lib/utils";

const STYLE: Record<string, string> = {
  valid: "bg-conf-high/10 text-conf-high",
  risky: "bg-conf-mid/10 text-conf-mid",
  invalid: "bg-conf-low/10 text-conf-low",
  unknown: "bg-surface-2 text-text-2",
};

export function VerdictBadge({ verdict, score }: { verdict: string; score: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold capitalize",
        STYLE[verdict] ?? STYLE.unknown,
      )}
    >
      {verdict}
      <span className="font-mono text-xs font-normal opacity-70 tnum">{score}/100</span>
    </span>
  );
}

export function CheckRow({
  label,
  pass,
  detail,
}: {
  label: string;
  pass: boolean | null;
  detail?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-text-2">{label}</span>
      <span
        className={cn(
          "font-medium",
          pass === true && "text-conf-high",
          pass === false && "text-conf-low",
          pass === null && "text-text-3",
        )}
      >
        {detail ?? (pass === null ? "—" : pass ? "Pass" : "Fail")}
      </span>
    </div>
  );
}
