export interface Industry {
  id: string;
  name: string;
  categoryId: string;
}

export interface IndustryCategory {
  id: string;
  name: string;
}

export const industryCategories: IndustryCategory[] = [
  { id: "1", name: "IT・通信" },
  { id: "2", name: "メーカー" },
  { id: "3", name: "商社" },
  { id: "4", name: "小売" },
  { id: "5", name: "金融" },
  { id: "6", name: "サービス・インフラ" },
  { id: "7", name: "メディア・広告" },
  { id: "8", name: "官公庁・公共" },
];

export const industries: Industry[] = [
  // IT・通信
  { id: "101", name: "ソフトウェア・ITサービス", categoryId: "1" },
  { id: "102", name: "インターネット・Web", categoryId: "1" },
  { id: "103", name: "通信", categoryId: "1" },
  { id: "104", name: "ゲーム", categoryId: "1" },
  
  // メーカー
  { id: "201", name: "電機・電子", categoryId: "2" },
  { id: "202", name: "機械", categoryId: "2" },
  { id: "203", name: "自動車", categoryId: "2" },
  { id: "204", name: "化学", categoryId: "2" },
  { id: "205", name: "食品・飲料", categoryId: "2" },
  { id: "206", name: "医薬品", categoryId: "2" },
  { id: "207", name: "その他メーカー", categoryId: "2" },
  
  // 商社
  { id: "301", name: "総合商社", categoryId: "3" },
  { id: "302", name: "専門商社", categoryId: "3" },
  
  // 小売
  { id: "401", name: "百貨店", categoryId: "4" },
  { id: "402", name: "コンビニエンスストア", categoryId: "4" },
  { id: "403", name: "専門店", categoryId: "4" },
  { id: "404", name: "EC・通販", categoryId: "4" },
  
  // 金融
  { id: "501", name: "銀行", categoryId: "5" },
  { id: "502", name: "証券", categoryId: "5" },
  { id: "503", name: "保険", categoryId: "5" },
  { id: "504", name: "その他金融", categoryId: "5" },
  
  // サービス・インフラ
  { id: "601", name: "不動産", categoryId: "6" },
  { id: "602", name: "建設", categoryId: "6" },
  { id: "603", name: "エネルギー・電力", categoryId: "6" },
  { id: "604", name: "運輸・物流", categoryId: "6" },
  { id: "605", name: "コンサルティング", categoryId: "6" },
  { id: "606", name: "人材サービス", categoryId: "6" },
  { id: "607", name: "教育", categoryId: "6" },
  { id: "608", name: "医療・福祉", categoryId: "6" },
  { id: "609", name: "ホテル・旅行", categoryId: "6" },
  { id: "610", name: "外食", categoryId: "6" },
  { id: "611", name: "エンターテインメント", categoryId: "6" },
  
  // メディア・広告
  { id: "701", name: "広告", categoryId: "7" },
  { id: "702", name: "出版", categoryId: "7" },
  { id: "703", name: "放送", categoryId: "7" },
  { id: "704", name: "新聞", categoryId: "7" },
  
  // 官公庁・公共
  { id: "801", name: "官公庁", categoryId: "8" },
  { id: "802", name: "公共団体", categoryId: "8" },
];

export const industriesByCategory = (categoryId: string): Industry[] => {
  return industries.filter(industry => industry.categoryId === categoryId);
};