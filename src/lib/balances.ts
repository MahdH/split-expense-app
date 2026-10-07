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
 * What the trip cost each member in total, in cents: the sum of their share of every
 * expense. It ignores who paid and any settlement payments, so it never changes when
 * people settle up.
 */
export function computeTripCosts(
  memberIds: string[],
  expenses: Pick<BalanceExpenseInput, "shares">[]
): Map<string, number> {
  const cost = new Map<string, number>(memberIds.map((id) => [id, 0]));
  for (const expense of expenses) {
    for (const share of expense.shares) {
      cost.set(share.memberId, (cost.get(share.memberId) ?? 0) + share.amount);
    }
  }
  return cost;
}

/**
 * Largest-creditor-with-largest-debtor matching. For a set of balances that sums to
 * zero it always settles everyone using at most (people - 1) transfers.
 */
function greedySettle(entries: { memberId: string; amount: number }[]): SimplifiedDebt[] {
  const creditors = entries
    .filter((e) => e.amount > 0)
    .map((e) => ({ ...e }))
    .sort((a, b) => b.amount - a.amount);
  const debtors = entries
    .filter((e) => e.amount < 0)
    .map((e) => ({ ...e }))
    .sort((a, b) => a.amount - b.amount);

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

/** Above this many people with a non-zero balance the exact search is skipped (it is O(3^n)). */
const EXACT_LIMIT = 13;

/**
 * The fewest payments that settle everyone ("who pays whom").
 *
 * A group of k people whose balances add up to zero can settle among themselves with
 * k - 1 payments, so the minimum for the whole group is
 *   (people with a balance) - (the most separate zero-sum groups they can be split into).
 * Finding that split is a subset-sum problem, so it is solved exactly for up to
 * EXACT_LIMIT people and with the greedy matching beyond that (at most one extra
 * payment in practice).
 */
export function simplifyDebts(balances: Map<string, number>): SimplifiedDebt[] {
  const entries = Array.from(balances.entries())
    .filter(([, amount]) => amount !== 0)
    .map(([memberId, amount]) => ({ memberId, amount }));

  const n = entries.length;
  if (n === 0) return [];
  if (n > EXACT_LIMIT) return greedySettle(entries);

  const size = 1 << n;
  const sums = new Array<number>(size).fill(0);
  for (let m = 1; m < size; m++) {
    const low = m & -m;
    sums[m] = sums[m ^ low] + entries[31 - Math.clz32(low)].amount;
  }

  // best[m]: most zero-sum groups the people in m (a zero-sum set) can be split into.
  // Every group in a split must contain the lowest-numbered person left, so each split is tried once.
  const best = new Array<number>(size).fill(-1);
  const pick = new Array<number>(size).fill(0);
  best[0] = 0;
  for (let m = 1; m < size; m++) {
    if (sums[m] !== 0) continue;
    const low = m & -m;
    const rest = m ^ low;
    for (let sub = rest; ; sub = (sub - 1) & rest) {
      const group = sub | low;
      if (sums[group] === 0 && best[m ^ group] >= 0 && best[m ^ group] + 1 > best[m]) {
        best[m] = best[m ^ group] + 1;
        pick[m] = group;
      }
      if (sub === 0) break;
    }
  }

  // Balances that do not add up to zero cannot be split into zero-sum groups; settle what we can.
  if (best[size - 1] < 0) return greedySettle(entries);

  const transactions: SimplifiedDebt[] = [];
  for (let m = size - 1; m > 0; m ^= pick[m]) {
    const group = pick[m];
    const members = entries.filter((_, i) => group & (1 << i));
    transactions.push(...greedySettle(members));
  }
  return transactions;
}

/**
 * Who owes whom directly, after netting everything between each pair of people:
 * every expense makes each sharer owe the payer their share, and every recorded payment
 * reduces what the payer owes the receiver. Each pair collapses to one payment in one
 * direction. People's totals are unchanged, so paying all of these also settles the group,
 * just with more payments than `simplifyDebts` needs.
 */
export function computeDirectDebts(
  expenses: BalanceExpenseInput[],
  payments: BalancePaymentInput[]
): SimplifiedDebt[] {
  const owed = new Map<string, number>(); // "from>to" -> cents `from` owes `to`
  const bump = (fromId: string, toId: string, delta: number) => {
    if (fromId === toId) return;
    const key = `${fromId}>${toId}`;
    owed.set(key, (owed.get(key) ?? 0) + delta);
  };

  for (const expense of expenses) {
    for (const share of expense.shares) bump(share.memberId, expense.paidById, share.amount);
  }
  for (const payment of payments) bump(payment.fromId, payment.toId, -payment.amount);

  const debts: SimplifiedDebt[] = [];
  const seen = new Set<string>();
  for (const [key, forward] of owed) {
    const [fromId, toId] = key.split(">");
    const pair = [fromId, toId].sort().join(">");
    if (seen.has(pair)) continue;
    seen.add(pair);
    const net = forward - (owed.get(`${toId}>${fromId}`) ?? 0);
    if (net > 0) debts.push({ fromId, toId, amount: net });
    else if (net < 0) debts.push({ fromId: toId, toId: fromId, amount: -net });
  }
  return debts.sort((a, b) => b.amount - a.amount || a.fromId.localeCompare(b.fromId));
}
