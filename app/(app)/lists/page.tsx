import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Saved Lists" };

export default function ListsPage() {
  return (
    <div>
      <PageHeader
        title="Saved lists"
        description="Search results live here instead of evaporating — the missing middle of the original product."
      />
      <ComingSoon sprint={4} what="List cards, bulk actions, and CSV export" />
    </div>
  );
}
