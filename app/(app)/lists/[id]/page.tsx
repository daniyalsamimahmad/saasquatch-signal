import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getList } from "@/lib/queries";
import { ListDetail } from "@/components/lists/list-detail";

export const metadata: Metadata = { title: "List" };

export default async function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  const list = getList(id, session!.user!.id!);
  if (!list) notFound();

  return <ListDetail list={list} />;
}
