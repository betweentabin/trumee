"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { buildApiUrl, getApiHeaders } from "@/config/api";
import ResumePreview from "@/components/pure/resume/preview";
import { useForm } from "react-hook-form";

type Msg = { id: string; sender: string; content: string; created_at: string };

type PreviewFormValues = Record<string, any>;

export default function ResumeAdvicePage() {
  // Chat states
  const [messages, setMessages] = useState<Msg[]>([]);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  // Resume preview states
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [jobhistoryList, setJobhistoryList] = useState<string[]>([]);
  const [formValues, setFormValues] = useState<PreviewFormValues>({});

  const params = useParams<{ userId: string }>();

  const token = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("drf_token_v2") || "" : ""), []);
  const me = useMemo(() => {
    if (typeof window === "undefined") return null as any;
    try { return JSON.parse(localStorage.getItem("current_user_v2") || "null"); } catch { return null as any; }
  }, []);

  // Helpers
  const fmtYM = (d?: string | null) => {
    if (!d) return "";
    try {
      const dt = new Date(d);
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, "0");
      return `${y}/${m}`;
    } catch {
      return String(d);
    }
  };

  // Load chat messages
  const loadMessages = useCallback(async () => {
    try {
      const userId = params?.userId ? String(params.userId) : "";
      const url = `${buildApiUrl("/advice/messages/")}?subject=resume_advice${userId ? `&user_id=${encodeURIComponent(userId)}` : ""}`;
      const res = await fetch(url, { headers: getApiHeaders(token) });
      if (!res.ok) return;
      const list = await res.json();
      const mapped = (list || []).map((m: any) => ({ id: String(m.id), sender: String(m.sender), content: m.content, created_at: m.created_at }));
      setMessages(mapped);
      // mark as read
      try { await fetch(buildApiUrl("/advice/mark_read/"), { method: "POST", headers: getApiHeaders(token), body: JSON.stringify({ subject: "resume_advice" }) }); } catch {}
    } catch {
      /* noop */
    }
  }, [token, params?.userId]);

  // Load resume preview (public)
  const loadResume = useCallback(async () => {
    const userId = params?.userId ? String(params.userId) : "";
    if (!userId) return;
    try {
      // User name
      try {
        const r = await fetch(buildApiUrl(`/users/${encodeURIComponent(userId)}/`), { headers: getApiHeaders(token) });
        if (r.ok) {
          const u = await r.json();
          if (u?.full_name) setUserName(u.full_name);
        }
      } catch {}

      // Resumes (public)
      const res = await fetch(buildApiUrl(`/users/${encodeURIComponent(userId)}/resumes/`), { headers: getApiHeaders(token) });
      if (!res.ok) return;
      const resumes = await res.json();
      const target = Array.isArray(resumes) ? (resumes.find((x: any) => x.is_active) || resumes[0]) : null;
      const exps: any[] = target?.experiences || [];

      const keys = exps.map((_: any, idx: number) => `exp_${idx}`);
      const fv: PreviewFormValues = {};
      exps.forEach((e: any, idx: number) => {
        const key = keys[idx];
        fv[key] = {
          since: fmtYM(e.period_from),
          to: fmtYM(e.period_to),
          company: e.company || "",
          business: e.business || "",
          capital: e.capital || "",
          people: e.team_size || e.people || "",
          duty: e.position || e.duty || "",
          work_content: e.tasks || e.work_content || "",
        };
      });
      setJobhistoryList(keys);
      setFormValues(fv);
    } catch {
      setJobhistoryList([]);
      setFormValues({});
    }
  }, [params?.userId, token]);

  useEffect(() => { loadMessages(); }, [loadMessages]);
  useEffect(() => { loadResume(); }, [loadResume]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Form for sending message
  const { handleSubmit, reset, register } = useForm<{ message: string }>({ defaultValues: { message: "" } });

  const onSend = async (data: { message: string }) => {
    const text = (data?.message || "").trim();
    if (!text) return;
    try {
      setSending(true);
      const userId = params?.userId ? String(params.userId) : "";
      const res = await fetch(buildApiUrl("/advice/messages/"), {
        method: "POST",
        headers: getApiHeaders(token),
        body: JSON.stringify({ subject: "resume_advice", content: text, ...(userId ? { user_id: userId } : {}) }),
      });
      if (!res.ok) return;
      reset();
      await loadMessages();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="border border-black rounded-lg overflow-hidden">
        {/* Two column layout copied from admin */}
        <div className="flex flex-col md:flex-row h-full w-full">
          {/* Left: Resume preview */}
          <div className="flex-1 flex flex-col items-start justify-start bg-white p-4 md:p-8 border-b md:border-b-0 md:border-r border-black min-h-[500px] md:min-h-[900px] overflow-y-auto">
            <ResumePreview
              userName={userName}
              jobhistoryList={jobhistoryList}
              formValues={formValues}
              className="w-full max-w-3xl mx-auto mb-8"
            />
          </div>

          {/* Right: Chat panel */}
          <div className="w-full md:w-[400px] md:min-w-[400px] md:max-w-[400px] flex flex-col h-[400px] md:h-[900px] border-t md:border-t-0 md:border-l border-black bg-[#F5F5F5]">
            {/* Header */}
            <div className="bg-[#4B3A2F] text-white px-4 md:px-6 py-3 md:py-4 text-base md:text-lg font-bold flex items-center justify-between border-b border-black">
              <span>職務内容について</span>
              <span className="text-lg md:text-xl">🔍</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 md:px-4 py-3 md:py-4 flex flex-col gap-3 bg-white border-b border-black">
              {messages.length === 0 && (
                <div className="text-gray-400 text-sm text-center py-8">追加内容が記載されます。</div>
              )}
              {messages.map((m) => {
                const isMine = me && String(m.sender) === String(me.id);
                return (
                  <div
                    key={m.id}
                    className={`rounded-lg px-3 md:px-4 py-2 md:py-3 text-sm md:text-base max-w-[85%] break-words shadow-sm ${
                      isMine ? "bg-[#4B3A2F] text-white self-end" : "bg-[#F5F5F5] text-gray-900 self-start border border-gray-200"
                    }`}
                    style={{ alignSelf: isMine ? "flex-end" : "flex-start" }}
                  >
                    <div>{m.content}</div>
                    <div className="text-[11px] opacity-70 mt-1">{new Date(m.created_at).toLocaleString()}</div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            {/* Input header */}
            <div className="bg-[#4B3A2F] text-white px-4 md:px-6 py-2 md:py-3 text-base md:text-lg font-bold border-b border-black">
              メッセージ入力
            </div>

            {/* Input */}
            <div className="px-3 md:px-4 py-2 md:py-3 bg-white flex flex-col gap-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSubmit(onSend)();
                }}
                className="flex flex-col gap-2"
              >
                <textarea
                  rows={3}
                  className="resize-none min-h-[80px] max-h-[150px] w-full px-3 py-2 text-base rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-default"
                  placeholder="入力してください。"
                  {...register("message")}
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="w-full md:w-auto px-6 py-2 rounded-md bg-[#FF733E] text-white font-semibold hover:bg-orange-600 disabled:opacity-50"
                    disabled={sending}
                  >
                    送信
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
