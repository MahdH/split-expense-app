// Server actions report expected problems (bad input, stale data) as a value instead of
// throwing: production builds replace the message of a thrown error with a generic one.
export type ActionResult = { ok: true } | { ok: false; error: string };

export const ok: ActionResult = { ok: true };
export const fail = (error: string): ActionResult => ({ ok: false, error });

/** Largest amount (in cents) the database's 32-bit integer columns can hold. */
export const MAX_CENTS = 2_000_000_000;
