'use client';

import Link from 'next/link';
import { FaChevronRight } from 'react-icons/fa';

export default function ServiceCards() {
  // 🚨 緊急対応: 無限ループ防止のため、認証が必要なページへのリンクを一時無効化
  const handleDisabledClick = (pageName: string) => {
    alert(`🚨 デバッグモード: ${pageName}は認証システムの修正中のため一時的に無効化されています`);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 mx-auto pt-4">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 col-span-2">
        <p className="text-sm">🚨 デバッグモード: 認証が必要なページへのリンクを一時無効化中</p>
      </div>
      
      {/* Left Card */}
      <div className="flex-1 bg-white border rounded-xl shadow-sm p-4">
        <h2 className="font-bold text-sm mb-4">各サービスを利用する</h2>
        <div className="space-y-3">
          {[
            { text: '職務経歴書に関するアドバイス', page: 'career' },
            { text: '面接に関するアドバイス', page: 'interview' },
            { text: '企業からのスカウト確認', page: 'scouts' },
          ].map(({ text, page }, idx) => (
            <button
              key={idx}
              onClick={() => handleDisabledClick(text)}
              className="w-full flex items-center justify-between px-4 py-2 border rounded-md text-sm hover:bg-red-50 cursor-pointer border-red-300 text-red-600"
            >
              <span>{text}</span>
              <FaChevronRight className="text-red-400 text-xs" />
            </button>
          ))}
        </div>
      </div>

      {/* Right Card */}
      <div className="flex-1 bg-white border rounded-xl shadow-sm p-4">
        <h2 className="font-bold text-sm mb-4">登録情報について</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: 'プロフィール', page: 'step1-profile' },
            { label: '経歴', page: 'step3-experience' },
            { label: '希望条件', page: 'step4-preference' },
            { label: '履歴書', page: 'resumes' },
          ].map(({ label, page }, idx) => (
            <button
              key={idx}
              onClick={() => handleDisabledClick(label)}
              className="flex items-center justify-between px-4 py-2 border rounded-md hover:bg-red-50 w-full cursor-pointer border-red-300 text-red-600"
            >
              <span>{label}</span>
              <FaChevronRight className="text-red-400 text-xs" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
