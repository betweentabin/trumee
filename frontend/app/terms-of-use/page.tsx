'use client';

import { FaFileContract, FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
              <FaFileContract className="text-blue-600" />
              利用規約
            </h1>
            <p className="text-gray-600 mt-2">最終更新日: 2024年1月1日</p>
          </div>

          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <FaCheckCircle className="text-green-600" />
                第1条（適用）
              </h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p>1. この利用規約（以下「本規約」といいます。）は、TruMeee（以下「当社」といいます。）が提供する転職支援サービス（以下「本サービス」といいます。）の利用条件を定めるものです。</p>
                <p>2. 登録ユーザーの皆さま（以下「ユーザー」といいます。）には、本規約に従って本サービスをご利用いただきます。</p>
                <p>3. 本規約は、ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されるものとします。</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <FaInfoCircle className="text-blue-600" />
                第2条（利用登録）
              </h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p>1. 本サービスの利用を希望する者は、本規約に同意の上、当社の定める方法によって利用登録を申請するものとします。</p>
                <p>2. 当社は、利用登録の申請者に以下の事由があると判断した場合、利用登録の申請を承認しないことがあります。</p>
                <ul className="list-disc list-inside ml-4">
                  <li>利用登録の申請に際して虚偽の事項を届け出た場合</li>
                  <li>本規約に違反したことがある者からの申請である場合</li>
                  <li>その他、当社が利用登録を相当でないと判断した場合</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">第3条（ユーザーIDおよびパスワードの管理）</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p>1. ユーザーは、自己の責任において、本サービスのユーザーIDおよびパスワードを適切に管理するものとします。</p>
                <p>2. ユーザーは、いかなる場合にも、ユーザーIDおよびパスワードを第三者に譲渡または貸与し、もしくは第三者と共用することはできません。</p>
                <p>3. 当社は、ユーザーIDとパスワードの組み合わせが登録情報と一致してログインされた場合には、そのユーザーIDを登録しているユーザー自身による利用とみなします。</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">第4条（料金および支払方法）</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p>1. ユーザーは、本サービスの有料部分の対価として、当社が別途定め、本サービス内に表示する料金を、当社が指定する方法により支払うものとします。</p>
                <p>2. ユーザーが料金の支払を遅滞した場合には、ユーザーは年14.6％の割合による遅延損害金を支払うものとします。</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <FaExclamationTriangle className="text-yellow-600" />
                第5条（禁止事項）
              </h2>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="mb-2">ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>法令または公序良俗に違反する行為</li>
                  <li>犯罪行為に関連する行為</li>
                  <li>当社、本サービスの他のユーザー、または第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                  <li>当社のサービスの運営を妨害するおそれのある行為</li>
                  <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                  <li>不正アクセスをし、またはこれを試みる行為</li>
                  <li>他のユーザーに成りすます行為</li>
                  <li>当社のサービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為</li>
                  <li>その他、当社が不適切と判断する行為</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">第6条（本サービスの提供の停止等）</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p>1. 当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。</p>
                <ul className="list-disc list-inside ml-4">
                  <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
                  <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
                  <li>コンピュータまたは通信回線等が事故により停止した場合</li>
                  <li>その他、当社が本サービスの提供が困難と判断した場合</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">第7条（著作権）</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p>1. ユーザーは、当社または当社にライセンスを許諾している者が著作権を有する情報を、当社および著作権者の事前の承諾を得ずに、複製、編集、加工、発信、販売、出版その他いかなる方法においても、使用することはできません。</p>
                <p>2. ユーザーは、本サービスを利用して投稿ないしアップロードした文章、画像、動画その他のデータについて、自らが投稿その他送信することについての適法な権利を有していること、および投稿データが第三者の権利を侵害していないことについて、当社に対し表明し、保証するものとします。</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">第8条（免責事項）</h2>
              <div className="bg-red-50 rounded-lg p-4 space-y-2">
                <p>1. 当社は、本サービスに関して、ユーザーと他のユーザーまたは第三者との間において生じた取引、連絡または紛争等について一切責任を負いません。</p>
                <p>2. 当社は、本サービスの提供の中断、停止、終了、利用不能または変更、ユーザーのメッセージまたは情報の削除または消失、ユーザーの登録の取消、本サービスの利用によるデータの消失または機器の故障もしくは損傷、その他本サービスに関連してユーザーが被った損害につき、賠償する責任を一切負わないものとします。</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">第9条（サービス内容の変更等）</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p>当社は、ユーザーに通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">第10条（利用規約の変更）</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p>当社は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。なお、本規約の変更後、本サービスの利用を開始した場合には、当該ユーザーは変更後の規約に同意したものとみなします。</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">第11条（準拠法・裁判管轄）</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p>1. 本規約の解釈にあたっては、日本法を準拠法とします。</p>
                <p>2. 本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。</p>
              </div>
            </section>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-center text-gray-700">
              本規約は2024年1月1日から施行されます。<br />
              ご不明な点がございましたら、お問い合わせフォームよりご連絡ください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}