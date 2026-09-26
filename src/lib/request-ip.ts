import { headers } from "next/headers";

/**
 * Best-effort client IP for rate limiting. Vercel sets x-forwarded-for/x-real-ip
 * on every request; falls back to a constant so local dev (no proxy headers)
 * still rate-limits per-process instead of throwing.
 */
export async function getClientIp(): Promise<string> {
  const store = await headers();
  const forwardedFor = store.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  const realIp = store.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}
