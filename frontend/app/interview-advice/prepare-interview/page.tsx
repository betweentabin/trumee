"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/app/redux/hooks";
import useAuthV2 from "@/hooks/useAuthV2";
import apiClient from "@/lib/api-v2-client";
import { buildApiUrl, getApiHeaders } from "@/config/api";
import toast from "react-hot-toast";
import { FaHandshake, FaPlus, FaMinus } from "react-icons/fa";
import ClientPaidPlanModal from "@/components/modal/ClientPaidPlanModal";

type ThreadMsg = { id: string; sender: string; text: string; created_at: string };

export default function PrepareInterviewPage() {
  const router = useRouter();
  const authState = useAppSelector((s) => s.auth);
  const { currentUser } = useAuthV2();

  const [openReason, setOpenReason] = useState(true);
  const [openOther, setOpenOther] = useState(true);
  const [showPaid, setShowPaid] = useState(false);

  const [hasResume, setHasResume] = useState<boolean | null>(null);

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
    if (!authState.isAuthenticated) router.push("/auth/login");
  }, [authState, router]);

  // check resume presence
  useEffect(() => {
    const run = async () => {
      try {
        const list = await apiClient.getResumes();
        setHasResume((list || []).length > 0);
      } catch {
        setHasResume(false);
      }
    };
    run();
  }, []);

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
      const url = `${buildApiUrl("/advice/messages/")}?subject=interview`;
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
      const res = await fetch(buildApiUrl("/advice/messages/"), {
        method: "POST",
        headers: getApiHeaders(token),
        body: JSON.stringify({ subject: "interview", content: text }),
      });
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
            <li className="hover:text-gray-700 cursor-pointer" onClick={() => router.push("/interview-advice/applying-reasons")}>面接に関するアドバイス</li>
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
                  onClick={() =>
                    router.push(
                      t === "転職理由(志望理由)"
                        ? "/interview-advice/applying-reasons"
                        : t === "職務経歴書に関する質問"
                        ? "/interview-advice/resume-questions"
                        : t === "志望理由"
                        ? "/interview-advice/applying-reasons"
                        : t === "面接対策"
                        ? "/interview-advice/prepare-interview"
                        : t === "その他、質問"
                        ? "/interview-advice/prepare-interview"
                        : "/interview-advice/prepare-interview"
                    )
                  }
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
          </main>
        </div>
      </div>

      {/* Paid plan modal */}
      <ClientPaidPlanModal showModal={showPaid} />
    </div>
  );
}

