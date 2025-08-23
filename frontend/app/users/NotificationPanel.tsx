'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

interface NotificationItem {
  message: string;
  detail: string; // 静的な詳細メッセージ
}

const notifications: NotificationItem[] = [
  {
    message: '職務経歴書に関するアドバイスに新しいコメントがあります。',
    detail: '職務経歴書のフォーマットや内容に関する最新のアドバイスをご確認ください。',
  },
  {
    message: '面接に関するアドバイスに新しいコメントがあります。',
    detail: '面接時の質問例や回答方法についての新しいコメントがあります。',
  },
  {
    message: '面接に関するアドバイスに新しいコメントがあります。',
    detail: '同様に面接準備に役立つ情報が追加されています。',
  },
];

export default function NotificationPanel() {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // 最初だけ開く

  const toggle = (index: number) => {
    setOpenIndex(prev => (prev === index ? null : index));
  };

  return (
    <div className="w-full bg-white border rounded-xl shadow-sm overflow-hidden">
      <div className="bg-[#3A2E20] text-white text-sm font-bold px-4 py-2">
        お知らせ
      </div>

      {notifications.map((item, index) => (
        <div key={index} className="border-t border-gray-200">
          <button
            onClick={() => toggle(index)}
            className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium"
          >
            <span className="text-gray-800">{item.message}</span>
            <span className="text-gray-500">
              {openIndex === index ? <Minus size={20} /> : <Plus size={20} />}
            </span>
          </button>
          {openIndex === index && (
            <div className="px-4 pb-3 text-sm text-gray-600">
              {item.detail}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
