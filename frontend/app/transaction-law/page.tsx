import Link from "next/link";

const sections = [
  {
    title: "事業者の名称",
    body: "株式会社Trumee（トゥルーミー）",
  },
  {
    title: "運営責任者",
    body: "代表取締役　山田 太郎",
  },
  {
    title: "所在地",
    body: "〒150-0002 東京都渋谷区渋谷1-1-1",
  },
  {
    title: "問い合わせ先",
    body: (
      <>
        <div>メール: support@trumee.jp</div>
        <div>（受付時間: 平日 10:00〜18:00）</div>
      </>
    ),
  },
  {
    title: "販売価格",
    body: "各サービスの購入ページに税込み価格を表示しています。",
  },
  {
    title: "商品代金以外の必要料金",
    body: "インターネット接続料金・通信料金はお客様のご負担となります。",
  },
  {
    title: "支払方法",
    body: "クレジットカード決済（Stripe）",
  },
  {
    title: "支払時期",
    body: "サービス申込み時に即時決済となります。",
  },
  {
    title: "提供時期",
    body: "決済完了後、ただちにサービス提供を開始します。",
  },
  {
    title: "返品・キャンセルについて",
    body: "サービスの性質上、提供開始後の返品・返金はお受けしておりません。詳細は利用規約をご確認ください。",
  },
  {
    title: "動作環境",
    body: "最新のブラウザ（Google Chrome / Safari / Microsoft Edge 等）のご利用を推奨しています。",
  },
];

export default function TransactionLawPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-10">
          <p className="text-sm text-gray-500">
            <Link href="/" className="hover:underline">ホーム</Link>
            <span className="mx-2">/</span>
            特定商取引法に基づく表記
          </p>
          <h1 className="text-3xl font-semibold text-gray-900 mt-4">特定商取引法に基づく表記</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border divide-y">
          {sections.map((section, index) => (
            <div key={index} className="px-6 py-6 md:flex md:items-start md:gap-8">
              <dt className="md:w-48 text-sm font-semibold text-gray-700">
                {section.title}
              </dt>
              <dd className="mt-2 md:mt-0 text-sm text-gray-700 leading-relaxed">
                {section.body}
              </dd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

