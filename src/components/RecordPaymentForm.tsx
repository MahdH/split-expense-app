"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordPayment } from "@/app/actions/payments";

const labelClass = "mb-1.5 block text-[13px] font-semibold text-ink-2";

export function RecordPaymentForm({
  groupId,
  currency,
  members,
  defaultFromId,
}: {
  groupId: string;
  currency: string;
  members: { id: string; name: string }[];
  defaultFromId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fromId, setFromId] = useState(defaultFromId);
  const [toId, setToId] = useState(members.find((m) => m.id !== defaultFromId)?.id ?? "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await recordPayment({
          groupId,
          fromId,
          toId,
          amount: Number(amount) || 0,
          currency,
          date: new Date().toISOString(),
          note,
        });
        setAmount("");
        setNote("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <p className="text-sm font-medium text-neg">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>From</label>
          <select value={fromId} onChange={(e) => setFromId(e.target.value)} className="field">
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>To</label>
          <select value={toId} onChange={(e) => setToId(e.target.value)} className="field">
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Amount ({currency})</label>
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="field"
          />
        </div>
        <div>
          <label className={labelClass}>Note (optional)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Venmo, cash…"
            className="field"
          />
        </div>
      </div>
      <button type="submit" disabled={pending} className="btn-dark w-full">
        {pending ? "Saving…" : "Record payment"}
      </button>
    </form>
  );
}
