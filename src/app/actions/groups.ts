"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generateInviteCode } from "@/lib/invite-code";
import { setMemberIdForGroup, clearMemberIdForGroup } from "@/lib/identity";
import { revalidatePath } from "next/cache";

export async function createGroup(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const currency = String(formData.get("currency") ?? "USD").trim() || "USD";
  const yourName = String(formData.get("yourName") ?? "").trim();

  if (!name) throw new Error("Group name is required.");
  if (!yourName) throw new Error("Your name is required.");

  let group;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      group = await prisma.group.create({
        data: {
          name,
          currency,
          inviteCode: generateInviteCode(),
          members: { create: { name: yourName } },
        },
        include: { members: true },
      });
      break;
    } catch (err: unknown) {
      const isUniqueViolation =
        typeof err === "object" && err !== null && "code" in err && err.code === "P2002";
      if (isUniqueViolation && attempt < 4) continue;
      throw err;
    }
  }
  if (!group) throw new Error("Could not create group. Please try again.");

  const me = group.members[0];
  await setMemberIdForGroup(group.id, me.id);

  redirect(`/g/${group.id}`);
}

export async function joinGroupByCode(formData: FormData) {
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  if (!code) throw new Error("Invite code is required.");

  const group = await prisma.group.findUnique({ where: { inviteCode: code } });
  if (!group) throw new Error("Invite code not found. Double-check the code and try again.");

  redirect(`/g/${group.id}/join`);
}

export async function joinGroupAsExistingMember(groupId: string, memberId: string) {
  const member = await prisma.member.findFirst({ where: { id: memberId, groupId } });
  if (!member) throw new Error("That member no longer exists in this group.");

  await setMemberIdForGroup(groupId, memberId);
  redirect(`/g/${groupId}`);
}

export async function joinGroupAsNewMember(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!groupId) throw new Error("Missing group.");
  if (!name) throw new Error("Your name is required.");

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new Error("Group not found.");

  const member = await prisma.member.create({ data: { groupId, name } });
  await setMemberIdForGroup(groupId, member.id);
  redirect(`/g/${groupId}`);
}

export async function addPlaceholderMember(groupId: string, formData: FormData) {
  const trimmed = String(formData.get("name") ?? "").trim();
  if (!trimmed) throw new Error("Name is required.");
  await prisma.member.create({ data: { groupId, name: trimmed } });
  revalidatePath(`/g/${groupId}`);
  revalidatePath(`/g/${groupId}/members`);
}

export async function archiveMember(groupId: string, memberId: string) {
  await prisma.member.update({ where: { id: memberId }, data: { archived: true } });
  revalidatePath(`/g/${groupId}`);
  revalidatePath(`/g/${groupId}/members`);
}

export async function unarchiveMember(groupId: string, memberId: string) {
  await prisma.member.update({ where: { id: memberId }, data: { archived: false } });
  revalidatePath(`/g/${groupId}`);
  revalidatePath(`/g/${groupId}/members`);
}

export async function renameGroup(groupId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Group name is required.");
  await prisma.group.update({ where: { id: groupId }, data: { name: trimmed } });
  revalidatePath(`/g/${groupId}`);
}

export async function switchIdentity(groupId: string) {
  await clearMemberIdForGroup(groupId);
  redirect(`/g/${groupId}/join`);
}
