import Link from "next/link";
import type { Member } from "@prisma/client";
import { formatMoney } from "@/lib/money";
import { GradientBanner } from "@/components/GradientBanner";
import { ShareSheet } from "@/components/ShareSheet";
import { MoreMenu } from "@/components/MoreMenu";
import { CheckIcon, ChevronRightIcon, SuitcaseIcon, WalletIcon } from "@/components/icons";

export function GroupHero({
  group,
  me,
  myBalance,
  myTripCost,
  totalSpent,
  expenseCount,
}: {
  group: { id: string; name: string; currency: string; inviteCode: string };
  me: Member;
  myBalance: number;
  /** This member's total share of every expense, regardless of who paid or what has been settled. */
  myTripCost: number;
  totalSpent: number;
  expenseCount: number;
}) {
  const status =
    myBalance === 0
      ? "You're all settled up"
      : myBalance > 0
        ? `You are owed ${formatMoney(myBalance, group.currency)}`
        : `You owe ${formatMoney(-myBalance, group.currency)}`;

  const summary =
    expenseCount === 0
      ? "No expenses yet"
      : `${formatMoney(totalSpent, group.currency)} spent · ${expenseCount} expense${
          expenseCount === 1 ? "" : "s"
        }`;

  return (
    <section className="relative">
      <div className="absolute inset-0 overflow-hidden rounded-[32px] shadow-hero">
        <GradientBanner className="h-full w-full" />
        <div className="pointer-events-none absolute inset-0 bg-[#0b3954]/25" />
      </div>

      <div className="pointer-events-none relative z-10 px-5 pb-[10.5rem] pt-5 text-center text-white">
        <div className="pointer-events-auto flex justify-end gap-2">
          <ShareSheet glass groupName={group.name} inviteCode={group.inviteCode} />
          <MoreMenu glass groupId={group.id} memberName={me.name} />
        </div>

        <div className="[text-shadow:0_1px_14px_rgba(11,57,84,0.45)]">
          <p className="mt-2 text-[15px] font-medium text-white/90">
            You&rsquo;re signed in as {me.name}
          </p>
          <h1 className="mx-auto mt-1 max-w-full break-words text-[34px] font-semibold leading-tight tracking-tight">
            {group.name}
          </h1>
          <p className="mt-2 text-sm font-medium text-white/85">{summary}</p>
        </div>
      </div>

      <div className="absolute inset-x-3 bottom-3 z-10 flex flex-col gap-2">
        <Link
          href={`/g/${group.id}/members`}
          transitionTypes={["nav-forward"]}
          className="flex items-center gap-2.5 rounded-full border border-white/60 bg-white/60 p-2 pr-3 shadow-[0_12px_26px_-14px_rgba(23,20,21,0.55)] backdrop-blur-xl transition-[transform,background-color] hover:bg-white/75 active:scale-[0.985]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ff8a4c] to-[#e4432a] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
            {myBalance === 0 ? <CheckIcon size={20} /> : <WalletIcon size={20} />}
          </span>
          <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">{status}</span>
          <ChevronRightIcon size={18} className="shrink-0 text-ink-2" />
        </Link>
        <div className="flex items-center gap-2.5 rounded-full border border-white/25 bg-[#0b3954]/35 py-2 pl-2 pr-5 text-white shadow-[0_10px_22px_-14px_rgba(11,57,84,0.8)] backdrop-blur-xl">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
            <SuitcaseIcon size={18} />
          </span>
          <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-white/90">
            Your trip cost
          </span>
          <span className="text-[17px] font-bold tabular-nums tracking-tight">
            {formatMoney(myTripCost, group.currency)}
          </span>
        </div>
      </div>
    </section>
  );
}
