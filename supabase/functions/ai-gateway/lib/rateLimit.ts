/**
 * Rate limiter backed by Supabase (ai_usage_log table).
 *
 * Strategy: sliding 1-hour window — count rows in ai_usage_log
 * for the user WHERE created_at > NOW() - INTERVAL '1 hour'.
 *
 * The insert to ai_usage_log (done in index.ts after every successful call)
 * doubles as the rate-limit increment, so no separate counter is needed.
 *
 * Trade-off: a small race window exists between check and insert under
 * concurrent requests; acceptable for this use-case (contracting firm SaaS).
 */

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface RateLimitResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  resetAt: number; // Unix ms — approximate window end (now + 1 hr)
}

/**
 * Check whether the user is under their hourly limit.
 * Queries ai_usage_log for calls in the last 60 minutes.
 *
 * @param db     Service-role Supabase client (bypasses RLS)
 * @param userId The authenticated user's UUID
 * @param limit  Maximum calls allowed per hour for this role
 */
export async function checkRateLimit(
  db: SupabaseClient,
  userId: string,
  limit: number
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - 3_600_000).toISOString();

  const { count, error } = await db
    .from('ai_usage_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', windowStart);

  if (error) {
    // On DB error, fail open (allow the call) to avoid blocking users
    console.error('[rateLimit] DB error, failing open:', error.message);
    return { allowed: true, used: 0, limit, remaining: limit, resetAt: Date.now() + 3_600_000 };
  }

  const used = count ?? 0;
  const remaining = Math.max(0, limit - used);
  const allowed = used < limit;
  const resetAt = Date.now() + 3_600_000; // approximate: oldest call expires in ~1 hr

  return { allowed, used, limit, remaining, resetAt };
}
