import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, RateLimitError } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";

export default async function JoinByCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const ip = await getClientIp();
  try {
    await checkRateLimit(`join-code:${ip}`, 10, 5 * 60 * 1000);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-20 text-center">
          <h1 className="text-xl font-semibold text-slate-900">Too many attempts</h1>
          <p className="max-w-md text-sm text-slate-500">{err.message}</p>
        </div>
      );
    }
    throw err;
  }

  const group = await prisma.group.findUnique({
    where: { inviteCode: code.toUpperCase() },
    select: { id: true },
  });
  if (!group) notFound();
  redirect(`/g/${group.id}/join`);
}
