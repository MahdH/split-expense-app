import { cookies } from "next/headers";

// Splid-style identity: no accounts/passwords. Joining a group as a member stores
// "which member am I in this group" in a per-group cookie on this browser. Anyone
// with the invite link/code can join; the cookie just remembers their choice.

function cookieNameForGroup(groupId: string): string {
  return `member_${groupId}`;
}

export async function getMemberIdForGroup(groupId: string): Promise<string | null> {
  const store = await cookies();
  return store.get(cookieNameForGroup(groupId))?.value ?? null;
}

export async function setMemberIdForGroup(groupId: string, memberId: string): Promise<void> {
  const store = await cookies();
  store.set(cookieNameForGroup(groupId), memberId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}

export async function clearMemberIdForGroup(groupId: string): Promise<void> {
  const store = await cookies();
  store.delete(cookieNameForGroup(groupId));
}
