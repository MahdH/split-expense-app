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
    return (
      <p className="card-quiet mt-3 px-4 py-3.5 text-[15px] text-ink-2">
        Everyone is already settled up.
      </p>
    );
  }

  return (
    <div className="mt-3">
      {error && <p className="mb-2 text-sm font-medium text-neg">{error}</p>}

      <div className="mb-2 flex items-center justify-between gap-3 px-1">
        <label className="flex items-center gap-2 text-[13px] font-semibold text-ink-2">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="h-4 w-4 rounded"
          />
          Select all
        </label>
        <span className="text-xs text-ink-3">Tap a payment to record it instantly</span>
      </div>

      <ul className="flex flex-col gap-2">
        {debts.map((debt, i) => {
          const isRecording = pending && recordingIndex === i;
          return (
            <li key={i} className="card-quiet flex items-center gap-3 px-3.5 py-3">
              <input
                type="checkbox"
                checked={selected.has(i)}
                onChange={() => toggle(i)}
                aria-label={`Select payment from ${nameOf(debt.fromId)} to ${nameOf(debt.toId)}`}
                className="h-4 w-4 shrink-0 rounded"
              />
              <button
                type="button"
                disabled={pending}
                onClick={() => recordOne(i)}
                className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:opacity-60"
                title="Click to mark this payment as made"
              >
                <span className="min-w-0 truncate text-[15px]">
                  <span className="font-semibold">{nameOf(debt.fromId)}</span>
                  <span className="text-ink-2"> pays </span>
                  <span className="font-semibold">{nameOf(debt.toId)}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2.5">
                  <span className="text-[15px] font-semibold tabular-nums">
                    {formatMoney(debt.amount, currency)}
                  </span>
                  <span className="rounded-full bg-gradient-to-b from-[#4b4a4c] to-[#2d2c2e] px-3.5 py-1.5 text-xs font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
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
        className="btn-dark mt-4 w-full"
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
