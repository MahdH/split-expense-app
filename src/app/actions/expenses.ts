"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { toCents } from "@/lib/money";
import { computeShares, SplitType } from "@/lib/splits";

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

export async function saveExpense(input: SaveExpenseInput) {
  const description = input.description.trim();
  if (!description) throw new Error("Description is required.");
  if (!(input.amount > 0)) throw new Error("Amount must be greater than zero.");
  if (!input.paidById) throw new Error("Choose who paid.");

  const amountCents = toCents(input.amount);
  const shares = computeShares(input.splitType, amountCents, toShareInputs(input));

  if (input.expenseId) {
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
}

export async function deleteExpense(groupId: string, expenseId: string) {
  await prisma.expense.delete({ where: { id: expenseId } });
  revalidatePath(`/g/${groupId}`);
}
