import type { Metadata } from "next";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CircleCheck, TriangleAlert, OctagonX } from "lucide-react";

export const metadata: Metadata = { title: "Design tokens" };

/* Dev-only style guide — the Sprint 0 review artifact. Removed before submission. */

const brand = [
  { name: "brand-050", cls: "bg-brand-50", hex: "#E6F7F4 / #123F39" },
  { name: "brand-500", cls: "bg-brand-500", hex: "#0FB5A2 / #2ECFBC" },
  { name: "brand-600", cls: "bg-brand-600", hex: "#0D9488 / #24B3A2" },
  { name: "brand-700", cls: "bg-brand-700", hex: "#0B6E66 · action" },
];

const neutrals = [
  { name: "background", cls: "bg-background", hex: "#F7F9FA / #0A0F12" },
  { name: "surface", cls: "bg-surface", hex: "#FFFFFF / #121A1F" },
  { name: "surface-2", cls: "bg-surface-2", hex: "#EFF3F5 / #1A242A" },
  { name: "border", cls: "bg-border", hex: "#D8E0E5 / #263238" },
  { name: "text-3", cls: "bg-text-3", hex: "muted text" },
  { name: "text-2", cls: "bg-text-2", hex: "secondary text" },
  { name: "text", cls: "bg-foreground", hex: "#0E1519 / #E6EDF1" },
];

const scale = [
  { px: "39", cls: "text-3xl", label: "Display: page titles" },
  { px: "31", cls: "text-2xl", label: "Section headings" },
  { px: "25", cls: "text-xl", label: "Card titles, stat values" },
  { px: "20", cls: "text-lg", label: "Subheadings" },
  { px: "16", cls: "text-base", label: "Prose body" },
  { px: "14", cls: "text-sm", label: "Dense table UI body" },
  { px: "12", cls: "text-xs", label: "Captions, metadata" },
];

const spacing = [4, 8, 12, 16, 24, 32, 48, 64];

export default function TokensPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="label-caps">SaaSquatch Signal · dev</p>
          <h1 className="mt-2 text-3xl font-bold">Design tokens</h1>
          <p className="mt-2 max-w-xl text-base text-text-2">
            The design system from BUILD_SPEC.md §9. Teal brand DNA kept from
            the original product, semantic confidence colours kept separate
            from it, on a 4px grid with a 1.25 type scale.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <Separator className="my-10" />

      {/* Palette */}
      <section aria-labelledby="palette">
        <h2 id="palette" className="text-xl font-semibold">
          Colour
        </h2>

        <p className="label-caps mt-6">Brand</p>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {brand.map((c) => (
            <div key={c.name} className="rounded-md border bg-surface p-2">
              <div className={`h-14 rounded-sm ${c.cls}`} />
              <p className="mt-2 font-mono text-xs">{c.name}</p>
              <p className="text-xs text-text-3">{c.hex}</p>
            </div>
          ))}
        </div>

        <p className="label-caps mt-8">Neutrals: cool, slight blue bias</p>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {neutrals.map((c) => (
            <div key={c.name} className="rounded-md border bg-surface p-2">
              <div className={`h-10 rounded-sm border ${c.cls}`} />
              <p className="mt-2 font-mono text-xs">{c.name}</p>
            </div>
          ))}
        </div>

        <p className="label-caps mt-8">
          Confidence bands: colour + label + icon, never colour alone
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-conf-high-subtle px-2.5 py-1 text-sm font-medium text-conf-high">
            <CircleCheck className="size-4" aria-hidden />
            High confidence · 94%
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-conf-med-subtle px-2.5 py-1 text-sm font-medium text-conf-med">
            <TriangleAlert className="size-4" aria-hidden />
            Medium · did you mean…?
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-conf-low-subtle px-2.5 py-1 text-sm font-medium text-conf-low">
            <OctagonX className="size-4" aria-hidden />
            Low · search blocked
          </span>
        </div>
      </section>

      <Separator className="my-10" />

      {/* Typography */}
      <section aria-labelledby="type">
        <h2 id="type" className="text-xl font-semibold">
          Type
        </h2>
        <p className="mt-2 text-sm text-text-2">
          Instrument Sans for display · Inter for UI · JetBrains Mono for the
          data register (NAICS codes, confidence, derivations).
        </p>

        <div className="mt-6 space-y-4">
          {scale.map((s) => (
            <div key={s.px} className="flex items-baseline gap-4">
              <span className="w-8 shrink-0 text-right font-mono text-xs text-text-3 tnum">
                {s.px}
              </span>
              <span className={`${s.cls} truncate`}>
                Resolve what the user meant
              </span>
              <span className="hidden text-xs text-text-3 sm:inline">
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border bg-surface p-4">
            <p className="label-caps">Data register: JetBrains Mono</p>
            <p className="mt-3 font-mono text-sm">
              NAICS 541511 · confidence 94%
            </p>
            <p className="mt-1 font-mono text-sm text-text-2">
              &quot;computr software&quot; → computer software
            </p>
          </div>
          <div className="rounded-md border bg-surface p-4">
            <p className="label-caps">Tabular figures</p>
            <div className="mt-3 space-y-1 font-mono text-sm tnum">
              <p className="flex justify-between">
                <span>Software Development</span>
                <span>1,204</span>
              </p>
              <p className="flex justify-between">
                <span>Legal Services</span>
                <span>87</span>
              </p>
              <p className="flex justify-between">
                <span>IT Consulting</span>
                <span>412</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <Separator className="my-10" />

      {/* Spacing */}
      <section aria-labelledby="space">
        <h2 id="space" className="text-xl font-semibold">
          Spacing: 4px base
        </h2>
        <div className="mt-6 flex items-end gap-3">
          {spacing.map((s) => (
            <div key={s} className="flex flex-col items-center gap-2">
              <div
                className="w-6 rounded-sm bg-brand-500/80"
                style={{ height: s }}
              />
              <span className="font-mono text-xs text-text-3 tnum">{s}</span>
            </div>
          ))}
        </div>
      </section>

      <Separator className="my-10" />

      {/* Interactive states */}
      <section aria-labelledby="states">
        <h2 id="states" className="text-xl font-semibold">
          Interactive elements
        </h2>
        <p className="mt-2 text-sm text-text-2">
          Hover, active, focus-visible (tab through), disabled: all four
          states designed. Focus ring is 2px brand at 2px offset.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button>Find companies</Button>
          <Button variant="secondary">Save to list</Button>
          <Button variant="outline">Export CSV</Button>
          <Button variant="ghost">Change</Button>
          <Button disabled>Disabled</Button>
          <Badge>PROTOTYPE</Badge>
          <Badge variant="secondary">Demo data</Badge>
        </div>
        <div className="mt-6 max-w-sm space-y-2">
          <Label htmlFor="demo-input">Industry</Label>
          <Input id="demo-input" placeholder="e.g. computer software" />
        </div>
      </section>
    </div>
  );
}
