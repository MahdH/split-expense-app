"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { toCents } from "@/lib/money";

export interface RecordPaymentInput {
  groupId: string;
  fromId: string;
  toId: string;
  amount: number; // dollars
  currency: string;
  date: string; // ISO date
  note?: string;
}

export async function recordPayment(input: RecordPaymentInput) {
  if (!input.fromId || !input.toId) throw new Error("Choose both who paid and who received.");
  if (input.fromId === input.toId) throw new Error("Payer and recipient must be different.");
  if (!(input.amount > 0)) throw new Error("Amount must be greater than zero.");

  await prisma.payment.create({
    data: {
      groupId: input.groupId,
      fromId: input.fromId,
      toId: input.toId,
      amount: toCents(input.amount),
      currency: input.currency,
      date: new Date(input.date),
      note: input.note?.trim() || null,
    },
  });

  revalidatePath(`/g/${input.groupId}`);
}

export async function deletePayment(groupId: string, paymentId: string) {
  await prisma.payment.delete({ where: { id: paymentId } });
  revalidatePath(`/g/${groupId}`);
}

export interface RecordSuggestedPaymentInput {
  fromId: string;
  toId: string;
  amountCents: number;
}

export async function recordSuggestedPayments(
  groupId: string,
  currency: string,
  payments: RecordSuggestedPaymentInput[]
) {
  const valid = payments.filter(
    (p) => p.fromId && p.toId && p.fromId !== p.toId && p.amountCents > 0
  );
  if (valid.length === 0) throw new Error("No valid payments to record.");

  await prisma.payment.createMany({
    data: valid.map((p) => ({
      groupId,
      fromId: p.fromId,
      toId: p.toId,
      amount: p.amountCents,
      currency,
      note: "Settled from suggested payments",
    })),
  });

  revalidatePath(`/g/${groupId}`);
  revalidatePath(`/g/${groupId}/settle`);
}
