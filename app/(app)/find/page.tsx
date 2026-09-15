import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { SearchForm } from "@/components/find/search-form";

export const metadata: Metadata = { title: "Search" };

export default function FindPage() {
  return (
    <div>
      <PageHeader
        title="Find companies"
        description="Type an industry — typos welcome. The resolver corrects, maps to NAICS, and shows exactly what it matched. Below 60% confidence it blocks instead of guessing."
      />
      <SearchForm />
    </div>
  );
}
