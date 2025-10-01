'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import useAuthV2 from '@/hooks/useAuthV2';
import apiV2Client from '@/lib/api-v2-client';
import type { JobCapPlan, JobTicketLedger } from '@/types/api-v2';
import toast from 'react-hot-toast';

export default function CompanyEditJobPage() {
  const params = useParams();
  const id = String(params?.id || '');
  const { initializeAuth, requireRole } = useAuthV2();
  const [cap, setCap] = useState<JobCapPlan | null>(null);
  const [tickets, setTickets] = useState<JobTicketLedger | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [consumeSeekerId, setConsumeSeekerId] = useState('');
  const [consumeInterviewDate, setConsumeInterviewDate] = useState('');
  const [consuming, setConsuming] = useState(false);

  // Auth init
  useEffect(() => {
    initializeAuth();
    requireRole('company', '/auth/login');
  }, [initializeAuth, requireRole]);

  // Fetch Cap/Tickets (read-only)
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!id) return;
      setLoadingMeta(true);
      try {
        const [capPlan, tks] = await Promise.all([
          apiV2Client.getJobCapPlan(id).catch(() => null as any),
          apiV2Client.getJobTickets(id).catch(() => null as any),
        ]);
        if (!mounted) return;
        setCap(capPlan);
        setTickets(tks);
      } catch (e) {
        // silent
      } finally {
        if (mounted) setLoadingMeta(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">求人を編集</h1>
        <Link href={`/jobs/${id}`} className="text-sm text-gray-600 hover:text-gray-900">求人詳細へ</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左: 編集フォーム（ダミーのまま） */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">求人タイトル</label>
            <input className="w-full border rounded-lg px-4 py-2" defaultValue={"—"} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">仕事内容</label>
            <textarea className="w-full border rounded-lg px-4 py-2 h-32" defaultValue={"—"}></textarea>
          </div>
          <div className="flex justify-end gap-3">
            <button className="px-6 py-2 rounded-full border">下書き保存</button>
            <button className="px-6 py-2 rounded-full text-white bg-[#FF733E] hover:bg-[#e9632e]">更新する</button>
          </div>
        </div>

        {/* 右: Cap/Tickets 概要（読み取り） */}
        <aside className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">課金設定・チケット</h2>

          {/* Cap */}
          <div className="mb-6">
            <div className="text-sm text-gray-600 mb-1">Cap（紹介料上限割合）</div>
            {loadingMeta ? (
              <div className="text-sm text-gray-500">読み込み中…</div>
            ) : cap ? (
              <div className="text-sm text-gray-900">
                <div>上限割合: <span className="font-medium">{cap.cap_percent}%</span></div>
                <div>固定上限: <span className="font-medium">{cap.cap_amount_limit ?? '未設定'}</span></div>
                <div>累計計上額: <span className="font-medium">{cap.total_cost}</span></div>
                <div>Cap到達: <span className="font-medium">{cap.cap_reached_at ? '済' : '未'}</span></div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">未設定</div>
            )}
          </div>

          {/* Tickets */}
          <div>
            <div className="text-sm text-gray-600 mb-1">チケット（求人専用）</div>
            {loadingMeta ? (
              <div className="text-sm text-gray-500">読み込み中…</div>
            ) : tickets ? (
              <div className="text-sm text-gray-900">
                <div>残数: <span className="font-medium">{tickets.tickets_remaining}</span> / {tickets.tickets_total}</div>
                <div>消費済: <span className="font-medium">{tickets.tickets_used}</span></div>
                <div>ボーナス: <span className="font-medium">{tickets.bonus_tickets_total}</span></div>
                <div>繰越許可: <span className="font-medium">{tickets.rollover_allowed ? '許可' : '不許可'}</span></div>
                <div className="mt-4 p-3 border rounded-md">
                  <div className="text-sm font-medium mb-2">面接確定（1チケット消費）</div>
                  <label className="block text-xs text-gray-600 mb-1">求職者ID</label>
                  <input
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="seeker UUID"
                    value={consumeSeekerId}
                    onChange={(e)=>setConsumeSeekerId(e.target.value)}
                  />
                  <label className="block text-xs text-gray-600 mt-3 mb-1">面接日（任意, YYYY-MM-DD またはISO）</label>
                  <input
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="2025-01-15"
                    value={consumeInterviewDate}
                    onChange={(e)=>setConsumeInterviewDate(e.target.value)}
                  />
                  <button
                    className={`mt-3 w-full px-4 py-2 rounded-md text-white ${consuming ? 'bg-gray-400' : 'bg-gray-800 hover:bg-gray-900'}`}
                    disabled={consuming}
                    onClick={async ()=>{
                      if (!consumeSeekerId.trim()) { toast.error('求職者IDを入力してください'); return; }
                      setConsuming(true);
                      try {
                        const payload: any = { seeker: consumeSeekerId.trim() };
                        if (consumeInterviewDate.trim()) payload.interview_date = consumeInterviewDate.trim();
                        const updated = await apiV2Client.consumeJobTicket(id, payload);
                        setTickets(updated as any);
                        toast.success('面接確定としてチケットを1消費しました');
                      } catch (e: any) {
                        const status = e?.response?.status;
                        const data = e?.response?.data || {};
                        if (status === 409 && data?.error === 'no_tickets') {
                          toast.error('この求人のチケット残がありません');
                        } else if (status === 409 && data?.error === 'already_consumed_for_seeker') {
                          toast.error('この求職者はすでに消費済みです');
                        } else {
                          toast.error(data?.detail || 'チケットの消費に失敗しました');
                        }
                      } finally {
                        setConsuming(false);
                      }
                    }}
                  >
                    {consuming ? '処理中…' : '面接確定（1消費）'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">未発行</div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
