export type AccessPlan = 'anonymous' | 'registered' | 'early_tester' | 'supporter' | 'pro';

export type ModelSelector = 'auto' | 'auto:fast' | 'auto:smart' | 'auto:coding';

export interface RateLimitSummary {
  limit: number;
  remaining: number;
  reset: string;
}

export interface PublicStatus {
  status: 'operational' | 'degraded' | 'unavailable';
  updatedAt: string;
}

export type WaitlistStatus = 'pending' | 'reviewing' | 'approved' | 'waitlisted' | 'rejected' | 'revoked';

export interface WaitlistApplication {
  id: string;
  status: WaitlistStatus;
  githubLogin?: string;
  primaryTool: string;
  primaryUseCase: string;
  expectedRequestVolume?: string | null;
  operatingSystems?: string[];
  bugReportReadiness?: string;
  testerGoal?: string;
  createdAt: string;
  updatedAt: string;
  previewAccessExpiresAt: string | null;
  reviewerNotes?: string;
  previewKeyId?: string | null;
}

export type WaitlistApplicationSummary = Pick<
  WaitlistApplication,
  'id' | 'status' | 'primaryTool' | 'primaryUseCase' | 'createdAt' | 'updatedAt' | 'previewAccessExpiresAt'
>;
