import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getMemberIdForGroup } from "@/lib/identity";
import { ExpenseForm } from "@/components/ExpenseForm";

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
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-6 sm:py-10">
      <div>
        <Link href={`/g/${groupId}`} className="text-sm font-medium text-indigo-600 hover:underline">
          &larr; Back to {group.name}
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Add expense</h1>
      </div>

      <ExpenseForm
        groupId={groupId}
        currency={group.currency}
        members={group.members.map((m) => ({ id: m.id, name: m.name }))}
        myMemberId={myMemberId}
      />
    </div>
  );
}
