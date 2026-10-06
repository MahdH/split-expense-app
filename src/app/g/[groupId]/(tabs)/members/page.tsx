import { notFound, redirect } from "next/navigation";
import { getMemberIdForGroup } from "@/lib/identity";
import { getGroupOrThrow, getGroupBalances, getGroupTripCosts } from "@/lib/group-data";
import { formatMoney } from "@/lib/money";
import { addPlaceholderMember, archiveMember, unarchiveMember } from "@/app/actions/groups";
import { GroupBalances } from "@/components/GroupBalances";
import { SubmitButton } from "@/components/SubmitButton";
import { Avatar } from "@/components/Avatar";
import { PageMain } from "@/components/PageMain";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const myMemberId = await getMemberIdForGroup(groupId);
  if (!myMemberId) redirect(`/g/${groupId}/join`);

  const group = await getGroupOrThrow(groupId);
  if (!group) notFound();

  const { balances, simplified } = getGroupBalances(group);
  const tripCosts = getGroupTripCosts(group);
  const active = group.members.filter((m) => !m.archived);
  const archived = group.members.filter((m) => m.archived);

  return (
    <PageMain className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 pb-36 pt-6">
      <header className="px-1">
        <h1 className="text-[28px] font-semibold tracking-tight">Members</h1>
        <p className="text-[15px] text-ink-2">{group.name}</p>
      </header>

      <GroupBalances currency={group.currency} members={group.members} simplified={simplified} />

      <section className="card p-5">
        <h2 className="text-lg font-semibold tracking-tight">Active</h2>
        <ul className="mt-2 flex flex-col divide-y divide-black/5">
          {active.map((m) => {
            const balance = balances.get(m.id) ?? 0;
            return (
              <li key={m.id} className="flex items-center justify-between gap-3 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={m.name} />
                  <div className="min-w-0">
                    <p className="truncate text-[16px] font-semibold">
                      {m.name}{" "}
                      {m.id === myMemberId && (
                        <span className="text-xs font-medium text-ink-3">(you)</span>
                      )}
                    </p>
                    <span
                      className={`tag mt-1 ${
                        balance === 0 ? "tag-neutral" : balance > 0 ? "tag-pos" : "tag-neg"
                      }`}
                    >
                      {balance === 0
                        ? "Settled up"
                        : balance > 0
                          ? `Gets back ${formatMoney(balance, group.currency)}`
                          : `Owes ${formatMoney(-balance, group.currency)}`}
                    </span>
                    <p className="mt-1 text-[12.5px] font-medium tabular-nums text-ink-3">
                      Trip cost {formatMoney(tripCosts.get(m.id) ?? 0, group.currency)}
                    </p>
                  </div>
                </div>
                {m.id !== myMemberId && (
                  <form action={archiveMember.bind(null, groupId, m.id)}>
                    <button
                      type="submit"
                      className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-ink-3 transition-colors hover:bg-neg-soft hover:text-neg"
                    >
                      Remove
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>

        <form action={addPlaceholderMember.bind(null, groupId)} className="mt-3 flex gap-2">
          <input
            name="name"
            required
            placeholder="Add a member who isn't here"
            aria-label="New member name"
            className="field min-w-0 flex-1"
          />
          <SubmitButton className="btn-dark shrink-0 !px-6">Add</SubmitButton>
        </form>
      </section>

      {archived.length > 0 && (
        <section className="card p-5">
          <h2 className="text-lg font-semibold tracking-tight">Removed</h2>
          <ul className="mt-2 flex flex-col divide-y divide-black/5">
            {archived.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-3">
                <span className="text-[15px] text-ink-2">{m.name}</span>
                <form action={unarchiveMember.bind(null, groupId, m.id)}>
                  <button type="submit" className="btn-soft !px-4 !py-1.5">
                    Restore
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}
    </PageMain>
  );
}
