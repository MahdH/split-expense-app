import { notFound, redirect } from "next/navigation";
import { getMemberIdForGroup } from "@/lib/identity";
import { getGroupOrThrow, getGroupBalances } from "@/lib/group-data";
import { formatMoney } from "@/lib/money";
import { PageHeader } from "@/components/PageHeader";
import { RecordPaymentForm } from "@/components/RecordPaymentForm";
import { DeletePaymentButton } from "@/components/DeletePaymentButton";
import { SuggestedPayments } from "@/components/SuggestedPayments";

export default async function SettleUpPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const myMemberId = await getMemberIdForGroup(groupId);
  if (!myMemberId) redirect(`/g/${groupId}/join`);

  const group = await getGroupOrThrow(groupId);
  if (!group) notFound();

  const { simplified } = getGroupBalances(group);
  const members = group.members.filter((m) => !m.archived);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 pb-16 pt-6">
      <PageHeader backHref={`/g/${groupId}`} title="Settle up" subtitle={group.name} />

      <section className="card p-5">
        <h2 className="text-lg font-semibold tracking-tight">Suggested payments</h2>
        <SuggestedPayments
          groupId={groupId}
          currency={group.currency}
          debts={simplified}
          members={group.members.map((m) => ({ id: m.id, name: m.name }))}
        />
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold tracking-tight">Record a payment</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
          Log a payment someone actually made outside the app (cash, bank transfer, etc.) to
          balance the books.
        </p>
        <div className="mt-4">
          <RecordPaymentForm
            groupId={groupId}
            currency={group.currency}
            members={members.map((m) => ({ id: m.id, name: m.name }))}
            defaultFromId={myMemberId}
          />
        </div>
      </section>

      {group.payments.length > 0 && (
        <section className="card p-5">
          <h2 className="text-lg font-semibold tracking-tight">Payment history</h2>
          <ul className="mt-2 flex flex-col divide-y divide-black/5">
            {group.payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-3 text-[15px]">
                <span className="min-w-0">
                  <span className="font-semibold">{p.from.name}</span>
                  <span className="text-ink-2"> paid </span>
                  <span className="font-semibold">{p.to.name}</span>
                  {p.note && <span className="block truncate text-[13px] text-ink-3">{p.note}</span>}
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <span className="font-semibold tabular-nums">
                    {formatMoney(p.amount, group.currency)}
                  </span>
                  <DeletePaymentButton groupId={groupId} paymentId={p.id} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
