export type SponsorTier = 'registered' | 'early_tester' | 'supporter' | 'pro';
export interface Entitlement { tier: SponsorTier; requestsPerDay: number; queuePriority: number; }
export const ENTITLEMENTS: Record<SponsorTier, Entitlement> = {
  registered: { tier: 'registered', requestsPerDay: 50, queuePriority: 10 },
  early_tester: { tier: 'early_tester', requestsPerDay: 100, queuePriority: 15 },
  supporter: { tier: 'supporter', requestsPerDay: 200, queuePriority: 20 },
  pro: { tier: 'pro', requestsPerDay: 500, queuePriority: 30 },
};
export function entitlementFor(tier: string | null | undefined): Entitlement { return ENTITLEMENTS[tier as SponsorTier] ?? ENTITLEMENTS.registered; }
export function planForTier(_tierName: string | null | undefined, tierId: string | null | undefined, env: { GITHUB_SUPPORTER_TIER_ID?: string; GITHUB_PRO_TIER_ID?: string }): SponsorTier { if (tierId && tierId === env.GITHUB_PRO_TIER_ID) return 'pro'; if (tierId && tierId === env.GITHUB_SUPPORTER_TIER_ID) return 'supporter'; return 'registered'; }
