'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildApiUrl, getApiHeaders, API_CONFIG } from '@/config/api';

type AdminSeeker = {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'company' | 'admin';
  full_name?: string;
  company_name?: string;
  is_premium?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export default function AdminSeekersPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState(''); // '', 'active', 'premium'
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Paginated<AdminSeeker>>({ count: 0, next: null, previous: null, results: [] });

  const token = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('drf_token_v2') || '';
  }, []);

  const fetchSeekers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      qs.set('page', String(page));
      if (status) qs.set('status', status);
      // 既存APIはキーワード未対応のため、実装時はバック側に合わせる
      const url = `${buildApiUrl(API_CONFIG.endpoints.adminSeekers)}?${qs.toString()}`;
      const res = await fetch(url, {
        headers: getApiHeaders(token),
      });
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const json = (await res.json()) as Paginated<AdminSeeker>;
      let filtered = json.results;
      if (keyword) {
        const kw = keyword.toLowerCase();
        filtered = filtered.filter((u) =>
          [u.full_name, u.username, u.email, u.company_name]
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
    fetchSeekers();
  }, [fetchSeekers]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(data.count / pageSize)), [data.count, pageSize]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">求職者一覧</h1>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow border p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">キーワード</label>
              <input
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
                placeholder="キーワードを入力する"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">状態</label>
              <select
                className="rounded-md border border-gray-300 px-3 py-2 bg-white"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">すべて</option>
                <option value="active">有効</option>
                <option value="premium">プレミアム</option>
              </select>
            </div>
            <div className="mt-2 md:mt-6">
              <button
                className="rounded-md bg-gray-800 text-white px-4 py-2 hover:bg-gray-700"
                onClick={() => { setPage(1); fetchSeekers(); }}
              >
                表示する
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">氏名</th>
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
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400">該当する求職者がいません</td></tr>
                )}
                {!loading && data.results.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/admin/seekers/${u.id}`)}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.full_name || u.username || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {u.is_premium ? (
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">プレミアム</span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">通常</span>
                      )}
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
                className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >前へ</button>
              <div className="px-2 py-1 text-sm text-gray-700">{page} / {totalPages}</div>
              <button
                className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >次へ</button>
            </div>
          </div>
        </div>
        {error && <div className="text-red-600 mt-4">{error}</div>}
      </div>
    </div>
  );
}
