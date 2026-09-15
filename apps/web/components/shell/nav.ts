import {
  LayoutDashboard,
  Search,
  FolderOpen,
  Send,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Job-stage group: find the right leads, then act on them. */
  group?: "find" | "act";
  countKey?: "lists" | "campaigns";
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/find", label: "Find leads", icon: Search, group: "find" },
  { href: "/lists", label: "Lists", icon: FolderOpen, group: "find", countKey: "lists" },
  { href: "/campaigns", label: "Campaigns", icon: Send, group: "act", countKey: "campaigns" },
  { href: "/validate", label: "Validate", icon: ShieldCheck, group: "act" },
];

export const SETTINGS_ITEM: NavItem = {
  href: "/settings",
  label: "Settings",
  icon: Settings,
};

export type NavCounts = { lists: number; campaigns: number };
