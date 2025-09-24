'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaSearch, FaPaperPlane } from 'react-icons/fa';
import { getAuthHeaders, getUserInfo } from '@/utils/auth';
import ResumePreview from '@/components/pure/resume/preview';

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
  const [resumes, setResumes] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Load user's resumes to show on the left
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/v2/resumes/`, {
          headers: { ...getAuthHeaders() },
        });
        if (!res.ok) return;
        const data = await res.json();
        const list = data.results || data || [];
        setResumes(list);
        const active = list.find((r: any) => r.is_active) || list[0] || null;
        setSelected(active);
      } catch {}
    };
    load();
  }, []);

  const buildPreviewFromResume = useMemo(() => {
    return (resume: any) => {
      if (!resume) return { userName: '', jobhistoryList: [], formValues: {} } as any;
      const extra = resume?.extra_data || {};
      const jobs = Array.isArray(extra.workExperiences) ? extra.workExperiences : [];
      const jobhistoryList = jobs.map((_: any, i: number) => `job${i + 1}`);
      const formValues: any = {};
      const toYM = (v?: string) => (v ? String(v).replace(/-/g, '/').slice(0, 7) : '');
      jobs.forEach((e: any, i: number) => {
        formValues[`job${i + 1}`] = {
          company: e.company,
          capital: '',
          work_content: e.description,
          since: toYM(e.startDate),
          to: toYM(e.endDate),
          people: '',
          duty: e.position,
          business: e.business,
        };
      });
      return { userName: extra.fullName || '', jobhistoryList, formValues };
    };
  }, []);

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
          {/* Left: Resume preview (actual data) */}
          <section className="lg:col-span-8 bg-white border rounded-lg shadow-sm p-4 overflow-auto max-h-[75vh]">
            {selected ? (
              <div className="mx-auto max-w-3xl">
                {(() => {
                  const d = buildPreviewFromResume(selected);
                  const extra = selected?.extra_data || {};
                  const skillsArray = (selected?.skills || '')
                    .split('\n')
                    .map((s: string) => s.trim())
                    .filter(Boolean);
                  return (
                    <ResumePreview
                      userName={d.userName}
                      jobhistoryList={d.jobhistoryList}
                      formValues={d.formValues}
                      jobSummary={(extra as any)?.jobSummary || ''}
                      selfPR={selected?.self_pr || ''}
                      skills={skillsArray}
                      education={Array.isArray((extra as any)?.education) ? (extra as any).education : []}
                    />
                  );
                })()}
              </div>
            ) : (
              <div className="h-[60vh] flex items-center justify-center text-secondary-500">
                プレビュー可能な職務経歴書が見つかりません。先に職務経歴書を作成してください。
              </div>
            )}
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
