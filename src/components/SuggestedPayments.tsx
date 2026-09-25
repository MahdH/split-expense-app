"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordSuggestedPayments } from "@/app/actions/payments";
import { formatMoney } from "@/lib/money";
import type { SimplifiedDebt } from "@/lib/balances";

export function SuggestedPayments({
  groupId,
  currency,
  debts,
  members,
}: {
  groupId: string;
  currency: string;
  debts: SimplifiedDebt[];
  members: { id: string; name: string }[];
}) {
  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? "Unknown";
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [recordingIndex, setRecordingIndex] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const allSelected = selected.size > 0 && selected.size === debts.length;

  function toggle(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(debts.map((_, i) => i)));
  }

  function recordOne(i: number) {
    setError(null);
    setRecordingIndex(i);
    const debt = debts[i];
    startTransition(async () => {
      try {
        await recordSuggestedPayments(groupId, currency, [
          { fromId: debt.fromId, toId: debt.toId, amountCents: debt.amount },
        ]);
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(i);
          return next;
        });
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setRecordingIndex(null);
      }
    });
  }

  const selectedCount = selected.size;

  function recordSelected() {
    setError(null);
    const chosen = Array.from(selected).map((i) => debts[i]);
    startTransition(async () => {
      try {
        await recordSuggestedPayments(
          groupId,
          currency,
          chosen.map((d) => ({ fromId: d.fromId, toId: d.toId, amountCents: d.amount }))
        );
        setSelected(new Set());
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  const selectedTotal = useMemo(
    () => Array.from(selected).reduce((sum, i) => sum + debts[i].amount, 0),
    [selected, debts]
  );

  if (debts.length === 0) {
    return <p className="mt-3 text-sm text-slate-500">Everyone is already settled up.</p>;
  }

  return (
    <div className="mt-3">
      {error && <p className="mb-2 text-sm text-rose-600">{error}</p>}

      <div className="mb-2 flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600"
          />
          Select all
        </label>
        <span className="text-xs text-slate-400">Tap a payment to record it instantly</span>
      </div>

      <ul className="flex flex-col gap-2">
        {debts.map((debt, i) => {
          const isRecording = pending && recordingIndex === i;
          return (
            <li
              key={i}
              className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm hover:bg-slate-100"
            >
              <input
                type="checkbox"
                checked={selected.has(i)}
                onChange={() => toggle(i)}
                onClick={(e) => e.stopPropagation()}
                className="h-4 w-4 flex-shrink-0 rounded border-slate-300 text-indigo-600"
              />
              <button
                type="button"
                disabled={pending}
                onClick={() => recordOne(i)}
                className="flex flex-1 items-center justify-between text-left disabled:cursor-not-allowed disabled:opacity-60"
                title="Click to mark this payment as made"
              >
                <span>
                  <span className="font-medium text-slate-900">{nameOf(debt.fromId)}</span>
                  <span className="text-slate-400"> pays </span>
                  <span className="font-medium text-slate-900">{nameOf(debt.toId)}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">
                    {formatMoney(debt.amount, currency)}
                  </span>
                  <span className="text-xs font-medium text-indigo-600">
                    {isRecording ? "Recording…" : "Mark paid"}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        disabled={pending || selectedCount === 0}
        onClick={recordSelected}
        className="mt-3 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending
          ? "Recording…"
          : selectedCount === 0
            ? "Select payments to record together"
            : `Record ${selectedCount} selected (${formatMoney(selectedTotal, currency)})`}
      </button>
    </div>
  );
}
