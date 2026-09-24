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

  const rows = group.payments.map((p) => [
    p.date.toISOString().slice(0, 10),
    p.from.name,
    p.to.name,
    fromCents(p.amount).toFixed(2),
    p.currency,
    p.note ?? "",
  ]);

  const csv = toCsv(["Date", "From", "To", "Amount", "Currency", "Note"], rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${group.name.replace(/[^a-z0-9]+/gi, "-")}-payments.csv"`,
    },
  });
}
