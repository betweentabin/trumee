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
  annotationId?: string;
  parentId?: string | null;
  senderId?: string | number;
};

export default function ResumeReviewPage() {
  const router = useRouter();
  const [sectionTitle] = useState('職務内容について');
  // All messages for "全て" view
  const [messagesAll, setMessagesAll] = useState<AnnMessage[]>([]);
  // Per-thread on-demand fetched messages
  const [threadMessages, setThreadMessages] = useState<Record<string, AnnMessage[]>>({});
  const [input, setInput] = useState('');
  const [replyInput, setReplyInput] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumes, setResumes] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [overridePreview, setOverridePreview] = useState<ResumePreviewData | null>(null);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null); // annotationId or null for all
  const [showUnresolvedOnly, setShowUnresolvedOnly] = useState(false);
  const [threadSearch, setThreadSearch] = useState('');
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [didAutoSelectThread, setDidAutoSelectThread] = useState(false);
  // Edit mode (Phase 2 skeleton)
  const [mode, setMode] = useState<'comments' | 'edit'>('comments');
  const [editSelfPr, setEditSelfPr] = useState('');
  const [editWorkDesc, setEditWorkDesc] = useState<string[]>([]); // mirrors extra_data.workExperiences[].description
  const [editJobSummary, setEditJobSummary] = useState('');
  const [initialBaselineEnsured, setInitialBaselineEnsured] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // Preview wrapper ref (scroll container)
  const previewWrapRef = useRef<HTMLDivElement | null>(null);
  // Pending selection → comment composer state
  const [pendingAnchor, setPendingAnchor] = useState<AnchorMeta | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [composerPos, setComposerPos] = useState<{ top: number; left: number } | null>(null);
  const [markTops, setMarkTops] = useState<Record<string, number>>({});
  const recalcTimerRef = useRef<number | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesAll.length]);
  // When thread messages update or thread selection changes, keep view scrolled
  useEffect(() => {
    if (!activeThread) return;
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread, threadMessages]);

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
          // load annotations
          try {
            const rid = String(tryAdmin.resumeId || '');
            const a = await fetch(`${apiUrl}/api/v2/advice/annotations/?resume_id=${encodeURIComponent(rid)}&subject=resume_advice`, { headers: { ...getAuthHeaders() } });
            if (a.ok) setAnnotations(await a.json());
            const t = await fetch(`${apiUrl}/api/v2/advice/threads/?user_id=${encodeURIComponent(String(userIdFromRoute))}&subject=resume_advice&mode=comment`, { headers: { ...getAuthHeaders() } });
            if (t.ok) setThreads(await t.json());
          } catch {}
          return;
        }
        const uid = getUserInfo()?.uid;
        const isOwner = uid && String(uid) === String(userIdFromRoute);
        const tryOwner = await fetchResumePreview({ userId: userIdFromRoute, token, forOwner: Boolean(isOwner) }).catch(() => emptyResumePreview);
        if ((tryOwner.jobhistoryList || []).length > 0 || tryOwner.selfPR || tryOwner.jobSummary) {
          setOverridePreview(tryOwner);
          setSelected(null);
          setResumes([]);
          try {
            const rid = String(tryOwner.resumeId || '');
            const a = await fetch(`${apiUrl}/api/v2/advice/annotations/?resume_id=${encodeURIComponent(rid)}&subject=resume_advice`, { headers: { ...getAuthHeaders() } }); if (a.ok) setAnnotations(await a.json());
            const t = await fetch(`${apiUrl}/api/v2/advice/threads/?subject=resume_advice&mode=comment`, { headers: { ...getAuthHeaders() } });
            if (t.ok) setThreads(await t.json());
          } catch {}
          return;
        }
        const tryPublic = await fetchResumePreview({ userId: userIdFromRoute, token }).catch(() => emptyResumePreview);
        setOverridePreview(tryPublic);
        setSelected(null);
        setResumes([]);
        try {
          const rid = String(tryPublic.resumeId || '');
          const a = await fetch(`${apiUrl}/api/v2/advice/annotations/?resume_id=${encodeURIComponent(rid)}&subject=resume_advice`, { headers: { ...getAuthHeaders() } }); if (a.ok) setAnnotations(await a.json());
          const t = await fetch(`${apiUrl}/api/v2/advice/threads/?subject=resume_advice&mode=comment`, { headers: { ...getAuthHeaders() } });
          if (t.ok) setThreads(await t.json());
        } catch {}
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
        // load annotations for active resume
        try {
          if (active?.id) {
            const rid = String(active.id);
            const a = await fetch(`${apiUrl}/api/v2/advice/annotations/?resume_id=${encodeURIComponent(rid)}&subject=resume_advice`, { headers: { ...getAuthHeaders() } }); if (a.ok) setAnnotations(await a.json());
            const t = await fetch(`${apiUrl}/api/v2/advice/threads/?subject=resume_advice&mode=comment`, { headers: { ...getAuthHeaders() } });
            if (t.ok) setThreads(await t.json());
          }
        } catch {}
        setOverridePreview(null);
      } catch {}
    };
    load();
  }, [userIdFromRoute]);

  // Recalculate mark positions when annotations or preview change
  useEffect(() => {
    const recalc = () => {
      const container = previewWrapRef.current;
      if (!container) return;
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
    };
    const schedule = () => {
      if (recalcTimerRef.current) cancelAnimationFrame(recalcTimerRef.current);
      recalcTimerRef.current = requestAnimationFrame(recalc);
    };
    // initial
    schedule();
    const onResize = () => schedule();
    const container = previewWrapRef.current;
    const onScroll = () => schedule();
    window.addEventListener('resize', onResize);
    container?.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('resize', onResize);
      container?.removeEventListener('scroll', onScroll as any);
      if (recalcTimerRef.current) cancelAnimationFrame(recalcTimerRef.current);
    };
  }, [annotations, overridePreview, selected]);

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

  const isOwner = useMemo(() => {
    const uid = getUserInfo()?.uid;
    if (selected?.user) return String(selected.user) === String(uid);
    // overridePreview path: treat as not owner by default
    return false;
  }, [selected]);

  const currentWorkExperiences = useMemo(() => {
    const extra = selected?.extra_data || {};
    return Array.isArray((extra as any).workExperiences) ? ((extra as any).workExperiences as any[]) : [];
  }, [selected]);

  // Ensure baseline snapshot exists (owner only)
  useEffect(() => {
    const ensureBaseline = async () => {
      if (!selected?.id || !isOwner || initialBaselineEnsured) return;
      const extra = selected?.extra_data || {};
      const hasBaseline = !!(extra && (extra as any).baseline);
      if (hasBaseline) { setInitialBaselineEnsured(true); return; }
      const baseline = {
        self_pr: selected?.self_pr || '',
        workExperiences: currentWorkExperiences || [],
        jobSummary: (extra as any)?.jobSummary || '',
      };
      try {
        const res = await fetch(`${apiUrl}/api/v2/resumes/${encodeURIComponent(String(selected.id))}/`, {
          method: 'PATCH',
          headers: { ...getAuthHeaders() },
          body: JSON.stringify({ extra_data: { ...(extra || {}), baseline } }),
        });
        if (res.ok) {
          const updated = await res.json();
          setSelected((prev: any) => ({ ...(prev || {}), extra_data: updated.extra_data }));
        }
      } catch {}
      setInitialBaselineEnsured(true);
    };
    ensureBaseline();
  }, [selected, isOwner, initialBaselineEnsured]);

  // Prepare edit buffers when entering edit mode
  useEffect(() => {
    if (mode !== 'edit' || !selected) return;
    const extra = selected.extra_data || {};
    const baseline = (extra as any).baseline || { self_pr: selected.self_pr || '', workExperiences: currentWorkExperiences, jobSummary: (extra as any)?.jobSummary || '' };
    setEditSelfPr(selected.self_pr || '');
    const desc = (Array.isArray(currentWorkExperiences) ? currentWorkExperiences : []).map((w: any) => String(w?.description || ''));
    setEditWorkDesc(desc);
    setEditJobSummary(String((extra as any)?.jobSummary || ''));
    setFormError(null);
  }, [mode, selected, currentWorkExperiences]);

  // Lightweight validation for edit fields
  const limits = { selfPr: 4000, jobSummary: 1200, workDesc: 4000 } as const;
  const validateEdit = (): string | null => {
    if (editSelfPr.length > limits.selfPr) return `自己PRは${limits.selfPr}文字以内にしてください`;
    if (editJobSummary.length > limits.jobSummary) return `職務要約は${limits.jobSummary}文字以内にしてください`;
    for (let i = 0; i < editWorkDesc.length; i++) {
      if ((editWorkDesc[i] || '').length > limits.workDesc) return `職務内容(${i + 1})は${limits.workDesc}文字以内にしてください`;
    }
    return null;
  };

  // Build preview data for left pane when in edit mode: use baseline snapshot
  const leftPreviewData = useMemo(() => {
    if (mode !== 'edit' || !selected) return null;
    const extra = selected.extra_data || {};
    const baseline = (extra as any).baseline;
    if (!baseline) return null;
    // Map baseline to ResumePreview props
    const jobs = Array.isArray(baseline.workExperiences) ? baseline.workExperiences : [];
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
    return {
      userName: (extra as any).fullName || '',
      jobhistoryList,
      formValues,
      jobSummary: typeof (baseline as any)?.jobSummary === 'string' ? (baseline as any).jobSummary : ((extra as any)?.jobSummary || ''),
      selfPR: baseline.self_pr || '',
      skills: Array.isArray((extra as any)?.skills) ? (extra as any).skills : [],
      education: Array.isArray((extra as any)?.education) ? (extra as any).education : [],
    } as ResumePreviewData;
  }, [mode, selected]);

  const saveDraft = async () => {
    if (!selected?.id || !isOwner) return;
    const v = validateEdit();
    if (v) { setFormError(v); return; }
    setLoading(true);
    try {
      const extra = selected.extra_data || {};
      const workExperiences = (Array.isArray(currentWorkExperiences) ? currentWorkExperiences : []).map((w: any, i: number) => ({ ...w, description: editWorkDesc[i] ?? w.description }));
      const payload: any = {
        self_pr: editSelfPr,
        extra_data: { ...(extra || {}), workExperiences, jobSummary: editJobSummary },
      };
      const res = await fetch(`${apiUrl}/api/v2/resumes/${encodeURIComponent(String(selected.id))}/`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelected((prev: any) => ({ ...(prev || {}), ...updated }));
        setFormError(null);
        // refresh left preview marks
        try {
          const rid = String(updated.id);
          const a = await fetch(`${apiUrl}/api/v2/advice/annotations/?resume_id=${encodeURIComponent(rid)}&subject=resume_advice`, { headers: { ...getAuthHeaders() } });
          if (a.ok) setAnnotations(await a.json());
        } catch {}
      }
    } catch {
      setError('保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const cancelToBaseline = async () => {
    if (!selected?.id || !isOwner) return;
    const extra = selected.extra_data || {};
    const baseline = (extra as any).baseline;
    if (!baseline) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/v2/resumes/${encodeURIComponent(String(selected.id))}/`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders() },
        body: JSON.stringify({
          self_pr: baseline.self_pr || '',
          extra_data: { ...(extra || {}), workExperiences: baseline.workExperiences || [], jobSummary: baseline.jobSummary || '' },
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelected((prev: any) => ({ ...(prev || {}), ...updated }));
        setEditSelfPr(baseline.self_pr || '');
        const desc = (Array.isArray(baseline.workExperiences) ? baseline.workExperiences : []).map((w: any) => String(w?.description || ''));
        setEditWorkDesc(desc);
        setEditJobSummary(String(baseline.jobSummary || ''));
      }
    } catch {
      setError('取消の適用に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const publishBaseline = async () => {
    if (!selected?.id || !isOwner) return;
    const v = validateEdit();
    if (v) { setFormError(v); return; }
    setLoading(true);
    try {
      const extra = selected.extra_data || {};
      const workExperiences = (Array.isArray(currentWorkExperiences) ? currentWorkExperiences : []).map((w: any, i: number) => ({ ...w, description: editWorkDesc[i] ?? w.description }));
      const baseline = {
        self_pr: editSelfPr,
        workExperiences,
        jobSummary: editJobSummary,
      };
      const res = await fetch(`${apiUrl}/api/v2/resumes/${encodeURIComponent(String(selected.id))}/`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders() },
        body: JSON.stringify({ extra_data: { ...(extra || {}), baseline } }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelected((prev: any) => ({ ...(prev || {}), extra_data: updated.extra_data }));
        setFormError(null);
      }
    } catch {
      setError('公開反映に失敗しました');
    } finally {
      setLoading(false);
    }
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
          isAnnotation: Boolean(meta) || Boolean(m.annotation),
          anchor: meta || (m.annotation ? { anchorId: 'from-annotation', top: 0 } as any : undefined),
          annotationId: m.annotation ? String(m.annotation) : undefined,
          parentId: m.parent ? String(m.parent) : null,
          senderId: m.sender,
          timestamp: new Date(m.created_at).toLocaleString('ja-JP'),
        } as AnnMessage;
      });
      setMessagesAll(mapped);
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

  // On-demand fetch for active thread
  useEffect(() => {
    const loadThread = async (parentId: string) => {
      const qs = new URLSearchParams();
      qs.set('subject', 'resume_advice');
      if (userIdFromRoute) qs.set('user_id', userIdFromRoute);
      qs.set('parent_id', parentId);
      const res = await fetch(`${apiUrl}/api/v2/advice/messages/?${qs.toString()}`, { headers: { ...getAuthHeaders() } });
      if (!res.ok) return;
      const data = await res.json();
      const uid = getUserInfo()?.uid;
      const mapped: AnnMessage[] = data.map((m: any) => {
        const role = uid && String(m.sender) === String(uid) ? 'seeker' : 'advisor';
        const raw = m.content as string;
        const { meta, rest } = parseAnnotation(raw);
        return {
          id: String(m.id),
          role,
          text: raw,
          body: rest,
          isAnnotation: Boolean(meta) || Boolean(m.annotation),
          anchor: meta || undefined,
          annotationId: m.annotation ? String(m.annotation) : undefined,
          parentId: m.parent ? String(m.parent) : null,
          senderId: m.sender,
          timestamp: new Date(m.created_at).toLocaleString('ja-JP'),
        } as AnnMessage;
      });
      setThreadMessages((prev) => ({ ...prev, [parentId]: mapped }));
    };
    if (activeThread && !threadMessages[activeThread]) {
      loadThread(activeThread);
    }
    // clear reply box when switching
    setReplyInput('');
  }, [activeThread]);

  // Filter threads (search + unresolved)
  const threadsFiltered = useMemo(() => {
    let list = Array.isArray(threads) ? [...threads] : [];
    if (showUnresolvedOnly) list = list.filter((t: any) => !!t?.unresolved);
    const q = threadSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((t: any) => {
        const aid = (t?.annotation?.anchor_id || '').toLowerCase();
        const raw = (t?.latest_message?.content || '') as string;
        const { rest } = parseAnnotation(raw);
        return aid.includes(q) || raw.toLowerCase().includes(q) || rest.toLowerCase().includes(q);
      });
    }
    return list;
  }, [threads, showUnresolvedOnly, threadSearch]);

  // Auto-select first thread so users immediately see a threaded view
  useEffect(() => {
    if (didAutoSelectThread) return;
    const first = (threadsFiltered && threadsFiltered[0]) || null;
    const tid = first?.thread_id ? String(first.thread_id) : null;
    if (tid) {
      setActiveThread(tid);
      setDidAutoSelectThread(true);
    }
  }, [threadsFiltered, didAutoSelectThread]);

  const visibleMessages = useMemo(() => {
    if (!activeThread) return messagesAll;
    return threadMessages[activeThread] || [];
  }, [messagesAll, activeThread, threadMessages]);

  

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

  // Send reply within a selected thread
  const sendReply = async () => {
    if (!activeThread) return;
    const text = replyInput.trim();
    if (!text) return;
    const list = threadMessages[activeThread] || [];
    const root = list.find((m) => !m.parentId) || list[0];
    const parentId = root ? root.id : undefined;
    setLoading(true);
    try {
      const body: any = { content: text, subject: 'resume_advice', annotation_id: activeThread };
      if (parentId) body.parent_id = parentId;
      if (userIdFromRoute) body.user_id = userIdFromRoute;
      const res = await fetch(`${apiUrl}/api/v2/advice/messages/`, {
        method: 'POST',
        headers: { ...getAuthHeaders() },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('failed');
      setReplyInput('');
      // refresh this thread only
      setThreadMessages((prev) => ({ ...prev, [activeThread]: undefined as any }));
      // refetch
      const qs = new URLSearchParams();
      qs.set('subject', 'resume_advice');
      if (userIdFromRoute) qs.set('user_id', userIdFromRoute);
      qs.set('annotation_id', activeThread);
      const next = await fetch(`${apiUrl}/api/v2/advice/messages/?${qs.toString()}`, { headers: { ...getAuthHeaders() } });
      if (next.ok) {
        const data = await next.json();
        const uid = getUserInfo()?.uid;
        const mapped: AnnMessage[] = data.map((m: any) => ({
          id: String(m.id),
          role: uid && String(m.sender) === String(uid) ? 'seeker' : 'advisor',
          text: m.content,
          body: m.content,
          isAnnotation: Boolean(m.annotation),
          annotationId: m.annotation ? String(m.annotation) : undefined,
          parentId: m.parent ? String(m.parent) : null,
          senderId: m.sender,
          timestamp: new Date(m.created_at).toLocaleString('ja-JP'),
        }));
        setThreadMessages((prev) => ({ ...prev, [activeThread]: mapped }));
      }
      // refresh threads summary to update counts
      try {
        const t = await fetch(`${apiUrl}/api/v2/advice/threads/?${userIdFromRoute ? `user_id=${encodeURIComponent(String(userIdFromRoute))}&` : ''}subject=resume_advice`, { headers: { ...getAuthHeaders() } });
        if (t.ok) setThreads(await t.json());
      } catch {}
    } catch (e) {
      setError('返信の送信に失敗しました');
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
      let createdAnn: any = null;
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
        if (annRes.ok) { createdAnn = await annRes.json(); annotationId = String(createdAnn.id); }
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
      // optimistic update annotations
      if (createdAnn) setAnnotations((prev) => [...prev, createdAnn]);
      await fetchMessages();
      // refresh threads summary (overlay + tabs)
      try {
        const t = await fetch(`${apiUrl}/api/v2/advice/threads/?${userIdFromRoute ? `user_id=${encodeURIComponent(String(userIdFromRoute))}&` : ''}subject=resume_advice&mode=comment`, { headers: { ...getAuthHeaders() } });
        if (t.ok) setThreads(await t.json());
      } catch {}
    } catch (e) {
      setError('コメントの送信に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const resolveAnnotation = async (annotationId?: string) => {
    if (!annotationId) return;
    try {
      await fetch(`${apiUrl}/api/v2/advice/annotations/${annotationId}/`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders() },
        body: JSON.stringify({ is_resolved: true }),
      });
      // refresh annotations and messages
      if (overridePreview?.resumeId) {
        try {
          const a = await fetch(`${apiUrl}/api/v2/advice/annotations/?resume_id=${encodeURIComponent(String(overridePreview.resumeId))}&subject=resume_advice`, { headers: { ...getAuthHeaders() } });
          if (a.ok) setAnnotations(await a.json());
        } catch {}
      } else if (selected?.id) {
        try {
          const a = await fetch(`${apiUrl}/api/v2/advice/annotations/?resume_id=${encodeURIComponent(String(selected.id))}&subject=resume_advice`, { headers: { ...getAuthHeaders() } });
          if (a.ok) setAnnotations(await a.json());
        } catch {}
      }
      await fetchMessages();
      // refresh threads summary
      try {
        const t = await fetch(`${apiUrl}/api/v2/advice/threads/?${userIdFromRoute ? `user_id=${encodeURIComponent(String(userIdFromRoute))}&` : ''}subject=resume_advice&mode=comment`, { headers: { ...getAuthHeaders() } });
        if (t.ok) setThreads(await t.json());
      } catch {}
    } catch {}
  };

  // Selection handler on preview: capture selection inside an annotatable block
  const handlePreviewMouseUp = () => {
    if (mode !== 'comments') return; // disable annot composer in edit mode
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
          {/* Left: Resume preview (actual data or baseline when editing) */}
          <section className="lg:col-span-8 bg-white border rounded-lg shadow-sm p-4 overflow-auto max-h-[75vh]">
            {(overridePreview || selected) ? (
              <div
                className="relative pr-[260px] w-full"
                ref={previewWrapRef}
                onMouseUp={handlePreviewMouseUp}
              >
                {mode === 'edit' && leftPreviewData ? (
                  <ResumePreview
                    userName={leftPreviewData.userName}
                    jobhistoryList={leftPreviewData.jobhistoryList}
                    formValues={leftPreviewData.formValues}
                    jobSummary={leftPreviewData.jobSummary}
                    selfPR={leftPreviewData.selfPR}
                    skills={leftPreviewData.skills as any}
                    education={leftPreviewData.education as any}
                    annotations={annotations}
                    className="w-full"
                  />
                ) : overridePreview ? (
                  <ResumePreview
                    userName={overridePreview.userName}
                    jobhistoryList={overridePreview.jobhistoryList}
                    formValues={overridePreview.formValues}
                    jobSummary={overridePreview.jobSummary}
                    selfPR={overridePreview.selfPR}
                    skills={overridePreview.skills}
                    education={overridePreview.education}
                    annotations={annotations}
                    className="w-full"
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
                        annotations={annotations}
                        className="w-full"
                      />
                    );
                  })()
                )}

                {/* Comment overlays (latest per thread via threads API) */}
                <div className="absolute inset-0 pointer-events-none">
                  {threadsFiltered.map((t: any, i: number) => {
                    const annId = String(t?.annotation?.id || '');
                    if (!annId) return null;
                    const topGuess = markTops[annId] !== undefined ? markTops[annId] : 0;
                    const markSelector = `[data-annot-ref=\"ann-${annId}\"]`;
                    const palette = ['#E56B6F','#6C9BD2','#7FB069','#E6B31E','#A77BD1','#E58F6B'];
                    const colorOf = (id: string) => { let h=0; for (let j=0;j<id.length;j++) h=(h*31+id.charCodeAt(j))>>>0; return palette[h%palette.length]; };
                    const color = colorOf(annId);
                    const idx = annotations.findIndex(a => String(a.id) === annId) + 1;
                    const latest = t.latest_message || {};
                    const raw = latest.content || '';
                    const { rest } = parseAnnotation(raw);
                    const uid = getUserInfo()?.uid;
                    const role: 'seeker'|'advisor' = uid && String(latest.sender) === String(uid) ? 'seeker' : 'advisor';
                    const timestamp = latest.created_at ? new Date(latest.created_at).toLocaleString('ja-JP') : '';
                    return (
                      <div
                        key={String(t.thread_id || annId)}
                        className="absolute right-[-240px] w-[220px] pointer-events-auto"
                        style={{ top: Math.max(0, topGuess - 8), opacity: t.unresolved ? 1 : 0.6 }}
                        onClick={() => {
                          const sel = previewWrapRef.current?.querySelector(`[data-annot-ref=\"ann-${annId}\"]`) as HTMLElement | null;
                          if (sel && previewWrapRef.current) {
                            previewWrapRef.current.scrollTo({ top: (markTops[annId] || 0) - 40, behavior: 'smooth' });
                            sel.classList.add('ring-2','ring-[#E5A6A6]');
                            setTimeout(() => sel.classList.remove('ring-2','ring-[#E5A6A6]'), 1200);
                          }
                          // select this thread for reply context
                          if (t.thread_id) setActiveThread(String(t.thread_id));
                        }}
                      >
                        <div
                          className="border bg-white rounded-md shadow-sm"
                          style={{ borderColor: color }}
                          onMouseEnter={() => { try { (previewWrapRef.current?.querySelector(markSelector) as HTMLElement)?.classList.add('ring-2','ring-[#E5A6A6]'); } catch {} }}
                          onMouseLeave={() => { try { (previewWrapRef.current?.querySelector(markSelector) as HTMLElement)?.classList.remove('ring-2','ring-[#E5A6A6]'); } catch {} }}
                        >
                          <div className="px-2 pt-1">
                            {idx > 0 && (
                              <span className="inline-flex items-center justify-center text-[10px] leading-[10px] rounded-sm px-[4px] py-[1px] mr-2" style={{ background: color + '22', color, border: `1px solid ${color}` }}>{idx}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 border-b text-sm">
                            <div className="h-6 w-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs">
                              {role === 'advisor' ? 'A' : 'S'}
                            </div>
                            <div className="text-secondary-800 truncate">{role === 'advisor' ? 'advisor' : 'you'}</div>
                            <div className="ml-auto text-xs text-secondary-500">{timestamp}</div>
                          </div>
                          {/* quote chip omitted here (available on creation time) */}
                          <div className="px-3 py-2 text-sm text-secondary-800 whitespace-pre-wrap">{rest || raw}</div>
                          <div className="px-3 pb-2 text-xs text-primary-700 flex gap-3">
                            <button className="hover:underline" onClick={(e) => { e.stopPropagation(); setActiveThread(String(t.thread_id || '')); setTimeout(() => { const el = document.getElementById('thread-reply-box'); el?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 0); }}>返信</button>
                            <button className="hover:underline" onClick={(e) => { e.stopPropagation(); resolveAnnotation(annId); }}>解決</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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

          {/* Right: Comments panel or Edit panel */}
          <aside className="lg:col-span-4 flex flex-col bg-white border rounded-lg shadow-sm overflow-hidden max-h-[75vh]">
            {/* Panel header */}
            <div className="bg-primary-600 text-white px-4 py-3 flex items-center justify-between">
              <div className="font-semibold">{mode === 'edit' ? '編集' : sectionTitle}</div>
              <div className="flex items-center gap-2">
                {isOwner && (
                  <>
                    <button
                      className={`text-xs px-2 py-1 rounded ${mode === 'comments' ? 'bg-white text-primary-700' : 'bg-primary-500 text-white'}`}
                      onClick={() => setMode('comments')}
                    >コメント</button>
                    <button
                      className={`text-xs px-2 py-1 rounded ${mode === 'edit' ? 'bg-white text-primary-700' : 'bg-primary-500 text-white'}`}
                      onClick={() => setMode('edit')}
                    >編集</button>
                  </>
                )}
                {mode === 'comments' && (
                  <button className="opacity-90 hover:opacity-100" onClick={() => searchRef.current?.focus()}>
                    <FaSearch />
                  </button>
                )}
              </div>
            </div>

            {/* Threads bar or Edit commands */}
            {mode === 'comments' ? (
            <div className="border-b px-3 py-2 bg-white/80 sticky top-0 z-[1] flex items-center gap-2 overflow-auto">
              <button
                className={`text-xs px-2 py-1 rounded border ${!activeThread ? 'bg-primary-50 border-primary-400 text-primary-700' : 'bg-white border-secondary-300'}`}
                onClick={() => setActiveThread(null)}
              >
                全て
              </button>
              {threadsFiltered.map((t: any, i: number) => {
                const annId = String(t.annotation?.id || '');
                const stableIdx = annId ? (annotations.findIndex(a => String(a.id) === annId) + 1) : (i + 1);
                const tid = String(t.thread_id || '');
                return (
                  <button key={tid || i}
                    onClick={() => setActiveThread(tid)}
                    className={`text-xs px-2 py-1 rounded border whitespace-nowrap ${String(activeThread) === tid ? 'bg-primary-50 border-primary-400 text-primary-700' : 'bg-white border-secondary-300'}`}
                    title={(t.annotation?.anchor_id || '')}
                  >
                    #{stableIdx} ({t.messages_count}){t.unresolved ? '•' : ''}
                  </button>
                );
              })}
              <input
                ref={searchRef}
                value={threadSearch}
                onChange={(e) => setThreadSearch(e.target.value)}
                placeholder="検索..."
                className="ml-auto rounded border px-2 py-1 text-xs w-[140px]"
              />
              <label className="flex items-center gap-1 text-xs text-secondary-700 whitespace-nowrap">
                <input type="checkbox" checked={showUnresolvedOnly} onChange={(e) => setShowUnresolvedOnly(e.target.checked)} />
                未解決のみ
              </label>
            </div>
            ) : (
            <div className="border-b px-3 py-2 bg-white/80 sticky top-0 z-[1] flex items-center gap-2">
              <button onClick={saveDraft} disabled={loading} className="text-xs px-2 py-1 rounded bg-primary-600 text-white hover:bg-primary-500">保存</button>
              <button onClick={cancelToBaseline} disabled={loading} className="text-xs px-2 py-1 rounded border">取消（基準へ復元）</button>
              <button onClick={publishBaseline} disabled={loading} className="text-xs px-2 py-1 rounded border">公開反映（基準更新）</button>
            </div>
            )}

            {/* Messages or Edit form */}
            {mode === 'comments' ? (
            <div className="flex-1 overflow-auto p-3 space-y-3 bg-secondary-50">
              {/* Threaded view when a thread is active */}
              {activeThread ? (
                (() => {
                  const list = visibleMessages;
                  const root = list.find((m) => !m.parentId) || list[0];
                  const replies = list.filter((m) => m.parentId && root && String(m.parentId) === String(root.id));
                  const renderMsg = (m: AnnMessage, indent = false) => {
                    const palette = ['#E56B6F','#6C9BD2','#7FB069','#E6B31E','#A77BD1','#E58F6B'];
                    const colorOf = (id: string) => { let h=0; for (let i=0;i<id.length;i++) h=(h*31+id.charCodeAt(i))>>>0; return palette[h%palette.length]; };
                    const color = m.annotationId ? colorOf(m.annotationId) : undefined;
                    const idx = m.annotationId ? (annotations.findIndex(a => String(a.id) === String(m.annotationId)) + 1) : undefined;
                    const onJump = () => {
                      const id = m.annotationId as string | undefined;
                      if (!id) return;
                      const sel = previewWrapRef.current?.querySelector(`[data-annot-ref=\\"ann-${id}\\"]`) as HTMLElement | null;
                      if (sel && previewWrapRef.current) {
                        const top = markTops[id] ?? 0;
                        previewWrapRef.current.scrollTo({ top: Math.max(0, top - 40), behavior: 'smooth' });
                        sel.classList.add('ring-2','ring-[#E5A6A6]');
                        setTimeout(() => sel.classList.remove('ring-2','ring-[#E5A6A6]'), 1200);
                      }
                    };
                    return (
                      <div key={m.id} className={`max-w-[90%] w-fit ${m.role === 'seeker' ? 'ml-auto' : ''} ${indent ? 'ml-6' : ''}`}>
                        <div
                          onClick={onJump}
                          className={`px-3 py-2 rounded-md text-sm shadow-sm cursor-pointer ${
                            m.role === 'seeker'
                              ? 'bg-secondary-800 text-white'
                              : 'bg-white text-secondary-800 border'
                          }`}
                          style={color ? { borderColor: color, boxShadow: `inset 4px 0 0 ${color}` } : undefined}
                          title={idx ? `注釈 #${idx}` : undefined}
                        >
                          {idx && !indent && (
                            <span className="inline-flex items-center justify-center text-[10px] leading-[10px] rounded-sm px-[4px] py-[1px] mr-2" style={ color ? { background: color + '22', color, border: `1px solid ${color}` } : undefined }>
                              {idx}
                            </span>
                          )}
                          {m.body || m.text}
                        </div>
                      </div>
                    );
                  };
                  return (
                    <div className="space-y-2">
                      {root && renderMsg(root)}
                      {replies.length > 0 && (
                        <div className="pl-3 border-l-2 border-secondary-200 space-y-2">
                          {replies.map((r) => renderMsg(r, true))}
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                // Flat view when no thread selected
                visibleMessages.map((m) => {
                  const colorOf = (id: string) => { const palette = ['#E56B6F','#6C9BD2','#7FB069','#E6B31E','#A77BD1','#E58F6B']; let h=0; for (let i=0;i<id.length;i++) h=(h*31+id.charCodeAt(i))>>>0; return palette[h%palette.length]; };
                  const color = (m as any).annotationId ? colorOf((m as any).annotationId) : undefined;
                  const idx = (m as any).annotationId ? (annotations.findIndex(a => String(a.id) === String((m as any).annotationId)) + 1) : undefined;
                  const onJump = () => {
                    const id = (m as any).annotationId as string | undefined;
                    if (!id) return;
                    const sel = previewWrapRef.current?.querySelector(`[data-annot-ref=\\"ann-${id}\\"]`) as HTMLElement | null;
                    if (sel && previewWrapRef.current) {
                      const top = markTops[id] ?? 0;
                      previewWrapRef.current.scrollTo({ top: Math.max(0, top - 40), behavior: 'smooth' });
                      sel.classList.add('ring-2','ring-[#E5A6A6]');
                      setTimeout(() => sel.classList.remove('ring-2','ring-[#E5A6A6]'), 1200);
                    }
                  };
                  return (
                    <div key={m.id} className={`max-w-[90%] w-fit ${m.role === 'seeker' ? 'ml-auto' : ''}`}>
                      <div
                        onClick={onJump}
                        className={`px-3 py-2 rounded-md text-sm shadow-sm cursor-pointer ${
                          m.role === 'seeker'
                            ? 'bg-secondary-800 text-white'
                            : 'bg-white text-secondary-800 border'
                        }`}
                        style={color ? { borderColor: color, boxShadow: `inset 4px 0 0 ${color}` } : undefined}
                        title={idx ? `注釈 #${idx}` : undefined}
                      >
                        {idx && (
                          <span className="inline-flex items-center justify-center text-[10px] leading-[10px] rounded-sm px-[4px] py-[1px] mr-2" style={ color ? { background: color + '22', color, border: `1px solid ${color}` } : undefined }>
                            {idx}
                          </span>
                        )}
                        {m.body || m.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>
            ) : (
            <div className="flex-1 overflow-auto p-3 space-y-4 bg-secondary-50">
              {formError && (
                <div className="text-sm text-error-600">{formError}</div>
              )}
              <div>
                <label className="block text-sm font-semibold text-secondary-800 mb-1">自己PR</label>
                <textarea
                  value={editSelfPr}
                  onChange={(e) => setEditSelfPr(e.target.value)}
                  className="w-full min-h-28 rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white"
                />
                <div className="text-[11px] text-secondary-500 text-right">{editSelfPr.length} / {limits.selfPr}</div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-secondary-800 mb-1">職務要約</label>
                <textarea
                  value={editJobSummary}
                  onChange={(e) => setEditJobSummary(e.target.value)}
                  className="w-full min-h-24 rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white"
                  placeholder="職務要約（短いサマリ）を入力"
                />
                <div className="text-[11px] text-secondary-500 text-right">{editJobSummary.length} / {limits.jobSummary}</div>
              </div>
              {currentWorkExperiences.map((w: any, i: number) => (
                <div key={i} className="border rounded bg-white p-2">
                  <div className="text-xs text-secondary-600 mb-1">職務内容（{w.company || `職歴${i+1}` }）</div>
                  <textarea
                    value={editWorkDesc[i] ?? ''}
                    onChange={(e) => setEditWorkDesc((prev) => { const next = [...prev]; next[i] = e.target.value; return next; })}
                    className="w-full min-h-24 rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                    placeholder="職務内容を入力"
                  />
                  <div className="text-[11px] text-secondary-500 text-right">{(editWorkDesc[i] || '').length} / {limits.workDesc}</div>
                </div>
              ))}
            </div>
            )}

            {/* Input / Reply (only in comments mode) */}
            {mode === 'comments' && activeThread ? (
              <div className="border-t bg-white p-3" id="thread-reply-box">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-secondary-800">スレッドに返信</label>
                  <button className="text-xs text-secondary-600 hover:underline" onClick={() => setActiveThread(null)}>全てに戻る</button>
                </div>
                <div className="flex items-end gap-2">
                  <textarea
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    placeholder="返信内容を入力..."
                    className="flex-1 h-20 resize-none rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                  <button
                    disabled={loading}
                    onClick={sendReply}
                    className="h-10 w-10 shrink-0 rounded-md bg-primary-600 text-white flex items-center justify-center hover:bg-primary-500"
                    aria-label="send reply"
                  >
                    <FaPaperPlane />
                  </button>
                </div>
                {error && <p className="text-sm text-error-600 mt-2">{error}</p>}
              </div>
            ) : mode === 'comments' ? (
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
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
