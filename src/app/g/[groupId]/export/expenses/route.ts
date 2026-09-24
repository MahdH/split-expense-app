import { NextRequest, NextResponse } from "next/server";
import { getGroupOrThrow } from "@/lib/group-data";
import { fromCents } from "@/lib/money";
import { toCsv } from "@/lib/csv";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const group = await getGroupOrThrow(groupId);
  if (!group) return new NextResponse("Group not found", { status: 404 });

  const rows = group.expenses.flatMap((e) =>
    e.shares.map((s) => [
      e.date.toISOString().slice(0, 10),
      e.description,
      fromCents(e.amount).toFixed(2),
      e.currency,
      e.paidBy.name,
      s.member.name,
      fromCents(s.amount).toFixed(2),
      e.splitType,
      e.notes ?? "",
    ])
  );

  const csv = toCsv(
    [
      "Date",
      "Description",
      "Total amount",
      "Currency",
      "Paid by",
      "Owed by",
      "Share amount",
      "Split type",
      "Notes",
    ],
    rows
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${group.name.replace(/[^a-z0-9]+/gi, "-")}-expenses.csv"`,
    },
  });
}
