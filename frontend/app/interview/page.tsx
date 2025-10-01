'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { buildApiUrl } from '@/config/api';
import { getAuthHeaders } from '@/utils/auth';

type Msg = { id: string; sender: string; content: string; created_at: string };

export default function InterviewTopPage() {
  const pathname = usePathname();
  const userIdFromPath = useMemo(() => {
    if (!pathname) return null as string | null;
    const parts = pathname.split('/').filter(Boolean);
    if (parts[0] === 'users' && parts[1]) return parts[1];
    return null;
  }, [pathname]);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const meId = useMemo(() => {
    try { const raw = typeof window !== 'undefined' ? localStorage.getItem('current_user_v2') : null; return raw ? String(JSON.parse(raw)?.id || '') : ''; } catch { return ''; }
  }, []);

  const parseContent = (c: any) => {
    if (!c) return '';
    try { const obj = JSON.parse(c); if (obj && typeof obj === 'object') return obj.message || String(c); } catch {}
    return String(c);
  };

  const load = async () => {
    try {
      const base = `${buildApiUrl('/advice/messages/')}?subject=interview`;
      const url = userIdFromPath ? `${base}&user_id=${encodeURIComponent(String(userIdFromPath))}` : base;
      const res = await fetch(url, { headers: { ...getAuthHeaders() } });
      if (!res.ok) return;
      const data = await res.json();
      const mapped: Msg[] = (data || []).map((m: any) => ({ id: String(m.id), sender: String(m.sender), content: parseContent(m.content), created_at: m.created_at }));
      setMessages(mapped);
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
      // 既読
      try { await fetch(buildApiUrl('/advice/mark_read/'), { method: 'POST', headers: { ...getAuthHeaders() }, body: JSON.stringify({ subject: 'interview' }) }); } catch {}
    } catch {}
  };

  useEffect(() => { load(); }, [userIdFromPath]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    try {
      setLoading(true);
      const body: any = { subject: 'interview', content: JSON.stringify({ message: text }) };
      const url = buildApiUrl('/advice/messages/');
      const res = await fetch(url, { method: 'POST', headers: { ...getAuthHeaders() }, body: JSON.stringify(body) });
      if (!res.ok) return;
      setInput('');
      load();
    } finally { setLoading(false); }
  };

  const questionsFromAdmins = useMemo(() => messages.filter(m => meId && String(m.sender) !== meId), [messages, meId]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: received questions */}
        <aside className="bg-white rounded-lg shadow border p-4 md:col-span-1">
          <h2 className="text-lg font-semibold mb-3">受信した質問</h2>
          <div className="space-y-2 max-h-[60vh] overflow-auto">
            {questionsFromAdmins.length === 0 && (
              <div className="text-gray-500 text-sm">まだ質問はありません。</div>
            )}
            {questionsFromAdmins.map((q) => (
              <div key={q.id} className="border rounded-md px-3 py-2 text-sm bg-white">{q.content}</div>
            ))}
          </div>
        </aside>

        {/* Right: chat */}
        <main className="bg-white rounded-lg shadow border p-4 md:col-span-2 flex flex-col min-h-[60vh]">
          <h2 className="text-lg font-semibold mb-3">やり取り</h2>
          <div className="flex-1 overflow-auto space-y-2 pr-1">
            {messages.map((m) => {
              const isMine = meId && String(m.sender) === meId;
              return (
                <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-md px-3 py-2 text-sm max-w-[80%] ${isMine ? 'bg-[#3A2F1C] text-white' : 'bg-gray-100 text-gray-900 border'}`}>{m.content}</div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
          <div className="mt-3 flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 border rounded px-3 py-2" placeholder="回答やメッセージを入力" />
            <button onClick={send} disabled={loading} className="btn-outline btn-outline-md">送信</button>
          </div>
        </main>
      </div>
    </div>
  );
}
