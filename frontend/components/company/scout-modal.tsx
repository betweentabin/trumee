"use client";

import { useState, useMemo } from 'react';
import { DefaultModal } from '@/components/modal';

type SeekerLite = {
  id: string;
  full_name?: string;
  email?: string;
  desired_job?: string;
  prefecture?: string;
  desired_salary?: number;
  gender?: string;
  birthday?: string;
};

interface ScoutModalProps {
  isOpen: boolean;
  seeker: SeekerLite | null;
  loading?: boolean;
  onClose: () => void;
  onSend: (message: string) => Promise<void> | void;
}

export default function ScoutModal({ isOpen, seeker, loading, onClose, onSend }: ScoutModalProps) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const headerSummary = useMemo(() => {
    const location = seeker?.prefecture || '—';
    // 年齢の簡易計算（生年月日があれば）
    let ageText = '—代';
    if (seeker?.birthday) {
      const birth = new Date(seeker.birthday);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      const tens = Math.floor(age / 10) * 10;
      ageText = `${tens}代`;
    }
    const gender = seeker?.gender ? (seeker.gender === 'male' ? '男性' : seeker.gender === 'female' ? '女性' : 'その他') : '—';
    const status = '在籍中';
    return `${location}/${ageText}${gender}/${status}`;
  }, [seeker]);

  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      setSubmitting(true);
      await onSend(message.trim());
      setMessage('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DefaultModal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 w-full max-w-2xl">
        {/* 上部カード */}
        <div className="border rounded-md p-4 text-sm text-gray-800 space-y-2">
          <div className="font-semibold text-gray-900">{headerSummary}</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex"><span className="w-16">職種</span><span className="mx-1">：</span><span>{seeker?.desired_job || '—'}</span></div>
            <div className="flex"><span className="w-16">勤務地</span><span className="mx-1">：</span><span>{seeker?.prefecture || '—'}</span></div>
          </div>
          <div>
            <div className="text-gray-700">メッセージ：</div>
            <div className="text-gray-600 text-xs leading-5">
              メッセージが入ります。メッセージが入ります。メッセージが入ります。メッセージが入ります。メッセージが入ります。
            </div>
          </div>
        </div>

        {/* 入力欄 */}
        <div className="mt-6 border rounded-md p-4">
          <div className="font-medium mb-2">メッセージ</div>
          <textarea
            className="w-full h-36 border rounded-md p-3 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="メッセージを入力してください"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={loading || submitting}
          />
        </div>

        {/* ボタン */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <button
            className="py-3 bg-gray-800 text-white rounded-md disabled:opacity-50"
            onClick={onClose}
            disabled={loading || submitting}
          >
            閉じる
          </button>
          <button
            className="py-3 bg-gray-800 text-white rounded-md disabled:opacity-50"
            onClick={handleSend}
            disabled={loading || submitting || !message.trim()}
          >
            スカウトする
          </button>
        </div>
      </div>
    </DefaultModal>
  );
}

