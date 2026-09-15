import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Company" };

export default function CompanyPage() {
  return (
    <div>
      <PageHeader title="Company" />
      <ComingSoon sprint={3} what="Company detail — including the rawIndustry → canonical story" />
    </div>
  );
}
