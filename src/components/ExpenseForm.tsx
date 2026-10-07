"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveExpense } from "@/app/actions/expenses";
import { fromCents } from "@/lib/money";
import type { SplitType } from "@/lib/splits";

export interface MemberOption {
  id: string;
  name: string;
}

export interface ExpenseFormInitialData {
  id: string;
  description: string;
  amount: number; // cents
  currency: string;
  date: string; // ISO
  paidById: string;
  splitType: SplitType;
  notes: string | null;
  shares: { memberId: string; amount: number; rawValue: number | null }[];
}

const labelClass = "mb-1.5 block text-[13px] font-semibold text-ink-2";

const SPLIT_LABELS: Record<SplitType, string> = {
  EQUAL: "Equally",
  EXACT: "By exact amounts",
  PERCENTAGE: "By percentages",
  SHARES: "By shares",
};

export function ExpenseForm({
  groupId,
  currency,
  members,
  myMemberId,
  initialData,
}: {
  groupId: string;
  currency: string;
  members: MemberOption[];
  myMemberId: string;
  initialData?: ExpenseFormInitialData;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [description, setDescription] = useState(initialData?.description ?? "");
  const [amount, setAmount] = useState(
    initialData ? String(fromCents(initialData.amount)) : ""
  );
  const [date, setDate] = useState(
    initialData ? initialData.date.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [paidById, setPaidById] = useState(initialData?.paidById ?? myMemberId);
  const [splitType, setSplitType] = useState<SplitType>(initialData?.splitType ?? "EQUAL");
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialData ? initialData.shares.map((s) => s.memberId) : members.map((m) => m.id))
  );

  const initialValues = useMemo(() => {
    const map: Record<string, string> = {};
    if (!initialData) return map;
    for (const s of initialData.shares) {
      if (initialData.splitType === "EXACT") map[s.memberId] = String(fromCents(s.amount));
      else if (initialData.splitType === "PERCENTAGE")
        map[s.memberId] = s.rawValue != null ? String(s.rawValue / 100) : "";
      else if (initialData.splitType === "SHARES")
        map[s.memberId] = s.rawValue != null ? String(s.rawValue) : "1";
    }
    return map;
  }, [initialData]);

  const [values, setValues] = useState<Record<string, string>>(initialValues);

  const selectedMembers = members.filter((m) => selected.has(m.id));
  const totalAmount = Number(amount) || 0;

  function toggleMember(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setAllSelected(all: boolean) {
    setSelected(all ? new Set(members.map((m) => m.id)) : new Set());
  }

  // Live validation summary for EXACT/PERCENTAGE splits.
  const splitCheck = useMemo(() => {
    if (splitType === "EXACT") {
      const sum = selectedMembers.reduce((s, m) => s + (Number(values[m.id]) || 0), 0);
      const remaining = Math.round((totalAmount - sum) * 100) / 100;
      return { label: `Remaining: ${remaining.toFixed(2)}`, ok: Math.abs(remaining) < 0.005 };
    }
    if (splitType === "PERCENTAGE") {
      const sum = selectedMembers.reduce((s, m) => s + (Number(values[m.id]) || 0), 0);
      const remaining = Math.round((100 - sum) * 100) / 100;
      return { label: `Remaining: ${remaining.toFixed(2)}%`, ok: Math.abs(remaining) < 0.005 };
    }
    return null;
  }, [splitType, selectedMembers, values, totalAmount]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (selectedMembers.length === 0) {
      setError("Select at least one participant.");
      return;
    }

    const participants = selectedMembers.map((m) => ({
      memberId: m.id,
      value:
        splitType === "EQUAL"
          ? undefined
          : Number(values[m.id]) || 0,
    }));

    startTransition(async () => {
      try {
        const result = await saveExpense({
          groupId,
          expenseId: initialData?.id,
          description,
          amount: totalAmount,
          currency,
          date,
          paidById,
          splitType,
          participants,
          notes,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.push(`/g/${groupId}`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-5 p-5">
      {error && (
        <div className="rounded-2xl bg-neg-soft px-4 py-3 text-sm font-medium text-[#7d1218]">
          {error}
        </div>
      )}

      <div>
        <label className={labelClass}>Description</label>
        <input
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Dinner, groceries, taxi…"
          className="field"
        />
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
          <label className={labelClass}>Date</label>
          <input
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="field"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Paid by</label>
        <select value={paidById} onChange={(e) => setPaidById(e.target.value)} className="field">
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="block text-[13px] font-semibold text-ink-2">Split between</label>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setAllSelected(true)}
              className="rounded-full px-2.5 py-1 text-xs font-semibold text-accent-deep hover:bg-peach/30"
            >
              Everyone
            </button>
            <button
              type="button"
              onClick={() => setAllSelected(false)}
              className="rounded-full px-2.5 py-1 text-xs font-semibold text-accent-deep hover:bg-peach/30"
            >
              No one
            </button>
          </div>
        </div>
        <div className="card-quiet flex flex-col gap-1.5 p-3">
          <select
            value={splitType}
            onChange={(e) => setSplitType(e.target.value as SplitType)}
            className="field mb-1.5 !py-2.5"
          >
            {(Object.keys(SPLIT_LABELS) as SplitType[]).map((st) => (
              <option key={st} value={st}>
                {SPLIT_LABELS[st]}
              </option>
            ))}
          </select>

          {members.map((m) => {
            const isSelected = selected.has(m.id);
            return (
              <div
                key={m.id}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors ${
                  isSelected ? "bg-white shadow-pill" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleMember(m.id)}
                  aria-label={`Include ${m.name}`}
                  className="h-[18px] w-[18px] rounded"
                />
                <span className="flex-1 text-[15px] font-medium">{m.name}</span>
                {isSelected && splitType !== "EQUAL" && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step={splitType === "SHARES" ? "1" : "0.01"}
                      min="0"
                      value={values[m.id] ?? ""}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [m.id]: e.target.value }))
                      }
                      placeholder={splitType === "SHARES" ? "1" : "0.00"}
                      className="field w-24 !rounded-xl !px-3 !py-1.5 text-right text-sm"
                    />
                    <span className="w-4 text-xs font-semibold text-ink-3">
                      {splitType === "PERCENTAGE" ? "%" : splitType === "EXACT" ? "" : "x"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {splitCheck && (
          <p className={`mt-2 px-1 text-xs font-semibold ${splitCheck.ok ? "text-pos" : "text-neg"}`}>
            {splitCheck.label}
          </p>
        )}
      </div>

      <div>
        <label className={labelClass}>Notes (optional)</label>
        <textarea
          value={notes ?? ""}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="field"
        />
      </div>

      <button type="submit" disabled={pending} className="btn-dark w-full">
        {pending ? "Saving…" : initialData ? "Save changes" : "Add expense"}
      </button>
    </form>
  );
}
