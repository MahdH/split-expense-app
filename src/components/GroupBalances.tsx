import type { Member } from "@prisma/client";
import type { SimplifiedDebt } from "@/lib/balances";
import { formatMoney } from "@/lib/money";

export function GroupBalances({
  currency,
  members,
  simplified,
}: {
  currency: string;
  members: Member[];
  simplified: SimplifiedDebt[];
}) {
  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? "Unknown";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
        Group balances
      </h2>

      {simplified.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Everyone is settled up. Nice!</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {simplified.map((debt, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
            >
              <span>
                <span className="font-medium text-slate-900">{nameOf(debt.fromId)}</span>
                <span className="text-slate-400"> owes </span>
                <span className="font-medium text-slate-900">{nameOf(debt.toId)}</span>
              </span>
              <span className="font-semibold text-slate-900">
                {formatMoney(debt.amount, currency)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
