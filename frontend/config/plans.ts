export type PlanTier = 'starter' | 'standard' | 'premium';

type Role = 'user' | 'company';

export interface PlanDef {
  id: PlanTier;
  name: string;
  price: number; // JPY per month (tax excl.)
  description: string;
  features: string[];
}

const base = {
  starter: {
    id: 'starter',
    name: 'スターター',
    price: 980,
    description: '基本機能を手頃に利用',
  },
  standard: {
    id: 'standard',
    name: 'スタンダード',
    price: 2980,
    description: '多くの方におすすめ',
  },
  premium: {
    id: 'premium',
    name: 'プレミアム',
    price: 5980,
    description: '全機能フルアクセス',
  },
} as const;

export const plansByRole: Record<Role, PlanDef[]> = {
  user: [
    { ...base.starter, features: ['職務経歴書作成', '企業閲覧', 'スカウト受信'] },
    { ...base.standard, features: ['AI職務経歴書添削', 'AI面接対策', '応募管理'] },
    { ...base.premium, features: ['個別サポート', '詳細レポート', '優先スカウト表示'] },
  ],
  company: [
    { ...base.starter, features: ['求職者検索（制限）', '求人掲載（1枠）'] },
    { ...base.standard, features: ['求職者スカウト', '求人掲載（3枠）', '応募管理'] },
    { ...base.premium, features: ['無制限掲載', '優先表示', '専任サポート'] },
  ],
};

