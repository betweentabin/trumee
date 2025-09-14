'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/app/redux/hooks';
import { FaBriefcase, FaLightbulb, FaPencilAlt, FaStar } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function ApplyingReasonsPage() {
  const router = useRouter();
  const authState = useAppSelector(state => state.auth);
  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('');
  const [reasons, setReasons] = useState('');
  const [generatedReason, setGeneratedReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authState.isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authState, router]);

  const handleGenerate = async () => {
    if (!companyName || !position) {
      toast.error('企業名と希望職種を入力してください');
      return;
    }

    setLoading(true);
    try {
      // AI生成のシミュレーション
      setTimeout(() => {
        const sample = `${companyName}への志望理由

私は${position}として、貴社の事業に大きな興味を持っております。

【志望理由1: 事業への共感】
貴社の革新的なサービスと顧客中心のアプローチに深く共感しております。特に、技術革新を通じて社会課題を解決するという理念は、私のキャリア目標と完全に一致しています。

【志望理由2: スキルの活用】
これまでの経験で培った技術スキルと問題解決能力を、貴社の${position}として最大限に活用できると確信しています。

【志望理由3: 成長機会】
貴社の成長環境において、自身のスキルをさらに磨き、チームと共に成長していきたいと考えています。`;

        setGeneratedReason(sample);
        setLoading(false);
        toast.success('志望理由を生成しました');
      }, 2000);
    } catch (error) {
      setLoading(false);
      toast.error('エラーが発生しました');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaBriefcase className="text-blue-600" />
            転職理由（志望理由）
          </h1>
          <p className="text-gray-600 mt-2">企業への志望理由を作成するお手伝いをします</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">基本情報入力</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  企業名
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="例: 株式会社ABC"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  希望職種
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="例: システムエンジニア"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  あなたの強み・経験（任意）
                </label>
                <textarea
                  value={reasons}
                  onChange={(e) => setReasons(e.target.value)}
                  placeholder="これまでの経験や強みを記入してください..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-3 bg-[#FF733E] text-white rounded-lg hover:bg-orange-70 active:bg-orange-60 transition disabled:bg-gray-400"
              >
                {loading ? '生成中...' : '志望理由を生成'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FaLightbulb className="text-yellow-500" />
              生成された志望理由
            </h2>
            
            {generatedReason ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                  <pre className="whitespace-pre-wrap text-gray-700 font-sans">{generatedReason}</pre>
                </div>
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                    コピー
                  </button>
                  <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
                    編集
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <FaPencilAlt className="text-6xl mx-auto mb-4" />
                  <p>企業情報を入力して志望理由を生成してください</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FaStar className="text-yellow-500" />
            志望理由作成のポイント
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">企業研究</h4>
              <p className="text-sm text-gray-600">企業の理念、事業内容、強みを理解しましょう</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">自己分析</h4>
              <p className="text-sm text-gray-600">自分の強みと企業のニーズをマッチングさせましょう</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">具体性</h4>
              <p className="text-sm text-gray-600">具体的な経験やスキルを交えて説明しましょう</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
