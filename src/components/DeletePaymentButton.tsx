"use client";

import { deletePayment } from "@/app/actions/payments";
import { TrashIcon } from "@/components/icons";

export function DeletePaymentButton({
  groupId,
  paymentId,
}: {
  groupId: string;
  paymentId: string;
}) {
  return (
    <form
      action={deletePayment.bind(null, groupId, paymentId)}
      onSubmit={(e) => {
        if (!confirm("Delete this payment?")) e.preventDefault();
      }}
    >
      <button
        type="submit"
        aria-label="Delete payment"
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-neg-soft hover:text-neg"
      >
        <TrashIcon size={18} />
      </button>
    </form>
  );
}
