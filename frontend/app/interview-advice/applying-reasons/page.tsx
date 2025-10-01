'use client';

import React from 'react';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAppSelector } from '@/app/redux/hooks';
import { FaBriefcase, FaLightbulb, FaPencilAlt, FaStar, FaPlus, FaMinus } from 'react-icons/fa';
import { buildApiUrl, getApiHeaders } from '@/config/api';
import toast from 'react-hot-toast';
// import QuestionBrowser from '@/components/interview/QuestionBrowser';

// Local types
type ThreadMsg = { id: string; sender: string; text: string; created_at: string; topic?: string };

export default function ApplyingReasonsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const authState = useAppSelector(state => state.auth);
  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('');
  const [reasons, setReasons] = useState('');
  const [generatedReason, setGeneratedReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [openReason, setOpenReason] = useState(true);
  const [openRetire, setOpenRetire] = useState(false);
  const [openFuture, setOpenFuture] = useState(true);
  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('drf_token_v2') || '' : ''), []);
  const me = useMemo(() => {
    if (typeof window === 'undefined') return null as any;
    try { return JSON.parse(localStorage.getItem('current_user_v2') || 'null'); } catch { return null as any; }
  }, []);

  // Thread state
  const [thread, setThread] = useState<ThreadMsg[]>([]);
  const [threadInput, setThreadInput] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);
  // Interview chat (user ↔ admin)
  type ChatMsg = { id: string; sender: string; content: string; created_at: string };
  const [interviewChat, setInterviewChat] = useState<ChatMsg[]>([]);
  const [interviewInput, setInterviewInput] = useState('');
  // Chat topic selection
  const topics = [
    { key: 'applying', label: '転職理由(志望理由)' },
    { key: 'retire', label: '退職理由' },
    { key: 'future', label: '将来やりたいこと' },
    { key: 'resume', label: '職務経歴書に関する質問' },
    { key: 'results', label: '実績など' },
    { key: 'interview', label: '面接対策' },
    { key: 'aspiration', label: '志望理由' },
    { key: 'others', label: 'その他、質問' },
  ] as const;
  type TopicKey = typeof topics[number]['key'];
  const [selectedTopic, setSelectedTopic] = useState<TopicKey | null>(null);
  const topicLabel = (k: TopicKey | null) => (k ? topics.find(t => t.key === k)?.label || '' : '');

  // Support both /interview-advice/... and /users/:id/interview-advice/...
  const userIdFromPath = useMemo(() => {
    if (!pathname) return null as string | null;
    const parts = pathname.split('/').filter(Boolean);
    if (parts[0] === 'users' && parts[1]) return parts[1];
    return null;
  }, [pathname]);
  const to = (path: string) => (userIdFromPath ? `/users/${userIdFromPath}${path}` : path);
  const searchParams = useSearchParams();

  // Avoid early redirect before persisted auth rehydrates
  useEffect(() => {
    const hasStoredToken = typeof window !== 'undefined' && !!localStorage.getItem('drf_token_v2');
    if (!authState.isAuthenticated && !hasStoredToken) {
      router.push('/auth/login');
    }
  }, [authState.isAuthenticated, router]);

  // Deep link support from footer: ?focus=resume | ?focus=pr
  useEffect(() => {
    const focus = (searchParams?.get('focus') || '').toLowerCase();
    if (focus === 'resume') setSelectedTopic('resume');
    else if (focus === 'pr') setSelectedTopic('interview');
  }, [searchParams]);

  // When entering 面接対策タブ, load chat messages
  useEffect(() => {
    if (selectedTopic === 'interview') loadInterviewChat();
  }, [selectedTopic]);

  const handleGenerate = async () => {
    if (!companyName || !position) {
      toast.error('企業名と希望職種を入力してください');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/gemini/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, position, strengths: reasons })
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t?.slice(0, 200) || 'Gemini API error');
      }
      const data = await res.json();
      setGeneratedReason(String(data?.text || ''));
      toast.success('志望理由を生成しました');
    } catch (error) {
      toast.error('生成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSendAdvice = async () => {
    if (!companyName || !position) {
      toast.error('企業名と希望職種を入力してください');
      return;
    }
    try {
      const body: any = {
        subject: 'advice',
        content: JSON.stringify({
          type: 'applying_reason',
          company: companyName,
          position,
          strengths: reasons,
          draft: generatedReason,
        }),
      };
      // ユーザー別ページの場合は対象ユーザーIDを付与
      if (userIdFromPath) body.user_id = String(userIdFromPath);
      const res = await fetch(buildApiUrl('/advice/messages/'), {
        method: 'POST',
        headers: getApiHeaders(token),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const t = await res.text();
        console.error('send failed', res.status, t);
        toast.error('相談の送信に失敗しました');
        return;
      }
      toast.success('相談内容を送信しました');
    } catch (e) {
      console.error(e);
      toast.error('相談の送信に失敗しました');
    }
  };

  // Thread helpers
  const parseContent = (c: any) => {
    if (!c) return { text: '', topic: undefined as string | undefined };
    try {
      const obj = JSON.parse(c);
      if (obj && typeof obj === 'object') {
        return { text: obj.message || obj.draft || String(c), topic: obj.topic };
      }
    } catch (e) {
      // noop
    }
    return { text: String(c), topic: undefined };
  };

  const loadThread = async () => {
    try {
      const base = `${buildApiUrl('/advice/messages/')}?subject=advice`;
      const url = userIdFromPath ? `${base}&user_id=${encodeURIComponent(String(userIdFromPath))}` : base;
      const res = await fetch(url, { headers: getApiHeaders(token) });
      if (!res.ok) return;
      const list = await res.json();
      const mapped: ThreadMsg[] = (list || []).map((m: any) => {
        const parsed = parseContent(m.content);
        return {
          id: String(m.id),
          sender: String(m.sender),
          text: parsed.text,
          topic: parsed.topic,
          created_at: m.created_at,
        };
      });
      setThread(mapped);
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
      // mark as read for advice subject
      try {
        await fetch(buildApiUrl('/advice/mark_read/'), {
          method: 'POST',
          headers: getApiHeaders(token),
          body: JSON.stringify({ subject: 'advice' }),
        });
      } catch (e) { /* noop */ }
    } catch (e) {
      // noop
    }
  };

  // Interview chat helpers (subject='interview')
  const parseInterviewContent = (c: any) => {
    if (!c) return '';
    try { const obj = JSON.parse(c); if (obj && typeof obj === 'object') return obj.message || String(c); } catch {}
    return String(c);
  };
  const loadInterviewChat = async () => {
    try {
      const base = `${buildApiUrl('/advice/messages/')}?subject=interview`;
      const url = userIdFromPath ? `${base}&user_id=${encodeURIComponent(String(userIdFromPath))}` : base;
      const res = await fetch(url, { headers: getApiHeaders(token) });
      if (!res.ok) return;
      const data = await res.json();
      const mapped: ChatMsg[] = (data || []).map((m: any) => ({ id: String(m.id), sender: String(m.sender), content: parseInterviewContent(m.content), created_at: m.created_at }));
      setInterviewChat(mapped);
      try {
        await fetch(buildApiUrl('/advice/mark_read/'), { method: 'POST', headers: getApiHeaders(token), body: JSON.stringify({ subject: 'interview' }) });
      } catch {}
    } catch {}
  };
  const sendInterviewChat = async () => {
    const text = interviewInput.trim();
    if (!text) return;
    try {
      const body: any = { subject: 'interview', content: JSON.stringify({ message: text }) };
      if (userIdFromPath) body.user_id = String(userIdFromPath);
      const res = await fetch(buildApiUrl('/advice/messages/'), { method: 'POST', headers: getApiHeaders(token), body: JSON.stringify(body) });
      if (!res.ok) return;
      setInterviewInput('');
      await loadInterviewChat();
    } catch {}
  };

  const sendThreadMessage = async () => {
    const text = threadInput.trim();
    if (!text || !selectedTopic) return;
    try {
      const payload = {
        type: selectedTopic,
        topic: selectedTopic,
        message: text,
      };
      const body: any = {
        subject: 'advice',
        content: JSON.stringify(payload),
      };
      // ユーザー別ページの場合は対象ユーザーIDを付与
      if (userIdFromPath) body.user_id = String(userIdFromPath);
      const res = await fetch(buildApiUrl('/advice/messages/'), {
        method: 'POST',
        headers: getApiHeaders(token),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        toast.error('メッセージ送信に失敗しました');
        return;
      }
      setThreadInput('');
      await loadThread();
    } catch (e) {
      toast.error('メッセージ送信に失敗しました');
    }
  };

  useEffect(() => { loadThread(); }, [token]);
  // When opening a topic, mark read for advice subject
  useEffect(() => {
    if (!selectedTopic) return;
    (async () => {
      try {
        await fetch(buildApiUrl('/advice/mark_read/'), {
          method: 'POST',
          headers: getApiHeaders(token),
          body: JSON.stringify({ subject: 'advice' }),
        });
      } catch (e) { /* noop */ }
    })();
  }, [selectedTopic, token]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-500 mb-4" aria-label="breadcrumb">
          <ol className="flex items-center gap-2">
            <li className="hover:text-gray-700 cursor-pointer" onClick={() => router.push('/')}>TOP</li>
            <li>›</li>
            <li className="hover:text-gray-700 cursor-pointer" onClick={() => router.push(me?.id ? `/users/${me.id}/myinfo/registerdata` : '/users/myinfo/registerdata')}>マイページ</li>
            <li>›</li>
            <li className="hover:text-gray-700 cursor-pointer" onClick={() => router.push(to('/interview-advice/applying-reasons'))}>面接に関するアドバイス</li>
            <li>›</li>
            <li className="text-gray-800">転職理由(志望理由)</li>
          </ol>
        </nav>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaBriefcase className="text-[#FF733E]" />
            転職理由（志望理由）
          </h1>
          <p className="text-gray-600 mt-2">企業への志望理由を作成するお手伝いをします</p>
        </div>

        {/* Topic Chat Panel (moved above main grid) */}
        {selectedTopic && (
          <section className="mb-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-9 bg-white rounded-lg shadow-md border">
              <div className="px-4 py-3 border-b font-semibold flex items-center justify-between">
                <span>{topicLabel(selectedTopic)}</span>
                <button aria-label="Close" onClick={() => setSelectedTopic(null)} className="p-1 rounded hover:bg-gray-100">
                  <FaMinus />
                </button>
              </div>

              {selectedTopic === 'interview' ? (
                <>
                  {/* 面接対策チャット（管理画面と同じ subject='interview'） */}
                  <div className="h-[300px] overflow-y-auto p-4 space-y-2 bg-gray-50">
                    {interviewChat.length === 0 && (
                      <div className="text-center text-gray-400 text-sm py-10">メッセージはありません。</div>
                    )}
                    {interviewChat.map((m) => {
                      const isMine = me && String(m.sender) === String(me.id);
                      return (
                        <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-md p-3 text-sm ${isMine ? 'bg-[#3A2F1C] text-white' : 'bg-white text-gray-900 border'}`}>
                            <div>{m.content}</div>
                            <div className="text-[10px] opacity-70 mt-1">{new Date(m.created_at).toLocaleString('ja-JP')}</div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={endRef} />
                  </div>
                  <div className="p-4 border-t flex gap-2">
                    <input
                      value={interviewInput}
                      onChange={(e) => setInterviewInput(e.target.value)}
                      placeholder="入力してください。"
                      className="flex-1 rounded-md border px-3 py-2"
                    />
                    <button onClick={sendInterviewChat} className="rounded-md bg-[#FF733E] text-white px-4 py-2">送信</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-[300px] overflow-y-auto p-4 space-y-2 bg-gray-50">
                    {thread.filter(m => (m.topic || 'others') === selectedTopic).length === 0 && (
                      <div className="text-center text-gray-400 text-sm py-10">メッセージはありません。</div>
                    )}
                    {thread.filter(m => (m.topic || 'others') === selectedTopic).map((m) => {
                      const isMine = me && String(m.sender) === String(me.id);
                      return (
                        <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-md p-3 text-sm ${isMine ? 'bg-[#3A2F1C] text-white' : 'bg-white text-gray-900 border'}`}>
                            <div>{m.text}</div>
                            <div className="text-[10px] opacity-70 mt-1">{new Date(m.created_at).toLocaleString('ja-JP')}</div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={endRef} />
                  </div>
                  <div className="p-4 border-t flex gap-2">
                    <input
                      value={threadInput}
                      onChange={(e) => setThreadInput(e.target.value)}
                      placeholder="入力してください。"
                      className="flex-1 rounded-md border px-3 py-2"
                    />
                    <button onClick={sendThreadMessage} className="rounded-md bg-[#FF733E] text-white px-4 py-2">送信</button>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left navigation */}
          <aside className="lg:col-span-3">
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              {topics.map((t) => (
                <div key={t.key} className={`px-4 py-3 border-b last:border-b-0 text-sm flex items-center justify-between ${selectedTopic===t.key ? 'bg-orange-50' : 'hover:bg-gray-50'}`}>
                  <span>{t.label}</span>
                  <button aria-label="Open chat" onClick={() => setSelectedTopic(t.key)} className="p-1 rounded hover:bg-gray-200">
                    <FaPlus />
                  </button>
                </div>
              ))}
            </div>
          </aside>

          {/* Right content */}
          <main className="lg:col-span-9 space-y-6">
            {/* Collapsible sections */}
            <div className="bg-white rounded-lg shadow-sm border">
              <button onClick={() => setOpenReason(!openReason)} className="w-full flex items-center justify-between px-4 py-3 font-semibold">
                転職理由(志望理由)
                {openReason ? <FaMinus /> : <FaPlus />}
              </button>
              {openReason && (
                <div className="px-4 pb-4 text-sm text-gray-700">
                  <p className="mb-3">テキストが入ります。志望理由の構成例や、盛り込むべき観点の例を表示します。</p>
                  <div className="bg-gray-50 rounded-md p-3">
                    <p className="text-xs text-gray-600">例）事業への共感 / 活かせるスキル / 成長機会</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
              <button onClick={() => setOpenRetire(!openRetire)} className="w-full flex items-center justify-between px-4 py-3 font-semibold">
                退職理由
                {openRetire ? <FaMinus /> : <FaPlus />}
              </button>
              {openRetire && (
                <div className="px-4 pb-4 text-sm text-gray-700">
                  <p>前職の退職理由をポジティブに、事実ベースで簡潔にまとめるコツを提示します。</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
              <button onClick={() => setOpenFuture(!openFuture)} className="w-full flex items-center justify-between px-4 py-3 font-semibold">
                将来やりたいこと
                {openFuture ? <FaMinus /> : <FaPlus />}
              </button>
              {openFuture && (
                <div className="px-4 pb-4 text-sm text-gray-700">
                  <p>中長期のキャリアビジョンと応募企業で実現したいことを関連づける視点を示します。</p>
                </div>
              )}
            </div>

            {/* Two-column: Form and Generated */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">基本情報入力</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">企業名</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="例: 株式会社ABC"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">希望職種</label>
                    <input
                      type="text"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder="例: システムエンジニア"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">あなたの強み・経験（任意）</label>
                    <textarea
                      value={reasons}
                      onChange={(e) => setReasons(e.target.value)}
                      placeholder="これまでの経験や強みを記入してください..."
                      className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#FF733E]"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleGenerate}
                      disabled={loading}
                      className="flex-1 py-3 bg-[#FF733E] text-white rounded-lg hover:bg-orange-70 active:bg-orange-60 transition disabled:bg-gray-400"
                    >
                      {loading ? '生成中...' : '志望理由を生成'}
                    </button>
                    <button
                      onClick={handleSendAdvice}
                      className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      相談を送信
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FaLightbulb className="text-yellow-500" />
                  生成された志望理由
                </h2>
                {generatedReason ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-orange-50 border-l-4 border-[#FF733E] rounded">
                      <pre className="whitespace-pre-wrap text-gray-700 font-sans">{generatedReason}</pre>
                    </div>
                    <div className="flex gap-3">
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">コピー</button>
                      <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">編集</button>
                    </div>
                  </div>
                ) : (
                  <div className="h-96 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <FaPencilAlt className="text-6xl mx-auto mb-4" />
                      <p>企業情報を入力して志望理由を生成してください</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaStar className="text-yellow-500" />
                志望理由作成のポイント
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">企業研究</h4>
                  <p className="text-sm text-gray-600">企業の理念、事業内容、強みを理解しましょう</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">自己分析</h4>
                  <p className="text-sm text-gray-600">自分の強みと企業のニーズをマッチングさせましょう</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">具体性</h4>
                  <p className="text-sm text-gray-600">具体的な経験やスキルを交えて説明しましょう</p>
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Topic Chat Panel (end) */}
      </div>
    </div>
  );
}
