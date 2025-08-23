export interface Region {
  id: number;
  name: string;
}

export interface Prefecture {
  id: string;
  name: string;
  regionId: number;
}

export const regions: Region[] = [
  { id: 1, name: "北海道" },
  { id: 2, name: "東北" },
  { id: 3, name: "関東" },
  { id: 4, name: "中部" },
  { id: 5, name: "関西" },
  { id: 6, name: "中国" },
  { id: 7, name: "四国" },
  { id: 8, name: "九州" },
];

export const prefectures: Prefecture[] = [
  // 北海道
  { id: "1", name: "北海道", regionId: 1 },
  
  // 東北
  { id: "2", name: "青森県", regionId: 2 },
  { id: "3", name: "岩手県", regionId: 2 },
  { id: "4", name: "宮城県", regionId: 2 },
  { id: "5", name: "秋田県", regionId: 2 },
  { id: "6", name: "山形県", regionId: 2 },
  { id: "7", name: "福島県", regionId: 2 },
  
  // 関東
  { id: "8", name: "茨城県", regionId: 3 },
  { id: "9", name: "栃木県", regionId: 3 },
  { id: "10", name: "群馬県", regionId: 3 },
  { id: "11", name: "埼玉県", regionId: 3 },
  { id: "12", name: "千葉県", regionId: 3 },
  { id: "13", name: "東京都", regionId: 3 },
  { id: "14", name: "神奈川県", regionId: 3 },
  
  // 中部
  { id: "15", name: "新潟県", regionId: 4 },
  { id: "16", name: "富山県", regionId: 4 },
  { id: "17", name: "石川県", regionId: 4 },
  { id: "18", name: "福井県", regionId: 4 },
  { id: "19", name: "山梨県", regionId: 4 },
  { id: "20", name: "長野県", regionId: 4 },
  { id: "21", name: "岐阜県", regionId: 4 },
  { id: "22", name: "静岡県", regionId: 4 },
  { id: "23", name: "愛知県", regionId: 4 },
  
  // 関西
  { id: "24", name: "三重県", regionId: 5 },
  { id: "25", name: "滋賀県", regionId: 5 },
  { id: "26", name: "京都府", regionId: 5 },
  { id: "27", name: "大阪府", regionId: 5 },
  { id: "28", name: "兵庫県", regionId: 5 },
  { id: "29", name: "奈良県", regionId: 5 },
  { id: "30", name: "和歌山県", regionId: 5 },
  
  // 中国
  { id: "31", name: "鳥取県", regionId: 6 },
  { id: "32", name: "島根県", regionId: 6 },
  { id: "33", name: "岡山県", regionId: 6 },
  { id: "34", name: "広島県", regionId: 6 },
  { id: "35", name: "山口県", regionId: 6 },
  
  // 四国
  { id: "36", name: "徳島県", regionId: 7 },
  { id: "37", name: "香川県", regionId: 7 },
  { id: "38", name: "愛媛県", regionId: 7 },
  { id: "39", name: "高知県", regionId: 7 },
  
  // 九州
  { id: "40", name: "福岡県", regionId: 8 },
  { id: "41", name: "佐賀県", regionId: 8 },
  { id: "42", name: "長崎県", regionId: 8 },
  { id: "43", name: "熊本県", regionId: 8 },
  { id: "44", name: "大分県", regionId: 8 },
  { id: "45", name: "宮崎県", regionId: 8 },
  { id: "46", name: "鹿児島県", regionId: 8 },
  { id: "47", name: "沖縄県", regionId: 8 },
];

export const prefecturesByRegion = (regionId: number): Prefecture[] => {
  return prefectures.filter(prefecture => prefecture.regionId === regionId);
};

export const getPrefectureName = (id: string): string => {
  const prefecture = prefectures.find(p => p.id === id);
  return prefecture ? prefecture.name : '';
};

export const getRegionName = (id: number): string => {
  const region = regions.find(r => r.id === id);
  return region ? region.name : '';
};