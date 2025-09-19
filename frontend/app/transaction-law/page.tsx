import Link from "next/link";

const sections = [
  {
    title: "販売社名",
    body: "株式会社Xrosspoint株式会社",
  },
  {
    title: "運営統括責任者",
    body: "仲丸 武宏",
  },
  {
    title: "所在地",
    body: "〒160-0023 東京都新宿区西新宿７丁目７−２６ ワコーレ新宿第一ビル914",
  },
  {
    title: "電話番号",
    body: "050-5527-0429",
  },
  {
    title: "メールアドレス",
    body: (
      <>
        <div>truemee＠xrosspoint.co.jp</div>
        <p className="mt-2 text-xs text-gray-500">
          上記アドレスは迷惑メール対策のため全角の「＠」で表記しております。お問い合わせの際は「＠」を半角の「@」に変更してご利用ください。
        </p>
      </>
    ),
  },
  {
    title: "販売URL",
    body: "各種追加オプションが記載されている専用ページにてご案内しております。",
  },
  {
    title: "お支払い方法",
    body: "クレジットカード、銀行振込",
  },
  {
    title: "販売価格",
    body: "商品申込ページに記載",
  },
  {
    title: "商品代金以外の必要金額",
    body: "消費税、振込手数料（銀行振込の場合）",
  },
  {
    title: "解約方法",
    body: "継続利用の解約をご希望の場合は、truemee＠xrosspoint.co.jpまで申込者氏名を添えてご連絡ください。",
  },
  {
    title: "継続決済の停止処理日について",
    body: "継続決済の解約をご希望の場合は、次回継続決済の課金日の3日前までにご連絡ください。",
  },
  {
    title: "お申込み有効期限",
    body: "14日以内にお願いいたします。14日間入金がない場合はキャンセルとさせていただきます。",
  },
  {
    title: "商品引渡し時期",
    body: "初回のご入金確認後3営業日以内にご案内します。",
  },
  {
    title: "商品引渡し方法",
    body: "商品購入メールアドレスへ配信",
  },
  {
    title: "返品・不良品について",
    body: "お客様のご都合による返品および返金には応じられません。",
  },
  {
    title: "表現、及び商品に関する注意書き",
    body: "本商品に示された表現や再現性には個人差があり、必ずしも利益や効果を保証したものではございません。",
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
