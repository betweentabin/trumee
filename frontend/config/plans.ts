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
    price: 20000,
    description: '職務経歴書添削に特化した入門プラン',
    interval: 'month',
  },
  standard: {
    id: 'standard',
    name: 'スタンダード',
    price: 30000,
    description: '志望理由まで伴走するおすすめプラン',
    interval: 'month',
  },
  premium: {
    id: 'premium',
    name: 'プレミアム',
    price: 60000,
    description: '面接対策までフルサポートする最上位プラン',
    interval: 'month',
  },
} as const;

export const plansByRole: Record<Role, PlanDef[]> = {
  user: [
    {
      ...base.starter,
      tagline: '当分は無料で試せる添削プラン',
      features: [
        '職務経歴書添削（初回往復）',
        '面接想定Qの一部サンプル開放',
        '2社マッチング成立で全額返金保証',
      ],
      stripePriceId: stripePriceIds.user.starter || undefined,
    },
    {
      ...base.standard,
      tagline: '志望理由まで網羅するおすすめプラン',
      highlight: true,
      badge: 'おすすめ',
      features: [
        '職務経歴書添削（往復無制限）',
        '面接想定Qのフルアクセス',
        'スカウト企業の志望理由添削',
        '2社マッチング成立で全額返金保証',
      ],
      stripePriceId: stripePriceIds.user.standard || undefined,
    },
    {
      ...base.premium,
      tagline: '面接対策まで含めた万全サポート',
      features: [
        '職務経歴書添削（往復無制限）',
        '志望理由添削（スカウト企業ごと）',
        '面接対策セッション（模擬面接含む）',
        '面接想定Qのフルアクセス',
        '2社マッチング成立で全額返金保証',
      ],
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
