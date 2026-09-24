import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const upstash =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(100, '1 m'),
        analytics: true,
      })
    : null;

const memory = new Map<string, { count: number; reset: number }>();

function memoryAllow(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const slot = memory.get(key);
  if (!slot || slot.reset <= now) {
    memory.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  slot.count += 1;
  return slot.count <= max;
}

export async function allow(key: string, max = 100, windowMs = 60_000): Promise<boolean> {
  if (upstash && max === 100) {
    const result = await upstash.limit(key);
    return result.success;
  }
  return memoryAllow(key, max, windowMs);
}

export function clientKey(req: Request, scope: string) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  return `rl:${scope}:${ip}`;
}

export function rateLimited() {
  return Response.json(
    {
      success: false,
      error: { message: 'Muitas requisições, tente novamente em instantes', code: 'RATE_LIMITED' },
    },
    { status: 429 },
  );
}
