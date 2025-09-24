'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import apiV2Client from '@/lib/api-v2-client';
import useAuthV2 from '@/hooks/useAuthV2';

type Thread = { id: string; name: string; last: string; time: string };

export default function MessagesListPage() {
  const { initializeAuth, requireAuth } = useAuthV2();
  const pathname = usePathname();
  const userIdFromPath = useMemo(() => {
    if (!pathname) return null as string | null;
    const parts = pathname.split('/').filter(Boolean);
    if (parts[0] === 'users' && parts[1]) return parts[1];
    return null;
  }, [pathname]);
  const to = (p: string) => (userIdFromPath ? `/users/${userIdFromPath}${p}` : p);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
    requireAuth('/auth/login');
  }, [initializeAuth, requireAuth]);

  useEffect(() => {
    const load = async () => {
      try {
        const msgs = await apiV2Client.getSeekerMessages();
        setMessages(msgs as any[]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const threads: Thread[] = useMemo(() => {
    // グループ化簡易版: senderごとの最新メッセージ
    const map = new Map<string, any>();
    (messages || []).forEach((m: any) => {
      const key = m.sender || m.sender_name || 'unknown';
      const prev = map.get(key);
      if (!prev || new Date(m.created_at) > new Date(prev.created_at)) {
        map.set(key, m);
      }
    });
    return Array.from(map.values()).map((m: any) => ({
      id: m.id,
      name: m.sender_name || '相手',
      last: m.subject || m.content?.slice(0, 40) || 'メッセージ',
      time: new Date(m.created_at).toLocaleString('ja-JP'),
    }));
  }, [messages]);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">メッセージ</h1>
      <div className="bg-white rounded-lg shadow divide-y">
        {loading ? (
          <div className="p-6 text-gray-500">読み込み中...</div>
        ) : threads.length === 0 ? (
          <div className="p-6 text-gray-500">メッセージはありません</div>
        ) : (
          threads.map(t => (
            <Link key={t.id} href={to(`/messages/${t.id}`)} className="block p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{t.name}</div>
                  <div className="text-sm text-gray-600 truncate max-w-[36ch]">{t.last}</div>
                </div>
                <div className="text-xs text-gray-500">{t.time}</div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
