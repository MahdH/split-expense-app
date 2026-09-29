import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getMemberIdForGroup } from "@/lib/identity";
import { getGroupOrThrow, getGroupBalances } from "@/lib/group-data";
import { GroupHeader } from "@/components/GroupHeader";
import { ExpenseRow } from "@/components/ExpenseRow";
import { PlusIcon } from "@/components/icons";

export default async function GroupHomePage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const group = await getGroupOrThrow(groupId);
  if (!group) notFound();

  const myMemberId = await getMemberIdForGroup(groupId);
  const me = group.members.find((m) => m.id === myMemberId);
  if (!myMemberId || !me) redirect(`/g/${groupId}/join`);

  const { balances } = getGroupBalances(group);
  const myBalance = balances.get(myMemberId) ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 pb-28 sm:py-10">
      <GroupHeader group={group} me={me} myBalance={myBalance} />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Expenses</h2>
          <Link
            href={`/g/${groupId}/settle`}
            className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Settle up
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href={`/g/${groupId}/expenses/new`}
            className="flex items-center gap-3 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 p-4 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <PlusIcon size={20} />
            </span>
            Add expense
          </Link>

          {group.expenses.length === 0 ? (
            <p className="px-1 py-4 text-center text-sm text-slate-500">
              No expenses yet. Add your first one to get started.
            </p>
          ) : (
            group.expenses.map((expense) => (
              <ExpenseRow
                key={expense.id}
                expense={expense}
                currency={group.currency}
                myMemberId={myMemberId}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
