"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  User,
  FolderOpen,
  Send,
  LayoutDashboard,
  ShieldCheck,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const PAGES = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Find leads", href: "/find", icon: Search },
  { label: "Lists", href: "/lists", icon: FolderOpen },
  { label: "Campaigns", href: "/campaigns", icon: Send },
  { label: "Validate", href: "/validate", icon: ShieldCheck },
  { label: "Settings", href: "/settings", icon: Settings },
];

type Results = {
  people: Array<{ id: string; name: string; title: string; companyName: string }>;
  lists: Array<{ id: string; name: string; count: number }>;
  campaigns: Array<{ id: string; name: string; status: string }>;
};

const EMPTY: Results = { people: [], lists: [], campaigns: [] };

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<Results>(EMPTY);
  const [isMac, setIsMac] = React.useState(true);

  React.useEffect(() => {
    setIsMac(!/windows|linux/i.test(navigator.userAgent));
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Debounced lookup against the API while the palette is open.
  React.useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults(EMPTY);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/global-search?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal },
        );
        if (response.ok) setResults(await response.json());
      } catch {}
    }, 200);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [open, query]);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  const pages = query.trim()
    ? PAGES.filter((p) => p.label.toLowerCase().includes(query.trim().toLowerCase()))
    : PAGES;

  const hasResults =
    pages.length > 0 ||
    results.people.length > 0 ||
    results.lists.length > 0 ||
    results.campaigns.length > 0;

  return (
    <>
      {/* Wide screens get an input-shaped trigger, small screens an icon */}
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="hidden h-9 w-80 justify-start gap-2 bg-surface px-3 font-normal text-text-3 lg:flex xl:w-[26rem]"
      >
        <Search className="size-4" aria-hidden />
        <span className="flex-1 text-left text-sm">Search anything</span>
        <kbd className="rounded-sm border bg-surface-2 px-1.5 font-mono text-[10px] text-text-3">
          {isMac ? "⌘" : "Ctrl"} K
        </kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="lg:hidden"
        aria-label="Search"
      >
        <Search className="size-4" aria-hidden />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
        <CommandInput
          placeholder="People, lists, campaigns, pages"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {!hasResults && (
            <CommandEmpty>
              {query.trim().length < 2
                ? "Type at least two characters."
                : `Nothing found for "${query}".`}
            </CommandEmpty>
          )}

          {results.people.length > 0 && (
            <CommandGroup heading="People">
              {results.people.map((person) => (
                <CommandItem
                  key={person.id}
                  value={`${person.name} ${person.companyName} ${person.id}`}
                  onSelect={() => go(`/find?q=${encodeURIComponent(person.name)}`)}
                >
                  <User className="size-4 text-text-3" aria-hidden />
                  <span className="flex-1 truncate">{person.name}</span>
                  <span className="max-w-44 truncate text-xs text-text-3">
                    {person.title}
                    {person.companyName ? ` · ${person.companyName}` : ""}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.lists.length > 0 && (
            <CommandGroup heading="Lists">
              {results.lists.map((list) => (
                <CommandItem
                  key={list.id}
                  value={`${list.name} ${list.id}`}
                  onSelect={() => go(`/lists/${list.id}`)}
                >
                  <FolderOpen className="size-4 text-text-3" aria-hidden />
                  <span className="flex-1 truncate">{list.name}</span>
                  <span className="font-mono text-xs text-text-3 tnum">
                    {list.count}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.campaigns.length > 0 && (
            <CommandGroup heading="Campaigns">
              {results.campaigns.map((campaign) => (
                <CommandItem
                  key={campaign.id}
                  value={`${campaign.name} ${campaign.id}`}
                  onSelect={() => go(`/campaigns/${campaign.id}`)}
                >
                  <Send className="size-4 text-text-3" aria-hidden />
                  <span className="flex-1 truncate">{campaign.name}</span>
                  <span className="text-xs text-text-3 capitalize">{campaign.status}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {pages.length > 0 && (
            <CommandGroup heading="Pages">
              {pages.map((page) => {
                const Icon = page.icon;
                return (
                  <CommandItem
                    key={page.href}
                    value={page.label}
                    onSelect={() => go(page.href)}
                  >
                    <Icon className="size-4 text-text-3" aria-hidden />
                    {page.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
        </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
