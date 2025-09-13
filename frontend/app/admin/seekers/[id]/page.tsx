'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { buildApiUrl, getApiHeaders, API_CONFIG } from '@/config/api';
import AdviceScreenTab from '@/components/admin/AdviceScreenTab';
import InterviewPreparationTab from '@/components/admin/InterviewPreparationTab';
import { useForm } from 'react-hook-form';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'review' | 'interview' | 'advice' | 'member'>('review');
  const [reviewMessages, setReviewMessages] = useState<Array<{id:string; sender:string; content:string; created_at:string;}>>([]);
  const [reviewInput, setReviewInput] = useState('');
  const [adviceMessages, setAdviceMessages] = useState<any[]>([]);
  const [interviewMessages, setInterviewMessages] = useState<any[]>([]);
  const [sendingReview, setSendingReview] = useState(false);
  const [sendingAdvice, setSendingAdvice] = useState(false);
  const [sendingInterview, setSendingInterview] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [selectedAdviceTab, setSelectedAdviceTab] = useState<string>('resume');
  const [selectedAdviceSubTab, setSelectedAdviceSubTab] = useState<string | null>(null);

  const token = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('drf_token_v2') || '';
  }, []);

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

  const loadReviewMessages = useCallback(async () => {
    if (!id) return;
    try {
      const url = `${buildApiUrl('/advice/messages/')}?user_id=${id}`;
      const res = await fetch(url, { headers: getApiHeaders(token) });
      if (!res.ok) return;
      const list = await res.json();
      const mapped = (list || []).map((m: any) => ({ id: String(m.id), sender: String(m.sender), content: m.content, created_at: m.created_at }));
      setReviewMessages(mapped);
    } catch {}
  }, [id, token]);

  useEffect(() => {
    loadReviewMessages();
  }, [loadReviewMessages]);

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
      setReviewMessages((prev) => [...prev, { id: String(m.id), sender: String(m.sender), content: m.content, created_at: m.created_at }]);
      setReviewInput('');
    } catch (e: any) {
      console.error(e);
      setSendError('送信に失敗しました');
    } finally {
      setSendingReview(false);
    }
  }, [reviewInput, token, id]);

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

  const adviceMessages = [
    { id: '1', content: { type: 'resume', message: '履歴書の構成を見直しましょう。' }, created_at: new Date().toISOString() },
    { id: '2', content: { type: 'self_pr', message: '事例を交えて具体化するのが良いです。' }, created_at: new Date().toISOString() },
  ];

  const interviewQuestions = [
    '転職理由を教えてください。',
    '強みと弱みを教えてください。',
    '直近のプロジェクトでの役割は？',
  ];

  const interviewAnswers = [
    { id: 'a1', senderId: 'admin', content: { message: 'STARで回答構成を意識しましょう。' } },
    { id: 'a2', senderId: String(id), content: { message: '了解しました。' } },
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
                <div className="text-lg font-semibold mb-4">職務経歴書</div>
                <div className="h-[600px] rounded-md border bg-gray-50 p-4 text-gray-600">
                  職務経歴書のプレビュー（準備中）
                </div>
              </div>
              {/* right: comments + input */}
              <div className="w-full md:w-[360px] p-6">
                <div className="text-lg font-semibold mb-3">職務内容について</div>
                <div className="h-[460px] overflow-y-auto border rounded-md p-3 space-y-2 bg-gray-50">
                  {reviewMessages.length === 0 && (
                    <div className="text-gray-400 text-sm text-center py-8">まだコメントがありません。</div>
                  )}
                  {reviewMessages.map((m) => {
                    const isAdmin = currentUser && String(m.sender) === String(currentUser.id);
                    return (
                      <div key={m.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[85%] rounded-md p-3 text-sm ${isAdmin ? 'bg-gray-200 text-gray-900' : 'bg-gray-800 text-white'}`}>
                          <div>{m.content}</div>
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
              selectedAdviceType={selectedAdviceTab}
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
                  <div><span className="text-gray-500">氏名</span><div className="font-medium">{user?.full_name || user?.username}</div></div>
                  <div><span className="text-gray-500">メール</span><div className="font-medium">{user?.email}</div></div>
                  <div><span className="text-gray-500">登録日</span><div className="font-medium">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</div></div>
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
