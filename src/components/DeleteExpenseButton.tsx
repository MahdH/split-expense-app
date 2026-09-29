"use client";

import { deleteExpense } from "@/app/actions/expenses";
import { TrashIcon } from "@/components/icons";

export function DeleteExpenseButton({
  groupId,
  expenseId,
}: {
  groupId: string;
  expenseId: string;
}) {
  return (
    <form
      action={deleteExpense.bind(null, groupId, expenseId)}
      onSubmit={(e) => {
        if (!confirm("Delete this expense?")) e.preventDefault();
      }}
    >
      <button
        type="submit"
        aria-label="Delete expense"
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-neg-soft hover:text-neg"
      >
        <TrashIcon size={18} />
      </button>
    </form>
  );
}
