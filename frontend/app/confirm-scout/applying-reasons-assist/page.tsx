'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppSelector } from '@/app/redux/hooks';
import { FaPencilAlt, FaBuilding, FaLightbulb, FaPaperPlane } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function ApplyingReasonsAssistPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authState = useAppSelector(state => state.auth);
  const scoutId = searchParams.get('scoutId');
  
  const [companyInfo, setCompanyInfo] = useState({
    name: '株式会社テックイノベーション',
    position: 'シニアエンジニア',
    description: 'AI技術を活用したサービス開発を行っている成長企業'
  });
  
  const [formData, setFormData] = useState({
    interests: '',
    experience: '',
    contribution: ''
  });
  
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [loading, setLoading] = useState(false);

  // Avoid redirecting before persisted auth rehydrates
  useEffect(() => {
    const hasStoredToken = typeof window !== 'undefined' && !!localStorage.getItem('drf_token_v2');
    if (!authState.isAuthenticated && !hasStoredToken) {
      router.push('/auth/login');
    }
  }, [authState.isAuthenticated, router]);

  const handleGenerate = async () => {
    if (!formData.interests || !formData.experience) {
      toast.error('興味・関心と経験・スキルを入力してください');
      return;
    }

    setLoading(true);
    try {
      // AI生成のシミュレーション
      setTimeout(() => {
        const response = `${companyInfo.name} 採用担当者様

この度は、${companyInfo.position}のポジションでスカウトをいただき、誠にありがとうございます。

【貴社に興味を持った理由】
${formData.interests}という点に大変興味を持っております。特に、${companyInfo.description}という貴社の事業内容は、私のキャリア目標と完全に一致しています。

【私の経験・スキル】
${formData.experience}の経験を通じて培ったスキルを、貴社の事業発展に活かせると確信しています。

【貴社で実現したいこと】
${formData.contribution || '貴社の成長に貢献しながら、自身のスキルもさらに向上させていきたい'}と考えています。

ぜひ一度、詳細についてお話しする機会をいただければ幸いです。
よろしくお願いいたします。`;

        setGeneratedResponse(response);
        setLoading(false);
        toast.success('返信文を生成しました');
      }, 2000);
    } catch (error) {
      setLoading(false);
      toast.error('エラーが発生しました');
    }
  };

  const handleSend = () => {
    toast.success('返信を送信しました');
    router.push('/confirm-scout/status');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedResponse);
    toast.success('クリップボードにコピーしました');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaPencilAlt className="text-blue-600" />
            スカウト企業への志望理由作成補助
          </h1>
          <p className="text-gray-600 mt-2">スカウトへの返信文を作成します</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FaBuilding className="text-gray-600" />
            スカウト企業情報
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">企業名</p>
              <p className="font-medium">{companyInfo.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">募集ポジション</p>
              <p className="font-medium">{companyInfo.position}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">事業内容</p>
              <p className="font-medium">{companyInfo.description}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">返信内容の入力</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  この企業に興味を持った点
                </label>
                <textarea
                  value={formData.interests}
                  onChange={(e) => setFormData({...formData, interests: e.target.value})}
                  placeholder="例: AI技術を活用した革新的なサービス開発"
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  活かせる経験・スキル
                </label>
                <textarea
                  value={formData.experience}
                  onChange={(e) => setFormData({...formData, experience: e.target.value})}
                  placeholder="例: 5年間のWeb開発経験、React/Node.jsでの開発実績"
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  貢献したいこと（任意）
                </label>
                <textarea
                  value={formData.contribution}
                  onChange={(e) => setFormData({...formData, contribution: e.target.value})}
                  placeholder="例: 技術力を活かしてプロダクトの品質向上に貢献"
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-3 bg-[#FF733E] text-white rounded-lg hover:bg-orange-70 active:bg-orange-60 transition disabled:bg-gray-400"
              >
                {loading ? '生成中...' : '返信文を生成'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FaLightbulb className="text-yellow-500" />
              生成された返信文
            </h2>
            
            {generatedResponse ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-gray-700 font-sans text-sm">
                    {generatedResponse}
                  </pre>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleCopy}
                    className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                  >
                    コピー
                  </button>
                  <button
                    onClick={handleSend}
                    className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                  >
                    <FaPaperPlane />
                    送信
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <FaPencilAlt className="text-6xl mx-auto mb-4" />
                  <p>左側のフォームに入力して返信文を生成してください</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">効果的な返信のポイント</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-2">
              <span className="text-yellow-600">💡</span>
              <div>
                <p className="font-medium text-gray-700">迅速な返信</p>
                <p className="text-sm text-gray-600">スカウトから1週間以内の返信が理想的</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-yellow-600">💡</span>
              <div>
                <p className="font-medium text-gray-700">具体的な内容</p>
                <p className="text-sm text-gray-600">企業研究をして具体的な興味を示す</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-yellow-600">💡</span>
              <div>
                <p className="font-medium text-gray-700">前向きな姿勢</p>
                <p className="text-sm text-gray-600">意欲と熱意を伝える</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
