"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordSuggestedPayments, type SuggestionMode } from "@/app/actions/payments";
import { formatMoney } from "@/lib/money";
import type { SimplifiedDebt } from "@/lib/balances";

const sameDebts = (a: SimplifiedDebt[], b: SimplifiedDebt[]) =>
  a.length === b.length &&
  a.every((x) => b.some((y) => y.fromId === x.fromId && y.toId === x.toId && y.amount === x.amount));

export function SuggestedPayments({
  groupId,
  currency,
  fewest,
  direct,
  members,
}: {
  groupId: string;
  currency: string;
  /** The fewest payments that settle everyone. */
  fewest: SimplifiedDebt[];
  /** What each person owes each other person, netted per pair. */
  direct: SimplifiedDebt[];
  members: { id: string; name: string }[];
}) {
  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? "Unknown";
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [recordingIndex, setRecordingIndex] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [mode, setMode] = useState<SuggestionMode>("fewest");

  // When both views are the same list there is nothing to choose between.
  const showToggle = !sameDebts(fewest, direct);
  const debts = showToggle && mode === "direct" ? direct : fewest;
  const activeMode: SuggestionMode = debts === direct && showToggle ? "direct" : "fewest";

  function pickMode(next: SuggestionMode) {
    setMode(next);
    setSelected(new Set());
    setError(null);
  }

  // Shared by both record buttons: surfaces the server's message and refreshes stale lists.
  async function record(chosen: SimplifiedDebt[]) {
    const result = await recordSuggestedPayments(
      groupId,
      chosen.map((d) => ({ fromId: d.fromId, toId: d.toId, amountCents: d.amount })),
      activeMode
    );
    if (!result.ok) setError(result.error);
    setSelected(new Set());
    router.refresh();
  }

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
        await record([debt]);
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
        await record(chosen);
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

      {showToggle && (
        <div className="mb-3">
          <div role="group" aria-label="How to settle" className="card-quiet flex gap-1 p-1">
            {(
              [
                ["fewest", `Fewest payments (${fewest.length})`],
                ["direct", `Between each pair (${direct.length})`],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={activeMode === value}
                onClick={() => pickMode(value)}
                className={`flex-1 rounded-[18px] px-3 py-2 text-[13px] font-semibold transition-[background-color,box-shadow,color] ${
                  activeMode === value ? "bg-white text-ink shadow-pill" : "text-ink-3 hover:text-ink-2"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-2 px-1 text-[12.5px] leading-relaxed text-ink-3">
            {activeMode === "fewest"
              ? "The smallest number of payments that settles everyone."
              : "What each person owes each other person directly, after netting everything between the two of them."}
          </p>
        </div>
      )}

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
