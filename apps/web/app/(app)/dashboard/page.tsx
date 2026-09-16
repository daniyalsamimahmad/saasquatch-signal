import Link from "next/link";
import type { Metadata } from "next";
import {
  Building2,
  Users,
  FolderOpen,
  Send,
  MailCheck,
  MailOpen,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { requireSession } from "@/lib/session";
import { apiFetch } from "@/lib/api";
import type { DashboardStats, UserProfile } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Dashboard" };

type Stat = {
  icon: typeof Users;
  label: string;
  sub: string;
  value: number;
  href: string;
};

/**
 * One connected strip on desktop (cells split by hairlines), separate mini
 * cards when it wraps on smaller screens.
 */
function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-0 lg:overflow-hidden lg:rounded-xl lg:border lg:bg-card lg:shadow-xs">
      {stats.map(({ icon: Icon, label, sub, value, href }) => (
        <Link
          key={label}
          href={href}
          className="group rounded-xl border bg-card px-5 py-4 transition-colors hover:bg-surface-2/50 max-lg:last:col-span-2 lg:rounded-none lg:border-0 lg:border-l lg:first:border-l-0"
        >
          <p className="flex items-center gap-1.5 text-xs font-medium text-text-3">
            <Icon className="size-3.5" aria-hidden />
            {label}
          </p>
          <p className="mt-2.5 font-display text-2xl leading-none font-bold tnum transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-500">
            {value.toLocaleString()}
          </p>
          <p className="mt-1.5 text-xs text-text-3">{sub}</p>
        </Link>
      ))}
    </div>
  );
}

const FUNNEL_STAGES = [
  { key: "sent", label: "Sent" },
  { key: "delivered", label: "Delivered" },
  { key: "opened", label: "Opened" },
] as const;

export default async function DashboardPage() {
  const session = await requireSession();
  const [profile, stats] = await Promise.all([
    apiFetch<UserProfile>("/auth/me", { token: session.apiToken }),
    apiFetch<DashboardStats>("/dashboard/stats", { token: session.apiToken }),
  ]);

  const firstName = profile.name.split(" ")[0];
  const messages = stats.messages;
  // Funnel counts are cumulative: an OPENED message was also delivered and sent.
  const opened = messages.opened ?? 0;
  const delivered = (messages.delivered ?? 0) + opened;
  const sent = (messages.sent ?? 0) + delivered;
  const queued = messages.queued ?? 0;
  const failed = messages.failed ?? 0;
  const funnel = { sent, delivered, opened };
  const funnelMax = Math.max(sent, 1);

  const emailChecks = stats.validations
    .filter((v) => v.kind === "email")
    .reduce((sum, v) => sum + v.count, 0);
  const phoneChecks = stats.validations
    .filter((v) => v.kind === "phone")
    .reduce((sum, v) => sum + v.count, 0);

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Your pipeline at a glance: find leads, save lists, launch outreach."
        actions={
          <Button asChild>
            <Link href="/find">
              Find leads
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        }
      />

      <StatStrip
        stats={[
          { icon: Building2, label: "Companies", sub: "in the searchable index", value: stats.index.companies, href: "/find?tab=companies" },
          { icon: Users, label: "Contacts", sub: "with emails and signals", value: stats.index.contacts, href: "/find" },
          { icon: FolderOpen, label: "Saved leads", sub: "across your lists", value: stats.pipeline.savedLeads, href: "/lists" },
          { icon: Send, label: "Campaigns", sub: "sequences created", value: stats.pipeline.campaigns, href: "/campaigns" },
          { icon: ShieldCheck, label: "Validations", sub: "email and phone checks", value: emailChecks + phoneChecks, href: "/validate" },
        ]}
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Outreach funnel */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Outreach funnel</CardTitle>
          </CardHeader>
          <CardContent>
            {sent + queued === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-text-2">
                  No messages yet. Create a campaign and the funnel fills in here.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link href="/campaigns/new">
                    <Sparkles className="size-3.5" aria-hidden />
                    New campaign
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {FUNNEL_STAGES.map((stage) => {
                  const value = funnel[stage.key];
                  const pct = Math.round((value / funnelMax) * 100);
                  return (
                    <div key={stage.key}>
                      <div className="mb-1 flex items-baseline justify-between text-sm">
                        <span className="text-text-2">{stage.label}</span>
                        <span className="font-mono text-xs tnum">
                          {value}
                          {stage.key !== "sent" && sent > 0 && (
                            <span className="ml-1.5 text-text-3">
                              {Math.round((value / sent) * 100)}%
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full bg-brand-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="flex gap-4 pt-1 text-xs text-text-3">
                  {queued > 0 && <span>{queued} queued (scheduled follow-ups)</span>}
                  {failed > 0 && <span className="text-conf-low">{failed} failed</span>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Validation + enrichment summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Data quality</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-text-2">
                <MailCheck className="size-4" aria-hidden />
                Emails validated
              </span>
              <span className="font-mono tnum">{emailChecks}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-text-2">
                <ShieldCheck className="size-4" aria-hidden />
                Phones validated
              </span>
              <span className="font-mono tnum">{phoneChecks}</span>
            </div>
            {Object.keys(stats.creditUsage).length > 0 && (
              <div className="border-t pt-3">
                <p className="label-caps mb-2">Provider credits used</p>
                <div className="space-y-1.5">
                  {Object.entries(stats.creditUsage).map(([provider, count]) => (
                    <div
                      key={provider}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-text-2 capitalize">{provider}</span>
                      <span className="font-mono text-xs tnum">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/validate">Run a validation</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Recent outreach activity</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentMessages.length === 0 ? (
            <p className="py-4 text-center text-sm text-text-2">
              Launch a campaign and delivery events show up here.
            </p>
          ) : (
            <ul className="divide-y">
              {stats.recentMessages.map((message) => (
                <li key={message.id} className="flex items-center gap-3 py-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-2 text-text-2">
                    {message.status === "OPENED" ? (
                      <MailOpen className="size-3.5" aria-hidden />
                    ) : (
                      <Send className="size-3.5" aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      {message.contact.firstName} {message.contact.lastName}
                      <span className="text-text-3">
                        {message.contact.company ? ` · ${message.contact.company.name}` : ""}
                      </span>
                    </p>
                    <p className="truncate text-xs text-text-2">
                      {message.subject || message.body.slice(0, 80)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      message.status === "OPENED"
                        ? "border-conf-high/40 text-conf-high"
                        : message.status === "FAILED"
                          ? "border-conf-low/40 text-conf-low"
                          : "text-text-2"
                    }
                  >
                    {message.status.toLowerCase()}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
