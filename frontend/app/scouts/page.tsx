'use client';

import { useState, useEffect } from 'react';
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

interface Scout {
  id: string;
  company: {
    id: string;
    company_name: string;
    email: string;
  };
  scout_message: string;
  status: string;
  created_at: string;
  viewed_at: string | null;
  responded_at: string | null;
}

export default function ScoutsPage() {
  const router = useRouter();
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const { isAuthenticated, initializeAuth } = useAuthV2();

  // 初期化（一度だけ実行）
  useEffect(() => {
    console.log('🕵️ Scouts page: Initializing auth');
    initializeAuth();
  }, []);

  // 認証状態の変化を監視
  useEffect(() => {
    console.log('🕵️ Scouts page: Auth check', { isAuthenticated });
    
    // SSRでは実行しない
    if (typeof window === 'undefined') return;
    
    // 初期ロード時は少し待つ
    const timer = setTimeout(() => {
      const hasStoredToken = localStorage.getItem('auth_token_v2') && 
        localStorage.getItem('drf_token_v2');
      
      console.log('🕵️ Scouts page: Token check', { hasStoredToken, isAuthenticated });
      
      if (hasStoredToken || isAuthenticated) {
        console.log('🕵️ Scouts page: Fetching scouts');
        fetchScouts();
      } else {
        console.log('🕵️ Scouts page: Redirecting to login');
        router.push('/auth/login');
      }
    }, 100); // タイマーを短縮

    return () => clearTimeout(timer);
  }, [isAuthenticated]); // routerを依存配列から除外

  const fetchScouts = async () => {
    try {
      const response = await apiClient.getScouts();
      setScouts(response);
    } catch (error) {
      console.error('Failed to fetch scouts:', error);
      toast.error('スカウト情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleViewScout = async (id: string) => {
    try {
      await apiClient.viewScout(id);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const filteredScouts = scouts.filter(scout => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !scout.viewed_at;
    if (filter === 'read') return scout.viewed_at && !scout.responded_at;
    if (filter === 'responded') return scout.responded_at;
    return true;
  });

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">スカウト管理</h1>
          <p className="mt-2 text-gray-600">
            企業からのスカウトメッセージを確認できます
          </p>
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

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'all'
                  ? 'bg-[#FF733E] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'unread'
                  ? 'bg-[#FF733E] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              未読のみ
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'read'
                  ? 'bg-[#FF733E] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              既読
            </button>
            <button
              onClick={() => setFilter('responded')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'responded'
                  ? 'bg-[#FF733E] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              返信済み
            </button>
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
            {filteredScouts.map((scout) => (
              <div
                key={scout.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FaBuilding className="text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {scout.company.company_name}
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
                        受信日: {formatDate(scout.created_at)}
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
                  {!scout.viewed_at && (
                    <button
                      onClick={() => handleViewScout(scout.id)}
                      className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      <FaEye className="mr-2" />
                      既読にする
                    </button>
                  )}
                  {scout.viewed_at && !scout.responded_at && (
                    <button
                      onClick={() => handleRespondScout(scout.id)}
                      className="inline-flex items-center px-4 py-2 bg-[#FF733E] text-white rounded-md hover:bg-[#e9632e]"
                    >
                      <FaReply className="mr-2" />
                      返信する
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}