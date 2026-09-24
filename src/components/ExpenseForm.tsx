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
        await saveExpense({
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
        router.push(`/g/${groupId}`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
        <input
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Dinner, groceries, taxi…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Amount ({currency})
          </label>
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
          <input
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Paid by</label>
        <select
          value={paidById}
          onChange={(e) => setPaidById(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-700">Split between</label>
          <div className="flex gap-3 text-xs font-medium text-indigo-600">
            <button type="button" onClick={() => setAllSelected(true)} className="hover:underline">
              Everyone
            </button>
            <button type="button" onClick={() => setAllSelected(false)} className="hover:underline">
              No one
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border border-slate-300 p-3">
          <select
            value={splitType}
            onChange={(e) => setSplitType(e.target.value as SplitType)}
            className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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
                className={`flex items-center gap-3 rounded-lg px-2 py-1.5 ${
                  isSelected ? "bg-indigo-50" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleMember(m.id)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                />
                <span className="flex-1 text-sm text-slate-800">{m.name}</span>
                {isSelected && splitType !== "EQUAL" && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step={splitType === "SHARES" ? "1" : "0.01"}
                      min="0"
                      value={values[m.id] ?? ""}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [m.id]: e.target.value }))
                      }
                      placeholder={splitType === "SHARES" ? "1" : "0.00"}
                      className="w-24 rounded-md border border-slate-300 px-2 py-1 text-right text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="w-4 text-xs text-slate-400">
                      {splitType === "PERCENTAGE" ? "%" : splitType === "EXACT" ? "" : "x"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {splitCheck && (
          <p className={`mt-1 text-xs ${splitCheck.ok ? "text-emerald-600" : "text-rose-500"}`}>
            {splitCheck.label}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Notes (optional)</label>
        <textarea
          value={notes ?? ""}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving…" : initialData ? "Save changes" : "Add expense"}
      </button>
    </form>
  );
}
