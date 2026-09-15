/**
 * In-memory sliding-window rate limiter. Per-instance only — good enough for
 * a prototype, and honest about it: a real deployment would back this with
 * Redis or the platform's rate-limit primitive.
 */

const windows = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (windows.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    windows.set(key, hits);
    return false;
  }
  hits.push(now);
  windows.set(key, hits);
  return true;
}
