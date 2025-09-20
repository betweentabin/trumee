export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'fulltime', label: '正社員' },
  { value: 'contract', label: '契約社員' },
  { value: 'dispatch', label: '派遣社員' },
  { value: 'parttime', label: 'パート・アルバイト' },
  { value: 'freelance', label: '業務委託' },
  { value: 'internship', label: 'インターン' },
  { value: 'other', label: 'その他' },
];

export const EMPLOYMENT_TYPE_LABEL_BY_VALUE = EMPLOYMENT_TYPE_OPTIONS.reduce<Record<string, string>>((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

export const EMPLOYMENT_TYPE_VALUE_BY_LABEL = EMPLOYMENT_TYPE_OPTIONS.reduce<Record<string, string>>((acc, option) => {
  acc[option.label] = option.value;
  return acc;
}, {});

export const SALARY_RANGES = [
  '300万円未満',
  '300万円～400万円',
  '400万円～500万円',
  '500万円～600万円',
  '600万円～700万円',
  '700万円～800万円',
  '800万円～900万円',
  '900万円～1000万円',
  '1000万円以上',
];

export const INDUSTRY_OPTIONS = [
  'IT・通信',
  '金融',
  '製造業',
  '小売・流通',
  '不動産・建設',
  '医療・福祉',
  '教育',
  'サービス業',
  'メディア・広告',
  'その他',
];

export const JOB_TYPE_OPTIONS = [
  'エンジニア',
  '営業',
  'マーケティング',
  '事務・管理',
  '企画',
  'デザイナー',
  'コンサルタント',
  '研究開発',
  'その他',
];

export const WORK_STYLE_OPTIONS = [
  'フルリモート',
  'ハイブリッド（週2-3日出社）',
  'ハイブリッド（週1日出社）',
  '出社メイン',
  'フレックスタイム制',
  '固定時間制',
];

export const PREFECTURE_OPTIONS = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

export const DEFAULT_RESUME_TITLE = '職務経歴書';
