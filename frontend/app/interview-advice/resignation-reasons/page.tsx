"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppSelector } from "@/app/redux/hooks";
import { buildApiUrl, getApiHeaders } from "@/config/api";
import toast from "react-hot-toast";
import { FaMinus, FaPlus, FaUserTie } from "react-icons/fa";

type ThreadMsg = { id: string; sender: string; text: string; created_at: string };

export default function ResignationReasonsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const authState = useAppSelector((s) => s.auth);

  // 左の折りたたみ
  const [openGuide, setOpenGuide] = useState(true);

  // 入力/生成
  const [currentIssue, setCurrentIssue] = useState("");
  const [whatYouDid, setWhatYouDid] = useState("");
  const [positiveMove, setPositiveMove] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);

  // スレッド
  const [thread, setThread] = useState<ThreadMsg[]>([]);
  const [threadInput, setThreadInput] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);
  const token = useMemo(
    () => (typeof window !== "undefined" ? localStorage.getItem("drf_token_v2") || "" : ""),
    []
  );
  const me = useMemo(() => {
    if (typeof window === "undefined") return null as any;
    try {
      return JSON.parse(localStorage.getItem("current_user_v2") || "null");
    } catch {
      return null as any;
    }
  }, []);

  useEffect(() => {
    const hasStoredToken = typeof window !== 'undefined' && !!localStorage.getItem('drf_token_v2');
    if (!authState.isAuthenticated && !hasStoredToken) router.push('/auth/login');
  }, [authState.isAuthenticated, router]);

  const handleGenerate = async () => {
    if (!currentIssue) {
      toast.error("現職・前職での課題を入力してください");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const text = `退職理由（ポジティブ表現）\n\n【現職で感じた課題】\n${currentIssue}\n\n【改善に向けて取り組んだこと】\n${whatYouDid || "（取り組みを簡潔に記載）"}\n\n【今後に向けた前向きな意図】\n${positiveMove || "専門性をより高め、より大きな価値提供ができる環境に挑戦したいと考えています。"}\n\n上記の通り、現職で得た学びを活かし、次の環境でさらなる成長と貢献を実現したいと考えています。`;
      setDraft(text);
      setLoading(false);
      toast.success("退職理由の草案を生成しました");
    }, 800);
  };

  // Thread helpers
  const parseContent = (c: any) => {
    if (!c) return "";
    try {
      const obj = JSON.parse(c);
      if (obj && typeof obj === "object") return obj.message || obj.draft || c;
    } catch {}
    return String(c);
  };

  const loadThread = async () => {
    try {
      const url = `${buildApiUrl("/advice/messages/")}?subject=advice`;
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
      endRef.current?.scrollIntoView({ behavior: "smooth" });
      try {
        await fetch(buildApiUrl("/advice/mark_read/"), {
          method: "POST",
          headers: getApiHeaders(token),
          body: JSON.stringify({ subject: "advice" }),
        });
      } catch {}
    } catch {}
  };

  const sendThread = async () => {
    const text = threadInput.trim();
    if (!text) return;
    try {
      const res = await fetch(buildApiUrl("/advice/messages/"), {
        method: "POST",
        headers: getApiHeaders(token),
        body: JSON.stringify({ subject: "advice", content: JSON.stringify({ type: "resignation_reason", message: text }) }),
      });
      if (!res.ok) return toast.error("メッセージ送信に失敗しました");
      setThreadInput("");
      await loadThread();
    } catch {
      toast.error("メッセージ送信に失敗しました");
    }
  };

  useEffect(() => { loadThread(); }, [token]);

  const navItems = [
    "転職理由(志望理由)",
    "退職理由",
    "将来やりたいこと",
    "職務経歴書に関する質問",
    "実績など",
    "面接対策",
    "志望理由",
    "その他、質問",
  ];

  // preserve /users/:id prefix
  const userIdFromPath = useMemo(() => {
    if (!pathname) return null as string | null;
    const parts = pathname.split('/').filter(Boolean);
    if (parts[0] === 'users' && parts[1]) return parts[1];
    return null;
  }, [pathname]);
  const to = (p: string) => (userIdFromPath ? `/users/${userIdFromPath}${p}` : p);

  const toPath = (label: string) =>
    label === "転職理由(志望理由)" || label === "志望理由"
      ? "/interview-advice/applying-reasons"
      : label === "退職理由"
      ? "/interview-advice/resignation-reasons"
      : label === "将来やりたいこと"
      ? "/interview-advice/future-plans"
      : label === "職務経歴書に関する質問"
      ? "/interview-advice/resume-questions"
      : label === "実績など"
      ? "/interview-advice/achievements"
      : label === "面接対策"
      ? "/interview-advice/prepare-interview"
      : "/interview-advice/other-questions";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-500 mb-4" aria-label="breadcrumb">
          <ol className="flex items-center gap-2">
            <li className="hover:text-gray-700 cursor-pointer" onClick={() => router.push("/")}>TOP</li>
            <li>›</li>
            <li className="hover:text-gray-700 cursor-pointer" onClick={() => router.push(to("/interview-advice/applying-reasons"))}>面接に関するアドバイス</li>
            <li>›</li>
            <li className="text-gray-800">退職理由</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left navigation */}
          <aside className="lg:col-span-3">
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              {navItems.map((t) => (
                <button
                  key={t}
                  onClick={() => router.push(to(toPath(t)))}
                  className={`w-full text-left px-4 py-3 border-b last:border-b-0 ${
                    t === "退職理由" ? "bg-[#FFF7E6] font-semibold" : "hover:bg-gray-50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </aside>

          {/* Main content */}
          <main className="lg:col-span-9 space-y-6">
            <div className="mb-2">
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <FaUserTie className="text-[#FF733E]" />
                退職理由
              </h1>
              <p className="text-gray-600 mt-2">ネガティブな表現を避け、前向きな意図が伝わる退職理由を作成します。</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
              <button onClick={() => setOpenGuide(!openGuide)} className="w-full flex items-center justify-between px-4 py-3 font-semibold">
                退職理由の作り方（ガイド）
                {openGuide ? <FaMinus /> : <FaPlus />}
              </button>
              {openGuide && (
                <div className="px-4 pb-4 text-sm text-gray-700 space-y-2">
                  <p>退職理由は「事実ベース」かつ「前向きな意図」を中心に構成します。</p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li>現職/前職での課題（誹謗ではなく環境・方針などの客観的な差異）</li>
                    <li>改善に向けて自身が試みたこと</li>
                    <li>今後に向けた前向きな挑戦（成長/貢献の意図）</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Two-column: Form and Generated */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">入力</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">現職/前職で感じた課題</label>
                    <textarea
                      value={currentIssue}
                      onChange={(e) => setCurrentIssue(e.target.value)}
                      placeholder="例: プロダクトの方向性が大きく変わり、専門性を活かしづらい状況が続いた など"
                      className="w-full h-28 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">改善に向けて行ったこと（任意）</label>
                    <textarea
                      value={whatYouDid}
                      onChange={(e) => setWhatYouDid(e.target.value)}
                      placeholder="上長への提案、社内プロジェクトの立ち上げ など"
                      className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">今後に向けた前向きな意図（任意）</label>
                    <textarea
                      value={positiveMove}
                      onChange={(e) => setPositiveMove(e.target.value)}
                      placeholder="より専門性を活かせる環境で価値提供を高めたい など"
                      className="w-full h-20 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button onClick={handleGenerate} disabled={loading} className="w-full py-3 bg-[#FF733E] text-white rounded-lg hover:bg-[#FF8659] transition disabled:bg-gray-400">
                    {loading ? "生成中..." : "草案を生成"}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">生成結果</h2>
                {draft ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-gray-700 font-sans text-sm">{draft}</pre>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={async () => {
                          try {
                            await fetch(buildApiUrl("/advice/messages/"), {
                              method: "POST",
                              headers: getApiHeaders(token),
                              body: JSON.stringify({ subject: "advice", content: JSON.stringify({ type: "resignation_reason_draft", draft }) }),
                            });
                            toast.success("相談内容を送信しました");
                          } catch {
                            toast.error("送信に失敗しました");
                          }
                        }}
                        className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
                      >
                        相談として送信
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-96 flex items-center justify-center text-gray-400">入力して草案を生成してください</div>
                )}
              </div>
            </div>

            {/* Thread */}
            <section className="bg-white rounded-lg shadow-md border">
              <div className="px-4 py-3 border-b font-semibold">相談スレッド</div>
              <div className="h-[300px] overflow-y-auto p-4 space-y-2 bg-gray-50">
                {thread.length === 0 && <div className="text-center text-gray-400 text-sm py-10">メッセージはありません。</div>}
                {thread.map((m) => {
                  const isMine = me && String(m.sender) === String(me.id);
                  return (
                    <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-md p-3 text-sm ${isMine ? "bg-[#3A2F1C] text-white" : "bg-white text-gray-900 border"}`}>
                        <div>{m.text}</div>
                        <div className="text-[10px] opacity-70 mt-1">{new Date(m.created_at).toLocaleString("ja-JP")}</div>
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
                <button onClick={sendThread} className="rounded-md bg-[#FF733E] text-white px-4 py-2">送信</button>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
