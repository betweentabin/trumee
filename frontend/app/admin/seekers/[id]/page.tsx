'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { buildApiUrl, getApiHeaders, API_CONFIG } from '@/config/api';
import AdviceScreenTab from '@/components/admin/AdviceScreenTab';
import InterviewPreparationTab from '@/components/admin/InterviewPreparationTab';
import { useForm } from 'react-hook-form';
import ResumePreview from '@/components/pure/resume/preview';
import { emptyResumePreview, fetchResumePreview, ResumePreviewData } from '@/utils/resume-preview';
import toast from 'react-hot-toast';

type AdminSeeker = {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  created_at?: string;
  is_premium?: boolean;
};

export default function AdminSeekerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<AdminSeeker | null>(null);
  const [overview, setOverview] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'review' | 'interview' | 'advice' | 'member'>('review');
  type AnchorMeta = { anchorId: string; top: number; quote?: string; resumeId?: string; startOffset?: number; endOffset?: number };
  type ReviewMsg = { id:string; sender:string; content:string; created_at:string; body?: string; isAnnotation?: boolean; anchor?: AnchorMeta; kind?: 'review' | 'interview'; annotationId?: string; parentId?: string | null };
  const [reviewMessages, setReviewMessages] = useState<ReviewMsg[]>([]);
  const [reviewInput, setReviewInput] = useState('');
  const [adviceMessages, setAdviceMessages] = useState<any[]>([]);
  const [interviewMessages, setInterviewMessages] = useState<any[]>([]);
  const [sendingReview, setSendingReview] = useState(false);
  const [sendingAdvice, setSendingAdvice] = useState(false);
  const [sendingInterview, setSendingInterview] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [selectedAdviceTab, setSelectedAdviceTab] = useState<string>('resume');
  const [selectedAdviceSubTab, setSelectedAdviceSubTab] = useState<string | null>(null);
  const [resumePreview, setResumePreview] = useState<ResumePreviewData>(emptyResumePreview);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [effectiveRegisteredAt, setEffectiveRegisteredAt] = useState<string | null>(null);
  const [userResumes, setUserResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  // Plan editor (admin)
  const [planSaving, setPlanSaving] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [planTierInput, setPlanTierInput] = useState<string>('');
  const [premiumExpiryInput, setPremiumExpiryInput] = useState<string>('');
  // Annotations + positions
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [markTops, setMarkTops] = useState<Record<string, number>>({});
  // Threads (comment-mode)
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<Record<string, ReviewMsg[]>>({});
  const [annotationFilter, setAnnotationFilter] = useState<string>('');
  const [threadSearch, setThreadSearch] = useState('');

  // Compute fine-grained changed ranges (annotation ids) by comparing quotes against current preview text
  const changedRangeIds = useMemo<Set<string>>(() => {
    try {
      const preview = resumePreview;
      const anns = Array.isArray(annotations) ? annotations : [];
      const jobKeys = Array.isArray(preview.jobhistoryList) ? preview.jobhistoryList : [];
      const values = (preview.formValues || {}) as any;
      const getAnchorText = (anchorId: string): string => {
        if (!anchorId) return '';
        if (anchorId === 'job_summary') return String((preview.jobSummary || preview.selfPR || ''));
        if (anchorId === 'self_pr') return String(preview.selfPR || '');
        if (anchorId.startsWith('work_content-')) {
          const key = anchorId.replace('work_content-', '');
          return String(values?.[key]?.work_content || '');
        }
        if (anchorId.startsWith('achievement-')) {
          // achievement-<key>-<index>
          const rest = anchorId.replace('achievement-', '');
          const m = rest.match(/^(.*)-(\d+)$/);
          if (!m) return '';
          const key = m[1];
          const idx = parseInt(m[2], 10);
          const v = values?.[key]?.achievements as any;
          let list: string[] = [];
          if (Array.isArray(v)) list = v.map((s: any) => String(s)).filter(Boolean);
          else {
            const s = String(v || '').trim();
            if (s) list = s.split(/[\n\r,、，;；・]/).map((t) => t.trim()).filter(Boolean);
          }
          return String(list[idx] || '');
        }
        return '';
      };
      const setIds = new Set<string>();
      const MIN_Q = 4;
      anns.forEach((a: any) => {
        try {
          const text = getAnchorText(String(a.anchor_id || ''));
          const q = String(a.quote || '');
          const start = Number(a.start_offset || 0);
          const end = Number(a.end_offset || 0);
          let changed = false;
          if (q && q.trim().length >= MIN_Q) {
            changed = !text.includes(q);
          } else if (end > start && text) {
            const sub = text.slice(Math.max(0, start), Math.max(start, end));
            changed = q ? (sub !== q) : false;
          }
          if (changed) setIds.add(String(a.id));
        } catch {}
      });
      return setIds;
    } catch {
      return new Set<string>();
    }
  }, [resumePreview, annotations]);
  const [didAutoSelectThread, setDidAutoSelectThread] = useState(false);
  const [threadReplyInput, setThreadReplyInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unresolved' | 'resolved'>('all');
  const [deleteMode, setDeleteMode] = useState(false);

  const token = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('drf_token_v2') || '';
  }, []);

  const sendNudgeMessage = useCallback(async (type: 'login' | 'billing') => {
    if (!id) return;
    try {
      const content =
        type === 'login'
          ? '【ログインのご案内】\nしばらくログインが確認できません。職務経歴書の更新や求人提案を受け取るため、再度のログインをご検討ください。'
          : '【プレミアムプランのご案内】\n応募管理やスカウト受信強化などが可能なプレミアム機能をご案内します。詳細はマイページのプラン設定をご確認ください。';
      const body = { user_id: id, subject: 'advice', content } as any;
      const res = await fetch(buildApiUrl('/advice/messages/'), {
        method: 'POST',
        headers: getApiHeaders(token),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Failed to send (${res.status})`);
      toast.success('メッセージを送信しました');
    } catch (e: any) {
      toast.error(e?.message || 'メッセージ送信に失敗しました');
    }
  }, [id, token]);

  useEffect(() => {
    const fetchOne = async () => {
      try {
        setLoading(true);
        const qs = new URLSearchParams({ page: '1' });
        const urlUsers = `${buildApiUrl(API_CONFIG.endpoints.adminUsers)}?${qs}`;
        let res = await fetch(urlUsers, { headers: getApiHeaders(token) });
        if (res.status === 404) {
          const urlSeekers = `${buildApiUrl(API_CONFIG.endpoints.adminSeekers)}?${qs}`;
          res = await fetch(urlSeekers, { headers: getApiHeaders(token) });
        }
        if (!res.ok) throw new Error('failed to load');
        const json = await res.json();
        const found = (json?.results || []).find((u: any) => u.id === id) || null;
        setUser(found);
        // 概要情報（年齢・最終ログイン・課金日・最終添削者）も取得
        try {
          const resOv = await fetch(buildApiUrl(`/admin/users/${id}/overview/`), { headers: getApiHeaders(token) });
          if (resOv.ok) {
            const ov = await resOv.json();
            setOverview(ov);
          }
        } catch {}
      } catch (e: any) {
        setError(e.message || 'failed');
      } finally {
        setLoading(false);
      }
    };
    fetchOne();
  }, [id, token]);

  const currentUser = useMemo(() => {
    if (typeof window === 'undefined') return null as any;
    try { return JSON.parse(localStorage.getItem('current_user_v2') || 'null'); } catch { return null as any; }
  }, []);

  // sync plan inputs when overview arrives
  useEffect(() => {
    try {
      const u = overview?.user;
      if (u) {
        setPlanTierInput(String(u.plan_tier || ''));
        setPremiumExpiryInput(u.premium_expiry ? new Date(u.premium_expiry).toISOString().slice(0,16) : '');
      }
    } catch {}
  }, [overview]);

  const reloadOverview = useCallback(async () => {
    if (!id) return;
    try {
      const resOv = await fetch(buildApiUrl(`/admin/users/${id}/overview/`), { headers: getApiHeaders(token) });
      if (resOv.ok) {
        const ov = await resOv.json();
        setOverview(ov);
      }
    } catch {}
  }, [id, token]);

  const loadReviewMessages = useCallback(async () => {
    if (!id) return;
    try {
      const url = `${buildApiUrl('/advice/messages/')}?user_id=${id}`;
      const res = await fetch(url, { headers: getApiHeaders(token) });
      if (!res.ok) return;
      const list = await res.json();
      const parseAnnotation = (text: string): { meta?: AnchorMeta; rest: string } => {
        const m = (text || '').match(/^@@ANNOTATION:(\{[\s\S]*?\})@@\s*/);
        if (m) {
          try {
            return { meta: JSON.parse(m[1]) as AnchorMeta, rest: text.slice(m[0].length) };
          } catch {}
        }
        return { rest: text };
      };
      const mapped = (list || []).map((m: any) => {
        const raw = String(m.content || '');
        const { meta, rest } = parseAnnotation(raw);
        let kind: 'review' | 'interview' = 'review';
        let bodyText = rest;
        try {
          const obj = JSON.parse(rest);
          if (obj && typeof obj === 'object') {
            if (obj.type === 'interview_hint') { kind = 'interview'; bodyText = obj.message || rest; }
          }
        } catch {}
        return {
          id: String(m.id),
          sender: String(m.sender),
          content: raw,
          body: bodyText,
          isAnnotation: Boolean(meta) || Boolean(m.annotation),
          anchor: meta,
          annotationId: m.annotation ? String(m.annotation) : undefined,
          parentId: m.parent ? String(m.parent) : null,
          created_at: m.created_at,
          kind,
        } as ReviewMsg;
      });
      setReviewMessages(mapped);
    } catch {}
  }, [id, token]);

  useEffect(() => {
    loadReviewMessages();
  }, [loadReviewMessages]);

  useEffect(() => {
    if (!id) return;
    let canceled = false;
    const loadResumePreview = async () => {
      try {
        setResumeLoading(true);
        setResumeError(null);
        const data = await fetchResumePreview({ userId: String(id), token, forAdmin: true });
        if (!canceled) {
          setResumePreview(data);
          // 併せて「最初の履歴書作成日」を取得して登録日に反映
          try {
            const res = await fetch(buildApiUrl(`/admin/users/${encodeURIComponent(String(id))}/resumes/`), { headers: getApiHeaders(token) });
            if (res.ok) {
              const list: any[] = await res.json();
              setUserResumes(list || []);
              // pick current preview id if available, otherwise latest
              const currentId = data?.resumeId ? String(data.resumeId) : '';
              let sel = currentId;
              if (!sel && Array.isArray(list) && list.length > 0) sel = String(list[0].id);
              setSelectedResumeId(sel);
              const latest = (list || [])
                .map((r) => r?.created_at)
                .filter(Boolean)
                .map((s: string) => new Date(s).getTime())
                .sort((a, b) => b - a);
              if (latest.length > 0) setEffectiveRegisteredAt(new Date(latest[0]).toISOString());
            }
          } catch {}
          // load annotations for this resume
          try {
            if (data?.resumeId) {
              const a = await fetch(buildApiUrl(`/advice/annotations/?resume_id=${encodeURIComponent(String(data.resumeId))}&subject=resume_advice`), { headers: getApiHeaders(token) });
              if (a.ok) setAnnotations(await a.json());
              // Load threads (comment-mode)
              try {
                const qs = new URLSearchParams();
                qs.set('subject', 'resume_advice');
                qs.set('mode', 'comment');
                qs.set('user_id', String(id));
                if (data?.resumeId) qs.set('resume_id', String(data.resumeId));
                const tr = await fetch(buildApiUrl(`/advice/threads/?${qs.toString()}`), { headers: getApiHeaders(token) });
                if (tr.ok) setThreads(await tr.json());
              } catch {}
            }
          } catch {}
        }
      } catch (err) {
        console.error('resume preview load failed', err);
        if (!canceled) {
          setResumePreview(emptyResumePreview);
          const message = err instanceof Error ? err.message : '職務経歴書の取得に失敗しました。';
          setResumeError(message);
        }
      } finally {
        if (!canceled) {
          setResumeLoading(false);
        }
      }
    };
    loadResumePreview();
    return () => {
      canceled = true;
    };
  }, [id, token]);

  useEffect(() => {
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
  }, [annotations, resumePreview]);

  // Threads filters + auto select
  const threadsFiltered = useMemo(() => {
    let list = Array.isArray(threads) ? [...threads] : [];
    // status filter removed: always show all
    if (annotationFilter) list = list.filter((t: any) => String(t?.annotation?.id || '') === String(annotationFilter));
    const q = threadSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((t: any) => {
        const aid = (t?.annotation?.anchor_id || '').toLowerCase();
        const raw = (t?.latest_message?.content || '') as string;
        return aid.includes(q) || raw.toLowerCase().includes(q);
      });
    }
    return list;
  }, [threads, annotationFilter, threadSearch]);

  // Canonical thread for current annotation (the oldest thread of that annotation)
  const canonicalThreadId = useMemo(() => {
    if (!annotationFilter) return null as string | null;
    const list = (threads || []).filter((t: any) => String(t?.annotation?.id || '') === String(annotationFilter));
    if (list.length === 0) return null as string | null;
    try {
      list.sort((a: any, b: any) => new Date(a.latest_message?.created_at || 0).getTime() - new Date(b.latest_message?.created_at || 0).getTime());
    } catch {}
    const tid = list[0]?.thread_id ? String(list[0].thread_id) : null;
    return tid;
  }, [threads, annotationFilter]);

  useEffect(() => {
    // Avoid auto-selecting a thread when user is filtering by annotation;
    // keep the list view to show all messages across threads.
    if (didAutoSelectThread || annotationFilter) return;
    const first = threadsFiltered && threadsFiltered[0];
    const tid = first?.thread_id ? String(first.thread_id) : null;
    if (tid) {
      setActiveThread(tid);
      setDidAutoSelectThread(true);
    }
  }, [threadsFiltered, didAutoSelectThread, annotationFilter]);

  // Refetch threads on annotation filter change
  useEffect(() => {
    const run = async () => {
      try {
        const qs = new URLSearchParams();
        qs.set('subject', 'resume_advice');
        qs.set('mode', 'comment');
        qs.set('user_id', String(id));
        if (annotationFilter) qs.set('annotation_id', annotationFilter);
        const res = await fetch(buildApiUrl(`/advice/threads/?${qs.toString()}`), { headers: getApiHeaders(token) });
        if (res.ok) {
          const data = await res.json();
          setThreads(data);
          // When an annotation is selected, keep list view (do not auto-select a thread)
          if (annotationFilter) {
            setActiveThread(null);
            setDidAutoSelectThread(false);
          } else if (Array.isArray(data) && data.length > 0) {
            // Preserve current selection if it still exists; otherwise select the first.
            const exists = activeThread && data.some((t: any) => String(t.thread_id) === String(activeThread));
            if (!exists) {
              const tid = data[0]?.thread_id ? String(data[0].thread_id) : null;
              if (tid) {
                setActiveThread(tid);
                setDidAutoSelectThread(true);
              }
            }
          }
        }
      } catch {}
    };
    run();
  }, [annotationFilter, id, token, activeThread]);

  // Load thread messages on selection
  useEffect(() => {
    const load = async (parentId: string) => {
      try {
        const qs = new URLSearchParams();
        qs.set('subject', 'resume_advice');
        qs.set('user_id', String(id));
        qs.set('parent_id', parentId);
        const res = await fetch(buildApiUrl(`/advice/messages/?${qs.toString()}`), { headers: getApiHeaders(token) });
        if (!res.ok) {
          // Avoid tight retry loop on 400 (e.g., ID format mismatch). Mark as empty so UI can proceed.
          if (res.status === 400) {
            setThreadMessages((prev) => ({ ...prev, [parentId]: [] }));
          }
          return;
        }
        const data = await res.json();
        const mapped: ReviewMsg[] = (data || []).map((m: any) => ({
          id: String(m.id), sender: String(m.sender), content: m.content, body: m.content, created_at: m.created_at,
          isAnnotation: !!m.annotation, annotationId: m.annotation ? String(m.annotation) : undefined, parentId: m.parent ? String(m.parent) : null,
        }));
        setThreadMessages((prev) => ({ ...prev, [parentId]: mapped }));
      } catch {}
    };
    if (activeThread && !threadMessages[activeThread]) load(activeThread);
  }, [activeThread, id, token, threadMessages]);

  const sendThreadReply = useCallback(async (overrideThreadId?: string) => {
    const targetThread = overrideThreadId || activeThread;
    if (!targetThread || !threadReplyInput.trim()) return;
    try {
      const list = threadMessages[targetThread] || [];
      const root = list.find((m) => !(m as any).parentId) || list[0];
      const annotationId = (root as any)?.annotationId || (threads.find((t: any) => String(t.thread_id) === String(targetThread))?.annotation?.id);
      const body: any = { user_id: id, subject: 'resume_advice', content: threadReplyInput.trim(), parent_id: targetThread };
      if (annotationId) body.annotation_id = String(annotationId);
      const res = await fetch(buildApiUrl('/advice/messages/'), { method: 'POST', headers: getApiHeaders(token), body: JSON.stringify(body) });
      if (!res.ok) throw new Error('failed');
      setThreadReplyInput('');
      // refresh thread
      setThreadMessages((prev) => ({ ...prev, [targetThread]: undefined as any }));
      const qs = new URLSearchParams();
      qs.set('subject', 'resume_advice'); qs.set('user_id', String(id)); qs.set('parent_id', targetThread);
      const next = await fetch(buildApiUrl(`/advice/messages/?${qs.toString()}`), { headers: getApiHeaders(token) });
      if (next.ok) {
        const data = await next.json();
        const mapped: ReviewMsg[] = (data || []).map((m: any) => ({ id: String(m.id), sender: String(m.sender), content: m.content, body: m.content, created_at: m.created_at, isAnnotation: !!m.annotation, annotationId: m.annotation ? String(m.annotation) : undefined, parentId: m.parent ? String(m.parent) : null }));
        setThreadMessages((prev) => ({ ...prev, [targetThread]: mapped }));
      }
      // Also refresh the flat list so「全件」表示にも即時反映
      try { await loadReviewMessages(); } catch {}
      // refresh threads summary
      try {
        const tqs = new URLSearchParams(); tqs.set('subject', 'resume_advice'); tqs.set('mode', 'comment'); tqs.set('user_id', String(id));
        const tr = await fetch(buildApiUrl(`/advice/threads/?${tqs.toString()}`), { headers: getApiHeaders(token) });
        if (tr.ok) setThreads(await tr.json());
      } catch {}
    } catch {}
  }, [activeThread, threadReplyInput, id, token, threadMessages, threads, loadReviewMessages]);

  // Selection/annotation state for inline comments
  const previewWrapRef = useRef<HTMLDivElement | null>(null);
  const [pendingAnchor, setPendingAnchor] = useState<AnchorMeta | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [composerPos, setComposerPos] = useState<{ top: number; left: number } | null>(null);
  const [composerAsInterview, setComposerAsInterview] = useState(false);

  const sendReviewMessage = useCallback(async () => {
    if (!reviewInput.trim()) return;
    try {
      setSendingReview(true);
      setSendError(null);
      const url = buildApiUrl('/advice/messages/');
      const res = await fetch(url, {
        method: 'POST',
        headers: getApiHeaders(token),
        body: JSON.stringify({ content: reviewInput.trim(), user_id: id, subject: 'resume_advice' }),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error('review send failed', res.status, text);
        setSendError(`送信に失敗しました (${res.status})`);
        return;
      }
      const m = await res.json();
      setReviewMessages((prev) => [...prev, { id: String(m.id), sender: String(m.sender), content: m.content, body: m.content, created_at: m.created_at }]);
      setReviewInput('');
    } catch (e: any) {
      console.error(e);
      setSendError('送信に失敗しました');
    } finally {
      setSendingReview(false);
    }
  }, [reviewInput, token, id]);

  // 新規: 注釈選択中にまだスレッドがない場合、その注釈の親コメントとして投稿
  const sendNewAnnotationComment = useCallback(async () => {
    if (!annotationFilter || !reviewInput.trim()) return;
    try {
      setSendingReview(true);
      setSendError(null);
      const url = buildApiUrl('/advice/messages/');
      const body: any = { content: reviewInput.trim(), user_id: id, subject: 'resume_advice', annotation_id: annotationFilter };
      const res = await fetch(url, { method: 'POST', headers: getApiHeaders(token), body: JSON.stringify(body) });
      if (!res.ok) {
        const text = await res.text();
        console.error('review send (annotation) failed', res.status, text);
        setSendError(`送信に失敗しました (${res.status})`);
        return;
      }
      setReviewInput('');
      await loadReviewMessages();
      // threads summary refresh
      try {
        const tqs = new URLSearchParams(); tqs.set('subject', 'resume_advice'); tqs.set('mode', 'comment'); tqs.set('user_id', String(id));
        const tr = await fetch(buildApiUrl(`/advice/threads/?${tqs.toString()}`), { headers: getApiHeaders(token) });
        if (tr.ok) setThreads(await tr.json());
      } catch {}
    } catch (e: any) {
      console.error(e);
      setSendError('送信に失敗しました');
    } finally {
      setSendingReview(false);
    }
  }, [annotationFilter, reviewInput, token, id, loadReviewMessages]);

  const sendAnnotation = useCallback(async () => {
    if (!pendingAnchor) return;
    const msg = composerText.trim();
    if (!msg) return;
    try {
      setSendingReview(true);
      setSendError(null);
      // 1) create annotation
      let annotationId: string | null = null;
      let createdAnn: any = null;
      if (pendingAnchor.resumeId) {
        const annRes = await fetch(buildApiUrl('/advice/annotations/'), {
          method: 'POST',
          headers: getApiHeaders(token),
          body: JSON.stringify({
            resume: pendingAnchor.resumeId,
            subject: 'resume_advice',
            anchor_id: pendingAnchor.anchorId,
            start_offset: pendingAnchor.startOffset ?? 0,
            end_offset: pendingAnchor.endOffset ?? 0,
            quote: pendingAnchor.quote || '',
          }),
        });
        if (annRes.ok) { const ann = await annRes.json(); createdAnn = ann; annotationId = String(ann.id); }
      }
      // 2) build content (plain or interview hint)
      const content = composerAsInterview
        ? JSON.stringify({ type: 'interview_hint', message: msg })
        : msg;
      const res = await fetch(buildApiUrl('/advice/messages/'), {
        method: 'POST',
        headers: getApiHeaders(token),
        body: JSON.stringify({ content, user_id: id, subject: 'resume_advice', annotation_id: annotationId || undefined }),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error('review annotation send failed', res.status, text);
        setSendError(`送信に失敗しました (${res.status})`);
        return;
      }
      setComposerOpen(false);
      setComposerText('');
      setComposerAsInterview(false);
      setPendingAnchor(null);
      if (createdAnn) {
        setAnnotations((prev) => [...prev, createdAnn]);
        // Optimistically remove the anchor from changed markers
        try {
          const aid = String(createdAnn.anchor_id || '');
          const alias = (() => {
            if (aid.startsWith('work_content-exp_')) {
              const idx = parseInt(aid.replace('work_content-exp_', ''), 10);
              return isNaN(idx) ? aid : `work_content-job${idx + 1}`;
            }
            if (aid.startsWith('work_content-job')) {
              const n = parseInt(aid.replace('work_content-job', ''), 10);
              return isNaN(n) ? aid : `work_content-exp_${Math.max(0, n - 1)}`;
            }
            return aid;
          })();
          setResumePreview((prev) => ({
            ...prev,
            changedAnchors: (prev.changedAnchors || []).filter((x) => String(x) !== aid && String(x) !== alias),
          }));
        } catch {}
      }
      await loadReviewMessages();
    } catch (e) {
      setSendError('送信に失敗しました');
    } finally {
      setSendingReview(false);
    }
  }, [pendingAnchor, composerText, composerAsInterview, token, id, loadReviewMessages]);

  const resolveAnnotation = useCallback(async (annotationId?: string) => {
    if (!annotationId) return;
    try {
      await fetch(buildApiUrl(`/advice/annotations/${annotationId}/`), { method: 'PATCH', headers: getApiHeaders(token), body: JSON.stringify({ is_resolved: true }) });
      // refresh
      await loadReviewMessages();
      // reload annotations list for preview
      try {
        if (resumePreview?.resumeId) {
          const a = await fetch(buildApiUrl(`/advice/annotations/?resume_id=${encodeURIComponent(String(resumePreview.resumeId))}&subject=resume_advice`), { headers: getApiHeaders(token) });
          if (a.ok) setAnnotations(await a.json());
        }
      } catch {}
    } catch {}
  }, [token, resumePreview?.resumeId, loadReviewMessages]);

  const deleteAnnotation = useCallback(async (annotationId?: string) => {
    if (!annotationId) return;
    try {
      const res = await fetch(buildApiUrl(`/advice/annotations/${annotationId}/`), { method: 'DELETE', headers: getApiHeaders(token) });
      if (!res.ok && res.status !== 204) return;
      // remove from local annotations state
      setAnnotations((prev) => (Array.isArray(prev) ? prev.filter((a: any) => String(a.id) !== String(annotationId)) : prev));
      // clear threads (will be re-fetched on next render)
      try {
        const qs = new URLSearchParams();
        qs.set('subject', 'resume_advice'); qs.set('mode', 'comment'); qs.set('user_id', String(id));
        if (resumePreview?.resumeId) qs.set('resume_id', String(resumePreview?.resumeId));
        const tr = await fetch(buildApiUrl(`/advice/threads/?${qs.toString()}`), { headers: getApiHeaders(token) });
        if (tr.ok) setThreads(await tr.json());
      } catch {}
      // reset selection if current filter points to deleted one
      setAnnotationFilter((f) => (String(f) === String(annotationId) ? '' : f));
      setActiveThread((t) => (t ? t : null));
      // refresh flat list so 削除直後の一覧からも該当スレッドが消える
      try { await loadReviewMessages(); } catch {}
    } catch {}
  }, [token, id, resumePreview?.resumeId, loadReviewMessages]);

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
    // compute offsets inside anchor
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

  // Advice (タブ付き) 取得/送信
  const parseContent = (c: any) => {
    try { const obj = JSON.parse(c); if (obj && typeof obj === 'object') return obj; } catch {}
    return { message: String(c ?? '') };
  };

  const loadAdvice = useCallback(async () => {
    if (!id) return;
    try {
      const url = `${buildApiUrl('/advice/messages/')}?user_id=${id}&subject=advice`;
      const res = await fetch(url, { headers: getApiHeaders(token) });
      if (!res.ok) return;
      const list = await res.json();
      const mapped = (list || []).map((m: any) => ({
        id: String(m.id),
        senderId: String(m.sender),
        content: parseContent(m.content),
        created_at: m.created_at,
      }));
      setAdviceMessages(mapped);
    } catch {}
  }, [id, token]);

  const sendAdviceMessage = useCallback(async ({ message, type }: { message: string; type: string; }) => {
    if (!message?.trim()) return;
    try {
      setSendingAdvice(true);
      setSendError(null);
      const body = { user_id: id, subject: 'advice', content: JSON.stringify({ type, message: message.trim() }) };
      const res = await fetch(buildApiUrl('/advice/messages/'), { method: 'POST', headers: getApiHeaders(token), body: JSON.stringify(body) });
      if (!res.ok) {
        const text = await res.text();
        console.error('advice send failed', res.status, text);
        setSendError(`送信に失敗しました (${res.status})`);
        return;
      }
      await loadAdvice();
    } catch (e: any) {
      console.error(e);
      setSendError('送信に失敗しました');
    } finally {
      setSendingAdvice(false);
    }
  }, [id, token, loadAdvice]);

  useEffect(() => { loadAdvice(); }, [loadAdvice]);

  // Interview 取得/送信（subject='interview'）
  const loadInterview = useCallback(async () => {
    if (!id) return;
    try {
      const url = `${buildApiUrl('/advice/messages/')}?user_id=${id}&subject=interview`;
      const res = await fetch(url, { headers: getApiHeaders(token) });
      if (!res.ok) return;
      const list = await res.json();
      const mapped = (list || []).map((m: any) => ({
        id: String(m.id),
        senderId: String(m.sender),
        content: parseContent(m.content),
        created_at: m.created_at,
      }));
      setInterviewMessages(mapped);
    } catch {}
  }, [id, token]);

  const sendInterviewMessage = useCallback(async ({ message }: { message: string; type: string; }) => {
    if (!message?.trim()) return;
    try {
      setSendingInterview(true);
      setSendError(null);
      const body = { user_id: id, subject: 'interview', content: JSON.stringify({ message: message.trim() }) };
      const res = await fetch(buildApiUrl('/advice/messages/'), { method: 'POST', headers: getApiHeaders(token), body: JSON.stringify(body) });
      if (!res.ok) {
        const text = await res.text();
        console.error('interview send failed', res.status, text);
        setSendError(`送信に失敗しました (${res.status})`);
        return;
      }
      await loadInterview();
    } catch (e: any) {
      console.error(e);
      setSendError('送信に失敗しました');
    } finally {
      setSendingInterview(false);
    }
  }, [id, token, loadInterview]);

  useEffect(() => { loadInterview(); }, [loadInterview]);

  // Forms for message inputs
  const adviceForm = useForm<{ message: string }>({ defaultValues: { message: '' } });
  const interviewForm = useForm<{ message: string }>({ defaultValues: { message: '' } });

  // Sample data for tabs (API未実装部分のダミー)
  const adviceTabs = [
    { key: 'all', label: '全て', isGroup: false },
    { key: 'resume', label: '職務経歴書に関する質問', isGroup: false },
    { key: 'self_pr', label: '自己PRに関する質問', isGroup: false },
    {
      key: 'others',
      label: 'その他',
      isGroup: true,
      subTabs: [
        { key: 'career', label: 'キャリア' },
        { key: 'skills', label: 'スキル' },
      ],
    },
  ];

  const interviewQuestions = [
    '転職理由を教えてください。',
    '強みと弱みを教えてください。',
    '直近のプロジェクトでの役割は？',
  ];

  const Header = (
    <div className="flex items-center justify-between pr-2">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{user?.full_name || user?.username || '求職者'}</h1>
        <div className="text-sm text-gray-500">{user?.email}</div>
      </div>
      <div className="text-sm">
        {user?.is_premium ? (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">プレミアム</span>
        ) : null}
      </div>
    </div>
  );

  const Tabs = (
    <div className="mt-4 flex flex-wrap gap-2">
      {[
        { key: 'review', label: '職務経歴書の添削' },
        { key: 'interview', label: '面接対策' },
        { key: 'advice', label: 'アドバイス画面' },
        { key: 'member', label: '会員情報' },
      ].map((t) => (
        <button
          key={t.key}
          className={`px-4 py-2 rounded-md border text-sm ${
            activeTab === (t.key as any) ? 'bg-gray-800 text-white' : 'bg-white hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab(t.key as any)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {loading && <div className="text-gray-500">読み込み中...</div>}
        {error && <div className="text-red-600">{error}</div>}

        <div className="bg-white rounded-xl shadow border p-6">
          {Header}
          {Tabs}
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow border p-0 md:p-6">
          {activeTab === 'review' && (
            <div className="flex flex-col md:flex-row">
              {/* left: resume preview mock */}
              <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-gray-200">
              <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                <div className="text-lg font-semibold">職務経歴書</div>
                {resumeLoading && <span className="text-xs text-gray-500">読み込み中...</span>}
                {/* Resume selector */}
                <div className="ml-auto flex items-center gap-2">
                  <label className="text-xs text-gray-600">対象:</label>
                  <select
                    className="text-xs border rounded px-2 py-1"
                    value={selectedResumeId}
                    onChange={async (e) => {
                      const rid = e.target.value;
                      setSelectedResumeId(rid);
                      const r = (userResumes || []).find((x: any) => String(x.id) === String(rid));
                      if (r) {
                        // Build preview from this resume object (prefer v2 experiences; fallback to legacy extra_data.workExperiences)
                        const extra = r?.extra_data || {};
                        const exps = Array.isArray((r as any).experiences) ? (r as any).experiences : [];
                        const legacy = Array.isArray((extra as any).workExperiences) ? (extra as any).workExperiences : [];
                        const jobs = (exps.length > 0 ? exps : legacy) as any[];
                        const jobhistoryList = jobs.map((_: any, i: number) => `job${i + 1}`);
                        const toYM = (v?: string) => (v ? String(v).replace(/-/g, '/').slice(0, 7) : '');
                        const formValues: any = {};
                        jobs.forEach((e: any, i: number) => {
                          const since = e?.period_from ? toYM(e.period_from) : toYM(e?.startDate);
                          const isCurrent = typeof e?.is_current === 'boolean' ? e.is_current : false;
                          const to = e?.period_to ? toYM(e.period_to) : toYM(e?.endDate);
                          // Overlay achievements from legacy when v2 experiences exist but achievements empty
                          let ach: any = e?.achievements;
                          if ((exps.length > 0) && (!ach || (Array.isArray(ach) && ach.length === 0))) {
                            const legacyItem = legacy[i];
                            if (legacyItem && legacyItem.achievements) ach = legacyItem.achievements;
                          }
                          formValues[`job${i + 1}`] = {
                            company: e?.company,
                            capital: e?.capital || '',
                            work_content: e?.tasks || e?.work_content || e?.description || '',
                            since,
                            to: isCurrent && !to ? '現在' : to,
                            people: e?.team_size || e?.people || '',
                            duty: e?.position || e?.duty || '',
                            business: e?.business,
                            achievements: Array.isArray(ach) ? ach : (ach || ''),
                          };
                        });
                        setResumePreview({
                          userName: extra.fullName || user?.full_name,
                          jobhistoryList,
                          formValues,
                          resumeId: String(r.id),
                          jobSummary: (extra as any)?.jobSummary || '',
                          selfPR: r?.self_pr || '',
                          skills: (r?.skills || '').split('\n').map((s: string) => s.trim()).filter(Boolean),
                          education: Array.isArray((extra as any)?.education) ? (extra as any).education : [],
                        });
                        // reload annotations & threads for selected resume
                        try {
                          const a = await fetch(buildApiUrl(`/advice/annotations/?resume_id=${encodeURIComponent(String(r.id))}&subject=resume_advice`), { headers: getApiHeaders(token) });
                          if (a.ok) setAnnotations(await a.json());
                          const qs = new URLSearchParams();
                          qs.set('subject', 'resume_advice'); qs.set('mode', 'comment'); qs.set('user_id', String(id)); qs.set('resume_id', String(r.id));
                          const tr = await fetch(buildApiUrl(`/advice/threads/?${qs.toString()}`), { headers: getApiHeaders(token) });
                          if (tr.ok) setThreads(await tr.json());
                        } catch {}
                      }
                    }}
                  >
                    {(userResumes || []).map((r: any, i: number) => (
                      <option key={String(r.id)} value={String(r.id)}>#{i + 1} {r?.extra_data?.title || r?.desired_job || '職務経歴書'}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setDeleteMode((v) => !v)}
                    className={`rounded border px-2 py-1 text-xs ${deleteMode ? 'bg-red-600 text-white border-red-700' : 'bg-white text-red-700 border-red-300'}`}
                    title="下線削除モード（ONでプレビューの下線をクリックすると削除）"
                  >{deleteMode ? '下線削除: ON' : '下線削除: OFF'}</button>
                </div>
              </div>
                {resumeError && <div className="text-sm text-red-600 mb-3">{resumeError}</div>}
                {resumePreview.jobhistoryList.length === 0 && !resumePreview.jobSummary && !resumePreview.selfPR ? (
                  <div className="h-[600px] rounded-md border bg-gray-50 p-4 text-gray-500 flex items-center justify-center text-center">
                    職務経歴書が登録されていません。
                  </div>
                ) : (
                  <div className="max-h-[600px] overflow-y-auto" data-admin-annot="no-underline" data-admin-annot-delete={deleteMode ? 'on' : 'off'}>
                    <div
                      className="relative md:pr-[260px] w-full"
                      ref={previewWrapRef}
                      onMouseUp={handlePreviewMouseUp}
                      onClick={(e) => {
                        try {
                          const container = previewWrapRef.current;
                          let el = e.target as HTMLElement | null;
                          while (el && el !== container) {
                            if (el.hasAttribute && el.hasAttribute('data-annot-ref')) {
                              const ref = el.getAttribute('data-annot-ref') || '';
                              if (ref.startsWith('ann-')) {
                                const id = ref.replace('ann-', '');
                                if (deleteMode) {
                                  const idx = annotations.findIndex((a: any) => String(a.id) === String(id));
                                  const label = idx >= 0 ? `#${idx + 1} (${annotations[idx]?.anchor_id || ''})` : `#?`;
                                  const ok = window.confirm(`${label} の下線と紐づくスレッドを削除しますか？この操作は元に戻せません。`);
                                  if (ok) {
                                    deleteAnnotation(id);
                                    return;
                                  }
                                } else {
                                  setAnnotationFilter(String(id));
                                  setActiveThread(null);
                                  setDidAutoSelectThread(false);
                                }
                                try {
                                  const panel = document.querySelector('#admin-thread-toolbar');
                                  panel && (panel as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                } catch {}
                              }
                              break;
                            }
                            el = el.parentElement as HTMLElement | null;
                          }
                        } catch {}
                      }}
                    >
                      <ResumePreview
                        userName={resumePreview.userName || user?.full_name}
                        jobhistoryList={resumePreview.jobhistoryList}
                        formValues={resumePreview.formValues}
                        jobSummary={resumePreview.jobSummary}
                        selfPR={resumePreview.selfPR}
                        skills={resumePreview.skills}
                        education={resumePreview.education}
                        annotations={annotations}
                        className="w-full"
                        changedAnchors={resumePreview.changedAnchors}
                        changedRangeIds={changedRangeIds}
                      />
                      {/* Hide underline style for annotation marks in admin preview */}
                      <style jsx>{`
                        [data-admin-annot="no-underline"] [data-annot-scope="resume-preview"] mark {
                          box-shadow: none !important;
                        }
                        [data-admin-annot-delete="on"] [data-annot-scope="resume-preview"] mark {
                          outline: 2px dashed rgba(220,38,38,0.6);
                          cursor: pointer;
                        }
                      `}</style>
                      <div className="hidden md:block absolute inset-0 pointer-events-none">
                        {reviewMessages.filter(m => m.isAnnotation).map((m) => {
                          const topGuess = m.annotationId && markTops[m.annotationId] !== undefined ? markTops[m.annotationId] : (m.anchor?.top || 0);
                          const markSelector = m.annotationId ? `[data-annot-ref="ann-${m.annotationId}"]` : '';
                          // Hide overlays for resolved annotations
                          if (m.annotationId) {
                            const ann = annotations.find((a: any) => String(a.id) === String(m.annotationId));
                            if (ann && ann.is_resolved) return null;
                          }
                          const colorOf = (id: string) => { const palette = ['#E56B6F','#6C9BD2','#7FB069','#E6B31E','#A77BD1','#E58F6B']; let h=0; for (let i=0;i<id.length;i++) h=(h*31+id.charCodeAt(i))>>>0; return palette[h%palette.length]; };
                          const color = m.annotationId ? colorOf(m.annotationId) : '#E5A6A6';
                          const idx = m.annotationId ? (annotations.findIndex(a => String(a.id) === String(m.annotationId)) + 1) : undefined;
                          // connector line removed
                          return (
                          <div
                            key={m.id}
                            className="md:absolute md:right-[-240px] md:w-[220px] pointer-events-auto"
                            style={{ top: Math.max(0, topGuess - 8) }}
                            onClick={() => {
                              if (m.annotationId) {
                                const sel = `[data-annot-ref=\\"ann-${m.annotationId}\\"]`;
                                const el = previewWrapRef.current?.querySelector(sel) as HTMLElement | null;
                                if (el && previewWrapRef.current) {
                                  previewWrapRef.current.scrollTo({ top: (markTops[m.annotationId] || 0) - 40, behavior: 'smooth' });
                                  el.classList.add('ring-2','ring-[#E5A6A6]');
                                  setTimeout(() => el.classList.remove('ring-2','ring-[#E5A6A6]'), 1200);
                                }
                                // Also narrow the list to this annotation
                                setAnnotationFilter(String(m.annotationId));
                                setActiveThread(null);
                                setDidAutoSelectThread(false);
                                try {
                                  const panel = document.querySelector('#admin-thread-toolbar');
                                  panel && (panel as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                } catch {}
                              }
                            }}
                          >
                            {/* connector line removed */}
                            <div className="border bg-white rounded-md shadow-sm" style={{ borderColor: color }} onMouseEnter={() => { try { if (markSelector) (previewWrapRef.current?.querySelector(markSelector) as HTMLElement)?.classList.add('ring-2','ring-[#E5A6A6]'); } catch {} }} onMouseLeave={() => { try { if (markSelector) (previewWrapRef.current?.querySelector(markSelector) as HTMLElement)?.classList.remove('ring-2','ring-[#E5A6A6]'); } catch {} }}>
                              <div className="px-2 pt-1">
                                {typeof idx === 'number' && (
                                  <span className="inline-flex items-center justify-center text-[10px] leading-[10px] rounded-sm px-[4px] py-[1px] mr-2" style={{ background: color + '22', color, border: `1px solid ${color}` }}>{idx}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 px-3 py-2 border-b text-sm">
                                <div className="h-6 w-6 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs">A</div>
                                <div className="text-secondary-800 truncate">advisor</div>
                                <div className="ml-auto text-xs text-secondary-500">{new Date(m.created_at).toLocaleString('ja-JP')}</div>
                              </div>
                              {m.anchor?.quote && (
                                <div className="px-3 pt-2 text-xs text-secondary-600"><span className="bg-yellow-100 px-1 py-[2px] rounded">{m.anchor.quote}</span></div>
                              )}
                              <div className="px-3 py-2 text-sm text-secondary-800 whitespace-pre-wrap">
                                {(m as any).kind === 'interview' && (
                                  <span className="inline-block text-[10px] px-1.5 py-[1px] mr-2 rounded-full bg-blue-100 text-blue-700 border border-blue-200 align-middle">面接</span>
                                )}
                                <span className="align-middle">{m.body || m.content}</span>
                              </div>
                              <div className="px-3 pb-2 text-xs text-primary-700 flex gap-3">
                                <button
                                  className="hover:underline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Open the corresponding thread view
                                    const tid = String((m as any).parentId || m.id);
                                    setActiveThread(tid);
                                    setDidAutoSelectThread(true);
                                    try {
                                      const panel = document.querySelector('#admin-thread-toolbar');
                                      panel && (panel as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                    } catch {}
                                  }}
                                >返信</button>
                                {/* 解決ボタンは非表示に変更 */}
                                <button className={`hover:underline text-red-700 ${!m.annotationId ? 'opacity-40 cursor-not-allowed' : ''}`} onClick={(e) => { e.stopPropagation(); deleteAnnotation(m.annotationId); }} disabled={!m.annotationId}>削除</button>
                              </div>
                            </div>
                          </div>
                          );
                        })}
                      </div>

                      {composerOpen && pendingAnchor && composerPos && (
                        <div
                          className="absolute z-10 w-[260px]"
                          style={{ top: composerPos.top, left: Math.max(composerPos.left, 16) }}
                          data-annot-ui="composer"
                          onMouseDown={(e) => e.stopPropagation()}
                          onMouseUp={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        >
                      <div className="border border-gray-400 bg-white rounded-md shadow-lg p-2">
                        <div className="text-xs text-secondary-600 mb-1">コメント対象: <span className="font-mono">{pendingAnchor.anchorId}</span></div>
                        {pendingAnchor.quote && (
                          <div className="text-xs text-secondary-700 mb-2"><span className="bg-yellow-100 px-1 py-[2px] rounded">{pendingAnchor.quote}</span></div>
                        )}
                        <textarea className="w-full h-20 border rounded px-2 py-1 text-sm" value={composerText} onChange={(e) => setComposerText(e.target.value)} placeholder="コメント内容を入力" />
                        <div className="mt-2 flex items-center gap-2 text-xs text-secondary-700">
                          <input id="asInterview" type="checkbox" checked={composerAsInterview} onChange={(e) => setComposerAsInterview(e.target.checked)} />
                          <label htmlFor="asInterview">面接で聞かれそうなポイントとして投稿</label>
                        </div>
                        <div className="mt-2 flex justify-end gap-2">
                          <button className="text-sm px-2 py-1 border rounded hover:bg-secondary-50" onClick={() => { setComposerOpen(false); setPendingAnchor(null); setComposerText(''); }}>キャンセル</button>
                          <button className="text-sm px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700" onClick={() => sendAnnotation()} disabled={sendingReview}>コメント追加</button>
                        </div>
                      </div>
                    </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {/* right: comments + input */}
              <div className="w-full md:w-[360px] p-6">
                <div className="text-lg font-semibold mb-3">職務内容について</div>
                {/* Threads toolbar */}
                <div id="admin-thread-toolbar" className="sticky top-0 z-[1] bg-white/80 rounded-md p-2 mb-2 flex items-center gap-2 overflow-x-auto">
                  <select value={annotationFilter} onChange={(e) => { setAnnotationFilter(e.target.value); setActiveThread(null); setDidAutoSelectThread(false); }} className="rounded border px-2 py-1 text-xs">
                    <option value="">注釈: すべて</option>
                    {annotations.map((a: any, i: number) => (<option key={String(a.id)} value={String(a.id)}>#{i+1} - {a.anchor_id}</option>))}
                  </select>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="rounded border px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-gray-700 ring-inset">
                    <option value="all">全件</option>
                    <option value="unresolved">未解決のみ</option>
                    <option value="resolved">解決済みのみ</option>
                  </select>
                  <input
                    value={threadSearch}
                    onChange={(e) => {
                      const v = e.target.value;
                      const m = v.match(/^#(\d+)\s*/);
                      if (m) {
                        const idx = parseInt(m[1], 10);
                        const ann = annotations[idx - 1];
                        if (ann) {
                          setAnnotationFilter(String(ann.id));
                          setActiveThread(null);
                          setDidAutoSelectThread(false);
                        }
                        setThreadSearch(v.slice(m[0].length));
                      } else {
                        setThreadSearch(v);
                      }
                    }}
                    placeholder="検索..."
                    className="ml-auto rounded border px-2 py-1 text-xs w-[150px] focus:outline-none focus:ring-2 focus:ring-gray-700 ring-inset"
                  />
                </div>

                <div className="h-[460px] overflow-y-auto border rounded-md p-3 space-y-2 bg-gray-50">
                  {/* Threads quick select (hidden when an annotation is selected) */}
                  {annotationFilter ? (
                    <div className="text-xs text-gray-600 mb-2">
                      注釈 #{annotations.findIndex(a => String(a.id) === String(annotationFilter)) + 1} の全メッセージを表示中
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {threadsFiltered.map((t: any, i: number) => {
                        const annId = String(t.annotation?.id || '');
                        const idx = annId ? (annotations.findIndex(a => String(a.id) === annId) + 1) : (i + 1);
                        const tid = String(t.thread_id || '');
                        return (
                          <button
                            key={tid || i}
                            onClick={() => { setActiveThread(tid); setDidAutoSelectThread(true); }}
                            title={t.annotation?.anchor_id || ''}
                            className={`text-xs px-2 py-1 rounded border ${String(activeThread) === tid ? 'bg-gray-100 border-gray-400' : 'bg-white border-gray-300'}`}
                          >
                            #{idx} ({t.messages_count})
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {reviewMessages.length === 0 && (
                    <div className="text-gray-400 text-sm text-center py-8">まだコメントがありません。</div>
                  )}
                  {(() => {
                    // Determine the message list to render
                    let msgs: ReviewMsg[] = [];
                    const selectedThreadMsgs = activeThread ? threadMessages[activeThread] : undefined;
                    if (activeThread) {
                      // When a thread is selected, prefer its messages (may be undefined while loading)
                      msgs = (selectedThreadMsgs || []) as any;
                    } else if (annotationFilter) {
                      // Show messages for this annotation:
                      // 1) 親メッセージ（annotationId が一致）
                      // 2) その親にぶら下がる返信（annotationId が null でも parent が一致）
                      const parentIds = new Set<string>(
                        (threads || [])
                          .filter((t: any) => String(t?.annotation?.id || '') === String(annotationFilter))
                          .map((t: any) => String(t.thread_id || ''))
                      );
                      msgs = reviewMessages.filter((x: any) => {
                        const aid = String(x?.annotationId || '');
                        const pid = String((x as any)?.parentId || '');
                        return aid === String(annotationFilter) || (pid && parentIds.has(pid));
                      });
                    } else {
                      msgs = reviewMessages;
                    }
                    // Apply statusFilter if needed using annotations
                    const annMap: Record<string, any> = {};
                    (annotations || []).forEach((a: any) => { annMap[String(a.id)] = a; });
                    if (statusFilter === 'unresolved') {
                      msgs = msgs.filter((x: any) => !x.annotationId || !annMap[String(x.annotationId)] || !annMap[String(x.annotationId)].is_resolved);
                    } else if (statusFilter === 'resolved') {
                      msgs = msgs.filter((x: any) => x.annotationId && annMap[String(x.annotationId)] && annMap[String(x.annotationId)].is_resolved);
                    }
                    // If a thread is selected but not loaded yet, show a lightweight loading indicator
                    if (activeThread && selectedThreadMsgs === undefined) {
                      return (
                        <div key="__loading__" className="text-center text-xs text-gray-500 py-6">
                          スレッドを読み込み中...
                        </div>
                      ) as any;
                    }
                    return msgs.map((m) => {
                    const isAdmin = currentUser && String(m.sender) === String(currentUser.id);
                    const fromUser = String(m.sender) === String(id); // 対象求職者からの返信
                    const colorOf = (annId: string) => { const palette = ['#E56B6F','#6C9BD2','#7FB069','#E6B31E','#A77BD1','#E58F6B']; let h=0; for (let i=0;i<annId.length;i++) h=(h*31+annId.charCodeAt(i))>>>0; return palette[h%palette.length]; };
                    const annId = (m as any).annotationId as string | undefined;
                    const color = annId ? colorOf(annId) : undefined;
                    const idx = annId ? (annotations.findIndex(a => String(a.id) === String(annId)) + 1) : undefined;
                    const jump = () => {
                      if (!annId) return;
                      const el = previewWrapRef.current?.querySelector(`[data-annot-ref=\\"ann-${annId}\\"]`) as HTMLElement | null;
                      if (el && previewWrapRef.current) {
                        const top = markTops[annId] ?? 0;
                        previewWrapRef.current.scrollTo({ top: Math.max(0, top - 40), behavior: 'smooth' });
                        el.classList.add('ring-2','ring-[#E5A6A6]');
                        setTimeout(() => el.classList.remove('ring-2','ring-[#E5A6A6]'), 1200);
                      }
                    };
                    return (
                      <div key={m.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                        <div onClick={jump} className={`max-w-[85%] rounded-md p-3 text-sm cursor-pointer ${isAdmin ? 'bg-gray-200 text-gray-900 border' : 'bg-gray-800 text-white'} ${fromUser ? 'ring-1 ring-blue-300' : ''}`} style={color ? { borderColor: color, boxShadow: isAdmin ? `inset 4px 0 0 ${color}` : undefined } : undefined}>
                          <div className="mb-1 flex items-center gap-2">
                            <span className={`text-[10px] px-1.5 py-[1px] rounded-full border ${fromUser ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>{fromUser ? 'ユーザー' : '管理者'}</span>
                            {(m as any).parentId && (
                              <span className="text-[10px] px-1.5 py-[1px] rounded-full bg-amber-50 text-amber-700 border border-amber-200">返信</span>
                            )}
                            {idx && (
                              <span className="text-[10px] px-1.5 py-[1px] rounded-sm" style={ color ? { background: color + '22', color, border: `1px solid ${color}` } : undefined }># {idx}</span>
                            )}
                          </div>
                          {idx && (
                            <span className="inline-flex items-center justify-center text-[10px] leading-[10px] rounded-sm px-[4px] py-[1px] mr-2" style={ color ? { background: color + '22', color, border: `1px solid ${color}` } : undefined }>{idx}</span>
                          )}
                          <div>
                            {(m as any).kind === 'interview' && (
                              <span className="inline-block text-[10px] px-1.5 py-[1px] mr-2 rounded-full bg-blue-100 text-blue-700 border border-blue-200 align-middle">面接</span>
                            )}
                            <span className="align-middle">{(m as any).body || m.content}</span>
                          </div>
                          <div className="text-[11px] opacity-70 mt-1">{new Date(m.created_at).toLocaleString()}</div>
                        </div>
                      </div>
                    );
                  }); })()}
                </div>
                {/* composer: reply to active thread, or to canonical thread when an annotation is selected */}
                {activeThread || (annotationFilter && canonicalThreadId) ? (
                  <div className="mt-4">
                    <form onSubmit={(e) => { e.preventDefault(); activeThread ? sendThreadReply() : (canonicalThreadId && sendThreadReply(canonicalThreadId)); }} className="flex gap-2">
                      <input
                        className="flex-1 rounded-md border px-3 py-2"
                        placeholder={activeThread ? 'このスレッドに返信...' : `#${annotations.findIndex(a => String(a.id) === String(annotationFilter)) + 1} に返信...`}
                        value={threadReplyInput}
                        onChange={(e) => setThreadReplyInput(e.target.value)}
                      />
                      <button type="submit" className="rounded-md bg-gray-800 text-white px-4 py-2 disabled:opacity-50" disabled={!threadReplyInput.trim()}>
                        返信
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="mt-4">
                    <form onSubmit={(e) => { e.preventDefault(); annotationFilter ? sendNewAnnotationComment() : sendReviewMessage(); }} className="flex gap-2">
                      <input
                        className="flex-1 rounded-md border px-3 py-2"
                        placeholder={annotationFilter ? `注釈 #${annotations.findIndex(a => String(a.id) === String(annotationFilter)) + 1} の最初のコメントを投稿...` : '入力してください。'}
                        value={reviewInput}
                        onChange={(e) => setReviewInput(e.target.value)}
                      />
                      <button type="submit" disabled={sendingReview} className="rounded-md bg-gray-800 text-white px-4 py-2 disabled:opacity-50">{sendingReview ? '送信中…' : '送信'}</button>
                    </form>
                    {sendError && <div className="text-red-600 text-sm mt-2">{sendError}</div>}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'interview' && (
            <InterviewPreparationTab
              control={interviewForm.control}
              errors={interviewForm.formState.errors}
              sendingInterview={sendingInterview}
              handleSubmit={interviewForm.handleSubmit}
              sendInterviewMessage={sendInterviewMessage as any}
              interviewQuestions={interviewQuestions}
              interviewAnswers={interviewMessages as any}
              currentUserIdInterview={String(id)}
              reset={interviewForm.reset}
              refetchInterview={() => {}}
            />
          )}

          {activeTab === 'advice' && (
            <AdviceScreenTab
              adviceTabs={adviceTabs}
              selectedAdviceTab={selectedAdviceTab}
              setSelectedAdviceTab={setSelectedAdviceTab}
              selectedAdviceSubTab={selectedAdviceSubTab}
              setSelectedAdviceSubTab={setSelectedAdviceSubTab}
              adviceMessages={adviceMessages}
              currentUserIdAdvice={String(id)}
              sendingAdvice={sendingAdvice}
              handleSubmit={adviceForm.handleSubmit}
              sendAdviceMessage={sendAdviceMessage as any}
              messageEndRef={{ current: null }}
              reset={adviceForm.reset}
              refetchAdvice={() => {}}
              CircleMinus={<span>-</span>}
              CircleArrow={<span>›</span>}
              control={adviceForm.control}
              errors={adviceForm.formState.errors}
            />
          )}

          {activeTab === 'member' && (
            <div className="p-6 space-y-6">
              <div className="rounded-xl border p-6">
                <div className="text-lg font-semibold mb-4">会員概要</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">氏名</span>
                    <div className="font-medium">{user?.full_name || user?.username}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">メール</span>
                    <div className="font-medium">{user?.email}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">登録日</span>
                    <div className="font-medium">{(() => {
                      const dt = effectiveRegisteredAt || user?.created_at;
                      return dt ? new Date(dt).toLocaleDateString('ja-JP') : '—';
                    })()}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">年齢</span>
                    <div className="font-medium">{overview?.attributes?.age ?? '—'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">最終ログイン</span>
                    <div className="font-medium">{overview?.attributes?.last_login_at ? new Date(overview.attributes.last_login_at).toLocaleString() : '—'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">最終課金日</span>
                    <div className="font-medium">{overview?.attributes?.last_payment_at ? new Date(overview.attributes.last_payment_at).toLocaleString() : '—'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">最終添削者</span>
                    <div className="font-medium">{overview?.review?.last_reviewed_by_name || '—'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">プラン</span>
                    <div className="font-medium">{overview?.user?.plan_tier || (overview?.user?.is_premium ? 'premium' : 'free')}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">最新アクティビティ</span>
                    <div className="font-medium">{overview?.latest_activity_at ? new Date(overview.latest_activity_at).toLocaleString() : '—'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">date_joined</span>
                    <div className="font-medium">{overview?.user?.date_joined ? new Date(overview.user.date_joined).toLocaleDateString() : '—'}</div>
                  </div>
                </div>
              </div>

              {/* プラン変更（管理者） */}
              <div className="rounded-xl border p-6">
                <div className="text-lg font-semibold mb-4">プラン変更（管理者）</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-3">
                    <label className="w-28 text-gray-600">plan_tier</label>
                    <select value={planTierInput} onChange={(e)=>setPlanTierInput(e.target.value)} className="border rounded px-2 py-1">
                      <option value="">free</option>
                      <option value="starter">starter</option>
                      <option value="standard">standard</option>
                      <option value="premium">premium</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="w-28 text-gray-600">premium_expiry</label>
                    <input
                      type="datetime-local"
                      value={premiumExpiryInput}
                      onChange={(e)=>setPremiumExpiryInput(e.target.value)}
                      className="border rounded px-2 py-1"
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    className="px-4 py-2 rounded-md bg-gray-800 text-white disabled:opacity-50"
                    disabled={planSaving}
                  onClick={async ()=>{
                    if (!id) return;
                    try {
                      setPlanSaving(true);
                      setPlanError(null);
                      const payload: any = { plan_tier: planTierInput };
                      // 明示的に is_premium を同期（バック側でも自動補完するが、フロントでも一貫させる）
                      payload.is_premium = (planTierInput === 'standard' || planTierInput === 'premium');
                      if (premiumExpiryInput) {
                        const iso = new Date(premiumExpiryInput).toISOString();
                        payload.premium_expiry = iso;
                      } else {
                        payload.premium_expiry = '';
                        }
                        const res = await fetch(buildApiUrl(`/admin/users/${id}/plan/`), {
                          method: 'PATCH',
                          headers: getApiHeaders(token),
                          body: JSON.stringify(payload),
                        });
                        if (!res.ok) {
                          const t = await res.text();
                          setPlanError(`更新に失敗しました (${res.status})`);
                          console.error('plan update failed', res.status, t);
                          return;
                        }
                        toast.success('プランを更新しました');
                        await reloadOverview();
                      } catch (e) {
                        setPlanError('更新に失敗しました');
                      } finally {
                        setPlanSaving(false);
                      }
                    }}
                  >{planSaving ? '更新中…' : '更新する'}</button>
                  {planError && <div className="text-red-600 text-sm">{planError}</div>}
                </div>
              </div>

              <div className="rounded-xl border p-6">
                <div className="text-lg font-semibold mb-4">リソース状況</div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">履歴書</span>
                    <div className="font-medium">{overview?.counts?.resumes ?? 0}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">職歴エントリ</span>
                    <div className="font-medium">{overview?.counts?.experiences ?? 0}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">応募（求職者として）</span>
                    <div className="font-medium">{overview?.counts?.applications_as_applicant ?? 0}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">スカウト受信</span>
                    <div className="font-medium">{overview?.counts?.scouts_received ?? 0}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">スカウト送信（企業）</span>
                    <div className="font-medium">{overview?.counts?.scouts_sent ?? 0}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">メッセージ総数</span>
                    <div className="font-medium">{overview?.counts?.messages_total ?? 0}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border p-6">
                <div className="text-lg font-semibold mb-4">アクション</div>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => sendNudgeMessage('login')} className="px-4 py-2 rounded-md border bg-white hover:bg-gray-50">ログイン催促メッセージを送る</button>
                  <button onClick={() => sendNudgeMessage('billing')} className="px-4 py-2 rounded-md border bg-white hover:bg-gray-50">課金案内メッセージを送る</button>
                </div>
              </div>

              <div className="rounded-xl border p-6">
                <div className="text-lg font-semibold mb-4">アプローチされた会社</div>
                <div className="text-gray-500 text-sm">データ準備中</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
