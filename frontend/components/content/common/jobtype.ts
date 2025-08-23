export interface JobType {
  id: string;
  name: string;
  categoryId: string;
}

export interface JobTypeCategory {
  id: string;
  name: string;
}

export const jobTypeCategories: JobTypeCategory[] = [
  { id: "1", name: "営業・ビジネス開発" },
  { id: "2", name: "企画・管理" },
  { id: "3", name: "マーケティング・PR" },
  { id: "4", name: "クリエイティブ" },
  { id: "5", name: "エンジニア・IT" },
  { id: "6", name: "専門職" },
  { id: "7", name: "事務・アシスタント" },
  { id: "8", name: "医療・福祉" },
  { id: "9", name: "その他" },
];

export const jobTypes: JobType[] = [
  // 営業・ビジネス開発
  { id: "101", name: "法人営業", categoryId: "1" },
  { id: "102", name: "個人営業", categoryId: "1" },
  { id: "103", name: "営業管理", categoryId: "1" },
  { id: "104", name: "ビジネス開発", categoryId: "1" },
  
  // 企画・管理
  { id: "201", name: "事業企画", categoryId: "2" },
  { id: "202", name: "商品企画", categoryId: "2" },
  { id: "203", name: "プロジェクト管理", categoryId: "2" },
  { id: "204", name: "経営管理", categoryId: "2" },
  
  // マーケティング・PR
  { id: "301", name: "デジタルマーケティング", categoryId: "3" },
  { id: "302", name: "ブランドマーケティング", categoryId: "3" },
  { id: "303", name: "広報・PR", categoryId: "3" },
  { id: "304", name: "市場調査", categoryId: "3" },
  
  // クリエイティブ
  { id: "401", name: "グラフィックデザイン", categoryId: "4" },
  { id: "402", name: "Webデザイン", categoryId: "4" },
  { id: "403", name: "UX/UIデザイン", categoryId: "4" },
  { id: "404", name: "コンテンツ制作", categoryId: "4" },
  { id: "405", name: "映像制作", categoryId: "4" },
  
  // エンジニア・IT
  { id: "501", name: "ソフトウェアエンジニア", categoryId: "5" },
  { id: "502", name: "フロントエンドエンジニア", categoryId: "5" },
  { id: "503", name: "バックエンドエンジニア", categoryId: "5" },
  { id: "504", name: "データサイエンティスト", categoryId: "5" },
  { id: "505", name: "DevOpsエンジニア", categoryId: "5" },
  { id: "506", name: "ITサポート", categoryId: "5" },
  { id: "507", name: "システム管理者", categoryId: "5" },
  
  // 専門職
  { id: "601", name: "経理", categoryId: "6" },
  { id: "602", name: "法務", categoryId: "6" },
  { id: "603", name: "人事", categoryId: "6" },
  { id: "604", name: "コンサルティング", categoryId: "6" },
  { id: "605", name: "財務", categoryId: "6" },
  
  // 事務・アシスタント
  { id: "701", name: "一般事務", categoryId: "7" },
  { id: "702", name: "秘書", categoryId: "7" },
  { id: "703", name: "受付", categoryId: "7" },
  { id: "704", name: "データ入力", categoryId: "7" },
  
  // 医療・福祉
  { id: "801", name: "看護師", categoryId: "8" },
  { id: "802", name: "医療技術者", categoryId: "8" },
  { id: "803", name: "介護職員", categoryId: "8" },
  { id: "804", name: "薬剤師", categoryId: "8" },
  
  // その他
  { id: "901", name: "製造", categoryId: "9" },
  { id: "902", name: "物流", categoryId: "9" },
  { id: "903", name: "販売スタッフ", categoryId: "9" },
  { id: "904", name: "カスタマーサービス", categoryId: "9" },
];

export const jobTypesByCategory = (categoryId: string): JobType[] => {
  return jobTypes.filter(jobType => jobType.categoryId === categoryId);
};