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

function StatTile({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  href?: string;
}) {
  const body = (
    <Card className="transition-colors hover:border-brand-500/40">
      <CardContent className="flex items-center gap-3 py-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-50/10 dark:text-brand-500">
          <Icon className="size-4" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="font-display text-xl font-bold tnum">
            {value.toLocaleString()}
          </p>
          <p className="truncate text-xs text-text-2">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
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
        description="Your pipeline at a glance — find leads, save lists, and launch outreach."
        actions={
          <Button asChild>
            <Link href="/find">
              Find leads
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile icon={Building2} label="Companies in index" value={stats.index.companies} href="/find?tab=companies" />
        <StatTile icon={Users} label="Contacts in index" value={stats.index.contacts} href="/find" />
        <StatTile icon={FolderOpen} label="Saved leads" value={stats.pipeline.savedLeads} href="/lists" />
        <StatTile icon={Send} label="Campaigns" value={stats.pipeline.campaigns} href="/campaigns" />
        <StatTile icon={ShieldCheck} label="Validations run" value={emailChecks + phoneChecks} href="/validate" />
      </div>

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
