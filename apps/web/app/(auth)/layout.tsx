import { BrandLockup } from "@/components/brand";
import {
  Search,
  Sparkles,
  ShieldCheck,
  BadgeCheck,
  Flame,
  type LucideIcon,
} from "lucide-react";

const PILLARS: Array<{ icon: LucideIcon; text: string }> = [
  {
    icon: Search,
    text: "Search 1,200+ decision makers by title, seniority, industry, and tech stack",
  },
  {
    icon: Sparkles,
    text: "AI writes outreach that cites a real signal — hiring, funding, news — never filler",
  },
  {
    icon: ShieldCheck,
    text: "Validate every email and phone before it touches your sender reputation",
  },
];

/**
 * The vignette is a faithful miniature of the product: the lead card and the
 * signal-cited draft the AI writes from it. Show, don't claim.
 */
function ProductVignette() {
  return (
    <div className="relative mt-8 max-w-sm" aria-hidden>
      {/* Lead card */}
      <div className="rounded-xl border bg-surface p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700 dark:bg-brand-50/10 dark:text-brand-500">
            FV
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">Felix Vasquez</p>
            <p className="truncate text-xs text-text-2">
              VP of Engineering · Saltmeadow
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 dark:bg-brand-50/10 dark:text-brand-500">
            <Flame className="size-3" aria-hidden />
            Hiring
          </span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 border-t pt-3 text-xs">
          <BadgeCheck className="size-3.5 shrink-0 text-conf-high" aria-hidden />
          <span className="font-mono">felix@saltmeadow.io</span>
          <span className="text-text-3">· verified</span>
        </div>
      </div>

      {/* AI draft card, overlapping */}
      <div className="relative z-10 -mt-3 ml-10 rounded-xl border bg-surface p-4 shadow-md">
        <p className="flex items-center gap-1.5 label-caps">
          <Sparkles className="size-3 text-brand-500" aria-hidden />
          AI draft · step 1 of 3
        </p>
        <p className="mt-2 text-xs leading-relaxed text-text-2">
          Hi Felix — 12 open engineering roles at Saltmeadow tells me pipeline
          is about to matter more than headcount. Most VPs scaling that fast
          hit the same wall…
        </p>
      </div>
    </div>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-surface-2/60 p-10 lg:flex dark:bg-surface/60">
        {/* Backdrop: faint dot grid fading out, plus a brand glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 text-text-3/50 [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_top_left,black_25%,transparent_75%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-brand-500/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 size-80 rounded-full bg-brand-500/5 blur-3xl"
        />

        <div className="relative">
          <BrandLockup />
        </div>

        <div className="relative max-w-md">
          <h1 className="font-display text-3xl leading-tight font-bold">
            Find the right leads.
            <br />
            Say the right <span className="text-brand-600 dark:text-brand-500">thing</span>.
          </h1>
          <p className="mt-3 text-base text-text-2">
            A filterable B2B index paired with an AI outreach engine — from
            search to sequence without leaving the app.
          </p>

          <ProductVignette />

          <ul className="mt-8 space-y-3">
            {PILLARS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2.5 text-sm text-text-2">
                <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-50/10 dark:text-brand-500">
                  <Icon className="size-3" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-text-3">
          <span>
            <span className="font-mono font-semibold text-text-2 tnum">400</span> companies
          </span>
          <span aria-hidden>·</span>
          <span>
            <span className="font-mono font-semibold text-text-2 tnum">1,206</span> contacts
          </span>
          <span aria-hidden>·</span>
          <span>
            <span className="font-mono font-semibold text-text-2 tnum">15</span> industries
          </span>
          <span aria-hidden>·</span>
          <span>live imports by domain</span>
        </div>
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
