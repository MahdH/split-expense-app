import type { Member } from "@prisma/client";
import { formatMoney } from "@/lib/money";
import { ShareSheet } from "@/components/ShareSheet";
import { MoreMenu } from "@/components/MoreMenu";

export function GroupHeader({
  group,
  me,
  myBalance,
}: {
  group: { id: string; name: string; currency: string; inviteCode: string };
  me: Member;
  myBalance: number;
}) {
  const status =
    myBalance === 0
      ? "You're all settled up"
      : myBalance > 0
        ? `You are owed ${formatMoney(myBalance, group.currency)}`
        : `You owe ${formatMoney(-myBalance, group.currency)}`;

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold text-slate-900">{group.name}</h1>
        <p className="text-sm text-slate-500">
          You&rsquo;re signed in as <span className="font-medium text-slate-700">{me.name}</span>
        </p>
        <p
          className={`mt-1 text-sm font-medium ${
            myBalance === 0 ? "text-slate-500" : myBalance > 0 ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {status}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <ShareSheet groupName={group.name} inviteCode={group.inviteCode} />
        <MoreMenu groupId={group.id} memberName={me.name} />
      </div>
    </div>
  );
}
