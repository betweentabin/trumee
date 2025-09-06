'use client';

import { useEffect, useState } from 'react';
import apiV2Client from '@/lib/api-v2-client';
import useAuthV2 from '@/hooks/useAuthV2';

type Notif = { id: string; title: string; time: string };

export default function NotificationsPage() {
  const { initializeAuth, requireAuth } = useAuthV2();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
    requireAuth('/auth/login');
  }, [initializeAuth, requireAuth]);

  useEffect(() => {
    const load = async () => {
      try {
        const msgs = await apiV2Client.getSeekerMessages();
        const mapped: Notif[] = (msgs as any[]).map((m: any) => ({
          id: m.id,
          title: m.subject || m.content?.slice(0, 40) || '新着メッセージ',
          time: new Date(m.created_at).toLocaleString('ja-JP'),
        }));
        setItems(mapped);
      } catch (e) {
        // keep empty list
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">通知</h1>
      <div className="bg-white rounded-lg shadow divide-y">
        {loading ? (
          <div className="p-6 text-gray-500">読み込み中...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-gray-500">通知はありません</div>
        ) : (
          items.map((n) => (
            <div key={n.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{n.title}</div>
                <div className="text-sm text-gray-500">{n.time}</div>
              </div>
              <button className="text-sm text-[#FF733E]">表示</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
