"use client";

import Link from "next/link";
import CustomModal from "@/components/modal/default";

interface LegalComplianceModalProps {
  isOpen: boolean;
  onAcknowledge: () => void;
}

const businessHighlights = [
  { label: "販売社名", value: "株式会社Xrosspoint株式会社" },
  { label: "所在地", value: "〒160-0023 東京都新宿区西新宿７丁目７−２６ ワコーレ新宿第一ビル914" },
  { label: "電話番号", value: "050-5527-0429" },
  { label: "メールアドレス", value: "truemee＠xrosspoint.co.jp" },
];

const policyUpdates = [
  "Cookieの利用とブラウザ設定による制御方法について追記しました。",
  "Googleアナリティクス等のアクセス解析・広告配信サービスの利用目的とオプトアウト手段を明記しました。",
  "個人情報の開示請求や利用停止等の手続き、手数料を更新しました。",
  "お問い合わせ窓口をXrosspoint株式会社（受付時間：平日10:00～18:00）へ変更しました。",
];

export default function LegalComplianceModal({ isOpen, onAcknowledge }: LegalComplianceModalProps) {
  return (
    <CustomModal isOpen={isOpen} onClose={() => {}}>
      <div className="pr-6 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">特定商取引法・プライバシーポリシーの改定</h2>
            <p className="mt-2 text-sm text-gray-600">2025年4月18日施行の内容を必ずご確認ください。</p>
          </div>
          <button
            type="button"
            onClick={onAcknowledge}
            aria-label="確認して閉じる"
            className="rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
          >
            閉じる
          </button>
        </div>

        <div className="mt-4 h-[22rem] overflow-y-auto pr-2 space-y-6 text-sm text-gray-700">
          <section className="space-y-3">
            <h3 className="text-base font-semibold text-gray-800">特定商取引法に基づく主な表記</h3>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {businessHighlights.map((item) => (
                <div key={item.label} className="rounded-md border border-gray-200 bg-white p-4">
                  <dt className="text-xs font-semibold text-gray-500">{item.label}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-gray-800">{item.value}</dd>
                </div>
              ))}
            </dl>
            <div className="rounded-md border border-orange-200 bg-orange-50 p-4 text-xs leading-relaxed text-orange-900">
              上記メールアドレスは迷惑メール対策のため全角の「＠」で表記しています。お問い合わせの際は半角の「@」に変えてご利用ください。
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-semibold text-gray-800">プライバシーポリシー改定ポイント</h3>
            <ul className="list-disc space-y-2 pl-5">
              {policyUpdates.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-2 rounded-md border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs leading-relaxed text-gray-600">
              継続決済をご利用中の企業様は、次回課金日の3日前までに解約申請を頂く必要があります。解約はメール（truemee＠xrosspoint.co.jp）にて受付いたします。
            </p>
            <p className="text-xs leading-relaxed text-gray-600">
              商品のお引き渡しは、初回ご入金確認後3営業日以内に、ご登録メールアドレス宛へご案内いたします。お客様都合での返品・返金には対応できません。
            </p>
          </section>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/transaction-law"
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-primary-200 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50"
            >
              特定商取引法の詳細を見る
            </Link>
            <Link
              href="/account/personal-info-license"
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-primary-200 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50"
            >
              プライバシーポリシーを確認する
            </Link>
          </div>
          <button
            type="button"
            onClick={onAcknowledge}
            className="w-full rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 sm:w-auto"
          >
            上記を確認しました
          </button>
        </div>
      </div>
    </CustomModal>
  );
}
