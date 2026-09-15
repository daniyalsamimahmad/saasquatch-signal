import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "List" };

export default function ListDetailPage() {
  return (
    <div>
      <PageHeader title="List" />
      <ComingSoon sprint={4} what="List table with rename, duplicate, export, and outreach" />
    </div>
  );
}
