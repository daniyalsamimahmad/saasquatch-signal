"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, SETTINGS_ITEM, type NavCounts, type NavItem } from "./nav";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function NavLink({
  item,
  counts,
  rail,
  onNavigate,
}: {
  item: NavItem;
  counts: NavCounts;
  rail?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active =
    pathname === item.href || pathname.startsWith(item.href + "/");
  const count = item.countKey ? counts[item.countKey] : undefined;
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-text-2 transition-colors",
        "hover:bg-surface-2 hover:text-foreground",
        active && "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent",
        rail && "justify-center px-0",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {!rail && <span className="flex-1 truncate">{item.label}</span>}
      {!rail && count !== undefined && count > 0 && (
        <span className="rounded-sm bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-text-3 tnum">
          {count}
        </span>
      )}
      {rail && <span className="sr-only">{item.label}</span>}
    </Link>
  );

  if (!rail) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={6}>
        {item.label}
        {count !== undefined && count > 0 ? ` (${count})` : ""}
      </TooltipContent>
    </Tooltip>
  );
}

export function SidebarNav({
  counts,
  rail = false,
  onNavigate,
}: {
  counts: NavCounts;
  rail?: boolean;
  onNavigate?: () => void;
}) {
  const dashboard = NAV_ITEMS.filter((i) => !i.group);
  const find = NAV_ITEMS.filter((i) => i.group === "find");
  const act = NAV_ITEMS.filter((i) => i.group === "act");

  return (
    <nav
      aria-label="Main"
      className={cn("flex flex-1 flex-col gap-1", rail && "items-stretch")}
    >
      {dashboard.map((item) => (
        <NavLink key={item.href} item={item} counts={counts} rail={rail} onNavigate={onNavigate} />
      ))}

      <p className={cn("label-caps mt-5 mb-1 px-2.5", rail && "sr-only")}>Find</p>
      {find.map((item) => (
        <NavLink key={item.href} item={item} counts={counts} rail={rail} onNavigate={onNavigate} />
      ))}

      <p className={cn("label-caps mt-5 mb-1 px-2.5", rail && "sr-only")}>Act</p>
      {act.map((item) => (
        <NavLink key={item.href} item={item} counts={counts} rail={rail} onNavigate={onNavigate} />
      ))}

      <div className="mt-auto pt-4">
        <NavLink item={SETTINGS_ITEM} counts={counts} rail={rail} onNavigate={onNavigate} />
      </div>
    </nav>
  );
}
