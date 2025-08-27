'use client';

import { FaShieldAlt, FaLock, FaUserShield, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

export default function PersonalInfoLicensePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
              <FaShieldAlt className="text-blue-600" />
              個人情報利用許諾
            </h1>
            <p className="text-gray-600 mt-2">最終更新日: 2024年1月1日</p>
          </div>

          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <FaUserShield className="text-blue-600" />
                個人情報の取り扱いについて
              </h2>
              <div className="bg-blue-50 rounded-lg p-4">
                <p>
                  株式会社TruMeee（以下「当社」といいます）は、お客様の個人情報の重要性を認識し、
                  その保護を徹底するため、個人情報保護法および関連法令を遵守し、
                  以下のプライバシーポリシーに基づき個人情報を取り扱います。
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">第1条（個人情報の定義）</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p>
                  本プライバシーポリシーにおいて「個人情報」とは、個人情報保護法に定める個人情報をいい、
                  生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日その他の記述等により
                  特定の個人を識別することができるもの（他の情報と容易に照合することができ、
                  それにより特定の個人を識別することができるものを含む）をいいます。
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">第2条（個人情報の収集）</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="mb-3">当社は、以下の方法で個人情報を収集いたします：</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>サービス利用登録時にご提供いただく情報</li>
                  <li>職務経歴書作成時にご入力いただく情報</li>
                  <li>お問い合わせ時にご提供いただく情報</li>
                  <li>サービス利用時に自動的に収集される情報（IPアドレス、Cookie情報等）</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <FaCheckCircle className="text-green-600" />
                第3条（個人情報の利用目的）
              </h2>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="mb-3">当社は、収集した個人情報を以下の目的で利用いたします：</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>転職支援サービスの提供および運営</li>
                  <li>お客様への連絡、通知、お知らせの送付</li>
                  <li>お客様からのお問い合わせへの対応</li>
                  <li>利用規約違反等への対応</li>
                  <li>サービスの改善、新サービスの開発</li>
                  <li>統計データの作成（個人を特定できない形式）</li>
                  <li>マーケティング活動（お客様の同意がある場合）</li>
                  <li>その他、上記利用目的に付随する目的</li>
                </ol>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">第4条（個人情報の第三者提供）</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="mb-3">
                  当社は、以下の場合を除き、お客様の同意なく第三者に個人情報を提供することはありません：
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>法令に基づく場合</li>
                  <li>人の生命、身体または財産の保護のために必要がある場合</li>
                  <li>公衆衛生の向上または児童の健全な育成の推進のために必要がある場合</li>
                  <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
                  <li>予め次の事項を告知あるいは公表し、かつ当社が個人情報保護委員会に届出をした場合
                    <ul className="list-circle list-inside ml-4 mt-2">
                      <li>利用目的に第三者への提供を含むこと</li>
                      <li>第三者に提供されるデータの項目</li>
                      <li>第三者への提供の手段または方法</li>
                      <li>本人の求めに応じて個人情報の第三者への提供を停止すること</li>
                      <li>本人の求めを受け付ける方法</li>
                    </ul>
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <FaLock className="text-blue-600" />
                第5条（個人情報の安全管理）
              </h2>
              <div className="bg-blue-50 rounded-lg p-4">
                <p>
                  当社は、個人情報の漏洩、滅失または毀損の防止その他の個人情報の安全管理のために、
                  以下の措置を講じています：
                </p>
                <ul className="list-disc list-inside space-y-2 mt-3">
                  <li>SSL暗号化通信の使用</li>
                  <li>アクセス権限の管理</li>
                  <li>個人情報へのアクセスログの記録</li>
                  <li>定期的なセキュリティ監査</li>
                  <li>従業員への個人情報保護教育</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">第6条（Cookieの使用）</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p>
                  当社のウェブサイトでは、お客様により良いサービスを提供するためにCookieを使用しています。
                  Cookieは、ウェブサイトがお客様のコンピューターを識別するための小さなテキストファイルです。
                  お客様は、ブラウザの設定によりCookieの受け取りを拒否することができますが、
                  その場合、一部のサービスがご利用いただけなくなる可能性があります。
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">第7条（個人情報の開示・訂正・削除）</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="mb-3">
                  お客様は、当社に対して以下の請求を行うことができます：
                </p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>個人情報の開示</li>
                  <li>個人情報の内容が事実と異なる場合の訂正、追加または削除</li>
                  <li>個人情報の利用停止または消去</li>
                  <li>個人情報の第三者への提供の停止</li>
                </ol>
                <p className="mt-3">
                  請求にあたっては、本人確認のための書類の提出をお願いする場合があります。
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <FaExclamationTriangle className="text-yellow-600" />
                第8条（未成年者の個人情報）
              </h2>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p>
                  18歳未満の未成年者が当社のサービスを利用する場合は、
                  保護者の同意を得たうえでご利用ください。
                  保護者の同意なく未成年者の個人情報が送信された場合でも、
                  保護者の同意があったものとみなします。
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">第9条（プライバシーポリシーの変更）</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p>
                  当社は、法令の変更、サービス内容の変更、その他の事情により、
                  本プライバシーポリシーを変更することがあります。
                  変更後のプライバシーポリシーは、当社ウェブサイト上に表示した時点から効力を生じるものとします。
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">第10条（お問い合わせ窓口）</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p>個人情報の取り扱いに関するお問い合わせは、以下の窓口までご連絡ください：</p>
                <div className="mt-3">
                  <p>株式会社TruMeee 個人情報保護管理者</p>
                  <p>メール: privacy@trumeee.com</p>
                  <p>電話: 03-1234-5678（平日 9:00-18:00）</p>
                  <p>住所: 〒100-0001 東京都千代田区千代田1-1-1</p>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-center text-gray-700">
              本個人情報利用許諾は2024年1月1日から施行されます。<br />
              ご不明な点がございましたら、上記お問い合わせ窓口までご連絡ください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}