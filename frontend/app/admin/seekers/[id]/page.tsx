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
import type { PlanTier } from '@/config/plans';

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
  type AnchorMeta = { anchorId: string; top: number; quote?: string };
  type ReviewMsg = { id:string; sender:string; content:string; created_at:string; body?: string; isAnnotation?: boolean; anchor?: AnchorMeta; kind?: 'review' | 'interview' };
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
  // Plan change controls
  const [planTierInput, setPlanTierInput] = useState<PlanTier | ''>('');
  const [planSaving, setPlanSaving] = useState(false);
  // Annotations + positions
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [markTops, setMarkTops] = useState<Record<string, number>>({});
  // Threads (comment-mode)
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<Record<string, ReviewMsg[]>>({});
  const [statusFilter, setStatusFilter] = useState<'all' | 'unresolved' | 'resolved'>('all');
  const [annotationFilter, setAnnotationFilter] = useState<string>('');
  const [threadSearch, setThreadSearch] = useState('');
  const [didAutoSelectThread, setDidAutoSelectThread] = useState(false);
  const [threadReplyInput, setThreadReplyInput] = useState('');

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
            // Init plan selector from overview
            const t = (ov?.user?.plan_tier as PlanTier | '') || '';
            setPlanTierInput(t);
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

  const savePlanTier = useCallback(async () => {
    if (!id) return;
    setPlanSaving(true);
    try {
      const tier = planTierInput || '';
      const url = buildApiUrl(API_CONFIG.endpoints.adminUserPlan(String(id)));
      const body = {
        plan_tier: tier,
        // auto align is_premium: standard/premium -> true, otherwise false
        is_premium: tier === 'standard' || tier === 'premium',
      };
      const res = await fetch(url, {
        method: 'PATCH',
        headers: getApiHeaders(token),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || '更新に失敗しました');
      }
      const updated = await res.json();
      // reflect in overview state
      setOverview((prev: any) => ({
        ...(prev || {}),
        user: {
          ...((prev && prev.user) || {}),
          plan_tier: updated?.plan_tier || tier,
          is_premium: updated?.is_premium ?? (tier === 'standard' || tier === 'premium'),
        },
      }));
      toast.success('プランを更新しました');
    } catch (e: any) {
      toast.error(e?.message || 'プラン更新に失敗しました');
    } finally {
      setPlanSaving(false);
    }
  }, [API_CONFIG, id, planTierInput, token]);

  const currentUser = useMemo(() => {
    if (typeof window === 'undefined') return null as any;
    try { return JSON.parse(localStorage.getItem('current_user_v2') || 'null'); } catch { return null as any; }
  }, []);

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
    if (statusFilter === 'unresolved') list = list.filter((t: any) => !!t?.unresolved);
    if (statusFilter === 'resolved') list = list.filter((t: any) => t?.unresolved === false);
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
  }, [threads, statusFilter, annotationFilter, threadSearch]);

  useEffect(() => {
    if (didAutoSelectThread) return;
    const first = threadsFiltered && threadsFiltered[0];
    const tid = first?.thread_id ? String(first.thread_id) : null;
    if (tid) {
      setActiveThread(tid);
      setDidAutoSelectThread(true);
    }
  }, [threadsFiltered, didAutoSelectThread]);

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
          if (Array.isArray(data) && data.length > 0) {
            const tid = data[0]?.thread_id ? String(data[0].thread_id) : null;
            if (tid) {
              setActiveThread(tid);
              setDidAutoSelectThread(true);
            }
          }
        }
      } catch {}
    };
    run();
  }, [annotationFilter, id, token]);

  // Load thread messages on selection
  useEffect(() => {
    const load = async (parentId: string) => {
      try {
        const qs = new URLSearchParams();
        qs.set('subject', 'resume_advice');
        qs.set('user_id', String(id));
        qs.set('parent_id', parentId);
        const res = await fetch(buildApiUrl(`/advice/messages/?${qs.toString()}`), { headers: getApiHeaders(token) });
        if (!res.ok) return;
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

  const sendThreadReply = useCallback(async () => {
    if (!activeThread || !threadReplyInput.trim()) return;
    try {
      const list = threadMessages[activeThread] || [];
      const root = list.find((m) => !(m as any).parentId) || list[0];
      const annotationId = (root as any)?.annotationId || (threads.find((t: any) => String(t.thread_id) === String(activeThread))?.annotation?.id);
      const body: any = { user_id: id, subject: 'resume_advice', content: threadReplyInput.trim(), parent_id: activeThread };
      if (annotationId) body.annotation_id = String(annotationId);
      const res = await fetch(buildApiUrl('/advice/messages/'), { method: 'POST', headers: getApiHeaders(token), body: JSON.stringify(body) });
      if (!res.ok) throw new Error('failed');
      setThreadReplyInput('');
      // refresh thread
      setThreadMessages((prev) => ({ ...prev, [activeThread]: undefined as any }));
      const qs = new URLSearchParams();
      qs.set('subject', 'resume_advice'); qs.set('user_id', String(id)); qs.set('parent_id', activeThread);
      const next = await fetch(buildApiUrl(`/advice/messages/?${qs.toString()}`), { headers: getApiHeaders(token) });
      if (next.ok) {
        const data = await next.json();
        const mapped: ReviewMsg[] = (data || []).map((m: any) => ({ id: String(m.id), sender: String(m.sender), content: m.content, body: m.content, created_at: m.created_at, isAnnotation: !!m.annotation, annotationId: m.annotation ? String(m.annotation) : undefined, parentId: m.parent ? String(m.parent) : null }));
        setThreadMessages((prev) => ({ ...prev, [activeThread]: mapped }));
      }
      // refresh threads summary
      try {
        const tqs = new URLSearchParams(); tqs.set('subject', 'resume_advice'); tqs.set('mode', 'comment'); tqs.set('user_id', String(id));
        const tr = await fetch(buildApiUrl(`/advice/threads/?${tqs.toString()}`), { headers: getApiHeaders(token) });
        if (tr.ok) setThreads(await tr.json());
      } catch {}
    } catch {}
  }, [activeThread, threadReplyInput, id, token, threadMessages, threads]);

  // Selection/annotation state for inline comments
  const previewWrapRef = useRef<HTMLDivElement | null>(null);
  const [pendingAnchor, setPendingAnchor] = useState<AnchorMeta | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [composerPos, setComposerPos] = useState<{ top: number; left: number } | null>(null);

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
      const res = await fetch(buildApiUrl('/advice/messages/'), {
        method: 'POST',
        headers: getApiHeaders(token),
        body: JSON.stringify({ content: msg, user_id: id, subject: 'resume_advice', annotation_id: annotationId || undefined }),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error('review annotation send failed', res.status, text);
        setSendError(`送信に失敗しました (${res.status})`);
        return;
      }
      setComposerOpen(false);
      setComposerText('');
      setPendingAnchor(null);
      if (createdAnn) setAnnotations((prev) => [...prev, createdAnn]);
      await loadReviewMessages();
    } catch (e) {
      setSendError('送信に失敗しました');
    } finally {
      setSendingReview(false);
    }
  }, [pendingAnchor, composerText, token, id, loadReviewMessages]);

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
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-semibold">職務経歴書</div>
                  {resumeLoading && <span className="text-xs text-gray-500">読み込み中...</span>}
                </div>
                {resumeError && <div className="text-sm text-red-600 mb-3">{resumeError}</div>}
                {resumePreview.jobhistoryList.length === 0 ? (
                  <div className="h-[600px] rounded-md border bg-gray-50 p-4 text-gray-500 flex items-center justify-center text-center">
                    職務経歴書が登録されていません。
                  </div>
                ) : (
                  <div className="max-h-[600px] overflow-y-auto">
                    <div
                      className="relative pr-[260px] w-full"
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
                                setAnnotationFilter(String(id));
                                setActiveThread(null);
                                setDidAutoSelectThread(false);
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
                      />
                      <div className="absolute inset-0 pointer-events-none">
                        {reviewMessages.filter(m => m.isAnnotation).map((m) => {
                          const topGuess = m.annotationId && markTops[m.annotationId] !== undefined ? markTops[m.annotationId] : (m.anchor?.top || 0);
                          const markSelector = m.annotationId ? `[data-annot-ref="ann-${m.annotationId}"]` : '';
                          const colorOf = (id: string) => { const palette = ['#E56B6F','#6C9BD2','#7FB069','#E6B31E','#A77BD1','#E58F6B']; let h=0; for (let i=0;i<id.length;i++) h=(h*31+id.charCodeAt(i))>>>0; return palette[h%palette.length]; };
                          const color = m.annotationId ? colorOf(m.annotationId) : '#E5A6A6';
                          const idx = m.annotationId ? (annotations.findIndex(a => String(a.id) === String(m.annotationId)) + 1) : undefined;
                          // connector line removed
                          return (
                          <div
                            key={m.id}
                            className="absolute right-[-240px] w-[220px] pointer-events-auto"
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
                                    if ((m as any).annotationId) {
                                      setAnnotationFilter(String((m as any).annotationId));
                                      setActiveThread(null);
                                      setDidAutoSelectThread(false);
                                      // スレッドツールバーへ軽くスクロール
                                      try {
                                        const panel = document.querySelector('#admin-thread-toolbar');
                                        panel && (panel as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                      } catch {}
                                    }
                                  }}
                                >返信</button>
                                <button className={`hover:underline ${!m.annotationId ? 'opacity-40 cursor-not-allowed' : ''}`} onClick={(e) => { e.stopPropagation(); resolveAnnotation(m.annotationId); }} disabled={!m.annotationId}>解決</button>
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
                  {/* Threads quick select */}
                  <div className="flex flex-wrap gap-2">
                    {threadsFiltered.map((t: any, i: number) => {
                      const annId = String(t.annotation?.id || '');
                      const idx = annId ? (annotations.findIndex(a => String(a.id) === annId) + 1) : (i + 1);
                      const tid = String(t.thread_id || '');
                      return (
                        <button key={tid || i} onClick={() => setActiveThread(tid)} title={t.annotation?.anchor_id || ''} className={`text-xs px-2 py-1 rounded border ${String(activeThread) === tid ? 'bg-gray-100 border-gray-400' : 'bg-white border-gray-300'}`}>#{idx} ({t.messages_count})</button>
                      );
                    })}
                  </div>

                  {reviewMessages.length === 0 && (
                    <div className="text-gray-400 text-sm text-center py-8">まだコメントがありません。</div>
                  )}
                  {reviewMessages.map((m) => {
                    const isAdmin = currentUser && String(m.sender) === String(currentUser.id);
                    const colorOf = (id: string) => { const palette = ['#E56B6F','#6C9BD2','#7FB069','#E6B31E','#A77BD1','#E58F6B']; let h=0; for (let i=0;i<id.length;i++) h=(h*31+id.charCodeAt(i))>>>0; return palette[h%palette.length]; };
                    const id = (m as any).annotationId as string | undefined;
                    const color = id ? colorOf(id) : undefined;
                    const idx = id ? (annotations.findIndex(a => String(a.id) === String(id)) + 1) : undefined;
                    const jump = () => {
                      if (!id) return;
                      const el = previewWrapRef.current?.querySelector(`[data-annot-ref=\\"ann-${id}\\"]`) as HTMLElement | null;
                      if (el && previewWrapRef.current) {
                        const top = markTops[id] ?? 0;
                        previewWrapRef.current.scrollTo({ top: Math.max(0, top - 40), behavior: 'smooth' });
                        el.classList.add('ring-2','ring-[#E5A6A6]');
                        setTimeout(() => el.classList.remove('ring-2','ring-[#E5A6A6]'), 1200);
                      }
                    };
                    return (
                      <div key={m.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                        <div onClick={jump} className={`max-w-[85%] rounded-md p-3 text-sm cursor-pointer ${isAdmin ? 'bg-gray-200 text-gray-900 border' : 'bg-gray-800 text-white'}`} style={color ? { borderColor: color, boxShadow: isAdmin ? `inset 4px 0 0 ${color}` : undefined } : undefined}>
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
                  })}
                </div>
                {/* message box */}
                <div className="mt-4">
                  <form onSubmit={(e) => { e.preventDefault(); sendReviewMessage(); }} className="flex gap-2">
                    <input
                      className="flex-1 rounded-md border px-3 py-2"
                      placeholder="入力してください。"
                      value={reviewInput}
                      onChange={(e) => setReviewInput(e.target.value)}
                    />
                    <button type="submit" disabled={sendingReview} className="rounded-md bg-gray-800 text-white px-4 py-2 disabled:opacity-50">{sendingReview ? '送信中…' : '送信'}</button>
                  </form>
                  {sendError && <div className="text-red-600 text-sm mt-2">{sendError}</div>}
                </div>
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

              {/* Plan editor */}
              <div className="rounded-xl border p-6">
                <div className="text-lg font-semibold mb-4">プラン設定（管理者）</div>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                  <label className="text-sm text-gray-600">プランを選択</label>
                  <select
                    className="border rounded px-3 py-2"
                    value={planTierInput}
                    onChange={(e) => setPlanTierInput(e.target.value as PlanTier | '')}
                  >
                    <option value="">未設定</option>
                    <option value="starter">starter</option>
                    <option value="standard">standard</option>
                    <option value="premium">premium</option>
                  </select>
                  <button
                    className={`px-4 py-2 rounded text-white ${planSaving ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                    onClick={savePlanTier}
                    disabled={planSaving}
                  >
                    {planSaving ? '更新中…' : '更新'}
                  </button>
                </div>
                <div className="text-xs text-gray-500 mt-2">standard/premium を選択すると is_premium が有効になります。</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
