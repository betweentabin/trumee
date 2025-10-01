"use client";

import Link from 'next/link';
import PlanGate from '@/components/PlanGate';
import { FeatureKey } from '@/config/feature-gates';
import React from 'react';

type Props = {
  href: string;
  feature: FeatureKey;
  className?: string;
  children: React.ReactNode;
};

export default function GatedLink({ href, feature, className, children }: Props) {
  return (
    <PlanGate feature={feature} className={`inline-block ${className || ''}`} withOverlay>
      <Link href={href} className="hover:text-[#FF733E] transition-colors">
        {children}
      </Link>
    </PlanGate>
  );
}

