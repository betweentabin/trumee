'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector } from '@/app/redux/hooks';
import { FaEnvelope, FaBriefcase, FaCalendarAlt, FaCheckCircle, FaClock, FaBuilding } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface Scout {
  id: string;
  companyName: string;
  companyLogo?: string;
  position: string;
  message: string;
  receivedAt: string;
  status: 'new' | 'viewed' | 'replied' | 'declined';
  salary?: string;
  location?: string;
}

export default function ScoutStatusPage() {
  const router = useRouter();
  const authState = useAppSelector(state => state.auth);
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [filter, setFilter] = useState<'all' | 'new' | 'viewed' | 'replied' | 'declined'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hasStoredToken = typeof window !== 'undefined' && !!localStorage.getItem('drf_token_v2');
    if (!authState.isAuthenticated && !hasStoredToken) {
      router.push('/auth/login');
      return;
    }
    fetchScouts();
  }, [authState.isAuthenticated, router]);

  const fetchScouts = async () => {
    try {
      // スカウトデータの取得シミュレーション
      setTimeout(() => {
        const mockScouts: Scout[] = [
          {
            id: '1',
            companyName: '株式会社テックイノベーション',
            position: 'シニアエンジニア',
            message: '貴殿の経歴を拝見し、ぜひ弊社で活躍いただきたく...',
            receivedAt: '2024-01-20',
            status: 'new',
            salary: '年収600-800万円',
            location: '東京都渋谷区'
          },
          {
            id: '2',
            companyName: 'デジタルソリューション株式会社',
            position: 'プロジェクトマネージャー',
            message: 'プロジェクト管理の経験を活かして...',
            receivedAt: '2024-01-18',
            status: 'viewed',
            salary: '年収700-900万円',
            location: '大阪府大阪市'
          },
          {
            id: '3',
            companyName: 'グローバルIT株式会社',
            position: 'フルスタックエンジニア',
            message: '海外展開を進める当社で...',
            receivedAt: '2024-01-15',
            status: 'replied',
            salary: '年収550-750万円',
            location: '福岡県福岡市'
          }
        ];
        setScouts(mockScouts);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching scouts:', error);
      setLoading(false);
    }
  };

  const handleReply = (scoutId: string) => {
    router.push(`/confirm-scout/applying-reasons-assist?scoutId=${scoutId}`);
  };

  const handleDecline = async (scoutId: string) => {
    if (confirm('このスカウトを辞退してもよろしいですか？')) {
      setScouts(scouts.map(s => 
        s.id === scoutId ? { ...s, status: 'declined' } : s
      ));
      toast.success('スカウトを辞退しました');
    }
  };

  const filteredScouts = filter === 'all' 
    ? scouts 
    : scouts.filter(s => s.status === filter);

  const statusColors = {
    new: 'bg-blue-100 text-blue-700',
    viewed: 'bg-gray-100 text-gray-700',
    replied: 'bg-green-100 text-green-700',
    declined: 'bg-red-100 text-red-700'
  };

  const statusLabels = {
    new: '新着',
    viewed: '既読',
    replied: '返信済み',
    declined: '辞退'
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaEnvelope className="text-blue-600" />
            企業からのスカウト状況
          </h1>
          <p className="text-gray-600 mt-2">あなたに届いたスカウトを確認できます</p>
        </div>

        <div className="mb-6 bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'new', 'viewed', 'replied', 'declined'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === status
                    ? 'bg-[#FF733E] text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {status === 'all' ? 'すべて' : statusLabels[status]}
                <span className="ml-2 inline-block px-2 py-1 bg-white bg-opacity-30 rounded-full text-xs">
                  {status === 'all' 
                    ? scouts.length 
                    : scouts.filter(s => s.status === status).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {filteredScouts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FaEnvelope className="mx-auto h-24 w-24 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              スカウトがありません
            </h3>
            <p className="text-gray-500">
              プロフィールを充実させて、企業からのスカウトを待ちましょう
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredScouts.map((scout) => (
              <div key={scout.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <FaBuilding className="text-gray-400 text-2xl" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                          {scout.companyName}
                        </h3>
                        <p className="text-lg text-gray-600 mt-1 flex items-center gap-2">
                          <FaBriefcase className="text-gray-400" />
                          {scout.position}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${statusColors[scout.status]}`}>
                      {statusLabels[scout.status]}
                    </span>
                  </div>

                  <p className="text-gray-700 mb-4 line-clamp-2">
                    {scout.message}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                    {scout.salary && (
                      <span className="flex items-center gap-1">
                        💰 {scout.salary}
                      </span>
                    )}
                    {scout.location && (
                      <span className="flex items-center gap-1">
                        📍 {scout.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <FaCalendarAlt />
                      {new Date(scout.receivedAt).toLocaleDateString('ja-JP')}
                    </span>
                  </div>

                  <div className="flex gap-3">
                    {scout.status === 'new' || scout.status === 'viewed' ? (
                      <>
                        <button
                          onClick={() => handleReply(scout.id)}
                          className="px-4 py-2 bg-[#FF733E] text-white rounded-lg hover:bg-orange-70 active:bg-orange-60 transition"
                        >
                          返信する
                        </button>
                        <button
                          onClick={() => handleDecline(scout.id)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                        >
                          辞退する
                        </button>
                      </>
                    ) : scout.status === 'replied' ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <FaCheckCircle />
                        <span>返信済み</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600">
                        <FaClock />
                        <span>辞退済み</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">スカウト対応のコツ</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600">✓</span>
              <span>スカウトメッセージは早めに確認し、返信しましょう</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">✓</span>
              <span>興味がある場合は、具体的な質問を含めて返信すると効果的です</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">✓</span>
              <span>辞退する場合も、丁寧にお断りすることで良い印象を残せます</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
