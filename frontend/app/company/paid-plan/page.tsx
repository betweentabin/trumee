'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaBuilding, FaCheck } from 'react-icons/fa';
import { plansByRole, PlanTier } from '@/config/plans';
import { getAuthHeaders } from '@/utils/auth';
import toast from 'react-hot-toast';

export default function CompanyPaidPlanPage() {
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<PlanTier | ''>('');
  const [loading, setLoading] = useState(false);

  const plans = plansByRole.company;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/v2/profile/me/`, { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          setCurrentPlan((data.plan_tier as PlanTier) || '');
        } else if (res.status === 401) {
          router.push('/auth/company/login');
        }
      } catch {}
    };
    fetchProfile();
  }, [router]);

  const changePlan = async (planId: PlanTier) => {
    if (planId === currentPlan) return;
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/v2/user/settings/`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ user: { plan_tier: planId, is_premium: true } }),
      });
      if (!res.ok) throw new Error('failed');
      setCurrentPlan(planId);
      toast.success('プランを変更しました');
    } catch (e) {
      toast.error('変更に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
            <FaBuilding className="text-primary-600" /> 企業向け 有料プラン
          </h1>
          <p className="text-gray-600 mt-2">採用活動を加速するプランを選択</p>
        </div>

        <div className="mb-6 bg-[#FFF5F3] rounded-lg p-4 text-center">
          <p className="text-primary-600">
            現在のプラン: <span className="font-bold">{plans.find(p => p.id === currentPlan)?.name || '未契約'}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan.id} className={`bg-white rounded-lg shadow-lg overflow-hidden ${plan.id === 'standard' ? 'ring-2 ring-primary-600' : ''} ${currentPlan === plan.id ? 'border-2 border-green-500' : ''}`}>
              {plan.id === 'standard' && (
                <div className="bg-primary-600 text-white text-center py-2 font-bold">おすすめ</div>
              )}
              <div className="p-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold">¥{plan.price.toLocaleString()}</span>
                    <span className="text-gray-600 ml-2">/月</span>
                  </div>
                  {currentPlan === plan.id && (
                    <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">現在のプラン</span>
                  )}
                </div>
                <ul className="space-y-2">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      <FaCheck className="text-green-500 mt-1" />
                      <span className="text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => changePlan(plan.id as PlanTier)}
                  disabled={loading || currentPlan === plan.id}
                  className={`w-full mt-6 py-3 rounded-lg font-medium transition ${currentPlan === plan.id ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : plan.id === 'standard' ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-secondary-900 text-white hover:bg-secondary-800'}`}
                >
                  {currentPlan === plan.id ? '選択中' : 'このプランに変更'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
