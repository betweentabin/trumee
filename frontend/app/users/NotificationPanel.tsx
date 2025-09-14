'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import apiV2Client from '@/lib/api-v2-client';

type AdviceSubject = 'resume_advice' | 'advice' | 'interview';

const SUBJECT_LABEL: Record<AdviceSubject, string> = {
  resume_advice: '職務経歴書に関するアドバイスに新しいコメントがあります。',
  advice: 'アドバイス画面に新しいコメントがあります。',
  interview: '面接に関するアドバイスに新しいコメントがあります。',
};

export default function NotificationPanel() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const items = useMemo(() => {
    if (!summary) return [] as { subject: AdviceSubject; unread: number; latest_at?: string | null }[];
    const list: { subject: AdviceSubject; unread: number; latest_at?: string | null }[] = [
      { subject: 'resume_advice', unread: summary?.resume_advice?.unread || 0, latest_at: summary?.resume_advice?.latest_at },
      { subject: 'interview', unread: summary?.interview?.unread || 0, latest_at: summary?.interview?.latest_at },
      { subject: 'advice', unread: summary?.advice?.unread || 0, latest_at: summary?.advice?.latest_at },
    ];
    return list.filter((i) => i.unread > 0);
  }, [summary]);

  const toggle = (index: number) => {
    setOpenIndex(prev => (prev === index ? null : index));
  };

  const load = async () => {
    try {
      setLoading(true);
      const data = await apiV2Client.getAdviceNotifications();
      setSummary(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (subject: AdviceSubject) => {
    await apiV2Client.markAdviceRead(subject);
    await load();
  };

  return (
    <div className="w-full bg-white border rounded-xl shadow-sm overflow-hidden">
      <div className="bg-[#3A2E20] text-white text-sm font-bold px-4 py-2">
        お知らせ
      </div>

      {loading && (
        <div className="px-4 py-3 text-sm text-gray-500">読み込み中...</div>
      )}

      {!loading && items.length === 0 && (
        <div className="px-4 py-3 text-sm text-gray-500">新しいお知らせはありません。</div>
      )}

      {!loading && items.map((item, index) => (
        <div key={item.subject} className="border-t border-gray-200">
          <button
            onClick={() => { toggle(index); markRead(item.subject); }}
            className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium"
          >
            <span className="text-gray-800">{SUBJECT_LABEL[item.subject]}</span>
            <span className="text-gray-500">
              {openIndex === index ? <Minus size={20} /> : <Plus size={20} />}
            </span>
          </button>
          {openIndex === index && (
            <div className="px-4 pb-3 text-sm text-gray-600">
              {item.latest_at ? `最新: ${new Date(item.latest_at).toLocaleString()}` : '詳細は各画面をご確認ください。'}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
