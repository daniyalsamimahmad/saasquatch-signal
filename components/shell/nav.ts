import {
  LayoutDashboard,
  Search,
  FolderOpen,
  Send,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Job-stage group. Their nav is organised by feature; ours by the job. */
  group?: "find" | "act";
  countKey?: "lists" | "drafts";
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/find", label: "Search", icon: Search, group: "find" },
  { href: "/lists", label: "Saved Lists", icon: FolderOpen, group: "find", countKey: "lists" },
  { href: "/outreach", label: "Outreach", icon: Send, group: "act", countKey: "drafts" },
];

export const SETTINGS_ITEM: NavItem = {
  href: "/settings",
  label: "Settings",
  icon: Settings,
};

export type NavCounts = { lists: number; drafts: number };
