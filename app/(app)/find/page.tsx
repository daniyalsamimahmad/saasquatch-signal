import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Search" };

export default function FindPage() {
  return (
    <div>
      <PageHeader
        title="Find companies"
        description="Search by industry and location. The Industry Resolver corrects typos, maps to NAICS, and shows exactly what it matched."
      />
      <ComingSoon sprint={3} what="The search form and Industry Resolver combobox" />
    </div>
  );
}
