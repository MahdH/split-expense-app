import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getMemberIdForGroup } from "@/lib/identity";
import { getGroupOrThrow, getGroupBalances } from "@/lib/group-data";
import { formatMoney } from "@/lib/money";
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
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-6 sm:py-10">
      <div>
        <Link href={`/g/${groupId}`} className="text-sm font-medium text-indigo-600 hover:underline">
          &larr; Back to {group.name}
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Settle up</h1>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Suggested payments
        </h2>
        <SuggestedPayments
          groupId={groupId}
          currency={group.currency}
          debts={simplified}
          members={group.members.map((m) => ({ id: m.id, name: m.name }))}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Record a payment
        </h2>
        <p className="mt-1 text-xs text-slate-500">
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
      </div>

      {group.payments.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Payment history
          </h2>
          <ul className="mt-3 flex flex-col divide-y divide-slate-100">
            {group.payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                <span>
                  <span className="font-medium text-slate-900">{p.from.name}</span>
                  <span className="text-slate-400"> paid </span>
                  <span className="font-medium text-slate-900">{p.to.name}</span>
                  {p.note && <span className="text-slate-400"> {"—"} {p.note}</span>}
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">
                    {formatMoney(p.amount, group.currency)}
                  </span>
                  <DeletePaymentButton groupId={groupId} paymentId={p.id} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
