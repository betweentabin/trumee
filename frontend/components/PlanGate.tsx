"use client";

import React, { PropsWithChildren, useMemo } from 'react';
import Link from 'next/link';
import { FEATURE_REQUIREMENTS, FeatureKey, isAllowed } from '@/config/feature-gates';

type Props = {
  feature: FeatureKey;
  planTier?: string | null; // current user's plan tier
  className?: string;
  // When true, overlay is visible and content interaction is disabled if locked.
  withOverlay?: boolean;
};

// Lightweight hook to obtain plan tier from localStorage snapshot.
// It avoids a blocking API call and works with the existing auth persistence.
export function useCurrentPlanTier(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('current_user_v2');
    if (!raw) return null;
    const u = JSON.parse(raw);
    return (u?.plan_tier as string) || null;
  } catch {
    return null;
  }
}

export default function PlanGate({ feature, planTier, withOverlay = true, className, children }: PropsWithChildren<Props>) {
  const tier = planTier ?? useCurrentPlanTier();
  const allowed = useMemo(() => isAllowed(tier, feature), [tier, feature]);

  if (allowed || !withOverlay) return <>{children}</>;

  const req = FEATURE_REQUIREMENTS[feature];
  const reqLabel = Array.isArray(req) ? req[0] : req; // show the minimum required tier

  return (
    <div className={`relative ${className || ''}`}>
      <div className="pointer-events-none select-none blur-[2px] opacity-60">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur rounded-xl border shadow p-4 max-w-md text-center">
          <div className="text-base font-semibold mb-1">この機能は現在のプランでは利用できません</div>
          <div className="text-sm text-gray-600 mb-3">ご利用には {reqLabel} プラン以上が必要です。</div>
          <Link href="/users/myinfo/paidplans" className="inline-block rounded-md bg-[#EE6C4D] text-white px-4 py-2">
            プランを確認する
          </Link>
        </div>
      </div>
    </div>
  );
}

