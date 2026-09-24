import { customAlphabet } from "nanoid";

// Unambiguous uppercase alphabet (no 0/O/1/I) for invite codes people type by hand.
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generate = customAlphabet(alphabet, 7);

export function generateInviteCode(): string {
  return generate();
}
