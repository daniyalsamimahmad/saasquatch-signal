"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

/**
 * Switch-style theme toggle. Both icons stay visible on the track; the thumb
 * slides under the active one and the active icon takes its color. Driven by
 * the html.dark class (dark: variants), so it animates on theme change with
 * nothing to mismatch during hydration.
 *
 * Geometry (border-box 64x32, 1px border): content box is 62x30, the two
 * icon halves are 31px wide with centers at x=15.5 and x=46.5. The 24px
 * thumb sits at 3px insets (center 15) and travels 31px (center 46), so it
 * lands centered under either icon.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={mounted ? resolvedTheme === "dark" : undefined}
      aria-label="Toggle dark mode"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="relative h-8 w-16 shrink-0 rounded-full border bg-surface-2 transition-colors duration-300 hover:border-brand-500/50 dark:bg-brand-50/10"
    >
      {/* Sliding thumb, behind the icons */}
      <span
        aria-hidden
        className="absolute top-[3px] left-[3px] size-6 rounded-full bg-white shadow-sm transition-transform duration-300 ease-out dark:translate-x-[31px] dark:bg-surface-2"
      />
      {/* Icon halves overlay the full track, so their centers match the thumb stops */}
      <span aria-hidden className="absolute inset-0 flex items-center">
        <span className="flex w-1/2 justify-center">
          <Sun className="size-3.5 text-amber-500 transition-colors duration-300 dark:text-text-3" />
        </span>
        <span className="flex w-1/2 justify-center">
          <Moon className="size-3.5 text-text-3 transition-colors duration-300 dark:text-[#F7D354]" />
        </span>
      </span>
    </button>
  );
}
