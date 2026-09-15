"use client";

import * as React from "react";
import { ChevronsUpDown, Check, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { METROS, type Metro } from "@/lib/metros";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

/** Same discipline as the industry picker: keyboardable, closes properly,
 * portal-rendered — and grouped by state so the list scans fast. */
export function LocationPicker({
  value,
  onSelect,
  id,
}: {
  value: Metro | null;
  onSelect: (metro: Metro) => void;
  id?: string;
}) {
  const [open, setOpen] = React.useState(false);

  const byState = React.useMemo(() => {
    const groups = new Map<string, Metro[]>();
    for (const metro of METROS) {
      if (!groups.has(metro.state)) groups.set(metro.state, []);
      groups.get(metro.state)!.push(metro);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          className={cn(
            "h-10 w-full justify-between bg-surface px-3 font-normal",
            !value && "text-text-3",
          )}
        >
          {value ? (
            <span className="flex items-center gap-2">
              <MapPin className="size-4 text-text-3" aria-hidden />
              {value.city}, {value.state}
            </span>
          ) : (
            "City or metro"
          )}
          <ChevronsUpDown className="size-4 shrink-0 text-text-3" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] min-w-[260px] p-0"
        align="start"
        collisionPadding={12}
      >
        <Command>
          <CommandInput placeholder="Search metros" />
          <CommandList className="max-h-72">
            <CommandEmpty>
              <p className="px-4 py-2 text-sm text-text-2">
                The demo dataset spans 25 US metros — try Austin, Seattle, Boston…
              </p>
            </CommandEmpty>
            {byState.map(([state, metros]) => (
              <CommandGroup key={state} heading={state}>
                {metros.map((metro) => (
                  <CommandItem
                    key={`${metro.city}-${metro.state}`}
                    value={`${metro.city} ${metro.state}`}
                    onSelect={() => {
                      onSelect(metro);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "size-4",
                        value?.city === metro.city && value?.state === metro.state
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                      aria-hidden
                    />
                    {metro.city}, {metro.state}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
