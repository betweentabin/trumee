'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import apiV2Client from '@/lib/api-v2-client';
import useAuthV2 from '@/hooks/useAuthV2';
import toast from 'react-hot-toast';

export default function MessageDetailPage() {
  const { id } = useParams();
  const { initializeAuth, requireAuth } = useAuthV2();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    initializeAuth();
    requireAuth('/auth/login');
  }, [initializeAuth, requireAuth]);

  useEffect(() => {
    const load = async () => {
      try {
        const msgs = await apiV2Client.getSeekerMessages();
        setMessages(msgs as any[]);
      } catch {}
    };
    load();
  }, []);

  const thread = useMemo(() => {
    // 簡易: 指定IDのメッセージのみ表示
    return (messages || []).filter((m) => String(m.id) === String(id));
  }, [messages, id]);

  const handleSend = () => {
    // 送信API未実装のため通知のみ
    if (!text.trim()) return;
    toast('送信機能は準備中です');
    setText('');
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">チャット: {String(id)}</h1>
      <div className="bg-white rounded-lg shadow h-[60vh] p-4 flex flex-col">
        <div className="flex-1 space-y-3 overflow-auto">
          {thread.length === 0 ? (
            <div className="text-gray-500">メッセージはありません</div>
          ) : (
            thread.map((m) => (
              <div key={m.id} className={`rounded-lg px-3 py-2 w-fit ${m.is_mine ? 'self-end bg-[#FF733E] text-white' : 'self-start bg-gray-100'}`}>
                {m.content || m.subject}
              </div>
            ))
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <input className="flex-1 border rounded-lg px-4 py-2" placeholder="メッセージを入力" value={text} onChange={(e) => setText(e.target.value)} />
          <button onClick={handleSend} className="px-4 py-2 rounded-md text-white bg-[#FF733E] hover:bg-[#e9632e]">送信</button>
        </div>
      </div>
    </div>
  );
}
