import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { formatMoney } from "@/lib/money";
import { DeleteExpenseButton } from "@/components/DeleteExpenseButton";

type ExpenseWithRelations = Prisma.ExpenseGetPayload<{
  include: { paidBy: true; shares: { include: { member: true } } };
}>;

const SPLIT_LABEL: Record<ExpenseWithRelations["splitType"], string> = {
  EQUAL: "Split equally",
  EXACT: "Exact amounts",
  PERCENTAGE: "By percentage",
  SHARES: "By shares",
};

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
  const participantNames = expense.shares.map((s) => s.member.name).join(", ");
  const isMine = expense.createdById === myMemberId;

  const details = (
    <>
      <span className="tag">{SPLIT_LABEL[expense.splitType]}</span>
      <p className="mt-1.5 truncate text-[16px] font-semibold leading-snug">{expense.description}</p>
      <p className="truncate text-[13px] text-ink-2">
        {expense.paidBy.name} paid {"·"} split with {participantNames}
      </p>
    </>
  );

  return (
    <div className="card flex items-center gap-3.5 p-3.5 pr-4">
      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-surface-2 shadow-[inset_0_1px_0_#fff]">
        <span className="text-[10px] font-bold uppercase leading-none tracking-wider text-accent">
          {date.toLocaleDateString(undefined, { month: "short" })}
        </span>
        <span className="mt-0.5 text-xl font-semibold leading-none">{date.getDate()}</span>
      </div>

      {isMine ? (
        <Link href={`/g/${expense.groupId}/expenses/${expense.id}/edit`} className="min-w-0 flex-1">
          {details}
        </Link>
      ) : (
        <div className="min-w-0 flex-1">{details}</div>
      )}

      <div className="flex shrink-0 items-center gap-1">
        <p className="text-[16px] font-semibold tabular-nums">
          {formatMoney(expense.amount, currency)}
        </p>
        {isMine && <DeleteExpenseButton groupId={expense.groupId} expenseId={expense.id} />}
      </div>
    </div>
  );
}
