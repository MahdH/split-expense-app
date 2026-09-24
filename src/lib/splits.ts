import { splitEvenly } from "./money";

export type SplitType = "EQUAL" | "EXACT" | "PERCENTAGE" | "SHARES";

export interface ParticipantInput {
  memberId: string;
  /** For EXACT: cents owed. For PERCENTAGE: basis points (10000 = 100%). For SHARES: weight (any positive integer). Unused for EQUAL. */
  value?: number;
}

export interface ComputedShare {
  memberId: string;
  amount: number; // cents owed, sums exactly to totalAmount
  rawValue: number | null;
}

export class SplitValidationError extends Error {}

/**
 * Distributes `total` cents proportionally to `weights`, rounding down then handing
 * the leftover cents one-by-one to the entries with the largest fractional remainder
 * (largest-remainder method), so the parts always sum exactly to `total`.
 */
function distributeByWeight(total: number, weights: number[]): number[] {
  const weightSum = weights.reduce((a, b) => a + b, 0);
  if (weightSum <= 0) {
    throw new SplitValidationError("Split weights must sum to a positive number.");
  }
  const raw = weights.map((w) => (total * w) / weightSum);
  const floors = raw.map(Math.floor);
  let remainder = total - floors.reduce((a, b) => a + b, 0);

  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);

  const result = [...floors];
  for (let k = 0; k < order.length && remainder > 0; k++, remainder--) {
    result[order[k].i] += 1;
  }
  return result;
}

export function computeShares(
  splitType: SplitType,
  totalAmount: number,
  participants: ParticipantInput[]
): ComputedShare[] {
  if (participants.length === 0) {
    throw new SplitValidationError("Select at least one participant.");
  }

  if (splitType === "EQUAL") {
    const amounts = splitEvenly(totalAmount, participants.length);
    return participants.map((p, i) => ({
      memberId: p.memberId,
      amount: amounts[i],
      rawValue: null,
    }));
  }

  if (splitType === "EXACT") {
    const amounts = participants.map((p) => Math.round(p.value ?? 0));
    const sum = amounts.reduce((a, b) => a + b, 0);
    if (sum !== totalAmount) {
      throw new SplitValidationError(
        `Exact amounts must add up to the total (${sum} ≠ ${totalAmount} cents).`
      );
    }
    return participants.map((p, i) => ({
      memberId: p.memberId,
      amount: amounts[i],
      rawValue: amounts[i],
    }));
  }

  if (splitType === "PERCENTAGE") {
    const bps = participants.map((p) => Math.round(p.value ?? 0));
    const sum = bps.reduce((a, b) => a + b, 0);
    if (sum !== 10000) {
      throw new SplitValidationError(
        `Percentages must add up to 100% (got ${(sum / 100).toFixed(2)}%).`
      );
    }
    const amounts = distributeByWeight(totalAmount, bps);
    return participants.map((p, i) => ({
      memberId: p.memberId,
      amount: amounts[i],
      rawValue: bps[i],
    }));
  }

  if (splitType === "SHARES") {
    const weights = participants.map((p) => Math.round(p.value ?? 0));
    if (weights.some((w) => w <= 0)) {
      throw new SplitValidationError("Each share weight must be greater than zero.");
    }
    const amounts = distributeByWeight(totalAmount, weights);
    return participants.map((p, i) => ({
      memberId: p.memberId,
      amount: amounts[i],
      rawValue: weights[i],
    }));
  }

  throw new SplitValidationError(`Unknown split type: ${splitType}`);
}
