import type { Member } from "@prisma/client";
import type { SimplifiedDebt } from "@/lib/balances";
import { formatMoney } from "@/lib/money";

export function BalanceSummary({
  group,
  members,
  balances,
  simplified,
  myMemberId,
}: {
  group: { currency: string };
  members: Member[];
  balances: Map<string, number>;
  simplified: SimplifiedDebt[];
  myMemberId: string;
}) {
  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? "Unknown";
  void myMemberId;

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
                {formatMoney(debt.amount, group.currency)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <details className="mt-4">
        <summary className="cursor-pointer text-xs font-medium text-slate-400 hover:text-slate-600">
          Show individual balances
        </summary>
        <ul className="mt-2 flex flex-col gap-1.5">
          {members.map((m) => {
            const balance = balances.get(m.id) ?? 0;
            return (
              <li key={m.id} className="flex items-center justify-between text-xs">
                <span className="text-slate-600">{m.name}</span>
                <span
                  className={
                    balance === 0
                      ? "text-slate-400"
                      : balance > 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                  }
                >
                  {balance === 0
                    ? "settled"
                    : balance > 0
                      ? `+${formatMoney(balance, group.currency)}`
                      : `-${formatMoney(-balance, group.currency)}`}
                </span>
              </li>
            );
          })}
        </ul>
      </details>
    </div>
  );
}
