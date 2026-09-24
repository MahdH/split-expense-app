import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { joinGroupAsExistingMember, joinGroupAsNewMember } from "@/app/actions/groups";
import { SubmitButton } from "@/components/SubmitButton";

export default async function JoinGroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: { where: { archived: false }, orderBy: { createdAt: "asc" } } },
  });
  if (!group) notFound();

  const joinAsExisting = joinGroupAsExistingMember.bind(null, groupId);

  return (
    <div className="flex flex-1 flex-col items-center bg-slate-50 px-4 py-12 sm:py-20">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">{group.name}</h1>
          <p className="mt-1 text-slate-500">Who are you?</p>
        </div>

        {group.members.length > 0 && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col divide-y divide-slate-100">
              {group.members.map((m) => (
                <form key={m.id} action={joinAsExisting.bind(null, m.id)}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 py-3 text-left hover:bg-slate-50"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                      {m.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="font-medium text-slate-900">{m.name}</span>
                  </button>
                </form>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">Not on the list?</h2>
          <form action={joinGroupAsNewMember} className="mt-3 flex gap-2">
            <input type="hidden" name="groupId" value={groupId} />
            <input
              name="name"
              required
              placeholder="Your name"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <SubmitButton className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
              Join
            </SubmitButton>
          </form>
        </div>
      </div>
    </div>
  );
}
