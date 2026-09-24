export interface BalanceExpenseInput {
  paidById: string;
  amount: number;
  shares: { memberId: string; amount: number }[];
}

export interface BalancePaymentInput {
  fromId: string;
  toId: string;
  amount: number;
}

export interface MemberBalance {
  memberId: string;
  /** Net balance in cents. Positive = this member is owed money. Negative = this member owes money. */
  balance: number;
}

export interface SimplifiedDebt {
  fromId: string;
  toId: string;
  amount: number;
}

/**
 * Computes each member's net balance (in cents) from the group's expenses and
 * settlement payments. Positive means the group owes them money; negative means
 * they owe the group money.
 */
export function computeBalances(
  memberIds: string[],
  expenses: BalanceExpenseInput[],
  payments: BalancePaymentInput[]
): Map<string, number> {
  const balance = new Map<string, number>(memberIds.map((id) => [id, 0]));

  const add = (id: string, delta: number) => {
    balance.set(id, (balance.get(id) ?? 0) + delta);
  };

  for (const expense of expenses) {
    add(expense.paidById, expense.amount);
    for (const share of expense.shares) {
      add(share.memberId, -share.amount);
    }
  }

  for (const payment of payments) {
    add(payment.fromId, payment.amount);
    add(payment.toId, -payment.amount);
  }

  return balance;
}

/**
 * Greedy min-transaction debt simplification: repeatedly matches the largest
 * creditor with the largest debtor until all balances are settled. Produces the
 * minimum number of "who pays whom" transactions to zero out the group.
 */
export function simplifyDebts(balances: Map<string, number>): SimplifiedDebt[] {
  const entries = Array.from(balances.entries())
    .filter(([, amount]) => amount !== 0)
    .map(([memberId, amount]) => ({ memberId, amount }));

  const creditors = entries.filter((e) => e.amount > 0).sort((a, b) => b.amount - a.amount);
  const debtors = entries.filter((e) => e.amount < 0).sort((a, b) => a.amount - b.amount);

  const transactions: SimplifiedDebt[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const settle = Math.min(creditor.amount, -debtor.amount);

    if (settle > 0) {
      transactions.push({ fromId: debtor.memberId, toId: creditor.memberId, amount: settle });
    }

    creditor.amount -= settle;
    debtor.amount += settle;

    if (creditor.amount === 0) ci++;
    if (debtor.amount === 0) di++;
  }

  return transactions;
}
