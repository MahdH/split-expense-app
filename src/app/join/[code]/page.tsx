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
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-3 px-6 py-20 text-center">
          <div className="card w-full p-8">
            <h1 className="text-xl font-semibold tracking-tight">Too many attempts</h1>
            <p className="mx-auto mt-2 max-w-sm text-[15px] text-ink-2">{err.message}</p>
          </div>
        </main>
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
