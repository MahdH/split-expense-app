import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getMemberIdForGroup } from "@/lib/identity";
import { getGroupOrThrow, getGroupBalances } from "@/lib/group-data";
import { formatMoney } from "@/lib/money";
import { GroupHeader } from "@/components/GroupHeader";
import { BalanceSummary } from "@/components/BalanceSummary";
import { ExpenseRow } from "@/components/ExpenseRow";

export default async function GroupDashboardPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const group = await getGroupOrThrow(groupId);
  if (!group) notFound();

  const myMemberId = await getMemberIdForGroup(groupId);
  const iAmMember = group.members.some((m) => m.id === myMemberId);
  if (!myMemberId || !iAmMember) redirect(`/g/${groupId}/join`);

  const { balances, simplified } = getGroupBalances(group);
  const me = group.members.find((m) => m.id === myMemberId)!;
  const myBalance = balances.get(myMemberId) ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 pb-28 sm:py-10">
      <GroupHeader group={group} me={me} />

      <BalanceSummary
        group={group}
        members={group.members}
        balances={balances}
        simplified={simplified}
        myMemberId={myMemberId}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Expenses</h2>
        <div
          className={`text-sm font-medium ${
            myBalance === 0 ? "text-slate-500" : myBalance > 0 ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {myBalance === 0
            ? "You're all settled up"
            : myBalance > 0
              ? `You are owed ${formatMoney(myBalance, group.currency)}`
              : `You owe ${formatMoney(-myBalance, group.currency)}`}
        </div>
      </div>

      {group.expenses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No expenses yet. Add your first one to get started.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {group.expenses.map((expense) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              currency={group.currency}
              myMemberId={myMemberId}
            />
          ))}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl gap-2">
          <Link
            href={`/g/${groupId}/settle`}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Settle up
          </Link>
          <Link
            href={`/g/${groupId}/expenses/new`}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-indigo-700"
          >
            + Add expense
          </Link>
        </div>
      </div>
    </div>
  );
}
