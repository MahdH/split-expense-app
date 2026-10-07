import { NextRequest, NextResponse } from "next/server";
import { getGroupOrThrow, getGroupBalances, getGroupTripCosts } from "@/lib/group-data";
import { fromCents } from "@/lib/money";
import { toCsv } from "@/lib/csv";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const group = await getGroupOrThrow(groupId);
  if (!group) return new NextResponse("Group not found", { status: 404 });

  const { balances, simplified, direct } = getGroupBalances(group);
  const tripCosts = getGroupTripCosts(group);
  const nameOf = (id: string) => group.members.find((m) => m.id === id)?.name ?? "Unknown";

  const netRows = group.members.map((m) => [
    m.name,
    fromCents(balances.get(m.id) ?? 0).toFixed(2),
    (balances.get(m.id) ?? 0) === 0 ? "settled" : (balances.get(m.id) ?? 0) > 0 ? "is owed" : "owes",
    fromCents(tripCosts.get(m.id) ?? 0).toFixed(2),
  ]);

  const settleRows = simplified.map((d) => [
    nameOf(d.fromId),
    nameOf(d.toId),
    fromCents(d.amount).toFixed(2),
  ]);

  const directRows = direct.map((d) => [
    nameOf(d.fromId),
    nameOf(d.toId),
    fromCents(d.amount).toFixed(2),
  ]);

  const csv =
    `Net balances (${group.currency})\r\n` +
    toCsv(["Member", "Net balance", "Status", "Trip cost"], netRows) +
    `\r\nSuggested settlements, fewest payments (${group.currency})\r\n` +
    toCsv(["From", "To", "Amount"], settleRows) +
    `\r\nWho owes whom directly, netted per pair (${group.currency})\r\n` +
    toCsv(["From", "To", "Amount"], directRows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${group.name.replace(/[^a-z0-9]+/gi, "-")}-balances.csv"`,
    },
  });
}
