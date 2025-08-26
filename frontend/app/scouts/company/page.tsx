'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/app/redux/hooks';
import { useScouts, useViewScout, useRespondScout } from '@/hooks/useApi';
import toast from 'react-hot-toast';
import { FaEye, FaReply, FaEnvelope, FaClock, FaBuilding } from 'react-icons/fa';

interface Scout {
  id: string;
  company: {
    id: string;
    company_name: string;
    industry: string;
  };
  scout_message: string;
  status: 'sent' | 'viewed' | 'responded' | 'expired';
  scouted_at: string;
  viewed_at: string | null;
  responded_at: string | null;
  expires_at: string | null;
}

export default function ScoutsCompanyPage() {
  const router = useRouter();
  const authState = useAppSelector(state => state.auth);
  const [filter, setFilter] = useState<string>('all');
  
  // React Query hooks
  const { data: scoutsData, isLoading, error } = useScouts();
  const viewScoutMutation = useViewScout();
  const respondScoutMutation = useRespondScout();

  // 認証チェック
  useEffect(() => {
    if (!authState.isAuthenticated) {
      router.push('/auth/login');
      toast.error('ログインが必要です');
    }
  }, [authState, router]);

  const scouts: Scout[] = scoutsData?.results || scoutsData || [];

  const handleViewScout = async (scoutId: string) => {
    try {
      await viewScoutMutation.mutateAsync(scoutId);
      toast.success('スカウトを確認しました');
    } catch (error) {
      console.error('Failed to mark scout as viewed:', error);
    }
  };

  const handleRespondScout = async (scoutId: string) => {
    try {
      await respondScoutMutation.mutateAsync(scoutId);
    } catch (error) {
      console.error('Failed to respond to scout:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'viewed': return 'bg-yellow-100 text-yellow-800';
      case 'responded': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent': return '新着';
      case 'viewed': return '確認済み';
      case 'responded': return '返信済み';
      case 'expired': return '期限切れ';
      default: return status;
    }
  };

  const filteredScouts = scouts.filter(scout => {
    if (filter === 'all') return true;
    return scout.status === filter;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg">読み込み中...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-red-600">スカウトの読み込みに失敗しました</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">企業からのスカウト</h1>
          <p className="text-gray-600">あなたに興味を持った企業からのスカウト一覧です。</p>
        </div>

        {/* フィルター */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">フィルター</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'すべて' },
              { key: 'sent', label: '新着' },
              { key: 'viewed', label: '確認済み' },
              { key: 'responded', label: '返信済み' },
              { key: 'expired', label: '期限切れ' },
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === filterOption.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-2xl font-bold text-blue-600">{scouts.length}</div>
            <div className="text-gray-600">総スカウト数</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {scouts.filter(s => s.status === 'sent').length}
            </div>
            <div className="text-gray-600">新着</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-2xl font-bold text-green-600">
              {scouts.filter(s => s.status === 'responded').length}
            </div>
            <div className="text-gray-600">返信済み</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-2xl font-bold text-gray-600">
              {scouts.filter(s => s.status === 'expired').length}
            </div>
            <div className="text-gray-600">期限切れ</div>
          </div>
        </div>

        {/* スカウト一覧 */}
        {filteredScouts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-500 mb-4">
              <FaEnvelope className="mx-auto h-16 w-16 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">スカウトがありません</h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'まだスカウトが届いていません。プロフィールを充実させてスカウトを待ちましょう。'
                : `${getStatusText(filter)}のスカウトがありません。`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredScouts.map((scout) => (
              <div key={scout.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FaBuilding className="text-gray-500" />
                      <h3 className="text-xl font-semibold text-gray-800">
                        {scout.company.company_name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(scout.status)}`}>
                        {getStatusText(scout.status)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{scout.company.industry}</p>
                    <div className="flex items-center text-gray-500 text-sm gap-4">
                      <span className="flex items-center gap-1">
                        <FaClock />
                        受信: {new Date(scout.scouted_at).toLocaleDateString('ja-JP')}
                      </span>
                      {scout.viewed_at && (
                        <span className="flex items-center gap-1">
                          <FaEye />
                          確認: {new Date(scout.viewed_at).toLocaleDateString('ja-JP')}
                        </span>
                      )}
                      {scout.responded_at && (
                        <span className="flex items-center gap-1">
                          <FaReply />
                          返信: {new Date(scout.responded_at).toLocaleDateString('ja-JP')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {scout.status === 'sent' && (
                      <button
                        onClick={() => handleViewScout(scout.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <FaEye />
                        確認
                      </button>
                    )}
                    {(scout.status === 'viewed' || scout.status === 'sent') && (
                      <button
                        onClick={() => handleRespondScout(scout.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <FaReply />
                        返信
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">スカウトメッセージ</h4>
                  <p className="text-gray-700 whitespace-pre-line">{scout.scout_message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
