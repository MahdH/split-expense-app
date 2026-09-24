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
