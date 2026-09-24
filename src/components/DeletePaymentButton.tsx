"use client";

import { deletePayment } from "@/app/actions/payments";

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
        className="rounded p-1 text-slate-300 hover:text-rose-500"
      >
        &times;
      </button>
    </form>
  );
}
