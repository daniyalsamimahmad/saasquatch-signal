import { BrandLockup } from "@/components/brand";
import { CircleCheck } from "lucide-react";

const FIXES = [
  "Industry search that resolves what you meant — and shows its work",
  "Refuses to guess below 60% confidence instead of returning wrong rows",
  "Search → list → outreach without losing a single lead",
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <aside className="hidden flex-col justify-between bg-surface-2/60 p-10 lg:flex dark:bg-surface/60">
        <BrandLockup />
        <div className="max-w-md">
          <h1 className="text-2xl font-bold">
            A lead tool&apos;s currency is <span className="text-brand-600">trust</span>.
          </h1>
          <p className="mt-3 text-base text-text-2">
            This prototype rebuilds SaaSquatch Leads around one idea: show the
            user exactly what you matched, and never guess silently.
          </p>
          <ul className="mt-8 space-y-3">
            {FIXES.map((fix) => (
              <li key={fix} className="flex items-start gap-2.5 text-sm text-text-2">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-conf-high" aria-hidden />
                {fix}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-text-3">
          Prototype rebuilt for Caprae Capital · synthetic demo data, clearly labelled
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <BrandLockup />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
