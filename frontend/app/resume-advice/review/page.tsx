'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaSearch, FaPaperPlane } from 'react-icons/fa';
import { getAuthHeaders, getUserInfo } from '@/utils/auth';

interface Message {
  id: string;
  role: 'system' | 'seeker' | 'advisor';
  text: string;
  timestamp: string;
}

export default function ResumeReviewPage() {
  const router = useRouter();
  const [sectionTitle] = useState('職務内容について');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchMessages = async () => {
    try {
      setError(null);
      const res = await fetch(`${apiUrl}/api/v2/advice/messages/`, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      const uid = getUserInfo()?.uid;
      // Map to local structure
      const mapped: Message[] = data.map((m: any) => ({
        id: String(m.id),
        role: uid && String(m.sender) === String(uid) ? 'seeker' : 'advisor',
        text: m.content,
        timestamp: new Date(m.created_at).toLocaleString('ja-JP'),
      }));
      // Post-process to mark own messages. We cannot easily know user id here without an extra call; assume last message echo will render on send.
      setMessages(mapped);
      // mark read for resume advice
      try {
        await fetch(`${apiUrl}/api/v2/advice/mark_read/`, {
          method: 'POST',
          headers: { ...getAuthHeaders() },
          body: JSON.stringify({ subject: 'resume_advice' }),
        });
      } catch {}
    } catch (e) {
      setError('メッセージの取得に失敗しました');
    }
  };

  useEffect(() => {
    fetchMessages();
    const t = setInterval(fetchMessages, 10000);
    return () => clearInterval(t);
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/v2/advice/messages/`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) throw new Error('failed');
      setInput('');
      await fetchMessages();
    } catch (e) {
      setError('送信に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-secondary-700 hover:text-primary-600 flex items-center gap-2"
          >
            <FaArrowLeft /> 戻る
          </button>
          <div className="ml-auto text-sm text-secondary-700">職務経歴書の添削</div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-secondary-800 text-center mb-8">
          職務経歴書の添削内容を確認、コメントを追加してください
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Resume preview mock */}
          <section className="lg:col-span-8 bg-white border rounded-lg shadow-sm p-6 overflow-auto max-h-[75vh]">
            <div className="mx-auto max-w-3xl">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold">職務経歴書</h2>
                <div className="text-sm text-secondary-500 mt-1">{new Date().toLocaleDateString('ja-JP')} 現在</div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-secondary-800 mb-2">職務要約</h3>
                <p className="text-sm text-secondary-700">入力した職務要約が記載されます。</p>
              </div>

              <div className="border-t pt-4 mt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-secondary-800">職務内容</h3>
                  <span className="inline-flex items-center gap-2 text-primary-600 text-sm">
                    <span className="w-2 h-2 rounded-full bg-primary-600" /> 対応中
                  </span>
                </div>
                <div className="text-sm text-secondary-700 space-y-2">
                  <p>2023年08月〜2024年08月 会社名: ●● 事業内容: ●●</p>
                  <div className="border rounded-md overflow-hidden">
                    <div className="grid grid-cols-12 bg-secondary-50 text-secondary-700 text-xs">
                      <div className="col-span-4 px-3 py-2 border-r">期間</div>
                      <div className="col-span-8 px-3 py-2">職務内容</div>
                    </div>
                    <div className="grid grid-cols-12 text-sm">
                      <div className="col-span-4 px-3 py-3 border-r">2023年08月〜2024年08月</div>
                      <div className="col-span-8 px-3 py-3">入力した職務内容が記載されます。</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Right: Comments panel */}
          <aside className="lg:col-span-4 flex flex-col bg-white border rounded-lg shadow-sm overflow-hidden max-h-[75vh]">
            {/* Panel header */}
            <div className="bg-primary-600 text-white px-4 py-3 flex items-center justify-between">
              <div className="font-semibold">{sectionTitle}</div>
              <button className="opacity-90 hover:opacity-100">
                <FaSearch />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto p-3 space-y-3 bg-secondary-50">
              {messages.map((m) => (
                <div key={m.id} className={`max-w-[90%] w-fit ${m.role === 'seeker' ? 'ml-auto' : ''}`}>
                  <div
                    className={`px-3 py-2 rounded-md text-sm shadow-sm ${
                      m.role === 'seeker'
                        ? 'bg-secondary-800 text-white'
                        : 'bg-white text-secondary-800 border'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="border-t bg-white p-3">
              <label className="block text-sm font-semibold text-secondary-800 mb-2">メッセージ入力</label>
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="メッセージを入力してください。"
                  className="flex-1 h-20 resize-none rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
                <button
                  disabled={loading}
                  onClick={send}
                  className="h-10 w-10 shrink-0 rounded-md bg-primary-600 text-white flex items-center justify-center hover:bg-primary-500"
                  aria-label="send message"
                >
                  <FaPaperPlane />
                </button>
              </div>
              {error && <p className="text-sm text-error-600 mt-2">{error}</p>}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
