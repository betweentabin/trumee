"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { buildApiUrl, getApiHeaders } from "@/config/api";
import ResumePreview from "@/components/pure/resume/preview";
import { useForm } from "react-hook-form";
import { emptyResumePreview, fetchResumePreview, ResumePreviewData } from "@/utils/resume-preview";

type AnchorMeta = { anchorId: string; top: number; quote?: string };
type Msg = { id: string; sender: string; content: string; created_at: string; body?: string; isAnnotation?: boolean; anchor?: AnchorMeta };

export default function ResumeAdvicePage() {
  // Chat states
  const [messages, setMessages] = useState<Msg[]>([]);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  // Resume preview states
  const [resumePreview, setResumePreview] = useState<ResumePreviewData>(emptyResumePreview);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const previewWrapRef = useRef<HTMLDivElement | null>(null);
  const [markTops, setMarkTops] = useState<Record<string, number>>({});

  const params = useParams<{ userId: string }>();

  const token = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("drf_token_v2") || "" : ""), []);
  const me = useMemo(() => {
    if (typeof window === "undefined") return null as any;
    try { return JSON.parse(localStorage.getItem("current_user_v2") || "null"); } catch { return null as any; }
  }, []);

  // Helpers
  // Load chat messages
  const loadMessages = useCallback(async () => {
    try {
      const userId = params?.userId ? String(params.userId) : "";
      const url = `${buildApiUrl("/advice/messages/")}?subject=resume_advice${userId ? `&user_id=${encodeURIComponent(userId)}` : ""}`;
      const res = await fetch(url, { headers: getApiHeaders(token) });
      if (!res.ok) return;
      const list = await res.json();
      const parseAnnotation = (text: string): { meta?: AnchorMeta; rest: string } => {
        const m = (text || '').match(/^@@ANNOTATION:(\{[\s\S]*?\})@@\s*/);
        if (m) { try { return { meta: JSON.parse(m[1]) as AnchorMeta, rest: text.slice(m[0].length) }; } catch {} }
        return { rest: text };
      };
      const mapped = (list || []).map((m: any) => {
        const raw = String(m.content || '');
        const { meta, rest } = parseAnnotation(raw);
        return { id: String(m.id), sender: String(m.sender), content: raw, body: rest, isAnnotation: Boolean(meta) || Boolean(m.annotation), anchor: meta, created_at: m.created_at, ...(m.annotation ? { annotationId: String(m.annotation) } : {}) } as Msg;
      });
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
    const isOwner = me && String(me.id) === userId;
    try {
      const data = await fetchResumePreview({ userId, token, forOwner: Boolean(isOwner) });
      const fallbackName = !data.userName && isOwner
        ? me?.full_name || me?.fullName || me?.username || me?.email
        : data.userName;
      setResumePreview({ ...data, userName: fallbackName });
      try {
        if (data?.resumeId) {
          const a = await fetch(buildApiUrl(`/advice/annotations/?resume_id=${encodeURIComponent(String(data.resumeId))}&subject=resume_advice`), { headers: getApiHeaders(token) });
          if (a.ok) setAnnotations(await a.json());
        }
      } catch {}
    } catch {
      setResumePreview(emptyResumePreview);
    }
  }, [params?.userId, token, me]);

  useEffect(() => { loadMessages(); }, [loadMessages]);
  useEffect(() => { loadResume(); }, [loadResume]);
  useEffect(() => {
    const container = previewWrapRef.current; if (!container) return;
    const map: Record<string, number> = {};
    const marks = container.querySelectorAll('[data-annot-ref]');
    marks.forEach((el) => {
      const idAttr = el.getAttribute('data-annot-ref') || '';
      if (!idAttr.startsWith('ann-')) return;
      const id = idAttr.replace('ann-', '');
      const rect = (el as HTMLElement).getBoundingClientRect();
      const contRect = container.getBoundingClientRect();
      const top = rect.top - contRect.top + container.scrollTop;
      map[id] = Math.max(0, top);
    });
    setMarkTops(map);
  }, [annotations, resumePreview]);
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

  // Inline annotation state/handlers
  const previewWrapRef = useRef<HTMLDivElement | null>(null);
  const [pendingAnchor, setPendingAnchor] = useState<AnchorMeta | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [composerPos, setComposerPos] = useState<{ top: number; left: number } | null>(null);

  const sendAnnotation = async () => {
    if (!pendingAnchor) return;
    const msg = composerText.trim();
    if (!msg) return;
    try {
      setSending(true);
      const userId = params?.userId ? String(params.userId) : "";
      // 1) create annotation then 2) link message
      let annotationId: string | null = null;
      if (pendingAnchor.resumeId) {
        const annRes = await fetch(buildApiUrl("/advice/annotations/"), {
          method: "POST",
          headers: getApiHeaders(token),
          body: JSON.stringify({
            resume: pendingAnchor.resumeId,
            subject: "resume_advice",
            anchor_id: pendingAnchor.anchorId,
            start_offset: pendingAnchor.startOffset ?? 0,
            end_offset: pendingAnchor.endOffset ?? 0,
            quote: pendingAnchor.quote || "",
          }),
        });
        if (annRes.ok) { const ann = await annRes.json(); annotationId = String(ann.id); }
      }
      const res = await fetch(buildApiUrl("/advice/messages/"), {
        method: "POST",
        headers: getApiHeaders(token),
        body: JSON.stringify({ subject: "resume_advice", content: msg, ...(userId ? { user_id: userId } : {}), annotation_id: annotationId || undefined }),
      });
      if (!res.ok) return;
      setComposerOpen(false);
      setComposerText('');
      setPendingAnchor(null);
      await loadMessages();
    } finally {
      setSending(false);
    }
  };

  const handlePreviewMouseUp = () => {
    const container = previewWrapRef.current;
    if (!container) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      setComposerOpen(false);
      setPendingAnchor(null);
      return;
    }
    const range = sel.getRangeAt(0);
    let node: Node | null = range.commonAncestorContainer;
    let anchorEl: HTMLElement | null = null;
    while (node) {
      if ((node as HTMLElement).nodeType === 1) {
        const el = node as HTMLElement;
        if (el.dataset && el.dataset.annotId) { anchorEl = el; break; }
      }
      node = (node as Node).parentNode;
    }
    if (!anchorEl) return;
    const rect = range.getBoundingClientRect();
    const contRect = container.getBoundingClientRect();
    const top = rect.top - contRect.top + container.scrollTop;
    const left = rect.right - contRect.left + container.scrollLeft;
    let startOffset = 0; let endOffset = 0;
    try {
      const pre = document.createRange();
      pre.setStart(anchorEl, 0);
      pre.setEnd(range.startContainer, range.startOffset);
      startOffset = pre.toString().length;
      endOffset = startOffset + sel.toString().length;
    } catch {}
    const meta: AnchorMeta = { anchorId: anchorEl.dataset.annotId!, top: Math.max(0, top), quote: sel.toString().slice(0, 200), startOffset, endOffset, resumeId: (resumePreview as any)?.resumeId };
    setPendingAnchor(meta);
    setComposerPos({ top: Math.max(0, top), left: Math.min(left + 8, container.clientWidth - 40) });
    setComposerOpen(true);
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="border border-black rounded-lg overflow-hidden">
        {/* Two column layout copied from admin */}
        <div className="flex flex-col md:flex-row h-full w-full">
          {/* Left: Resume preview */}
          <div className="flex-1 flex flex-col items-start justify-start bg-white p-4 md:p-8 border-b md:border-b-0 md:border-r border-black min-h-[500px] md:min-h-[900px] overflow-y-auto">
            <div className="relative pr-[260px] w-full max-w-3xl mx-auto" ref={previewWrapRef} onMouseUp={handlePreviewMouseUp}>
              <ResumePreview
                userName={resumePreview.userName}
                jobhistoryList={resumePreview.jobhistoryList}
                formValues={resumePreview.formValues}
                jobSummary={resumePreview.jobSummary}
                selfPR={resumePreview.selfPR}
                skills={resumePreview.skills}
                education={resumePreview.education}
                annotations={annotations}
                className="w-full mb-8"
              />
              {/* overlays */}
              <div className="absolute inset-0 pointer-events-none">
                {messages.filter(m => m.isAnnotation).map((m) => {
                  const topGuess = (m as any).annotationId && markTops[(m as any).annotationId] !== undefined ? markTops[(m as any).annotationId] : (m.anchor?.top || 0);
                  return (
                  <div key={m.id} className="absolute right-[-240px] w-[220px] pointer-events-auto" style={{ top: Math.max(0, topGuess - 8) }}>
                    <div className="border border-[#E5A6A6] bg-white rounded-md shadow-sm">
                      <div className="flex items-center gap-2 px-3 py-2 border-b text-sm">
                        <div className="h-6 w-6 rounded-full bg-secondary-800 text-white flex items-center justify-center text-xs">S</div>
                        <div className="text-secondary-800 truncate">you</div>
                        <div className="ml-auto text-xs text-secondary-500">{new Date(m.created_at).toLocaleString()}</div>
                      </div>
                      {m.anchor?.quote && (
                        <div className="px-3 pt-2 text-xs text-secondary-600"><span className="bg-yellow-100 px-1 py-[2px] rounded">{m.anchor.quote}</span></div>
                      )}
                      <div className="px-3 py-2 text-sm text-secondary-800 whitespace-pre-wrap">{m.body || m.content}</div>
                      <div className="px-3 pb-2 text-xs text-primary-700 flex gap-3">
                        <button className="hover:underline">返信</button>
                        <button className="hover:underline">解決</button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>

              {/* composer */}
              {composerOpen && pendingAnchor && composerPos && (
                <div
                  className="absolute z-10 w-[260px]"
                  style={{ top: composerPos.top, left: Math.max(composerPos.left, 16) }}
                  data-annot-ui="composer"
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="border border-primary-400 bg-white rounded-md shadow-lg p-2">
                    <div className="text-xs text-secondary-600 mb-1">コメント対象: <span className="font-mono">{pendingAnchor.anchorId}</span></div>
                    {pendingAnchor.quote && (<div className="text-xs text-secondary-700 mb-2"><span className="bg-yellow-100 px-1 py-[2px] rounded">{pendingAnchor.quote}</span></div>)}
                    <textarea className="w-full h-20 border rounded px-2 py-1 text-sm" value={composerText} onChange={(e) => setComposerText(e.target.value)} placeholder="コメント内容を入力" />
                    <div className="mt-2 flex justify-end gap-2">
                      <button className="text-sm px-2 py-1 border rounded hover:bg-secondary-50" onClick={() => { setComposerOpen(false); setPendingAnchor(null); setComposerText(''); }}>キャンセル</button>
                      <button className="text-sm px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-500" onClick={sendAnnotation} disabled={sending}>コメント追加</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
                    <div>{m.body || m.content}</div>
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
