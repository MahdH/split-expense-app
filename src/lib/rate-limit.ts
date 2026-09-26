import { prisma } from "./prisma";

export class RateLimitError extends Error {}

/**
 * Fixed-window rate limiter backed by Postgres, so it holds up across
 * serverless invocations/regions (an in-memory counter wouldn't).
 * Records this attempt and returns whether it's allowed under `limit`
 * hits per `windowMs` for the given `key`. Throws RateLimitError when over
 * the limit — the attempt is not recorded again in that case.
 */
export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<void> {
  const windowStart = new Date(Date.now() - windowMs);

  const recentCount = await prisma.rateLimitHit.count({
    where: { key, createdAt: { gte: windowStart } },
  });

  if (recentCount >= limit) {
    throw new RateLimitError("Too many attempts. Please wait a few minutes and try again.");
  }

  await prisma.rateLimitHit.create({ data: { key } });

  // Opportunistically prune this key's old hits so the table doesn't grow
  // unbounded; no need for a separate cron job at this scale.
  await prisma.rateLimitHit.deleteMany({
    where: { key, createdAt: { lt: windowStart } },
  });
}
