import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Results" };

export default function ResultsPage() {
  return (
    <div>
      <PageHeader title="Results" />
      <ComingSoon sprint={3} what="Results table with the match transparency panel" />
    </div>
  );
}
