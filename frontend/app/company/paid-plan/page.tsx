'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaBuilding, FaCheck, FaSpinner } from 'react-icons/fa';
import { plansByRole, PlanTier, PlanDef } from '@/config/plans';
import { getAuthHeaders } from '@/utils/auth';
import { buildApiUrl } from '@/config/api';
import toast from 'react-hot-toast';

export default function CompanyPaidPlanPage() {
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<PlanTier | ''>('');
  const [loadingPlan, setLoadingPlan] = useState<PlanTier | ''>('');

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
          router.push('/auth/login');
        }
      } catch {}
    };
    fetchProfile();
  }, [router]);

  const gotoStripeCheckout = async (plan: PlanDef) => {
    if (!plan.stripePriceId) {
      toast.error('このプランのStripe設定が見つかりません');
      return;
    }
    setLoadingPlan(plan.id);
    try {
      const res = await fetch(buildApiUrl('/payments/checkout/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          plan_type: plan.id,
          price_id: plan.stripePriceId,
          interval: plan.interval,
          role: 'company',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.checkout_url) {
        throw new Error(data?.error || 'checkout');
      }
      window.location.href = data.checkout_url;
    } catch (error) {
      console.error('Stripe checkout error', error);
      toast.error('決済ページに遷移できませんでした');
      setLoadingPlan('');
    }
  };

  const changePlan = async (plan: PlanDef) => {
    if (plan.id === currentPlan) return;
    setLoadingPlan(plan.id);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/api/v2/user/settings/`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ user: { plan_tier: plan.id, is_premium: true } }),
      });
      if (!res.ok) throw new Error('failed');
      setCurrentPlan(plan.id);
      toast.success('プランを変更しました');
    } catch (e) {
      toast.error('変更に失敗しました');
    } finally {
      setLoadingPlan('');
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
          {plans.map(plan => {
            const isActive = currentPlan === plan.id;
            const interval = plan.interval === 'year' ? '年' : '月';
            const canCheckout = Boolean(plan.stripePriceId);
            const badge = plan.badge;
            const cardEmphasis = plan.highlight ? 'ring-2 ring-primary-600 shadow-xl' : 'shadow-lg';
            const isLoading = loadingPlan === plan.id;

            const handleSelect = () => {
              if (isActive || isLoading) return;
              if (canCheckout) {
                gotoStripeCheckout(plan);
              } else {
                changePlan(plan);
              }
            };

            const buttonLabel = isActive
              ? '利用中のプラン'
              : canCheckout
                ? isLoading
                  ? '処理中…'
                  : 'Stripeで申し込む'
                : isLoading
                  ? '変更中…'
                  : 'このプランに変更';

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl overflow-hidden border transition ${
                  isActive ? 'border-green-400' : 'border-transparent'
                } ${cardEmphasis}`}
              >
                {badge && (
                  <div className="bg-primary-600 text-white text-center py-2 text-sm font-semibold">
                    {badge}
                  </div>
                )}
                <div className="p-6 flex flex-col h-full">
                  <div className="text-center mb-6 space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900">{plan.name}</h2>
                    {plan.tagline && <p className="text-sm text-gray-500">{plan.tagline}</p>}
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-4xl font-extrabold text-gray-900">¥{plan.price.toLocaleString()}</span>
                      <span className="text-sm text-gray-500">/{interval}</span>
                    </div>
                    {isActive && (
                      <span className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full">
                        <span className="w-2 h-2 bg-green-600 rounded-full" />
                        現在のプラン
                      </span>
                    )}
                  </div>

                  <ul className="space-y-3 text-sm text-gray-700 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <FaCheck className="text-green-500 mt-1" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={handleSelect}
                    disabled={isLoading || isActive}
                    className={`w-full mt-8 py-3 rounded-lg font-medium transition ${
                      isActive || isLoading
                        ? 'bg-primary-300 text-white cursor-not-allowed'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    {isLoading && !isActive ? (
                      <span className="flex items-center justify-center gap-2">
                        <FaSpinner className="animate-spin" />
                        {buttonLabel}
                      </span>
                    ) : (
                      buttonLabel
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
