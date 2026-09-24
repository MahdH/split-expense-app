import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getMemberIdForGroup } from "@/lib/identity";
import { addPlaceholderMember, archiveMember, unarchiveMember } from "@/app/actions/groups";
import { SubmitButton } from "@/components/SubmitButton";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const myMemberId = await getMemberIdForGroup(groupId);
  if (!myMemberId) redirect(`/g/${groupId}/join`);

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: { orderBy: { createdAt: "asc" } } },
  });
  if (!group) notFound();

  const active = group.members.filter((m) => !m.archived);
  const archived = group.members.filter((m) => m.archived);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:py-10">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/g/${groupId}`} className="text-sm font-medium text-indigo-600 hover:underline">
            &larr; Back to {group.name}
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Members</h1>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Active</h2>
        <ul className="mt-3 flex flex-col divide-y divide-slate-100">
          {active.map((m) => (
            <li key={m.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                  {m.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="font-medium text-slate-900">
                  {m.name} {m.id === myMemberId && <span className="text-xs text-slate-400">(you)</span>}
                </span>
              </div>
              {m.id !== myMemberId && (
                <form action={archiveMember.bind(null, groupId, m.id)}>
                  <button type="submit" className="text-xs font-medium text-slate-400 hover:text-rose-500">
                    Remove
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>

        <form action={addPlaceholderMember.bind(null, groupId)} className="mt-4 flex gap-2">
          <input
            name="name"
            required
            placeholder="Add a member who isn't here (e.g. paying offline)"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <SubmitButton className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            Add
          </SubmitButton>
        </form>
      </div>

      {archived.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Removed</h2>
          <ul className="mt-3 flex flex-col divide-y divide-slate-100">
            {archived.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-3">
                <span className="text-slate-500">{m.name}</span>
                <form action={unarchiveMember.bind(null, groupId, m.id)}>
                  <button type="submit" className="text-xs font-medium text-indigo-600 hover:underline">
                    Restore
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
