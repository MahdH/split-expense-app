import { prisma } from "./prisma";
import { computeBalances, computeDirectDebts, computeTripCosts, simplifyDebts } from "./balances";

export async function getGroupOrThrow(groupId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: { orderBy: { createdAt: "asc" } },
      expenses: {
        orderBy: { date: "desc" },
        include: { paidBy: true, shares: { include: { member: true } } },
      },
      payments: {
        orderBy: { date: "desc" },
        include: { from: true, to: true },
      },
    },
  });
  if (!group) return null;
  return group;
}

export type GroupWithData = NonNullable<Awaited<ReturnType<typeof getGroupOrThrow>>>;

export function getGroupBalances(group: GroupWithData) {
  const memberIds = group.members.map((m) => m.id);
  const expenses = group.expenses.map((e) => ({
    paidById: e.paidById,
    amount: e.amount,
    shares: e.shares.map((s) => ({ memberId: s.memberId, amount: s.amount })),
  }));
  const payments = group.payments.map((p) => ({ fromId: p.fromId, toId: p.toId, amount: p.amount }));

  const balances = computeBalances(memberIds, expenses, payments);
  return {
    balances,
    /** The fewest payments that settle everyone. */
    simplified: simplifyDebts(balances),
    /** What each person owes each other person directly, netted per pair. */
    direct: computeDirectDebts(expenses, payments),
  };
}

export function getGroupTripCosts(group: GroupWithData) {
  return computeTripCosts(
    group.members.map((m) => m.id),
    group.expenses.map((e) => ({
      shares: e.shares.map((s) => ({ memberId: s.memberId, amount: s.amount })),
    }))
  );
}
