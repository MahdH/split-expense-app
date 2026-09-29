import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getMemberIdForGroup } from "@/lib/identity";
import { getGroupOrThrow, getGroupBalances } from "@/lib/group-data";
import { GroupHero } from "@/components/GroupHero";
import { ExpenseRow } from "@/components/ExpenseRow";
import { PlusIcon } from "@/components/icons";
import { ViewTransition } from "react";
import { PageMain } from "@/components/PageMain";

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
  const totalSpent = group.expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <PageMain className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pb-36 pt-4">
      <GroupHero
        group={group}
        me={me}
        myBalance={myBalance}
        totalSpent={totalSpent}
        expenseCount={group.expenses.length}
      />

      <section className="mt-8 flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[22px] font-semibold tracking-tight">Expenses</h2>
          <Link href={`/g/${groupId}/settle`} transitionTypes={["nav-forward"]} className="btn-soft">
            Settle up
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href={`/g/${groupId}/expenses/new`}
            transitionTypes={["nav-forward"]}
            className="card-quiet flex items-center gap-3.5 border-2 border-dashed border-black/10 p-3.5 pr-4 transition-[transform,background-color] hover:bg-[#efefef] active:scale-[0.985]"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-[#4b4a4c] to-[#2d2c2e] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_14px_-8px_rgba(23,20,21,0.6)]">
              <PlusIcon size={24} />
            </span>
            <span className="text-[16px] font-semibold">Add expense</span>
          </Link>

          {group.expenses.length === 0 ? (
            <p className="px-2 py-5 text-center text-sm text-ink-2">
              No expenses yet. Add your first one to get started.
            </p>
          ) : (
            group.expenses.map((expense) => (
              <ViewTransition
                key={expense.id}
                enter="item-in"
                exit="item-out"
                update="item-move"
                default="none"
              >
                <ExpenseRow
                  expense={expense}
                  currency={group.currency}
                  myMemberId={myMemberId}
                />
              </ViewTransition>
            ))
          )}
        </div>
      </section>
    </PageMain>
  );
}
