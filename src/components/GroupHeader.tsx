import Link from "next/link";
import { InviteBox } from "@/components/InviteBox";
import { switchIdentity } from "@/app/actions/groups";
import type { Member } from "@prisma/client";

export function GroupHeader({
  group,
  me,
}: {
  group: { id: string; name: string; inviteCode: string };
  me: Member;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{group.name}</h1>
          <p className="text-sm text-slate-500">
            You&rsquo;re signed in as <span className="font-medium text-slate-700">{me.name}</span>
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1 text-right text-sm">
          <Link href={`/g/${group.id}/members`} className="font-medium text-indigo-600 hover:underline">
            Members
          </Link>
          <Link href={`/g/${group.id}/export`} className="font-medium text-indigo-600 hover:underline">
            Export
          </Link>
          <form action={switchIdentity.bind(null, group.id)}>
            <button type="submit" className="font-medium text-slate-400 hover:text-slate-600">
              Not {me.name}?
            </button>
          </form>
        </div>
      </div>
      <InviteBox groupId={group.id} inviteCode={group.inviteCode} />
    </div>
  );
}
