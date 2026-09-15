"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import type { NotificationItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

const READ_KEY = "notifications-read-at";

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function NotificationsBell({ items }: { items: NotificationItem[] }) {
  const [readAt, setReadAt] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    try {
      setReadAt(localStorage.getItem(READ_KEY));
    } catch {}
  }, []);

  const unread = mounted
    ? items.filter((item) => !readAt || item.createdAt > readAt).length
    : 0;

  const markAllRead = () => {
    const now = new Date().toISOString();
    try {
      localStorage.setItem(READ_KEY, now);
    } catch {}
    setReadAt(now);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <Bell className="size-4" aria-hidden />
          {unread > 0 && (
            <span
              aria-hidden
              className="absolute top-1 right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-conf-low px-[3px] font-mono text-[9px] leading-none font-semibold text-white ring-2 ring-background tnum"
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" collisionPadding={12}>
        <div className="flex items-center justify-between px-4 py-2.5">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs text-brand-600 underline-offset-4 hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <Separator />
        {items.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-text-2">
            Nothing yet. Run a search or save a list and updates land here.
          </p>
        ) : (
          <ul className="max-h-80 overflow-y-auto py-1">
            {items.map((item) => {
              const isUnread = mounted && (!readAt || item.createdAt > readAt);
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="flex gap-2.5 px-4 py-2.5 transition-colors hover:bg-surface-2/60"
                  >
                    <span
                      aria-hidden
                      className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                        isUnread ? "bg-brand-500" : "bg-transparent"
                      }`}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {item.title}
                      </span>
                      <span className="block truncate text-xs text-text-2">
                        {item.detail}
                      </span>
                      <span className="block text-[11px] text-text-3">
                        {mounted ? timeAgo(item.createdAt) : ""}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
