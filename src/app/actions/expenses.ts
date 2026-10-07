"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { toCents } from "@/lib/money";
import { computeShares, SplitType, SplitValidationError } from "@/lib/splits";
import { fail, MAX_CENTS, ok, type ActionResult } from "@/lib/action-result";
import { getMemberIdForGroup } from "@/lib/identity";

export interface ExpenseParticipantForm {
  memberId: string;
  value?: number; // dollars for EXACT, percent (0-100) for PERCENTAGE, weight for SHARES
}

export interface SaveExpenseInput {
  groupId: string;
  expenseId?: string; // present when editing
  description: string;
  amount: number; // dollars
  currency: string;
  date: string; // ISO date
  paidById: string;
  splitType: SplitType;
  participants: ExpenseParticipantForm[];
  notes?: string;
}

function toShareInputs(input: SaveExpenseInput) {
  return input.participants.map((p) => {
    if (input.splitType === "EXACT") {
      return { memberId: p.memberId, value: toCents(p.value ?? 0) };
    }
    if (input.splitType === "PERCENTAGE") {
      return { memberId: p.memberId, value: Math.round((p.value ?? 0) * 100) }; // percent -> basis points
    }
    return { memberId: p.memberId, value: p.value };
  });
}

export async function saveExpense(input: SaveExpenseInput): Promise<ActionResult> {
  const description = input.description.trim();
  if (!description) return fail("Description is required.");
  if (!(input.amount > 0)) return fail("Amount must be greater than zero.");
  if (!input.paidById) return fail("Choose who paid.");

  const myMemberId = await getMemberIdForGroup(input.groupId);
  if (!myMemberId) return fail("You need to join this group before adding an expense.");

  const amountCents = toCents(input.amount);
  if (!(amountCents > 0)) return fail("Amount must be at least 0.01.");
  if (amountCents > MAX_CENTS) return fail("That amount is too large.");

  // Everyone involved must belong to this group, or the balances would be meaningless.
  const involved = Array.from(new Set([input.paidById, ...input.participants.map((p) => p.memberId)]));
  const known = await prisma.member.count({ where: { id: { in: involved }, groupId: input.groupId } });
  if (known !== involved.length) return fail("Someone in this expense is not in the group.");

  let shares;
  try {
    // A random offset spreads the odd cents of uneven splits across people over time.
    const offset = Math.floor(Math.random() * Math.max(1, input.participants.length));
    shares = computeShares(input.splitType, amountCents, toShareInputs(input), offset);
  } catch (err) {
    if (err instanceof SplitValidationError) return fail(err.message);
    throw err;
  }

  if (input.expenseId) {
    const existing = await prisma.expense.findUnique({
      where: { id: input.expenseId },
      select: { groupId: true, createdById: true },
    });
    if (!existing || existing.groupId !== input.groupId) return fail("Expense not found.");
    if (existing.createdById !== myMemberId) {
      return fail("You can only edit expenses you added.");
    }

    await prisma.$transaction([
      prisma.expenseShare.deleteMany({ where: { expenseId: input.expenseId } }),
      prisma.expense.update({
        where: { id: input.expenseId },
        data: {
          description,
          amount: amountCents,
          currency: input.currency,
          date: new Date(input.date),
          paidById: input.paidById,
          splitType: input.splitType,
          notes: input.notes?.trim() || null,
          shares: {
            create: shares.map((s) => ({
              memberId: s.memberId,
              amount: s.amount,
              rawValue: s.rawValue,
            })),
          },
        },
      }),
    ]);
  } else {
    await prisma.expense.create({
      data: {
        groupId: input.groupId,
        description,
        amount: amountCents,
        currency: input.currency,
        date: new Date(input.date),
        paidById: input.paidById,
        createdById: myMemberId,
        splitType: input.splitType,
        notes: input.notes?.trim() || null,
        shares: {
          create: shares.map((s) => ({
            memberId: s.memberId,
            amount: s.amount,
            rawValue: s.rawValue,
          })),
        },
      },
    });
  }

  revalidatePath(`/g/${input.groupId}`);
  return ok;
}

export async function deleteExpense(groupId: string, expenseId: string) {
  const myMemberId = await getMemberIdForGroup(groupId);
  if (!myMemberId) throw new Error("You need to join this group first.");

  const existing = await prisma.expense.findUnique({
    where: { id: expenseId },
    select: { groupId: true, createdById: true },
  });
  if (!existing || existing.groupId !== groupId) throw new Error("Expense not found.");
  if (existing.createdById !== myMemberId) {
    throw new Error("You can only delete expenses you added.");
  }

  await prisma.expense.delete({ where: { id: expenseId } });
  revalidatePath(`/g/${groupId}`);
}
