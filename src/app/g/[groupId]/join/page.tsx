import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { joinGroupAsExistingMember, joinGroupAsNewMember } from "@/app/actions/groups";
import { SubmitButton } from "@/components/SubmitButton";
import { NeatBanner } from "@/components/NeatBanner";
import { Avatar } from "@/components/Avatar";

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
    <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-12 pt-4">
      <section className="relative overflow-hidden rounded-[32px] shadow-hero">
        <NeatBanner className="absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-[#0b3954]/25" />
        <div className="pointer-events-none relative z-10 px-6 pb-12 pt-14 text-center text-white [text-shadow:0_1px_14px_rgba(11,57,84,0.45)]">
          <p className="text-[15px] font-medium text-white/90">You&rsquo;re joining</p>
          <h1 className="mt-1 break-words text-[34px] font-semibold leading-tight tracking-tight">
            {group.name}
          </h1>
        </div>
      </section>

      <div className="mt-4 flex flex-col gap-4">
        {group.members.length > 0 && (
          <section className="card p-3">
            <h2 className="px-3 pb-1 pt-2 text-lg font-semibold tracking-tight">Who are you?</h2>
            <div className="flex flex-col">
              {group.members.map((m) => (
                <form key={m.id} action={joinAsExisting.bind(null, m.id)}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-surface-2"
                  >
                    <Avatar name={m.name} />
                    <span className="text-[16px] font-semibold">{m.name}</span>
                  </button>
                </form>
              ))}
            </div>
          </section>
        )}

        <section className="card p-5">
          <h2 className="text-lg font-semibold tracking-tight">Not on the list?</h2>
          <form action={joinGroupAsNewMember} className="mt-3 flex gap-2">
            <input type="hidden" name="groupId" value={groupId} />
            <input
              name="name"
              required
              placeholder="Your name"
              aria-label="Your name"
              className="field min-w-0 flex-1"
            />
            <SubmitButton className="btn-dark shrink-0 !px-6">Join</SubmitButton>
          </form>
        </section>
      </div>
    </main>
  );
}
