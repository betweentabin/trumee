'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FaArrowLeft, FaSearch, FaPaperPlane } from 'react-icons/fa';
import { getAuthHeaders, getUserInfo } from '@/utils/auth';
import ResumePreview from '@/components/pure/resume/preview';
import { emptyResumePreview, fetchResumePreview, ResumePreviewData } from '@/utils/resume-preview';

interface Message {
  id: string;
  role: 'system' | 'seeker' | 'advisor';
  text: string;
  timestamp: string;
}

// Annotation metadata embedded into message text for Word-like comments
type AnchorMeta = {
  anchorId: string; // e.g. work_content-job1
  top: number; // relative to preview scroll container
  quote?: string; // selected text (for context)
  startOffset?: number;
  endOffset?: number;
  resumeId?: string;
};

type AnnMessage = Message & {
  isAnnotation?: boolean;
  anchor?: AnchorMeta;
  body?: string; // message text without meta
};

export default function ResumeReviewPage() {
  const router = useRouter();
  const [sectionTitle] = useState('職務内容について');
  const [messages, setMessages] = useState<AnnMessage[]>([]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumes, setResumes] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [overridePreview, setOverridePreview] = useState<ResumePreviewData | null>(null);
  // Preview wrapper ref (scroll container)
  const previewWrapRef = useRef<HTMLDivElement | null>(null);
  // Pending selection → comment composer state
  const [pendingAnchor, setPendingAnchor] = useState<AnchorMeta | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [composerPos, setComposerPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://trumee-production.up.railway.app' : 'http://localhost:8000');
  const params = useParams<{ userId?: string }>();
  const userIdFromRoute = (params as any)?.userId ? String((params as any).userId) : '';

  // Load preview target
  useEffect(() => {
    const load = async () => {
      // If URL includes /users/[userId]/..., try to load that user's resume for viewing
      if (userIdFromRoute) {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('drf_token_v2') || '') : '';
        // try admin → owner → public fallback
        const tryAdmin = await fetchResumePreview({ userId: userIdFromRoute, token, forAdmin: true }).catch(() => emptyResumePreview);
        if ((tryAdmin.jobhistoryList || []).length > 0 || tryAdmin.selfPR || tryAdmin.jobSummary) {
          setOverridePreview(tryAdmin);
          setSelected(null);
          setResumes([]);
          return;
        }
        const uid = getUserInfo()?.uid;
        const isOwner = uid && String(uid) === String(userIdFromRoute);
        const tryOwner = await fetchResumePreview({ userId: userIdFromRoute, token, forOwner: Boolean(isOwner) }).catch(() => emptyResumePreview);
        if ((tryOwner.jobhistoryList || []).length > 0 || tryOwner.selfPR || tryOwner.jobSummary) {
          setOverridePreview(tryOwner);
          setSelected(null);
          setResumes([]);
          return;
        }
        const tryPublic = await fetchResumePreview({ userId: userIdFromRoute, token }).catch(() => emptyResumePreview);
        setOverridePreview(tryPublic);
        setSelected(null);
        setResumes([]);
        return;
      }

      // Default: current user's resumes
      try {
        const res = await fetch(`${apiUrl}/api/v2/resumes/`, { headers: { ...getAuthHeaders() } });
        if (!res.ok) return;
        const data = await res.json();
        const list = data.results || data || [];
        setResumes(list);
        const active = list.find((r: any) => r.is_active) || list[0] || null;
        setSelected(active);
        setOverridePreview(null);
      } catch {}
    };
    load();
  }, [userIdFromRoute]);

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

  const parseAnnotation = (text: string): { meta?: AnchorMeta; rest: string } => {
    // Expect prefix: @@ANNOTATION:{...}@@ message
    const m = text.match(/^@@ANNOTATION:(\{[\s\S]*?\})@@\s*/);
    if (m) {
      try {
        const meta = JSON.parse(m[1]) as AnchorMeta;
        return { meta, rest: text.slice(m[0].length) };
      } catch (_) {
        // fallthrough
      }
    }
    return { rest: text };
  };

  const fetchMessages = async () => {
    try {
      setError(null);
      const qs = new URLSearchParams();
      qs.set('subject', 'resume_advice');
      if (userIdFromRoute) qs.set('user_id', userIdFromRoute);
      const res = await fetch(`${apiUrl}/api/v2/advice/messages/?${qs.toString()}`, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      const uid = getUserInfo()?.uid;
      // Map to local structure
      const mapped: AnnMessage[] = data.map((m: any) => {
        const role = uid && String(m.sender) === String(uid) ? 'seeker' : 'advisor';
        const raw = m.content as string;
        const { meta, rest } = parseAnnotation(raw);
        return {
          id: String(m.id),
          role,
          text: raw,
          body: rest,
          isAnnotation: Boolean(meta),
          anchor: meta,
          timestamp: new Date(m.created_at).toLocaleString('ja-JP'),
        } as AnnMessage;
      });
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
      const body: any = { content: text, subject: 'resume_advice' };
      if (userIdFromRoute) body.user_id = userIdFromRoute;
      const res = await fetch(`${apiUrl}/api/v2/advice/messages/`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
        },
        body: JSON.stringify(body),
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

  // Send annotation via API (create annotation, then message linking it)
  const sendAnnotation = async () => {
    if (!pendingAnchor) return;
    const msg = composerText.trim();
    if (!msg) return;
    setLoading(true);
    try {
      // 1) Create annotation first
      let annotationId: string | null = null;
      if (pendingAnchor.resumeId) {
        const annRes = await fetch(`${apiUrl}/api/v2/advice/annotations/`, {
          method: 'POST',
          headers: { ...getAuthHeaders() },
          body: JSON.stringify({
            resume: pendingAnchor.resumeId,
            subject: 'resume_advice',
            anchor_id: pendingAnchor.anchorId,
            start_offset: pendingAnchor.startOffset ?? 0,
            end_offset: pendingAnchor.endOffset ?? 0,
            quote: pendingAnchor.quote || '',
          }),
        });
        if (annRes.ok) { const ann = await annRes.json(); annotationId = String(ann.id); }
      }

      // 2) Post message that links to annotation
      const body: any = { content: msg, subject: 'resume_advice' };
      if (userIdFromRoute) body.user_id = userIdFromRoute;
      if (annotationId) body.annotation_id = annotationId;
      const res = await fetch(`${apiUrl}/api/v2/advice/messages/`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('failed');
      setComposerText('');
      setComposerOpen(false);
      setPendingAnchor(null);
      await fetchMessages();
    } catch (e) {
      setError('コメントの送信に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // Selection handler on preview: capture selection inside an annotatable block
  const handlePreviewMouseUp = () => {
    const container = previewWrapRef.current;
    if (!container) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setPendingAnchor(null);
      setComposerOpen(false);
      return;
    }
    if (sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    // Find nearest ancestor with data-annot-id
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
    // compute offsets within anchor element text
    let startOffset = 0; let endOffset = 0;
    try {
      const pre = document.createRange();
      pre.setStart(anchorEl, 0);
      pre.setEnd(range.startContainer, range.startOffset);
      startOffset = pre.toString().length;
      endOffset = startOffset + sel.toString().length;
    } catch {}

    const meta: AnchorMeta = {
      anchorId: anchorEl.dataset.annotId!,
      top: Math.max(0, top),
      quote: sel.toString().slice(0, 200),
      startOffset,
      endOffset,
      resumeId: (overridePreview?.resumeId || (selected?.id ? String(selected.id) : undefined)) as any,
    };
    setPendingAnchor(meta);
    setComposerPos({ top: Math.max(0, top), left: Math.min(left + 8, container.clientWidth - 40) });
    setComposerOpen(true);
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
            {(overridePreview || selected) ? (
              <div
                className="mx-auto max-w-3xl relative pr-[260px]"
                ref={previewWrapRef}
                onMouseUp={handlePreviewMouseUp}
              >
                {overridePreview ? (
                  <ResumePreview
                    userName={overridePreview.userName}
                    jobhistoryList={overridePreview.jobhistoryList}
                    formValues={overridePreview.formValues}
                    jobSummary={overridePreview.jobSummary}
                    selfPR={overridePreview.selfPR}
                    skills={overridePreview.skills}
                    education={overridePreview.education}
                  />
                ) : (
                  (() => {
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
                  })()
                )}

                {/* Word-like comment overlays */}
                <div className="absolute inset-0 pointer-events-none">
                  {messages.filter(m => m.isAnnotation && m.anchor).map((m) => (
                    <div
                      key={m.id}
                      className="absolute right-[-240px] w-[220px] pointer-events-auto"
                      style={{ top: (m.anchor!.top || 0) - 8 }}
                    >
                      <div className="border border-[#E5A6A6] bg-white rounded-md shadow-sm">
                        <div className="flex items-center gap-2 px-3 py-2 border-b text-sm">
                          <div className="h-6 w-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs">
                            {m.role === 'advisor' ? 'A' : 'S'}
                          </div>
                          <div className="text-secondary-800 truncate">{m.role === 'advisor' ? 'advisor' : 'you'}</div>
                          <div className="ml-auto text-xs text-secondary-500">{m.timestamp}</div>
                        </div>
                        {m.anchor?.quote && (
                          <div className="px-3 pt-2 text-xs text-secondary-600">
                            <span className="bg-yellow-100 px-1 py-[2px] rounded">{m.anchor.quote}</span>
                          </div>
                        )}
                        <div className="px-3 py-2 text-sm text-secondary-800 whitespace-pre-wrap">{m.body || m.text}</div>
                        <div className="px-3 pb-2 text-xs text-primary-700 flex gap-3">
                          <button className="hover:underline">返信</button>
                          <button className="hover:underline">解決</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Inline composer for new comment */}
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
                      <div className="text-xs text-secondary-600 mb-1">
                        コメント対象: <span className="font-mono">{pendingAnchor.anchorId}</span>
                      </div>
                      {pendingAnchor.quote && (
                        <div className="text-xs text-secondary-700 mb-2">
                          <span className="bg-yellow-100 px-1 py-[2px] rounded">{pendingAnchor.quote}</span>
                        </div>
                      )}
                      <textarea
                        value={composerText}
                        onChange={(e) => setComposerText(e.target.value)}
                        placeholder="コメント内容を入力"
                        className="w-full h-20 border rounded px-2 py-1 text-sm"
                      />
                      <div className="mt-2 flex justify-end gap-2">
                        <button
                          className="text-sm px-2 py-1 border rounded hover:bg-secondary-50"
                          onClick={() => { setComposerOpen(false); setPendingAnchor(null); setComposerText(''); }}
                        >
                          キャンセル
                        </button>
                        <button
                          className="text-sm px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-500"
                          onClick={sendAnnotation}
                          disabled={loading}
                        >
                          コメント追加
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
                    {m.body || m.text}
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
