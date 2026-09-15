"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/lib/queries";
import type { Plan } from "@/lib/actions/billing-actions";
import { PlanChip } from "./pricing-dialog";
import { NotificationsBell } from "./notifications";
import { HelpWidget } from "./help-widget";
import { BrandLockup, BrandMark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarNav } from "./sidebar-nav";
import type { NavCounts } from "./nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export type ShellUser = { name: string; email: string };

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AppShell({
  user,
  counts,
  plan,
  notifications,
  signOutAction,
  children,
}: {
  user: ShellUser;
  counts: NavCounts;
  plan: Plan;
  notifications: NotificationItem[];
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  // User-collapsible on desktop, persisted per browser. Below lg the rail is
  // automatic regardless; below md the sidebar becomes a drawer.
  const [collapsed, setCollapsed] = React.useState(false);
  React.useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("sidebar-collapsed") === "1");
    } catch {}
  }, []);
  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      try {
        localStorage.setItem("sidebar-collapsed", prev ? "0" : "1");
      } catch {}
      return !prev;
    });
  };

  return (
    <TooltipProvider delayDuration={200}>
    <div className="flex min-h-dvh">
      {/* Sidebar: full at ≥1024px (collapsible), icon rail at 768–1024px, drawer below */}
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-sidebar md:flex md:w-16 md:px-2",
          collapsed ? "lg:w-16 lg:px-2" : "lg:w-[260px] lg:px-3",
        )}
      >
        <div className="flex h-16 items-center px-1.5">
          <Link href="/dashboard" aria-label="SaaSquatch Leads — dashboard">
            <span className={cn("hidden", !collapsed && "lg:block")}>
              <BrandLockup />
            </span>
            <span className={cn(!collapsed && "lg:hidden")}>
              <BrandMark />
            </span>
          </Link>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto pt-4 pb-4">
          <div className={cn("hidden flex-1", !collapsed && "lg:flex lg:flex-col")}>
            <SidebarNav counts={counts} />
          </div>
          <div className={cn("flex flex-1 flex-col", !collapsed && "lg:hidden")}>
            <SidebarNav counts={counts} rail />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur sm:px-6">
          {/* Mobile drawer */}
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation">
                <Menu className="size-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-4">
              <SheetHeader className="p-0 pb-4 text-left">
                <SheetTitle asChild>
                  <div>
                    <BrandLockup />
                  </div>
                </SheetTitle>
              </SheetHeader>
              <div className="flex h-[calc(100%-4rem)] flex-col">
                <SidebarNav counts={counts} onNavigate={() => setDrawerOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop sidebar collapse toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={collapsed}
            onClick={toggleCollapsed}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" aria-hidden />
            ) : (
              <PanelLeftClose className="size-4" aria-hidden />
            )}
          </Button>

          <div className="flex-1" />

          <PlanChip plan={plan} />
          <NotificationsBell items={notifications} />
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-brand-50 text-xs font-semibold text-brand-700 dark:text-brand-500">
                    {initials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs font-normal text-text-3">{user.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <button
                  className="w-full"
                  onClick={() => signOutAction()}
                >
                  <LogOut className="size-4" aria-hidden />
                  Sign out
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
      <Toaster position="bottom-right" />
      <HelpWidget />
    </div>
    </TooltipProvider>
  );
}
