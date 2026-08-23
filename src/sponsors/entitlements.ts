export type SponsorTier = 'registered' | 'supporter' | 'pro' | 'builder';
export interface Entitlement { tier: SponsorTier; requestsPerDay: number; queuePriority: number; }
export const ENTITLEMENTS: Record<SponsorTier, Entitlement> = {
  registered: { tier: 'registered', requestsPerDay: 50, queuePriority: 10 },
  supporter: { tier: 'supporter', requestsPerDay: 200, queuePriority: 20 },
  pro: { tier: 'pro', requestsPerDay: 500, queuePriority: 30 },
  builder: { tier: 'builder', requestsPerDay: 1000, queuePriority: 40 }
};
export function entitlementFor(tier: string | null | undefined): Entitlement { return ENTITLEMENTS[tier as SponsorTier] ?? ENTITLEMENTS.registered; }
