import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { getCompany } from "@/lib/queries";
import { getContactsForCompany } from "@/lib/search";
import { INDUSTRIES } from "@/lib/taxonomy/resolve";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = { title: "Company" };

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = getCompany(id);
  if (!company) notFound();

  const contacts = getContactsForCompany(id);
  const canonical = INDUSTRIES.find((ind) => ind.id === company.industryId);

  return (
    <div className="max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
        <Link href="/find">
          <ArrowLeft className="size-4" aria-hidden />
          Back to search
        </Link>
      </Button>

      <div className="pb-6">
        <h1 className="text-xl font-bold">{company.name}</h1>
        <p className="mt-1 text-sm text-text-2">{company.description}</p>
      </div>

      <Card>
        <CardContent>
          <p className="label-caps">Industry, stored vs resolved</p>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-mono text-xs text-text-3 line-through decoration-conf-low/60">
              {company.rawIndustry}
            </span>
            <ArrowRight className="size-3.5 text-text-3" aria-hidden />
            <span className="font-medium">{canonical?.label ?? company.industryId}</span>
          </p>
          <p className="mt-1.5 font-mono text-xs text-text-2 tnum">
            NAICS {company.naicsCode}
            {canonical ? ` · ${canonical.naicsTitle}` : ""}
          </p>

          <Separator className="my-5" />

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="label-caps">Location</dt>
              <dd className="mt-1">
                {company.city}, {company.state}
              </dd>
            </div>
            <div>
              <dt className="label-caps">Employees</dt>
              <dd className="mt-1 font-mono tnum">
                {company.employeeCount.toLocaleString("en-US")}
              </dd>
            </div>
            <div>
              <dt className="label-caps">Revenue band</dt>
              <dd className="mt-1 font-mono tnum">{company.revenueBand}</dd>
            </div>
            <div>
              <dt className="label-caps">Founded</dt>
              <dd className="mt-1 font-mono tnum">{company.foundedYear}</dd>
            </div>
          </dl>

          <Separator className="my-5" />

          <p className="label-caps">Website</p>
          <a
            href={company.website}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-sm text-brand-600 underline-offset-4 hover:underline"
          >
            {company.website.replace("https://", "")}
            <ExternalLink className="size-3.5" aria-hidden />
          </a>

          <Separator className="my-5" />

          <p className="label-caps">Contacts</p>
          {contacts.length === 0 ? (
            <p className="mt-2 text-sm text-text-3">No contacts on record.</p>
          ) : (
            <ul className="mt-2 grid gap-3 sm:grid-cols-2">
              {contacts.map((contact) => (
                <li key={contact.id} className="text-sm">
                  <p className="font-medium">{contact.name}</p>
                  <p className="text-text-2">{contact.title}</p>
                  <p className="font-mono text-xs text-text-3">{contact.email}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
