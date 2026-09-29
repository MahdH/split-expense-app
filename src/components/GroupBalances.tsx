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
    <section className="card p-5">
      <h2 className="text-lg font-semibold tracking-tight">Group balances</h2>

      {simplified.length === 0 ? (
        <p className="card-quiet mt-3 px-4 py-3.5 text-[15px] text-ink-2">
          Everyone is settled up. Nice!
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {simplified.map((debt, i) => (
            <li
              key={i}
              className="card-quiet flex items-center justify-between gap-3 px-4 py-3.5 text-[15px]"
            >
              <span className="min-w-0 truncate">
                <span className="font-semibold">{nameOf(debt.fromId)}</span>
                <span className="text-ink-2"> owes </span>
                <span className="font-semibold">{nameOf(debt.toId)}</span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums">
                {formatMoney(debt.amount, currency)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
