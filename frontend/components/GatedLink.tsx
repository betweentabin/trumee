"use client";

import Link from 'next/link';
import { useCurrentPlanTier } from '@/components/PlanGate';
import { FeatureKey, isAllowed } from '@/config/feature-gates';
import React, { useMemo } from 'react';

type Props = {
  href: string;
  feature: FeatureKey;
  className?: string;
  children: React.ReactNode;
};

export default function GatedLink({ href, feature, className, children }: Props) {
  // Inline gating to avoid noisy overlays in footers/navigation.
  // If the feature is not available, link routes to plans page and shows subtle lock styling.
  const tier = useCurrentPlanTier();
  const allowed = useMemo(() => isAllowed(tier, feature), [tier, feature]);

  // いずれの場合も遷移はその機能のページへ。
  // 未許可のときは控えめなロック表示だけにし、実際のブロックは遷移先で PlanGate が担当します。
  return (
    <Link
      href={href}
      className={`${allowed ? 'hover:text-[#FF733E]' : 'opacity-80 hover:opacity-100'} transition-colors ${className || ''}`}
      title={allowed ? undefined : 'この機能は現在のプランでは利用できません（遷移先でご案内）'}
    >
      {children}
      {!allowed && (
        <span className="ml-1 inline-block align-middle text-[11px] text-[#EE6C4D]" aria-hidden>
          🔒
        </span>
      )}
    </Link>
  );
}
