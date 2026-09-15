import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Compose" };

export default function ComposePage() {
  return (
    <div>
      <PageHeader title="Compose" />
      <ComingSoon sprint={4} what="Prefilled compose with three generated context points" />
    </div>
  );
}
