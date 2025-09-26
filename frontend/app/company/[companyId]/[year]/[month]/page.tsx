"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthV2 from '@/hooks/useAuthV2';
import apiV2Client from '@/lib/api-v2-client';
import type { CompanyMonthlyPage } from '@/types/api-v2';
import toast from 'react-hot-toast';

type Params = {
  companyId: string;
  year: string;
  month: string;
};

export default function CompanyMonthlyPageView({ params }: { params: Promise<Params> }) {
  const router = useRouter();
  const { isAuthenticated, currentUser, initializeAuth, requireRole } = useAuthV2();
  const [page, setPage] = useState<CompanyMonthlyPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [year, setYear] = useState<number>(0);
  const [month, setMonth] = useState<number>(0);
  const [companyId, setCompanyId] = useState<string>('');

  useEffect(() => {
    initializeAuth();
    
    // Resolve params promise
    params.then((resolvedParams) => {
      setYear(Number(resolvedParams.year));
      setMonth(Number(resolvedParams.month));
      setCompanyId(resolvedParams.companyId);
    });
  }, [initializeAuth, params]);

  useEffect(() => {
    const hasStored = typeof window !== 'undefined' && !!localStorage.getItem('drf_token_v2');
    if (isAuthenticated === false && !hasStored) {
      router.push('/auth/login');
      return;
    }
    if (isAuthenticated && currentUser && currentUser.role !== 'company') {
      toast.error('企業アカウントでログインしてください');
      router.push('/auth/login');
      return;
    }
  }, [isAuthenticated, currentUser, router]);

  useEffect(() => {
    // Wait for params to be resolved
    if (!companyId || year === 0 || month === 0) {
      return;
    }
    
    const fetchPage = async () => {
      try {
        const data = await apiV2Client.getCompanyMonthly(year, month);
        setPage(data);
        setTitle(data.title || `${year}年${month}月のページ`);
        setNotes((data.content && data.content.notes) || '');
      } catch (e: any) {
        if (e?.response?.status === 404) {
          // 初回アクセス時に存在しない場合は current を作成後、URLにリダイレクト
          try {
            const created = await apiV2Client.getCompanyMonthlyCurrent();
            router.replace(created.page_url);
            return;
          } catch (err) {
            toast.error('月次ページの作成に失敗しました');
          }
        } else {
          toast.error('月次ページの取得に失敗しました');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [year, month, router]);

  const handleSave = async () => {
    if (!page) return;
    setSaving(true);
    try {
      const updated = await apiV2Client.updateCompanyMonthly(year, month, {
        title,
        content: { ...(page.content || {}), notes },
      });
      setPage(updated);
      toast.success('保存しました');
    } catch (e) {
      toast.error('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF733E]"></div>
      </div>
    );
  }

  if (!page) return null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{`${year}年${month}月`}</h1>
        <p className="text-sm text-gray-500">企業: {currentUser?.company_name || currentUser?.email}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`${year}年${month}月のページ`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">メモ（任意）</label>
          <textarea
            className="w-full border rounded-md px-3 py-2 h-40"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="月次のメモやKPI、TODOなどを書いてください"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-[#FF733E] text-white rounded-md disabled:opacity-50"
          >
            保存
          </button>
          <button
            onClick={() => router.push('/company')}
            className="px-4 py-2 border rounded-md"
          >
            求職者検索へ戻る
          </button>
        </div>
      </div>
    </div>
  );
}
