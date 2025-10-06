'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildApiUrl, getApiHeaders, API_CONFIG } from '@/config/api';

type AdminCompany = {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'company' | 'admin';
  company_name?: string;
  is_premium?: boolean;
  is_active?: boolean;
  plan_tier?: string;
  created_at?: string;
  updated_at?: string;
};

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export default function AdminCompaniesPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState(''); // '', 'active', 'premium'
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Paginated<AdminCompany>>({ count: 0, next: null, previous: null, results: [] });

  const token = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('drf_token_v2') || '';
  }, []);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      qs.set('page', String(page));
      // 企業（role=company）のみ
      qs.set('role', 'company');
      if (status) qs.set('status', status);

      const urlUsers = `${buildApiUrl(API_CONFIG.endpoints.adminUsers)}?${qs.toString()}`;
      let res = await fetch(urlUsers, { headers: getApiHeaders(token) });
      if (res.status === 403) throw new Error('管理者権限が必要です（ログインし直してください）');
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const json = (await res.json()) as Paginated<AdminCompany>;
      let filtered = json.results;
      if (keyword) {
        const kw = keyword.toLowerCase();
        filtered = filtered.filter((u) =>
          [u.company_name, u.username, u.email]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(kw))
        );
      }
      setData({ ...json, results: filtered });
    } catch (e: any) {
      setError(e.message || 'failed to load');
    } finally {
      setLoading(false);
    }
  }, [page, status, keyword, token]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    const onFocus = () => fetchCompanies();
    const onVisibility = () => { if (document.visibilityState === 'visible') fetchCompanies(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchCompanies]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(data.count / pageSize)), [data.count, pageSize]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">企業一覧</h1>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow border p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">キーワード</label>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="会社名 / メール"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <div className="w-full md:w-60">
              <label className="block text-sm text-gray-600 mb-1">状態</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
                <option value="">すべて</option>
                <option value="active">アクティブ</option>
                <option value="premium">プレミアム</option>
              </select>
            </div>
            <div className="pt-6 md:pt-0">
              <button
                onClick={() => fetchCompanies()}
                className="px-4 py-2 rounded-md bg-[#1F2937] text-white hover:bg-[#111827]"
              >表示する</button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">会社名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">メール</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">登録日</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状態</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && (
                  <tr><td colSpan={4} className="px-6 py-6 text-center text-gray-500">読み込み中...</td></tr>
                )}
                {!loading && data.results.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400">該当する企業がいません</td></tr>
                )}
                {!loading && data.results.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/admin/companies/${u.id}`)}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.company_name || u.username || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{u.created_at ? new Date(u.created_at).toLocaleDateString('ja-JP') : '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {(() => {
                        const tier = (u.plan_tier || '').toLowerCase();
                        if (tier === 'premium') {
                          return (
                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">プレミアム</span>
                          );
                        }
                        if (tier === 'standard') {
                          return (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">スタンダード</span>
                          );
                        }
                        return (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">通常</span>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
            <div className="text-sm text-gray-600">{data.count} 件</div>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 rounded border text-sm bg-white text-gray-800 border-gray-300 hover:bg-gray-50 disabled:opacity-60 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-300"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >前へ</button>
              <div className="px-2 py-1 text-sm text-gray-700">{page} / {totalPages}</div>
              <button
                className="px-3 py-1 rounded border text-sm bg-white text-gray-800 border-gray-300 hover:bg-gray-50 disabled:opacity-60 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-300"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >次へ</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

