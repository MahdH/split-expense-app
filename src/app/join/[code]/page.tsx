import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function JoinByCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const group = await prisma.group.findUnique({
    where: { inviteCode: code.toUpperCase() },
    select: { id: true },
  });
  if (!group) notFound();
  redirect(`/g/${group.id}/join`);
}
