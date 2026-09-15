import { ArrowDown } from "lucide-react";
import type { ResolveResult } from "@/lib/taxonomy/types";

const METHOD_LABEL: Record<ResolveResult["method"], string> = {
  "exact-label": "exact match on canonical label",
  "exact-alias": "matched a known raw industry string (alias)",
  fuzzy: "weighted fuzzy match (label 0.7 · aliases 0.3)",
  none: "no viable match",
};

function Step({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="relative">
      <p className="label-caps">{label}</p>
      <div className="mt-1 font-mono text-sm">{children}</div>
    </li>
  );
}

function Arrow() {
  return (
    <li aria-hidden className="py-0.5 pl-1 text-text-3">
      <ArrowDown className="size-3.5" />
    </li>
  );
}

/**
 * The full derivation, shown rather than hidden — the component this
 * project's thesis lives in. Every step from keystrokes to NAICS code.
 */
export function DerivationChain({ result }: { result: ResolveResult }) {
  return (
    <div>
      <ol className="space-y-1">
        <Step label="You typed">
          <span className="text-text-2">&quot;{result.query.trim()}&quot;</span>
        </Step>
        <Arrow />
        <Step
          label={
            result.corrections.length > 0
              ? "Normalised + spell-corrected"
              : "Normalised"
          }
        >
          {result.normalised || <span className="text-text-3">(empty)</span>}
          {result.corrections.length > 0 && (
            <span className="ml-2 rounded-sm bg-conf-med-subtle px-1.5 py-0.5 text-xs text-conf-med">
              {result.corrections.join(" · ")}
            </span>
          )}
        </Step>
        {result.match ? (
          <>
            <Arrow />
            <Step label={METHOD_LABEL[result.method]}>
              <span className="font-sans font-semibold">
                {result.match.label}
              </span>
            </Step>
            <Arrow />
            <Step label="Mapped to NAICS">
              <span className="rounded-sm bg-surface-2 px-1.5 py-0.5">
                {result.match.naicsCode}
              </span>{" "}
              <span className="text-text-2">{result.match.naicsTitle}</span>
            </Step>
          </>
        ) : (
          <>
            <Arrow />
            <Step label="Result">
              <span className="text-conf-low">
                No industry match — this search would be blocked, not guessed.
              </span>
            </Step>
          </>
        )}
      </ol>

      {result.alternatives.length > 0 && (
        <div className="mt-5 border-t pt-4">
          <p className="label-caps">Also considered</p>
          <ul className="mt-2 space-y-1.5">
            {result.alternatives.map((alt) => (
              <li
                key={alt.industry.id}
                className="flex items-baseline justify-between gap-4 text-sm"
              >
                <span>
                  {alt.industry.label}
                  <span className="ml-2 font-mono text-xs text-text-3">
                    NAICS {alt.industry.naicsCode}
                  </span>
                </span>
                <span className="font-mono text-xs text-text-2 tnum">
                  {alt.confidence}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
