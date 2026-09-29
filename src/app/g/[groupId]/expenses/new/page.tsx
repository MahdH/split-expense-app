import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMemberIdForGroup } from "@/lib/identity";
import { ExpenseForm } from "@/components/ExpenseForm";
import { PageHeader } from "@/components/PageHeader";
import { PageMain } from "@/components/PageMain";

export default async function NewExpensePage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const myMemberId = await getMemberIdForGroup(groupId);
  if (!myMemberId) redirect(`/g/${groupId}/join`);

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: { where: { archived: false }, orderBy: { createdAt: "asc" } } },
  });
  if (!group) notFound();

  return (
    <PageMain className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 pb-16 pt-6">
      <PageHeader backHref={`/g/${groupId}`} title="Add expense" subtitle={group.name} />

      <ExpenseForm
        groupId={groupId}
        currency={group.currency}
        members={group.members.map((m) => ({ id: m.id, name: m.name }))}
        myMemberId={myMemberId}
      />
    </PageMain>
  );
}
