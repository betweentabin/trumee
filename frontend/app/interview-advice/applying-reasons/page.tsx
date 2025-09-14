'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/app/redux/hooks';
import { FaBriefcase, FaLightbulb, FaPencilAlt, FaStar, FaPlus, FaMinus } from 'react-icons/fa';
import { buildApiUrl, getApiHeaders } from '@/config/api';
import toast from 'react-hot-toast';

export default function ApplyingReasonsPage() {
  const router = useRouter();
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
  type ThreadMsg = { id: string; sender: string; text: string; created_at: string };
  const [thread, setThread] = useState<ThreadMsg[]>([]);
  const [threadInput, setThreadInput] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!authState.isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authState, router]);

  const handleGenerate = async () => {
    if (!companyName || !position) {
      toast.error('企業名と希望職種を入力してください');
      return;
    }

    setLoading(true);
    try {
      // AI生成のシミュレーション
      setTimeout(() => {
        const sample = `${companyName}への志望理由

私は${position}として、貴社の事業に大きな興味を持っております。

【志望理由1: 事業への共感】
貴社の革新的なサービスと顧客中心のアプローチに深く共感しております。特に、技術革新を通じて社会課題を解決するという理念は、私のキャリア目標と完全に一致しています。

【志望理由2: スキルの活用】
これまでの経験で培った技術スキルと問題解決能力を、貴社の${position}として最大限に活用できると確信しています。

【志望理由3: 成長機会】
貴社の成長環境において、自身のスキルをさらに磨き、チームと共に成長していきたいと考えています。`;

        setGeneratedReason(sample);
        setLoading(false);
        toast.success('志望理由を生成しました');
      }, 2000);
    } catch (error) {
      setLoading(false);
      toast.error('エラーが発生しました');
    }
  };

  const handleSendAdvice = async () => {
    if (!companyName || !position) {
      toast.error('企業名と希望職種を入力してください');
      return;
    }
    try {
      const body = {
        subject: 'advice',
        content: JSON.stringify({
          type: 'applying_reason',
          company: companyName,
          position,
          strengths: reasons,
          draft: generatedReason,
        }),
      };
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
    if (!c) return '';
    try {
      const obj = JSON.parse(c);
      if (obj && typeof obj === 'object') {
        return obj.message || obj.draft || c;
      }
    } catch {}
    return String(c);
  };

  const loadThread = async () => {
    try {
      const url = `${buildApiUrl('/advice/messages/')}?subject=advice`;
      const res = await fetch(url, { headers: getApiHeaders(token) });
      if (!res.ok) return;
      const list = await res.json();
      const mapped: ThreadMsg[] = (list || []).map((m: any) => ({
        id: String(m.id),
        sender: String(m.sender),
        text: parseContent(m.content),
        created_at: m.created_at,
      }));
      setThread(mapped);
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch {}
  };

  const sendThreadMessage = async () => {
    const text = threadInput.trim();
    if (!text) return;
    try {
      const body = {
        subject: 'advice',
        content: JSON.stringify({ type: 'applying_reason_note', message: text }),
      };
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
    } catch {
      toast.error('メッセージ送信に失敗しました');
    }
  };

  useEffect(() => { loadThread(); }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaBriefcase className="text-[#FF733E]" />
            転職理由（志望理由）
          </h1>
          <p className="text-gray-600 mt-2">企業への志望理由を作成するお手伝いをします</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left navigation */}
          <aside className="lg:col-span-3">
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              {[
                '転職理由(志望理由)',
                '退職理由',
                '将来やりたいこと',
                '職務経歴書に関する質問',
                '実績など',
                '面接対策',
                '志望理由',
                'その他、質問',
              ].map((t, i) => (
                <div key={i} className="px-4 py-3 border-b last:border-b-0 text-sm hover:bg-gray-50 cursor-default">
                  {t}
                </div>
              ))}
            </div>
          </aside>

          {/* Right content */}
          <div className="lg:col-span-9 space-y-6">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">基本情報入力</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  企業名
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="例: 株式会社ABC"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  希望職種
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="例: システムエンジニア"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  あなたの強み・経験（任意）
                </label>
                <textarea
                  value={reasons}
                  onChange={(e) => setReasons(e.target.value)}
                  placeholder="これまでの経験や強みを記入してください..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                  <pre className="whitespace-pre-wrap text-gray-700 font-sans">{generatedReason}</pre>
                </div>
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                    コピー
                  </button>
                  <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
                    編集
                  </button>
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

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
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

            <div className="mt-2 bg-white rounded-lg shadow-md p-6">
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
                  <p className="text-sm text-gray-600">実例や数値を交えて説明しましょう</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Thread */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-9 bg-white rounded-lg shadow-md border">
            <div className="px-4 py-3 border-b font-semibold">相談スレッド</div>
            <div className="h-[300px] overflow-y-auto p-4 space-y-2 bg-gray-50">
              {thread.length === 0 && (
                <div className="text-center text-gray-400 text-sm py-10">メッセージはありません。</div>
              )}
              {thread.map((m) => {
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
          </div>
        </div>
      </div>
    </div>
  );
}
