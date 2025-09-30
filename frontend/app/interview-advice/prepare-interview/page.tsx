"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppSelector } from "@/app/redux/hooks";
import useAuthV2 from "@/hooks/useAuthV2";
import apiClient from "@/lib/api-v2-client";
import { buildApiUrl, getApiHeaders } from "@/config/api";
import toast from "react-hot-toast";
import { FaHandshake, FaPlus, FaMinus } from "react-icons/fa";
import ClientPaidPlanModal from "@/components/modal/ClientPaidPlanModal";
import QuestionBrowser from "@/components/interview/QuestionBrowser";
import MockInterviewTrainer from "@/components/interview/MockInterviewTrainer";

type ThreadMsg = { id: string; sender: string; text: string; created_at: string };

export default function PrepareInterviewPage() {
  const router = useRouter();
  const pathname = usePathname();
  const authState = useAppSelector((s) => s.auth);
  const { currentUser } = useAuthV2();

  const [openReason, setOpenReason] = useState(true);
  const [openOther, setOpenOther] = useState(true);
  const [showPaid, setShowPaid] = useState(false);

  const [hasResume, setHasResume] = useState<boolean | null>(null);

  const [thread, setThread] = useState<ThreadMsg[]>([]);
  const [threadInput, setThreadInput] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);
  const [derivedQs, setDerivedQs] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

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

  // preserve /users/:id prefix when present
  const userIdFromPath = useMemo(() => {
    if (!pathname) return null as string | null;
    const parts = pathname.split('/').filter(Boolean);
    if (parts[0] === 'users' && parts[1]) return parts[1];
    return null;
  }, [pathname]);
  const to = (p: string) => (userIdFromPath ? `/users/${userIdFromPath}${p}` : p);

  // check resume presence
  useEffect(() => {
    const run = async () => {
      try {
        const list = await apiClient.getResumes();
        const has = (list || []).length > 0;
        setHasResume(has);
        if (has) {
          const r = list.find((x: any) => x.is_active) || list[0];
          const extra = (r?.extra_data || {}) as any;
          const experiences = Array.isArray(extra?.workExperiences) ? extra.workExperiences : [];
          const qs: string[] = [];
          experiences.forEach((e: any) => {
            if (e?.company) qs.push(`${e.company}での役割と主な成果は？`);
            if (e?.position) qs.push(`${e.position}として最も難しかった課題と対応は？`);
          });
          if ((r?.skills || '').trim()) qs.push('履歴書のスキルから、強調したい3点は？それぞれ裏付けは？');
          setDerivedQs(qs.slice(0, 6));
        }
      } catch {
        setHasResume(false);
      }
    };
    run();
  }, []);

  // 回答のローカル保存（簡易）
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('interview_prepare_answers');
        if (saved) setAnswers(JSON.parse(saved));
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('interview_prepare_answers', JSON.stringify(answers));
      }
    } catch {}
  }, [answers]);

  const isPremium = !!currentUser?.is_premium;
  const requirePremium = () => {
    if (!isPremium) {
      setShowPaid(true);
      return false;
    }
    return true;
  };

  const loadThread = async () => {
    try {
      const base = `${buildApiUrl("/advice/messages/")}?subject=interview`;
      const url = userIdFromPath ? `${base}&user_id=${encodeURIComponent(String(userIdFromPath))}` : base;
      const res = await fetch(url, { headers: getApiHeaders(token) });
      if (!res.ok) return;
      const list = await res.json();
      const mapped: ThreadMsg[] = (list || []).map((m: any) => ({
        id: String(m.id),
        sender: String(m.sender),
        text: m.content ?? m.message ?? "",
        created_at: m.created_at,
      }));
      setThread(mapped);
      endRef.current?.scrollIntoView({ behavior: "smooth" });
      try {
        await fetch(buildApiUrl("/advice/mark_read/"), {
          method: "POST",
          headers: getApiHeaders(token),
          body: JSON.stringify({ subject: "interview" }),
        });
      } catch {}
    } catch {}
  };

  const sendThread = async () => {
    const text = threadInput.trim();
    if (!text) return;
    if (!requirePremium()) return;
    try {
      const body: any = { subject: "interview", content: text };
      if (userIdFromPath) body.user_id = String(userIdFromPath);
      const res = await fetch(buildApiUrl("/advice/messages/"), { method: "POST", headers: getApiHeaders(token), body: JSON.stringify(body) });
      if (!res.ok) {
        toast.error("メッセージ送信に失敗しました");
        return;
      }
      setThreadInput("");
      await loadThread();
    } catch {
      toast.error("メッセージ送信に失敗しました");
    }
  };

  useEffect(() => {
    loadThread();
  }, [token]);

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
            <li className="text-gray-800">面接対策</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left navigation */}
          <aside className="lg:col-span-3">
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              {[
                "転職理由(志望理由)",
                "退職理由",
                "将来やりたいこと",
                "職務経歴書に関する質問",
                "実績など",
                "面接対策",
                "志望理由",
                "その他、質問",
              ].map((t, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const path =
                      t === "転職理由(志望理由)"
                        ? "/interview-advice/applying-reasons"
                        : t === "職務経歴書に関する質問"
                        ? "/interview-advice/resume-questions"
                        : t === "志望理由"
                        ? "/interview-advice/applying-reasons"
                        : t === "面接対策"
                        ? "/interview-advice/prepare-interview"
                        : t === "その他、質問"
                        ? "/interview-advice/other-questions"
                        : "/interview-advice/prepare-interview";
                    router.push(to(path));
                  }}
                  className={`w-full text-left px-4 py-3 border-b last:border-b-0 ${
                    t === "面接対策" ? "bg-[#FFF7E6] font-semibold" : "hover:bg-gray-50"
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
                <FaHandshake className="text-[#FF733E]" />
                面接対策
              </h1>
              <p className="text-gray-600 mt-2">
                ここでは想定される質問とあなたの職務経歴書をベースに、回答の添削やアドバイスを受けることができます。
              </p>
            </div>

            {/* 一般的な想定質問（自動生成のベース） */}
            <section className="bg-white rounded-lg shadow-sm border">
              <div className="px-4 py-3 border-b font-semibold">一般的な想定質問</div>
              <div className="p-4 space-y-4">
                {[
                  { id: 'q1', text: '自己紹介をお願いします（1-2分）' },
                  { id: 'q2', text: '志望動機を教えてください' },
                  { id: 'q3', text: 'あなたの強み・弱みは何ですか？' },
                  { id: 'q4', text: '困難を乗り越えた経験は？' },
                  { id: 'q5', text: '5年後のキャリアビジョンは？' },
                ].map((q) => (
                  <div key={q.id} className="space-y-2">
                    <div className="text-sm font-medium text-gray-800">• {q.text}</div>
                    <textarea
                      className="w-full border rounded-md p-2 text-sm"
                      placeholder="あなたの回答を入力してください"
                      value={answers[q.id] || ''}
                      onChange={(e)=>setAnswers(prev=>({ ...prev, [q.id]: e.target.value }))}
                      rows={3}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* 履歴書からの想定質問 */}
            {derivedQs.length > 0 && (
              <section className="bg-white rounded-lg shadow-sm border">
                <div className="px-4 py-3 border-b font-semibold">履歴書からの想定質問</div>
                <div className="p-4">
                  <ul className="list-disc pl-5 space-y-2 text-gray-700">
                    {derivedQs.map((q, i) => (<li key={i}>{q}</li>))}
                  </ul>
                </div>
              </section>
            )}

            {/* カテゴリ別 質問集（インライン） */}
            <section className="bg-white rounded-lg shadow-sm border">
              <div className="px-4 py-3 border-b font-semibold">カテゴリ別 質問集</div>
              <div className="p-4">
                <QuestionBrowser type="interview" showPersonalize className="shadow-none p-0" />
              </div>
            </section>

            {hasResume === false && (
              <div className="bg-white border rounded-lg p-6">
                <p className="text-gray-700 mb-4">面接対策を開始するには、まず職務経歴書を作成してください。</p>
                <button
                  onClick={() => router.push("/career")}
                  className="px-6 py-3 rounded-lg bg-[#FF733E] text-white hover:bg-orange-70 active:bg-orange-60"
                >
                  職務経歴書を作成する
                </button>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border">
              <button
                onClick={() => setOpenReason(!openReason)}
                className="w-full flex items-center justify-between px-4 py-3 font-semibold"
              >
                志望理由
                {openReason ? <FaMinus /> : <FaPlus />}
              </button>
              {openReason && (
                <div className="px-4 pb-4 text-sm text-gray-700">
                  <p className="mb-3">志望理由の構成例や、盛り込むべき観点の例を表示します。</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
              <button
                onClick={() => setOpenOther(!openOther)}
                className="w-full flex items-center justify-between px-4 py-3 font-semibold"
              >
                その他、質問
                {openOther ? <FaMinus /> : <FaPlus />}
              </button>
              {openOther && (
                <div className="px-4 pb-4 text-sm text-gray-700">
                  <p>面接でよくあるその他の質問集と回答のヒントを表示します。</p>
                </div>
              )}
            </div>

            {/* Thread */}
            <section className="bg-white rounded-lg shadow-md border">
              <div className="px-4 py-3 border-b font-semibold">相談スレッド</div>
              <div className="h-[300px] overflow-y-auto p-4 space-y-2 bg-gray-50">
                {thread.length === 0 && (
                  <div className="text-center text-gray-400 text-sm py-10">メッセージはありません。</div>
                )}
                {thread.map((m) => {
                  const isMine = me && String(m.sender) === String(me.id);
                  return (
                    <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-md p-3 text-sm ${
                          isMine ? "bg-[#3A2F1C] text-white" : "bg-white text-gray-900 border"
                        }`}
                      >
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

            {/* 模擬面接（タイマー付き） */}
            <MockInterviewTrainer />
          </main>
        </div>
      </div>

      {/* Paid plan modal */}
      <ClientPaidPlanModal showModal={showPaid} />
    </div>
  );
}
