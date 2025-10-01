// Feature gating matrix by plan tier
// Centralized definition so UI and logic can share one source of truth.

export type PlanTier = 'starter' | 'standard' | 'premium';

export type FeatureKey =
  | 'resume_review_chat'      // 添削チャット（履歴書）
  | 'motivation_review_chat'  // 志望理由添削チャット
  | 'interview_chat';         // 面接対策チャット

export const FEATURE_REQUIREMENTS: Record<FeatureKey, PlanTier | PlanTier[]> = {
  resume_review_chat: ['starter', 'standard', 'premium'],
  motivation_review_chat: ['standard', 'premium'],
  // 面接対策セッションはプレミアム限定
  interview_chat: 'premium',
};

export function isAllowed(plan: string | undefined | null, feature: FeatureKey): boolean {
  const tiers = FEATURE_REQUIREMENTS[feature];
  if (!plan) return false;
  const p = String(plan) as PlanTier;
  return Array.isArray(tiers) ? (tiers as PlanTier[]).includes(p) : p === tiers;
}

