'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/app/redux/hooks';
import { useSearchSeekers, useCreateScout, useCreateApplication } from '@/hooks/useApi';
import { Search, Filter, MapPin, Briefcase, Calendar, Send, UserPlus, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface SeekerProfile {
  id: string;
  email: string;
  full_name: string;
  gender?: string;
  phone?: string;
  created_at: string;
  // 追加のプロフィール情報
  experience_years?: number;
  skills?: string[];
  location?: string;
  desired_salary?: string;
  resume_id?: string;
}

export default function CompanySearchPage() {
  const router = useRouter();
  const authState = useAppSelector(state => state.auth);
  const createScoutMutation = useCreateScout();
  const createApplicationMutation = useCreateApplication();

  // 検索条件
  const [searchParams, setSearchParams] = useState({
    q: '',
    skills: '',
    location: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSeeker, setSelectedSeeker] = useState<SeekerProfile | null>(null);
  const [scoutMessage, setScoutMessage] = useState('');
  const [showScoutModal, setShowScoutModal] = useState(false);

  // 検索実行
  const { data: searchResults, isLoading, refetch } = useSearchSeekers(searchParams);

  // 認証チェック
  useEffect(() => {
    if (!authState.isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (authState.user?.role !== 'company') {
      router.push('/');
      toast.error('企業アカウントでログインしてください');
    }
  }, [authState, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  const handleScoutClick = (seeker: SeekerProfile) => {
    setSelectedSeeker(seeker);
    setShowScoutModal(true);
    setScoutMessage(`${seeker.full_name}様

この度は、貴方のプロフィールを拝見し、ぜひ弊社の求人にご興味を持っていただければと思い、ご連絡させていただきました。

${authState.user?.company_name || '弊社'}では、現在新しいメンバーを募集しており、貴方のご経験とスキルが弊社の求める人材像と合致していると感じております。

詳細についてお話しする機会をいただければ幸いです。
ご検討のほど、よろしくお願いいたします。`);
  };

  const handleSendScout = async () => {
    if (!selectedSeeker || !scoutMessage.trim()) {
      toast.error('メッセージを入力してください');
      return;
    }

    try {
      await createScoutMutation.mutateAsync({
        seeker: selectedSeeker.id,
        scout_message: scoutMessage,
      });
      toast.success('スカウトを送信しました');
      setShowScoutModal(false);
      setSelectedSeeker(null);
      setScoutMessage('');
    } catch (error) {
      toast.error('スカウト送信に失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">求職者検索</h1>
            <button
              onClick={() => router.push('/company/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              ダッシュボードに戻る
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 検索フォーム */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <form onSubmit={handleSearch}>
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="キーワードで検索（名前、スキルなど）"
                    value={searchParams.q}
                    onChange={(e) => setSearchParams({ ...searchParams, q: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Filter size={18} />
                フィルター
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                検索
              </button>
            </div>

            {/* 詳細フィルター */}
            {showFilters && (
              <div className="border-t pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      スキル
                    </label>
                    <input
                      type="text"
                      placeholder="JavaScript, Python, etc."
                      value={searchParams.skills}
                      onChange={(e) => setSearchParams({ ...searchParams, skills: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      勤務地
                    </label>
                    <input
                      type="text"
                      placeholder="東京都、大阪府など"
                      value={searchParams.location}
                      onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* 検索結果 */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                検索中...
              </div>
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            searchResults.map((seeker: any) => (
              <SeekerCard
                key={seeker.id}
                seeker={seeker}
                onScout={() => handleScoutClick(seeker)}
                onViewDetails={() => router.push(`/company/seeker/${seeker.id}`)}
              />
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">
                {searchParams.q || searchParams.skills || searchParams.location
                  ? '検索条件に一致する求職者が見つかりませんでした'
                  : '検索条件を入力してください'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* スカウトモーダル */}
      {showScoutModal && selectedSeeker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">スカウトメッセージを送信</h2>
                <button
                  onClick={() => setShowScoutModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">送信先:</p>
                <p className="font-semibold text-gray-900">{selectedSeeker.full_name}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メッセージ
                </label>
                <textarea
                  value={scoutMessage}
                  onChange={(e) => setScoutMessage(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="スカウトメッセージを入力してください"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowScoutModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSendScout}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Send size={18} />
                  送信
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 求職者カードコンポーネント
function SeekerCard({ 
  seeker, 
  onScout, 
  onViewDetails 
}: { 
  seeker: any; 
  onScout: () => void; 
  onViewDetails: () => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-2xl font-semibold text-gray-600">
                {seeker.full_name?.charAt(0) || '?'}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{seeker.full_name || '名前未設定'}</h3>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                {seeker.location && (
                  <div className="flex items-center gap-1">
                    <MapPin size={16} />
                    {seeker.location}
                  </div>
                )}
                {seeker.experience_years !== undefined && (
                  <div className="flex items-center gap-1">
                    <Briefcase size={16} />
                    経験{seeker.experience_years}年
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar size={16} />
                  登録日: {new Date(seeker.created_at).toLocaleDateString()}
                </div>
              </div>
              
              {seeker.skills && seeker.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {seeker.skills.map((skill: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 ml-4">
          <button
            onClick={onViewDetails}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            詳細を見る
          </button>
          <button
            onClick={onScout}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
          >
            <Send size={16} />
            スカウト
          </button>
        </div>
      </div>
    </div>
  );
}