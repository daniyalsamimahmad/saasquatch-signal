import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { SearchForm } from "@/components/find/search-form";

export const metadata: Metadata = { title: "Search" };

export default function FindPage() {
  return (
    <div>
      <PageHeader
        title="Find companies"
        description="Search by industry and metro. Typos are fine, the resolver sorts them out."
      />
      <SearchForm />
    </div>
  );
}
