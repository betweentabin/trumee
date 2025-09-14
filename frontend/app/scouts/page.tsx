'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-v2-client';
import useAuthV2 from '@/hooks/useAuthV2';
import toast from 'react-hot-toast';
import { 
  FaUserTie, 
  FaClock, 
  FaEye,
  FaReply,
  FaBuilding,
  FaEnvelope,
  FaCheckCircle
} from 'react-icons/fa';

type Scout = any; // API差異があるため一旦ワイドに受ける

export default function ScoutsPage() {
  const router = useRouter();
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [jobType, setJobType] = useState<string>('');
  const [pref, setPref] = useState<string>('');
  const [industry, setIndustry] = useState<string>('');
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState<Scout | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 5;
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

  const getStatusBadge = (status: string, viewedAt: string | null, respondedAt: string | null) => {
    if (respondedAt) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <FaCheckCircle className="mr-1" />
          返信済み
        </span>
      );
    }
    if (viewedAt) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <FaEye className="mr-1" />
          既読
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <FaEnvelope className="mr-1" />
        未読
      </span>
    );
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
    let list = scouts.filter(scout => {
      if (filter === 'all') return true;
      if (filter === 'unread') return !scout.viewed_at;
      if (filter === 'read') return scout.viewed_at && !scout.responded_at;
      if (filter === 'responded') return scout.responded_at;
      return true;
    });
    // industry filter (company profile)
    if (industry) {
      const kw = industry.toLowerCase();
      list = list.filter((s: any) => {
        const ind = s.company?.industry || s.company_details?.industry || '';
        return String(ind).toLowerCase().includes(kw);
      });
    }
    // JobType filter: message contains a hint (暫定)
    if (jobType) {
      const kw = jobType.toLowerCase();
      list = list.filter((s: any) => String(s.scout_message || '').toLowerCase().includes(kw));
    }
    // Pref filter: 暫定（メッセージ内検索）
    if (pref) {
      const kw = pref.toLowerCase();
      list = list.filter((s: any) => String(s.scout_message || '').toLowerCase().includes(kw));
    }
    if (!keyword.trim()) return list;
    const kw = keyword.trim().toLowerCase();
    return list.filter((s: any) => {
      const companyName = s.company_name || s.company?.company_name || s.company_details?.company_name || '';
      const msg = s.scout_message || '';
      return String(companyName).toLowerCase().includes(kw) || String(msg).toLowerCase().includes(kw);
    });
  }, [scouts, filter, keyword, jobType, pref, industry]);

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
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">全スカウト</p>
                <p className="text-2xl font-bold text-gray-900">{scouts.length}</p>
              </div>
              <FaUserTie className="text-3xl text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">未読</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {scouts.filter(s => !s.viewed_at).length}
                </p>
              </div>
              <FaEnvelope className="text-3xl text-yellow-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">既読</p>
                <p className="text-2xl font-bold text-blue-600">
                  {scouts.filter(s => s.viewed_at && !s.responded_at).length}
                </p>
              </div>
              <FaEye className="text-3xl text-blue-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">返信済み</p>
                <p className="text-2xl font-bold text-green-600">
                  {scouts.filter(s => s.responded_at).length}
                </p>
              </div>
              <FaCheckCircle className="text-3xl text-green-400" />
            </div>
          </div>
        </div>

        {/* Filters bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">職種</label>
              <select value={jobType} onChange={(e)=>setJobType(e.target.value)} className="px-3 py-2 border rounded-md text-sm">
                <option value="">指定なし</option>
                <option value="sales">営業・販売</option>
                <option value="office">事務・受付</option>
                <option value="it">IT・WEB</option>
                <option value="engineer">エンジニア</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">勤務地</label>
              <select value={pref} onChange={(e)=>setPref(e.target.value)} className="px-3 py-2 border rounded-md text-sm">
                <option value="">指定なし</option>
                <option value="東京都">東京都</option>
                <option value="神奈川県">神奈川県</option>
                <option value="大阪府">大阪府</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">業種</label>
              <select value={industry} onChange={(e)=>setIndustry(e.target.value)} className="px-3 py-2 border rounded-md text-sm">
                <option value="">指定なし</option>
                <option value="it">IT</option>
                <option value="manufacturing">製造</option>
                <option value="service">サービス</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">応募状況</label>
              <select value={filter} onChange={(e)=>{ setPage(1); setFilter(e.target.value); }} className="px-3 py-2 border rounded-md text-sm">
                <option value="all">指定なし</option>
                <option value="unread">未読</option>
                <option value="read">既読</option>
                <option value="responded">返信済み</option>
              </select>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <input
                value={keyword}
                onChange={(e) => { setPage(1); setKeyword(e.target.value); }}
                placeholder="会社名・メッセージで検索"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={() => { setKeyword(''); setFilter('all'); setJobType(''); setPref(''); setIndustry(''); setPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >全てクリア</button>
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
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FaBuilding className="text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {scout.company?.company_name || scout.company_name || (scout as any).company_details?.company_name || '企業'}
                      </h3>
                      {getStatusBadge(scout.status, scout.viewed_at, scout.responded_at)}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-3">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {scout.scout_message}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <FaClock className="mr-1" />
                        受信日: {formatDate(scout.created_at || scout.scouted_at)}
                      </div>
                      {scout.viewed_at && (
                        <div className="flex items-center">
                          <FaEye className="mr-1" />
                          既読: {formatDate(scout.viewed_at)}
                        </div>
                      )}
                      {scout.responded_at && (
                        <div className="flex items-center">
                          <FaReply className="mr-1" />
                          返信: {formatDate(scout.responded_at)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelected(scout)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >詳細を見る</button>
                  {!scout.viewed_at && (
                    <button
                      onClick={() => handleViewScout(scout.id)}
                      className="inline-flex items-center px-4 py-2 bg-[#FF733E] text-white rounded-md hover:bg-orange-70 active:bg-orange-60"
                    >
                      <FaEye className="mr-2" />
                      既読にする
                    </button>
                  )}
                  {(!scout.responded_at) && (
                    <button
                      onClick={() => handleApply(scout)}
                      className="inline-flex items-center px-4 py-2 bg-[#FF733E] text-white rounded-md hover:bg-orange-70 active:bg-orange-60"
                    >応募する</button>
                  )}
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
          <div className="mt-6 flex justify-center items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-8 h-8 rounded-full text-sm ${n === page ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
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
