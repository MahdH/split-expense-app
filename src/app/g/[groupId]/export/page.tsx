import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMemberIdForGroup } from "@/lib/identity";
import { PageHeader } from "@/components/PageHeader";
import { DownloadIcon } from "@/components/icons";

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
      tag: "CSV",
      description: "Every expense, who paid, and each person's share.",
    },
    {
      href: `/g/${groupId}/export/balances`,
      title: "Balances",
      tag: "CSV",
      description: "Net balance per member and the suggested settlements (who owes whom).",
    },
    {
      href: `/g/${groupId}/export/payments`,
      title: "Payment history",
      tag: "CSV",
      description: "All recorded settlement payments between members.",
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 pb-16 pt-6">
      <PageHeader
        backHref={`/g/${groupId}`}
        title="Export data"
        subtitle="Download CSV files for any spreadsheet app"
      />

      <div className="flex flex-col gap-3">
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="card flex items-center gap-4 p-4 pr-5 transition-transform active:scale-[0.99]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-ink shadow-[inset_0_1px_0_#fff]">
              <DownloadIcon size={22} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="text-[16px] font-semibold">{l.title}</span>
                <span className="tag">{l.tag}</span>
              </span>
              <span className="mt-0.5 block text-[13px] leading-snug text-ink-2">
                {l.description}
              </span>
            </span>
          </a>
        ))}
      </div>
    </main>
  );
}
