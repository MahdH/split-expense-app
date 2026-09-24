import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getMemberIdForGroup } from "@/lib/identity";

export default async function ExportPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const myMemberId = await getMemberIdForGroup(groupId);
  if (!myMemberId) redirect(`/g/${groupId}/join`);

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) notFound();

  const links = [
    {
      href: `/g/${groupId}/export/expenses`,
      title: "Expenses",
      description: "Every expense, who paid, and each person's share.",
    },
    {
      href: `/g/${groupId}/export/balances`,
      title: "Balances",
      description: "Net balance per member and the suggested settlements (who owes whom).",
    },
    {
      href: `/g/${groupId}/export/payments`,
      title: "Payment history",
      description: "All recorded settlement payments between members.",
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-6 sm:py-10">
      <div>
        <Link href={`/g/${groupId}`} className="text-sm font-medium text-indigo-600 hover:underline">
          &larr; Back to {group.name}
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Export data</h1>
        <p className="mt-1 text-sm text-slate-500">Download CSV files you can open in any spreadsheet app.</p>
      </div>

      <div className="flex flex-col gap-3">
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-300"
          >
            <div>
              <p className="font-semibold text-slate-900">{l.title}</p>
              <p className="mt-0.5 text-sm text-slate-500">{l.description}</p>
            </div>
            <span className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">
              Download CSV
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
