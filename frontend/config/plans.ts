export type PlanTier = 'starter' | 'standard' | 'premium';

type Role = 'user' | 'company';

export interface PlanDef {
  id: PlanTier;
  name: string;
  price: number; // JPY per month (tax excl.)
  description: string;
  features: string[];
  interval?: 'month' | 'year';
  tagline?: string;
  highlight?: boolean;
  badge?: string;
  stripePriceId?: string;
}

const stripePriceIds = {
  user: {
    starter: process.env.NEXT_PUBLIC_STRIPE_PRICE_USER_STARTER || '',
    standard: process.env.NEXT_PUBLIC_STRIPE_PRICE_USER_STANDARD || '',
    premium: process.env.NEXT_PUBLIC_STRIPE_PRICE_USER_PREMIUM || '',
  },
  company: {
    starter: process.env.NEXT_PUBLIC_STRIPE_PRICE_COMPANY_STARTER || '',
    standard: process.env.NEXT_PUBLIC_STRIPE_PRICE_COMPANY_STANDARD || '',
    premium: process.env.NEXT_PUBLIC_STRIPE_PRICE_COMPANY_PREMIUM || '',
  },
} as const;

const base = {
  starter: {
    id: 'starter',
    name: 'スターター',
    price: 980,
    description: '基本機能を手頃に利用',
    interval: 'month',
  },
  standard: {
    id: 'standard',
    name: 'スタンダード',
    price: 2980,
    description: '多くの方におすすめ',
    interval: 'month',
  },
  premium: {
    id: 'premium',
    name: 'プレミアム',
    price: 5980,
    description: '全機能フルアクセス',
    interval: 'month',
  },
} as const;

export const plansByRole: Record<Role, PlanDef[]> = {
  user: [
    {
      ...base.starter,
      tagline: 'まずはカジュアルに始めたい求職者向け',
      features: ['職務経歴書作成', '企業閲覧', 'スカウト受信'],
      stripePriceId: stripePriceIds.user.starter || undefined,
    },
    {
      ...base.standard,
      tagline: '添削と面接対策をワンパッケージで',
      highlight: true,
      badge: '人気',
      features: ['AI職務経歴書添削', 'AI面接対策', '応募管理'],
      stripePriceId: stripePriceIds.user.standard || undefined,
    },
    {
      ...base.premium,
      tagline: '個別サポートで転職活動を加速',
      features: ['個別サポート', '詳細レポート', '優先スカウト表示'],
      stripePriceId: stripePriceIds.user.premium || undefined,
    },
  ],
  company: [
    {
      ...base.starter,
      tagline: 'はじめての採用活動をスモールスタート',
      features: ['求職者検索（制限）', '求人掲載（1枠）'],
      stripePriceId: stripePriceIds.company.starter || undefined,
    },
    {
      ...base.standard,
      tagline: 'スカウトと応募の両輪で採用を強化',
      highlight: true,
      badge: 'おすすめ',
      features: ['求職者スカウト', '求人掲載（3枠）', '応募管理'],
      stripePriceId: stripePriceIds.company.standard || undefined,
    },
    {
      ...base.premium,
      tagline: '専任サポートでハイボリューム採用を実現',
      features: ['無制限掲載', '優先表示', '専任サポート'],
      stripePriceId: stripePriceIds.company.premium || undefined,
    },
  ],
};
