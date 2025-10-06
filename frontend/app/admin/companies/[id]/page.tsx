'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { buildApiUrl, getApiHeaders } from '@/config/api';
import toast from 'react-hot-toast';

export default function AdminCompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [overview, setOverview] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planTierInput, setPlanTierInput] = useState('');
  const [premiumExpiryInput, setPremiumExpiryInput] = useState('');
  const [planSaving, setPlanSaving] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const token = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('drf_token_v2') || '';
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await fetch(buildApiUrl(`/admin/users/${id}/overview/`), { headers: getApiHeaders(token) });
        if (!res.ok) throw new Error(`failed (${res.status})`);
        const data = await res.json();
        setOverview(data);
        const u = data?.user || {};
        setPlanTierInput(String(u.plan_tier || ''));
        setPremiumExpiryInput(u.premium_expiry ? new Date(u.premium_expiry).toISOString().slice(0,16) : '');
      } catch (e: any) {
        setError(e?.message || '読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id, token]);

  const reloadOverview = async () => {
    if (!id) return;
    try {
      const res = await fetch(buildApiUrl(`/admin/users/${id}/overview/`), { headers: getApiHeaders(token) });
      if (res.ok) setOverview(await res.json());
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">企業詳細</h1>
          <p className="text-gray-600 text-sm">会社情報とプラン</p>
        </div>

        {loading && <div className="text-gray-600">読み込み中...</div>}
        {error && <div className="text-red-600">{error}</div>}

        {!loading && overview && (
          <>
            <div className="rounded-xl border p-6 bg-white">
              <div className="text-lg font-semibold mb-4">会社概要</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">会社名</span>
                  <div className="font-medium">{overview?.user?.company_name || '—'}</div>
                </div>
                <div>
                  <span className="text-gray-500">メール</span>
                  <div className="font-medium">{overview?.user?.email || '—'}</div>
                </div>
                <div>
                  <span className="text-gray-500">登録日</span>
                  <div className="font-medium">{overview?.user?.created_at ? new Date(overview.user.created_at).toLocaleDateString('ja-JP') : '—'}</div>
                </div>
                <div>
                  <span className="text-gray-500">最終ログイン</span>
                  <div className="font-medium">{overview?.user?.last_login ? new Date(overview.user.last_login).toLocaleString() : '—'}</div>
                </div>
                <div>
                  <span className="text-gray-500">プラン</span>
                  <div className="font-medium">{overview?.user?.plan_tier || (overview?.user?.is_premium ? 'premium' : 'free')}</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-6 bg-white">
              <div className="text-lg font-semibold mb-4">プラン管理</div>
              <div className="flex flex-col md:flex-row gap-3 md:items-end">
                <div>
                  <label className="w-28 text-gray-600 block text-sm">plan_tier</label>
                  <select value={planTierInput} onChange={(e)=>setPlanTierInput(e.target.value)} className="rounded-md border px-3 py-2">
                    <option value="">未契約</option>
                    <option value="starter">starter</option>
                    <option value="standard">standard</option>
                    <option value="premium">premium</option>
                  </select>
                </div>
                <div>
                  <label className="w-28 text-gray-600 block text-sm">premium_expiry</label>
                  <input type="datetime-local" value={premiumExpiryInput} onChange={(e)=>setPremiumExpiryInput(e.target.value)} className="rounded-md border px-3 py-2" />
                </div>
                <div className="pt-6 md:pt-0">
                  <button
                    onClick={async ()=>{
                      if (!id) return;
                      try {
                        setPlanSaving(true);
                        setPlanError(null);
                        const payload: any = { plan_tier: planTierInput };
                        payload.is_premium = (planTierInput === 'standard' || planTierInput === 'premium');
                        if (premiumExpiryInput) {
                          payload.premium_expiry = new Date(premiumExpiryInput).toISOString();
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
                    className="rounded-md bg-gray-800 text-white px-4 py-2 disabled:opacity-50"
                    disabled={planSaving}
                  >{planSaving ? '更新中…' : '更新する'}</button>
                  {planError && <div className="text-red-600 text-sm mt-2">{planError}</div>}
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-6 bg-white">
              <div className="text-lg font-semibold mb-4">リソース状況</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">応募（企業として）</span>
                  <div className="font-medium">{overview?.counts?.applications_as_company ?? 0}</div>
                </div>
                <div>
                  <span className="text-gray-500">スカウト送信</span>
                  <div className="font-medium">{overview?.counts?.scouts_sent ?? 0}</div>
                </div>
                <div>
                  <span className="text-gray-500">メッセージ総数</span>
                  <div className="font-medium">{overview?.counts?.messages_total ?? 0}</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

