'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/app/redux/hooks';
import { FaCrown, FaCheck, FaTimes, FaRocket, FaStar } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  notIncluded: string[];
  recommended?: boolean;
}

export default function PaidPlanPage() {
  const router = useRouter();
  const authState = useAppSelector(state => state.auth);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authState.isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authState, router]);

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'フリープラン',
      price: 0,
      period: '月',
      features: [
        '職務経歴書作成（3件まで）',
        '企業検索・閲覧',
        'スカウト受信',
        '基本的なサポート'
      ],
      notIncluded: [
        'AI面接対策',
        '優先サポート',
        '詳細分析レポート'
      ]
    },
    {
      id: 'standard',
      name: 'スタンダードプラン',
      price: 2980,
      period: '月',
      features: [
        '職務経歴書作成（無制限）',
        '企業検索・閲覧',
        'スカウト受信',
        'AI職務経歴書添削',
        'AI面接対策（月10回）',
        '応募管理機能',
        'メールサポート'
      ],
      notIncluded: [
        '優先サポート',
        '1対1キャリア相談'
      ],
      recommended: true
    },
    {
      id: 'premium',
      name: 'プレミアムプラン',
      price: 5980,
      period: '月',
      features: [
        '職務経歴書作成（無制限）',
        '企業検索・閲覧（詳細情報付き）',
        'スカウト受信（優先表示）',
        'AI職務経歴書添削（無制限）',
        'AI面接対策（無制限）',
        '応募管理機能',
        '詳細分析レポート',
        '1対1キャリア相談（月1回）',
        '優先サポート',
        '転職成功保証'
      ],
      notIncluded: []
    }
  ];

  const handleUpgrade = async (planId: string) => {
    if (planId === currentPlan) {
      toast.error('既に選択中のプランです');
      return;
    }

    setSelectedPlan(planId);
    setLoading(true);

    try {
      // プラン変更のシミュレーション
      setTimeout(() => {
        setCurrentPlan(planId);
        setLoading(false);
        toast.success('プランを変更しました');
      }, 1500);
    } catch (error) {
      setLoading(false);
      toast.error('プラン変更に失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
            <FaCrown className="text-yellow-500" />
            有料プラン
          </h1>
          <p className="text-gray-600 mt-2">あなたに最適なプランを選択してください</p>
        </div>

        <div className="mb-6 bg-[#FFF5F3] rounded-lg p-4 text-center">
          <p className="text-[#FF733E]">
            現在のプラン: <span className="font-bold">{plans.find(p => p.id === currentPlan)?.name}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-lg shadow-lg overflow-hidden ${
                plan.recommended ? 'ring-2 ring-[#FF733E]' : ''
              } ${currentPlan === plan.id ? 'border-2 border-green-500' : ''}`}
            >
              {plan.recommended && (
                <div className="bg-[#FFF5F3]0 text-white text-center py-2 font-bold">
                  おすすめ
                </div>
              )}
              
              <div className="p-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold">¥{plan.price.toLocaleString()}</span>
                    <span className="text-gray-600 ml-2">/{plan.period}</span>
                  </div>
                  {currentPlan === plan.id && (
                    <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      現在のプラン
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">含まれる機能</h3>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <FaCheck className="text-green-500 mt-1 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.notIncluded.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">含まれない機能</h3>
                      <ul className="space-y-2">
                        {plan.notIncluded.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <FaTimes className="text-red-500 mt-1 flex-shrink-0" />
                            <span className="text-sm text-gray-500">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={loading || currentPlan === plan.id}
                  className={`w-full mt-6 py-3 rounded-lg font-medium transition ${
                    currentPlan === plan.id
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : plan.recommended
                      ? 'bg-[#FF733E] text-white hover:bg-[#FF8659]'
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  {currentPlan === plan.id 
                    ? '選択中' 
                    : loading && selectedPlan === plan.id 
                    ? '処理中...'
                    : plan.price === 0 
                    ? 'ダウングレード' 
                    : 'アップグレード'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaRocket className="text-[#FF733E]" />
              プレミアムプランの特典
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li>• 専任キャリアアドバイザーによる個別サポート</li>
              <li>• 転職成功率を高める詳細な分析レポート</li>
              <li>• 優先的なスカウト表示で企業の目に留まりやすく</li>
              <li>• 転職成功保証付き（条件あり）</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaStar className="text-yellow-500" />
              よくある質問
            </h3>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-gray-800">Q: いつでもプラン変更できますか？</p>
                <p className="text-sm text-gray-600 mt-1">A: はい、いつでも変更可能です。日割り計算で調整されます。</p>
              </div>
              <div>
                <p className="font-medium text-gray-800">Q: 解約はできますか？</p>
                <p className="text-sm text-gray-600 mt-1">A: いつでも解約可能です。解約後も月末まで利用できます。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}