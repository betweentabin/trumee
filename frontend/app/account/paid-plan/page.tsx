'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/app/redux/hooks';
import { FaCrown, FaCheck, FaTimes, FaRocket, FaStar } from 'react-icons/fa';
import { plansByRole, PlanTier } from '@/config/plans';
import { getAuthHeaders } from '@/utils/auth';
import toast from 'react-hot-toast';

export default function PaidPlanPage() {
  const router = useRouter();
  const authState = useAppSelector(state => state.auth);
  const [currentPlan, setCurrentPlan] = useState<PlanTier | ''>('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'user' | 'company'>('user');

  useEffect(() => {
    const hasStoredToken = typeof window !== 'undefined' && !!localStorage.getItem('drf_token_v2');
    if (!authState.isAuthenticated && !hasStoredToken) {
      router.push('/auth/login');
    }
  }, [authState.isAuthenticated, router]);

  // ログインユーザー情報から現在のプランとロールを取得
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/v2/profile/me/`, { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          setRole(data.role === 'company' ? 'company' : 'user');
          setCurrentPlan((data.plan_tier as PlanTier) || '');
        }
      } catch {}
    };
    fetchProfile();
  }, []);

  const plans = plansByRole[role];

  const handleUpgrade = async (planId: PlanTier) => {
    if (planId === currentPlan) {
      toast.error('既に選択中のプランです');
      return;
    }

    setSelectedPlan(planId);
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/v2/user/settings/`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ user: { plan_tier: planId, is_premium: planId !== 'starter' ? true : true } }),
      });
      if (!res.ok) throw new Error('failed');
      setCurrentPlan(planId);
      toast.success('プランを変更しました');
    } catch (error) {
      setLoading(false);
      toast.error('プラン変更に失敗しました');
      return;
    }
    setLoading(false);
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
            現在のプラン: <span className="font-bold">{plans.find(p => p.id === currentPlan)?.name || '未契約'}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-lg shadow-lg overflow-hidden ${
                plan.id === 'standard' ? 'ring-2 ring-[#FF733E]' : ''
              } ${currentPlan === plan.id ? 'border-2 border-green-500' : ''}`}
            >
              {plan.id === 'standard' && (
                <div className="bg-[#FF733E] text-white text-center py-2 font-bold">おすすめ</div>
              )}
              
              <div className="p-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold">¥{plan.price.toLocaleString()}</span>
                    <span className="text-gray-600 ml-2">/月</span>
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
                </div>

                <button
                  onClick={() => handleUpgrade(plan.id as PlanTier)}
                  disabled={loading || currentPlan === plan.id}
                  className={`w-full mt-6 py-3 rounded-lg font-medium transition ${
                    currentPlan === plan.id
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : plan.id === 'standard'
                      ? 'bg-[#FF733E] text-white hover:bg-[#FF8659]'
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  {currentPlan === plan.id 
                    ? '選択中' 
                    : loading && selectedPlan === plan.id 
                    ? '処理中...'
                    : 'このプランに変更'}
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
