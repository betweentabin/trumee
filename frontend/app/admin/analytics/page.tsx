'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { buildApiUrl, getApiHeaders, API_CONFIG } from '@/config/api';

type Summary = {
  totals: Record<string, number>;
  plan_distribution: Record<string, number>;
  login_recency: Record<string, number>;
  registrations_trend: { date: string; count: number }[];
  age_buckets: Record<string, number>;
  payments_recent: Record<string, number>;
  generated_at?: string;
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('drf_token_v2') || '';
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(buildApiUrl(API_CONFIG.endpoints.adminAnalyticsSummary), {
          headers: getApiHeaders(token),
        });
        if (res.status === 403) throw new Error('管理者権限が必要です');
        if (!res.ok) throw new Error(`取得に失敗しました (${res.status})`);
        const json = await res.json();
        setData(json);
      } catch (e: any) {
        setError(e?.message || '取得に失敗しました');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const kv = (obj?: Record<string, number>) => {
    const entries = Object.entries(obj || {});
    if (entries.length === 0) return <div className="text-gray-500">—</div>;
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {entries.map(([k, v]) => (
          <div key={k} className="rounded-md border p-3 bg-white">
            <div className="text-xs text-gray-500">{k}</div>
            <div className="text-lg font-semibold">{v}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">分析サマリ</h1>
          <p className="text-gray-600 text-sm">ユーザー属性とアクティビティの集計</p>
        </div>

        {loading && <div className="text-gray-600">読み込み中...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !error && data && (
          <>
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">合計</h2>
              {kv(data.totals)}
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">プラン分布</h2>
              {kv(data.plan_distribution)}
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">最終ログインの分布</h2>
              {kv(data.login_recency)}
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">年齢分布（求職者）</h2>
              {kv(data.age_buckets)}
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">直近の登録推移（30日）</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-md border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs text-gray-500">日付</th>
                      <th className="px-4 py-2 text-left text-xs text-gray-500">登録数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.registrations_trend.map((r) => (
                      <tr key={r.date} className="border-t">
                        <td className="px-4 py-2 text-sm text-gray-800">{new Date(r.date).toLocaleDateString('ja-JP')}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold">決済（最近）</h2>
              {kv(data.payments_recent)}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

