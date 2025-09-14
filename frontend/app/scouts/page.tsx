"use client";

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-v2-client';
import useAuthV2 from '@/hooks/useAuthV2';
import toast from 'react-hot-toast';
import {
  FaUserTie,
  FaClock,
  FaBuilding,
  FaSearch,
} from 'react-icons/fa';

type Scout = any; // API差異があるため一旦ワイドに受ける

export default function ScoutsPage() {
  const router = useRouter();
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [loading, setLoading] = useState(true);
  // フィルター（未適用）
  const [pendingStatus, setPendingStatus] = useState<string>(''); // 応募状況
  const [pendingPref, setPendingPref] = useState<string>(''); // 勤務地
  const [pendingIndustry, setPendingIndustry] = useState<string>(''); // 業種
  const [pendingJobTags, setPendingJobTags] = useState<string[]>([]); // 職種タグ

  // 適用中フィルター
  const [status, setStatus] = useState<string>('');
  const [pref, setPref] = useState<string>('');
  const [industry, setIndustry] = useState<string>('');
  const [jobTags, setJobTags] = useState<string[]>([]);
  const [selected, setSelected] = useState<Scout | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 5;

  // 職種タグ候補（UI表示用）
  const JOB_TAGS = [
    '営業・販売', '事務・受付', '飲食・サービス', '保育士・教員',
    '介護・福祉', '医師・看護師', 'クリエイター', 'IT・WEB',
    'エンジニア', '製造・工場', '物流', '金融',
  ];
  const { isAuthenticated, initializeAuth } = useAuthV2();

  // 認証初期化
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // 認証済みなら実データを取得
  useEffect(() => {
    if (isAuthenticated) {
      fetchScouts();
    } else if (isAuthenticated === false) {
      const hasStored = typeof window !== 'undefined' && !!localStorage.getItem('drf_token_v2');
      if (!hasStored) {
        toast.error('ログインが必要です');
        router.push('/auth/login');
      }
    }
  }, [isAuthenticated, router]);

  const fetchScouts = async () => {
    try {
      const data = await apiClient.getScouts();
      setScouts(data || []);
    } catch (error) {
      console.error('Failed to fetch scouts:', error);
      toast.error('スカウト情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleViewScout = async (id: string) => {
    try {
      await apiClient.markScoutViewed(id);
      toast.success('スカウトを確認しました');
      fetchScouts();
    } catch (error) {
      console.error('Failed to view scout:', error);
    }
  };

  const handleRespondScout = async (id: string) => {
    try {
      await apiClient.respondScout(id);
      toast.success('スカウトに返信しました');
      fetchScouts();
    } catch (error) {
      console.error('Failed to respond to scout:', error);
      toast.error('スカウトへの返信に失敗しました');
    }
  };

  const handleApply = async (scout: any) => {
    try {
      const companyId = typeof scout.company === 'string'
        ? scout.company
        : scout.company?.id ?? scout.company_details?.id;
      if (!companyId) {
        toast.error('企業情報を特定できません');
        return;
      }
      await apiClient.createApplication({ company: companyId } as any);
      toast.success('応募を送信しました');
    } catch (e) {
      console.error(e);
      toast.error('応募の送信に失敗しました');
    }
  };

  const formatDate = (dateString?: string | null) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const filteredScouts = useMemo(() => {
    let list = scouts.slice();

    // 応募状況
    if (status) {
      if (status === '未読') list = list.filter((s: any) => !s.viewed_at);
      if (status === '既読') list = list.filter((s: any) => s.viewed_at && !s.responded_at);
      if (status === '返信済み') list = list.filter((s: any) => !!s.responded_at);
    }
    // industry filter (company profile)
    if (industry) {
      const kw = industry.toLowerCase();
      list = list.filter((s: any) => {
        const ind = s.company?.industry || s.company_details?.industry || '';
        return String(ind).toLowerCase().includes(kw);
      });
    }
    // Pref filter: 暫定（メッセージ内検索）
    if (pref) {
      const kw = pref.toLowerCase();
      list = list.filter((s: any) => String(s.scout_message || '').toLowerCase().includes(kw));
    }
    // Job tags: メッセージ内に含まれる語で簡易フィルタ
    if (jobTags.length > 0) {
      const kws = jobTags.map((t) => t.toLowerCase());
      list = list.filter((s: any) => {
        const text = String(s.scout_message || '').toLowerCase();
        return kws.some((k) => text.includes(k) || (s.company_name || '').toLowerCase().includes(k));
      });
    }

    return list;
  }, [scouts, status, pref, industry, jobTags]);

  const totalPages = Math.max(1, Math.ceil(filteredScouts.length / perPage));
  const pagedScouts = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredScouts.slice(start, start + perPage);
  }, [filteredScouts, page]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF733E]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-500 mb-4" aria-label="breadcrumb">
          <ol className="flex items-center gap-2">
            <li className="hover:text-gray-700 cursor-pointer" onClick={() => router.push('/')}>TOP</li>
            <li>›</li>
            <li className="text-gray-800">企業からのスカウト確認</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left navigation */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="bg-white rounded-lg border shadow-sm divide-y">
              <button
                className="w-full text-left px-4 py-3 hover:bg-gray-50"
                onClick={() => router.push('/scouts')}
              >企業からのスカウト状況</button>
              <button
                className="w-full text-left px-4 py-3 hover:bg-gray-50"
                onClick={() => router.push('/interview-advice/applying-reasons')}
              >スカウト企業への志望理由作成補助</button>
            </div>
          </aside>

          {/* Main content */}
          <div className="lg:col-span-9">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">企業からのスカウト状況</h1>
              <p className="mt-2 text-gray-600">採用中の企業からのオファーが確認できます。</p>
            </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">全スカウト</p>
                <p className="text-2xl font-bold text-gray-900">{scouts.length}</p>
              </div>
              <FaUserTie className="text-3xl text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">未読</p>
                <p className="text-2xl font-bold text-gray-900">{scouts.filter(s => !s.viewed_at).length}</p>
              </div>
              <span className="text-2xl text-gray-400">●</span>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">既読</p>
                <p className="text-2xl font-bold text-gray-900">{scouts.filter(s => s.viewed_at && !s.responded_at).length}</p>
              </div>
              <span className="text-2xl text-gray-400">●</span>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">返信済み</p>
                <p className="text-2xl font-bold text-gray-900">{scouts.filter(s => s.responded_at).length}</p>
              </div>
              <span className="text-2xl text-gray-400">●</span>
            </div>
          </div>
        </div>

        {/* Filters bar */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          {/* 上段セレクタ */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">職種</label>
              <div className="px-3 py-2 border rounded-md text-sm text-gray-700 bg-white">指定なし</div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">勤務地</label>
              <select value={pendingPref} onChange={(e)=>setPendingPref(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
                <option value="">指定なし</option>
                <option value="東京都">東京都</option>
                <option value="神奈川県">神奈川県</option>
                <option value="大阪府">大阪府</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">業種</label>
              <select value={pendingIndustry} onChange={(e)=>setPendingIndustry(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
                <option value="">指定なし</option>
                <option value="IT">IT</option>
                <option value="製造">製造</option>
                <option value="サービス">サービス</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">応募状況</label>
              <select value={pendingStatus} onChange={(e)=>setPendingStatus(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
                <option value="">指定なし</option>
                <option value="未読">未読</option>
                <option value="既読">既読</option>
                <option value="返信済み">返信済み</option>
              </select>
            </div>
          </div>

          {/* 職種チップ */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {JOB_TAGS.map((tag) => {
              const active = pendingJobTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setPendingJobTags((prev) => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
                  }}
                  className={`flex items-center justify-start gap-2 px-3 py-2 rounded-md border text-sm ${active ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  <span className={`inline-block w-4 h-4 rounded ${active ? 'bg-white' : 'bg-gray-200'} border`}></span>
                  {tag}
                </button>
              );
            })}
          </div>

          {/* アクション行 */}
          <div className="mt-4 flex items-center justify-between">
            <button
              className="text-sm text-gray-700 hover:underline"
              onClick={() => { setPendingJobTags([]); setPendingPref(''); setPendingIndustry(''); setPendingStatus(''); setPage(1); }}
            >全てクリア</button>
            <div className="flex items-center gap-2">
              <button
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
                onClick={() => {
                  setStatus(pendingStatus);
                  setPref(pendingPref);
                  setIndustry(pendingIndustry);
                  setJobTags(pendingJobTags);
                  setPage(1);
                }}
              >
                <FaSearch /> この条件で検索する
              </button>
            </div>
          </div>
        </div>

        {/* Scouts List */}
        {filteredScouts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FaUserTie className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              スカウトはまだありません
            </h3>
            <p className="text-gray-600">
              プロフィールを充実させて、企業からのスカウトを待ちましょう
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pagedScouts.map((scout) => (
              <div
                key={scout.id}
                className="bg-white rounded-xl border p-5"
              >
                {/* 上段: 会社名 + 更新日時 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-900 font-semibold">
                    <FaBuilding className="text-gray-500" />
                    {scout.company?.company_name || scout.company_name || (scout as any).company_details?.company_name || '株式会社'}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-1">
                    <FaClock />
                    {new Date(scout.updated_at || scout.scouted_at || scout.created_at).toLocaleString('ja-JP')}
                  </div>
                </div>

                {/* 中段: 情報行 */}
                <div className="mt-3 space-y-1 text-sm text-gray-700">
                  <div>職種：<span className="text-gray-900">{jobTags[0] || '未指定'}</span></div>
                  <div>勤務地：<span className="text-gray-900">{pref || '未指定'}</span></div>
                  <div className="truncate">メッセージ：<span className="text-gray-900">{scout.scout_message || 'メッセージが入ります。'}</span></div>
                </div>

                {/* 下段: ボタン */}
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() => setSelected(scout)}
                    className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
                  >詳細を見る</button>
                  <button
                    onClick={() => handleApply(scout)}
                    className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
                  >応募する</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selected && (
          <ScoutDetailModal
            scout={selected}
            onClose={() => setSelected(null)}
            onApply={() => { handleApply(selected); setSelected(null); }}
          />
        )}

        {/* Pagination */}
        {filteredScouts.length > perPage && (
          <div className="mt-8 flex justify-center items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-8 h-8 rounded-full text-sm border ${n === page ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >{n}</button>
            ))}
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 詳細モーダル（簡易）
function ScoutDetailModal({ scout, onClose, onApply }: { scout: any, onClose: () => void, onApply: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">
            {scout.company?.company_name || scout.company_name || scout.company_details?.company_name || '企業'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            更新: {new Date(scout.updated_at || scout.scouted_at || scout.created_at).toLocaleString('ja-JP')}
          </p>
        </div>
        <div className="p-6 space-y-3">
          <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-md p-4">
            {scout.scout_message}
          </div>
        </div>
        <div className="p-6 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300">閉じる</button>
          <button onClick={onApply} className="px-4 py-2 rounded-md bg-[#FF733E] text-white hover:bg-orange-70 active:bg-orange-60">応募する</button>
        </div>
      </div>
    </div>
  );
}
