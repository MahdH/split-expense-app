import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMemberIdForGroup } from "@/lib/identity";
import { ExpenseForm } from "@/components/ExpenseForm";
import { PageHeader } from "@/components/PageHeader";
import { PageMain } from "@/components/PageMain";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ groupId: string; expenseId: string }>;
}) {
  const { groupId, expenseId } = await params;
  const myMemberId = await getMemberIdForGroup(groupId);
  if (!myMemberId) redirect(`/g/${groupId}/join`);

  const [group, expense] = await Promise.all([
    prisma.group.findUnique({
      where: { id: groupId },
      include: { members: { where: { archived: false }, orderBy: { createdAt: "asc" } } },
    }),
    prisma.expense.findUnique({
      where: { id: expenseId },
      include: { shares: true },
    }),
  ]);
  if (!group || !expense || expense.groupId !== groupId) notFound();
  if (expense.createdById !== myMemberId) {
    redirect(`/g/${groupId}`);
  }

  return (
    <PageMain className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 pb-16 pt-6">
      <PageHeader backHref={`/g/${groupId}`} title="Edit expense" subtitle={group.name} />

      <ExpenseForm
        groupId={groupId}
        currency={group.currency}
        members={group.members.map((m) => ({ id: m.id, name: m.name }))}
        myMemberId={myMemberId}
        initialData={{
          id: expense.id,
          description: expense.description,
          amount: expense.amount,
          currency: expense.currency,
          date: expense.date.toISOString(),
          paidById: expense.paidById,
          splitType: expense.splitType,
          notes: expense.notes,
          shares: expense.shares.map((s) => ({
            memberId: s.memberId,
            amount: s.amount,
            rawValue: s.rawValue,
          })),
        }}
      />
    </PageMain>
  );
}
