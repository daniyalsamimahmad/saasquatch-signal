"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

/**
 * Switch-style theme toggle. Both icons stay visible on the track; the thumb
 * slides under the active one and the active icon takes its color. Driven by
 * the html.dark class (dark: variants), so it animates on theme change with
 * nothing to mismatch during hydration.
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
      className="relative flex h-8 w-16 shrink-0 items-center rounded-full border bg-surface-2 p-1 transition-colors duration-300 hover:border-brand-500/50 dark:bg-brand-50/10"
    >
      {/* Sliding thumb, behind the icons */}
      <span
        aria-hidden
        className="absolute left-1 size-6 rounded-full bg-white shadow-sm transition-transform duration-300 ease-out dark:translate-x-8 dark:bg-surface-2"
      />
      <span aria-hidden className="relative z-10 flex w-1/2 justify-center">
        <Sun className="size-3.5 text-amber-500 transition-colors duration-300 dark:text-text-3" />
      </span>
      <span aria-hidden className="relative z-10 flex w-1/2 justify-center">
        <Moon className="size-3.5 text-text-3 transition-colors duration-300 dark:text-[#F7D354]" />
      </span>
    </button>
  );
}
