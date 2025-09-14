'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/app/redux/hooks';
import { FaClipboardCheck, FaTshirt, FaClock, FaHandshake, FaVideo, FaBuilding } from 'react-icons/fa';

export default function PrepareInterviewPage() {
  const router = useRouter();
  const authState = useAppSelector(state => state.auth);
  const [activeTab, setActiveTab] = useState('before');
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authState.isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authState, router]);

  const handleCheck = (itemId: string) => {
    const newCheckedItems = new Set(checkedItems);
    if (newCheckedItems.has(itemId)) {
      newCheckedItems.delete(itemId);
    } else {
      newCheckedItems.add(itemId);
    }
    setCheckedItems(newCheckedItems);
  };

  const preparationContent = {
    before: {
      title: '面接前の準備',
      icon: <FaClipboardCheck />,
      sections: [
        {
          title: '企業研究',
          icon: <FaBuilding />,
          items: [
            { id: 'b1', text: '企業の事業内容を理解する' },
            { id: 'b2', text: '企業理念・ビジョンを確認する' },
            { id: 'b3', text: '最近のニュース・プレスリリースをチェック' },
            { id: 'b4', text: '競合他社との違いを理解する' }
          ]
        },
        {
          title: '自己分析',
          icon: <FaClipboardCheck />,
          items: [
            { id: 'b5', text: '志望動機を明確にする' },
            { id: 'b6', text: '自己PRを3つ準備する' },
            { id: 'b7', text: '想定質問への回答を準備' },
            { id: 'b8', text: '逆質問を5つ以上準備' }
          ]
        },
        {
          title: '持ち物準備',
          icon: <FaTshirt />,
          items: [
            { id: 'b9', text: '履歴書・職務経歴書のコピー' },
            { id: 'b10', text: '筆記用具とメモ帳' },
            { id: 'b11', text: '身分証明書' },
            { id: 'b12', text: 'スーツ・靴の準備' }
          ]
        }
      ]
    },
    during: {
      title: '面接当日',
      icon: <FaClock />,
      sections: [
        {
          title: '出発前チェック',
          icon: <FaClock />,
          items: [
            { id: 'd1', text: '場所と交通手段の最終確認' },
            { id: 'd2', text: '15分前到着を目指す' },
            { id: 'd3', text: '身だしなみの最終チェック' },
            { id: 'd4', text: 'スマートフォンをマナーモードに' }
          ]
        },
        {
          title: '面接中の心構え',
          icon: <FaHandshake />,
          items: [
            { id: 'd5', text: '明るく元気な挨拶' },
            { id: 'd6', text: '相手の目を見て話す' },
            { id: 'd7', text: '結論から話す' },
            { id: 'd8', text: '落ち着いてゆっくり話す' },
            { id: 'd9', text: '積極的に逆質問をする' }
          ]
        }
      ]
    },
    online: {
      title: 'オンライン面接',
      icon: <FaVideo />,
      sections: [
        {
          title: '環境準備',
          icon: <FaVideo />,
          items: [
            { id: 'o1', text: '静かな場所を確保' },
            { id: 'o2', text: '背景をシンプルに' },
            { id: 'o3', text: '照明を顔に当てる' },
            { id: 'o4', text: 'カメラを目線の高さに' }
          ]
        },
        {
          title: '技術チェック',
          icon: <FaClipboardCheck />,
          items: [
            { id: 'o5', text: 'インターネット接続を確認' },
            { id: 'o6', text: 'カメラ・マイクのテスト' },
            { id: 'o7', text: '使用ツールへの事前ログイン' },
            { id: 'o8', text: 'バックアップデバイスの準備' }
          ]
        }
      ]
    }
  };

  const tabs = [
    { id: 'before', label: '面接前', icon: <FaClipboardCheck /> },
    { id: 'during', label: '面接当日', icon: <FaClock /> },
    { id: 'online', label: 'オンライン', icon: <FaVideo /> }
  ];

  const currentContent = preparationContent[activeTab as keyof typeof preparationContent];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-500 mb-4" aria-label="breadcrumb">
          <ol className="flex items-center gap-2">
            <li className="hover:text-gray-700 cursor-pointer" onClick={() => router.push('/')}>TOP</li>
            <li>›</li>
            <li className="hover:text-gray-700 cursor-pointer" onClick={() => router.push('/interview-advice/applying-reasons')}>面接に関するアドバイス</li>
            <li>›</li>
            <li className="text-gray-800">面接対策</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left navigation */}
          <aside className="lg:col-span-3">
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              {[
                { label: '転職理由(志望理由)', href: '/interview-advice/applying-reasons' },
                { label: '職務経歴書に関する質問', href: '/interview-advice/resume-questions' },
                { label: '自己PRに関係する質問', href: '/interview-advice/pr-questions' },
                { label: '面接対策', href: '/interview-advice/prepare-interview' },
              ].map((item, i) => (
                <button key={i} onClick={() => router.push(item.href)} className={`w-full text-left px-4 py-3 border-b last:border-b-0 ${item.href.endsWith('prepare-interview') ? 'bg-[#FFF7E6] font-semibold' : 'hover:bg-gray-50'}`}>
                  {item.label}
                </button>
              ))}
            </div>
          </aside>

          {/* Main content */}
          <div className="lg:col-span-9">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <FaHandshake className="text-[#FF733E]" />
                面接対策
              </h1>
              <p className="text-gray-600 mt-2">面接を成功させるための準備チェックリスト</p>
            </div>

            {/* CTA */}
            <div className="mb-6 bg-white border rounded-lg p-6">
              <p className="text-gray-700 mb-4">ここでは想定される質問とあなたの職務経歴書をベースに、回答の添削やアドバイスを受けることができます。面接対策を始めるには、まず職務経歴書を作成してください。</p>
              <button onClick={() => router.push('/career')} className="px-6 py-3 rounded-lg bg-[#FF733E] text-white hover:bg-orange-70 active:bg-orange-60">
                職務経歴書を作成する
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex border-b">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 transition ${
                  activeTab === tab.id
                    ? 'bg-[#FF733E] text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              {currentContent.icon}
              {currentContent.title}
            </h2>

            <div className="space-y-6">
              {currentContent.sections.map((section, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    {section.icon}
                    {section.title}
                  </h3>
                  <div className="space-y-3">
                    {section.items.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center gap-3 cursor-pointer hover:bg-white p-2 rounded transition"
                      >
                        <input
                          type="checkbox"
                          checked={checkedItems.has(item.id)}
                          onChange={() => handleCheck(item.id)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className={`${
                          checkedItems.has(item.id) ? 'line-through text-gray-500' : 'text-gray-700'
                        }`}>
                          {item.text}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">進捗状況</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {checkedItems.size} / {currentContent.sections.reduce((acc, sec) => acc + sec.items.length, 0)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">達成率</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round((checkedItems.size / currentContent.sections.reduce((acc, sec) => acc + sec.items.length, 0)) * 100)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
          </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-3">面接成功の秘訣</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 第一印象を大切に</li>
              <li>• 笑顔と感謝の気持ちを忘れずに</li>
              <li>• 自信を持って堂々と</li>
              <li>• 準備した内容を自然に話す</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-3">よくある失敗</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 遅刻や時間の勘違い</li>
              <li>• 企業研究不足</li>
              <li>• ネガティブな退職理由</li>
              <li>• 逆質問を準備していない</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-3">面接後のフォロー</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• お礼メールを送る</li>
              <li>• 面接の振り返りをする</li>
              <li>• 次回への改善点を整理</li>
              <li>• 結果を冷静に待つ</li>
            </ul>
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
