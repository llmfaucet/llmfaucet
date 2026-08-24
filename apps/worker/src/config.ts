export type Plan = 'anonymous' | 'registered' | 'early_tester' | 'supporter' | 'pro';
export interface PlanLimits { daily: number; edgePerMinute: number; streams: number; maxTokens: number; fallbackAttempts: number; priority: number; }
export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  anonymous: { daily: 20, edgePerMinute: 30, streams: 1, maxTokens: 1024, fallbackAttempts: 2, priority: 0 },
  registered: { daily: 50, edgePerMinute: 60, streams: 2, maxTokens: 2048, fallbackAttempts: 3, priority: 10 },
  early_tester: { daily: 100, edgePerMinute: 60, streams: 2, maxTokens: 2048, fallbackAttempts: 3, priority: 15 },
  supporter: { daily: 200, edgePerMinute: 90, streams: 3, maxTokens: 4096, fallbackAttempts: 3, priority: 20 },
  pro: { daily: 500, edgePerMinute: 120, streams: 5, maxTokens: 4096, fallbackAttempts: 3, priority: 30 },
};
export function planLimits(env: Record<string, string | undefined>, plan: Plan): PlanLimits {
  const base = PLAN_LIMITS[plan]; const prefix = plan.toUpperCase();
  const daily = Number(env[`${prefix}_DAILY_LIMIT`]);
  return { ...base, daily: Number.isInteger(daily) && daily > 0 ? daily : base.daily };
}
export function effectiveDailyLimit(env: Record<string, string | undefined>, plan: Plan, stored?: number): number { const configured = planLimits(env, plan).daily; return typeof stored === 'number' && Number.isInteger(stored) && stored > 0 ? Math.min(stored, configured) : configured; }
