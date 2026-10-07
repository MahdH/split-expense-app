"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { toCents } from "@/lib/money";
import { getGroupBalances, getGroupOrThrow } from "@/lib/group-data";
import { fail, MAX_CENTS, ok, type ActionResult } from "@/lib/action-result";

export interface RecordPaymentInput {
  groupId: string;
  fromId: string;
  toId: string;
  amount: number; // dollars
  currency: string;
  date: string; // ISO date
  note?: string;
}

export async function recordPayment(input: RecordPaymentInput): Promise<ActionResult> {
  if (!input.fromId || !input.toId) return fail("Choose both who paid and who received.");
  if (input.fromId === input.toId) return fail("Payer and recipient must be different.");
  if (!(input.amount > 0)) return fail("Amount must be greater than zero.");

  const amount = toCents(input.amount);
  if (!(amount > 0)) return fail("Amount must be at least 0.01.");
  if (amount > MAX_CENTS) return fail("That amount is too large.");

  const date = new Date(input.date);
  if (Number.isNaN(date.getTime())) return fail("That date isn't valid.");

  const inGroup = await prisma.member.count({
    where: { id: { in: [input.fromId, input.toId] }, groupId: input.groupId },
  });
  if (inGroup !== 2) return fail("Both people must be in this group.");

  await prisma.payment.create({
    data: {
      groupId: input.groupId,
      fromId: input.fromId,
      toId: input.toId,
      amount,
      currency: input.currency,
      date,
      note: input.note?.trim() || null,
    },
  });

  revalidatePath(`/g/${input.groupId}`);
  return ok;
}

export async function deletePayment(groupId: string, paymentId: string) {
  await prisma.payment.deleteMany({ where: { id: paymentId, groupId } });
  revalidatePath(`/g/${groupId}`);
}

export interface RecordSuggestedPaymentInput {
  fromId: string;
  toId: string;
  amountCents: number;
}

/** Which list of suggestions a payment was taken from (see `getGroupBalances`). */
export type SuggestionMode = "fewest" | "direct";

const STALE =
  "The balances changed since this page was loaded (someone may have already recorded these). The list has been refreshed.";

/**
 * Records payments the app suggested. The amounts come from the browser, so each one is
 * checked against the group's current balances first: without that, two people tapping
 * "Mark paid" on the same suggestion would record it twice and reverse the debt.
 */
export async function recordSuggestedPayments(
  groupId: string,
  payments: RecordSuggestedPaymentInput[],
  mode: SuggestionMode = "fewest"
): Promise<ActionResult> {
  const valid = payments.filter(
    (p) => p.fromId && p.toId && p.fromId !== p.toId && Number.isInteger(p.amountCents) && p.amountCents > 0
  );
  if (valid.length === 0 || valid.length !== payments.length) return fail("No valid payments to record.");

  const group = await getGroupOrThrow(groupId);
  if (!group) return fail("Group not found.");
  const memberIds = new Set(group.members.map((m) => m.id));
  if (valid.some((p) => !memberIds.has(p.fromId) || !memberIds.has(p.toId))) {
    return fail("Both people must be in this group.");
  }

  const { balances, direct } = getGroupBalances(group);

  if (mode === "direct") {
    // Each payment may not exceed what that person currently owes that person.
    const owed = new Map(direct.map((d) => [`${d.fromId}>${d.toId}`, d.amount]));
    for (const p of valid) {
      const key = `${p.fromId}>${p.toId}`;
      const left = (owed.get(key) ?? 0) - p.amountCents;
      if (left < 0) return fail(STALE);
      owed.set(key, left);
    }
  } else {
    // The payer must still owe at least this much, and the receiver must still be owed it.
    const working = new Map(balances);
    for (const p of valid) {
      const from = (working.get(p.fromId) ?? 0) + p.amountCents;
      const to = (working.get(p.toId) ?? 0) - p.amountCents;
      if (from > 0 || to < 0) return fail(STALE);
      working.set(p.fromId, from);
      working.set(p.toId, to);
    }
  }

  await prisma.payment.createMany({
    data: valid.map((p) => ({
      groupId,
      fromId: p.fromId,
      toId: p.toId,
      amount: p.amountCents,
      currency: group.currency,
      note: "Settled from suggested payments",
    })),
  });

  revalidatePath(`/g/${groupId}`);
  revalidatePath(`/g/${groupId}/settle`);
  return ok;
}
