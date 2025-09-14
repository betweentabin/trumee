"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildApiUrl, getApiHeaders } from "@/config/api";

type Msg = { id: string; sender: string; content: string; created_at: string };

export default function InterviewAdvicePage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const token = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("drf_token_v2") || "" : ""), []);
  const me = useMemo(() => {
    if (typeof window === "undefined") return null as any;
    try { return JSON.parse(localStorage.getItem("current_user_v2") || "null"); } catch { return null as any; }
  }, []);

  const load = useCallback(async () => {
    try {
      const url = `${buildApiUrl("/advice/messages/")}?subject=interview`;
      const res = await fetch(url, { headers: getApiHeaders(token) });
      if (!res.ok) return;
      const list = await res.json();
      const mapped = (list || []).map((m: any) => ({ id: String(m.id), sender: String(m.sender), content: m.content, created_at: m.created_at }));
      setMessages(mapped);
      // 既読化
      try { await fetch(buildApiUrl("/advice/mark_read/"), { method: "POST", headers: getApiHeaders(token), body: JSON.stringify({ subject: "interview" }) }); } catch {}
    } catch { /* noop */ }
  }, [token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    try {
      setSending(true);
      const res = await fetch(buildApiUrl("/advice/messages/"), {
        method: "POST",
        headers: getApiHeaders(token),
        body: JSON.stringify({ subject: "interview", content: input.trim() }),
      });
      if (!res.ok) return;
      setInput("");
      await load();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow border p-6">
        <h1 className="text-xl font-semibold mb-4">面接に関するアドバイス</h1>
        <div className="h-[60vh] overflow-y-auto border rounded-md p-3 space-y-2 bg-gray-50">
          {messages.length === 0 && <div className="text-gray-400 text-sm text-center py-8">メッセージはありません。</div>}
          {messages.map((m) => {
            const isMine = me && String(m.sender) === String(me.id);
            return (
              <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-md p-3 text-sm ${isMine ? "bg-[#3A2F1C] text-white" : "bg-gray-200 text-gray-900"}`}>
                  <div>{m.content}</div>
                  <div className="text-[11px] opacity-70 mt-1">{new Date(m.created_at).toLocaleString()}</div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
        <div className="mt-4 flex gap-2">
          <input className="flex-1 rounded-md border px-3 py-2" placeholder="入力してください。" value={input} onChange={(e) => setInput(e.target.value)} />
          <button className="rounded-md bg-gray-800 text-white px-4 py-2 disabled:opacity-50" onClick={send} disabled={sending}>{sending ? "送信中…" : "送信"}</button>
        </div>
      </div>
    </div>
  );
}
