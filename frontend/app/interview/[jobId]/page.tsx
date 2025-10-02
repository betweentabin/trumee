'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import apiV2Client from '@/lib/api-v2-client';
import useAuthV2 from '@/hooks/useAuthV2';
import toast from 'react-hot-toast';

export default function InterviewSlotsPage() {
  const { jobId } = useParams();
  const id = String(jobId || '');
  const { initializeAuth, requireRole } = useAuthV2();
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    initializeAuth();
    requireRole('user', '/auth/login');
  }, [initializeAuth, requireRole]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const list = await apiV2Client.getInterviewSlots(id);
        setSlots(list || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">面接候補日</h1>
      <div className="bg-white rounded-lg shadow p-4">
        {loading ? (
          <div className="text-gray-500">読み込み中…</div>
        ) : slots.length === 0 ? (
          <div className="text-gray-500">現在、候補日はありません。</div>
        ) : (
          <ul className="space-y-2">
            {slots.map((s: any) => (
              <li key={s.id} className="border rounded p-3 flex items-center justify-between">
                <div className="text-sm text-gray-900">
                  <div>{new Date(s.start_time).toLocaleString('ja-JP')} 〜 {new Date(s.end_time).toLocaleString('ja-JP')}</div>
                  <div className="text-xs text-gray-600">状態: {s.status === 'proposed' ? '候補' : s.status === 'accepted' ? '確定' : s.status === 'declined' ? '辞退' : '—'}</div>
                </div>
                <div className="flex items-center gap-2">
                  {s.status === 'proposed' && (
                    <button
                      className={`px-3 py-1 rounded text-white ${accepting === s.id ? 'bg-gray-400' : 'bg-primary-600 hover:bg-primary-700'}`}
                      disabled={!!accepting}
                      onClick={async ()=>{
                        setAccepting(s.id);
                        try {
                          await apiV2Client.acceptInterviewSlot(id, s.id);
                          toast.success('面接日を確定しました');
                          const list = await apiV2Client.getInterviewSlots(id);
                          setSlots(list || []);
                        } catch (e: any) {
                          const status = e?.response?.status;
                          const data = e?.response?.data || {};
                          if (status === 409 && data?.error === 'no_tickets') toast.error('企業側のチケット残がありません');
                          else if (status === 409 && data?.error === 'already_consumed_for_seeker') toast.error('面接は既に確定済みです');
                          else toast.error('確定に失敗しました');
                        } finally {
                          setAccepting(null);
                        }
                      }}
                    >{accepting === s.id ? '処理中…' : 'この候補で確定'}</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

