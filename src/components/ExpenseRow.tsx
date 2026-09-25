import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { formatMoney } from "@/lib/money";
import { DeleteExpenseButton } from "@/components/DeleteExpenseButton";

type ExpenseWithRelations = Prisma.ExpenseGetPayload<{
  include: { paidBy: true; shares: { include: { member: true } } };
}>;

export function ExpenseRow({
  expense,
  currency,
  myMemberId,
}: {
  expense: ExpenseWithRelations;
  currency: string;
  myMemberId: string;
}) {
  const date = new Date(expense.date);
  const dateLabel = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const participantNames = expense.shares.map((s) => s.member.name).join(", ");
  const isMine = expense.createdById === myMemberId;

  const details = (
    <>
      <p className="truncate font-medium text-slate-900">{expense.description}</p>
      <p className="truncate text-xs text-slate-500">
        {expense.paidBy.name} paid {"·"} split with {participantNames}
      </p>
    </>
  );

  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex h-11 w-11 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
        <span className="text-[10px] font-semibold uppercase leading-none">
          {date.toLocaleDateString(undefined, { month: "short" })}
        </span>
        <span className="text-sm font-bold leading-none">{date.getDate()}</span>
      </div>

      {isMine ? (
        <Link href={`/g/${expense.groupId}/expenses/${expense.id}/edit`} className="min-w-0 flex-1">
          {details}
        </Link>
      ) : (
        <div className="min-w-0 flex-1">{details}</div>
      )}

      <div className="flex flex-shrink-0 items-center gap-3">
        <div className="text-right">
          <p className="font-semibold text-slate-900">{formatMoney(expense.amount, currency)}</p>
          <p className="text-xs text-slate-400">{dateLabel}</p>
        </div>
        {isMine && <DeleteExpenseButton groupId={expense.groupId} expenseId={expense.id} />}
      </div>
    </div>
  );
}
