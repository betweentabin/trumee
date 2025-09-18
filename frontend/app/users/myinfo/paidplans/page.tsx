"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Leftpage from '@/components/user/page';
import useAuthV2 from '@/hooks/useAuthV2';
import { getAccessToken, getAuthHeaders } from '@/utils/auth';
import { plansByRole, PlanTier, PlanDef } from '@/config/plans';
import { buildApiUrl } from '@/config/api';
import toast from 'react-hot-toast';
import { FaCheck, FaSpinner } from 'react-icons/fa';

export default function UserPaidPlansPage() {
  const router = useRouter();
  const { isAuthenticated, initializeAuth } = useAuthV2();
  const plans = plansByRole.user;
  const [currentPlan, setCurrentPlan] = useState<PlanTier | ''>('');
  const [loadingPlan, setLoadingPlan] = useState<PlanTier | ''>('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/v2/profile/me/`, { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          setCurrentPlan((data.plan_tier as PlanTier) || '');
        }
      } catch (error) {
        console.error('failed to fetch profile plan tier', error);
      }
    };

    fetchProfile();
  }, []);

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
          role: 'user',
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
    } catch (error) {
      toast.error('プラン変更に失敗しました');
    } finally {
      setLoadingPlan('');
    }
  };

  const handleHighlightCheckout = () => {
    const recommended = plans.find(plan => plan.highlight) || plans[0];
    if (!recommended) return;
    if (loadingPlan) return;
    if (recommended.stripePriceId) {
      gotoStripeCheckout(recommended);
    } else {
      changePlan(recommended);
    }
  };

  useEffect(() => { initializeAuth(); }, [initializeAuth]);
  useEffect(() => {
    if (isAuthenticated === false) {
      const hasStored = typeof window !== 'undefined' && !!getAccessToken();
      if (!hasStored) router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-500 mb-6" aria-label="breadcrumb">
          <ol className="flex items-center gap-2">
            <li className="hover:text-gray-700 cursor-pointer" onClick={() => router.push('/')}>TOP</li>
            <li>›</li>
            <li className="text-gray-800">マイページ</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left navigation */}
          <aside className="lg:col-span-3">
            <Leftpage />
          </aside>

          {/* Main content */}
          <div className="lg:col-span-9">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">有料プラン</h1>
              <p className="mt-2 text-gray-600">有料プランに関する説明があります。</p>
            </div>

            <div className="mb-6 bg-[#E8F5F2] rounded-lg p-4 text-center">
              <p className="text-[#14795A]">
                現在のプラン: <span className="font-bold">{plans.find(p => p.id === currentPlan)?.name || '未契約'}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {plans.map(plan => {
                const isActive = plan.id === currentPlan;
                const interval = plan.interval === 'year' ? '年' : '月';
                const badge = plan.badge;
                const canCheckout = Boolean(plan.stripePriceId);
                const isLoading = loadingPlan === plan.id;

                const onSelect = () => {
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
                    } ${plan.highlight ? 'ring-2 ring-[#14795A] shadow-xl' : 'shadow-lg'}`}
                  >
                    {badge && (
                      <div className="bg-[#14795A] text-white text-center py-2 text-sm font-semibold">
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
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <FaCheck className="text-green-500 mt-1" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <button
                        onClick={onSelect}
                        disabled={isLoading || isActive}
                        className={`w-full mt-8 py-3 rounded-lg font-medium transition ${
                          isActive
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : plan.highlight
                              ? 'bg-[#14795A] text-white hover:bg-[#116a4f]'
                              : 'bg-gray-800 text-white hover:bg-gray-700'
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

            {/* Hero Offer: 職務経歴書の添削 */}
            <div className="mb-6 border rounded-xl overflow-hidden">
              <div className="flex items-stretch">
                <div className="bg-[#143D33] text-white px-6 py-5 font-semibold flex items-center justify-center min-w-[220px]">職務経歴書の添削</div>
                <div className="flex-1 px-6 py-5 flex items-center justify-between">
                  <div className="text-gray-800 flex items-baseline gap-3">
                    <span className="line-through text-gray-400">50,000円</span>
                    <span className="text-2xl font-bold">0円</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 面接アドバイス */}
            <div className="mb-6 border rounded-xl overflow-hidden">
              <div className="flex items-stretch">
                <div className="bg-[#143D33] text-white px-6 py-5 font-semibold min-w-[220px] flex items-center">面接アドバイス</div>
                <div className="flex-1 px-6 py-5 text-gray-700">各質問ごとの対策が可能（最初は一部無料可）</div>
              </div>
            </div>

            {/* 各 20,000円 セクション */}
            <div className="mb-10">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {['転職理由 志望動機', '職務経歴書関連', '自己PR対策', '面接全般'].map((t) => (
                  <div key={t} className="border rounded-xl h-24 flex items-center justify-center text-gray-800 bg-white">{t}</div>
                ))}
              </div>
              <div className="text-center mt-3 text-gray-700">各 20,000円</div>
            </div>

            {/* 自己理解3点セット */}
            <div className="mb-10">
              <div className="text-center mb-3 text-gray-800">自己理解3点セット</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {['転職理由', '職務経歴書', '自己PR'].map((t) => (
                  <div key={t} className="border rounded-xl h-24 flex items-center justify-center bg-white text-gray-800">{t}</div>
                ))}
              </div>
              <div className="text-center mt-3 text-gray-800">50,000円</div>
            </div>

            {/* 面接アドバイスフルパッケージ */}
            <div className="mb-10">
              <div className="text-center mb-3 text-gray-800">面接アドバイスフルパッケージ（全対策セット）</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {['転職理由 志望動機', '職務経歴書関連', '自己PR対策', '面接全般'].map((t) => (
                  <div key={t} className="border rounded-xl h-24 flex items-center justify-center bg-white text-gray-800">{t}</div>
                ))}
              </div>
              <div className="text-center mt-3 text-gray-800">60,000円</div>
            </div>

            {/* 転職サポートプラン */}
            <div className="mb-12">
              <div className="text-center mb-3 text-gray-800">転職サポートプラン</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['職務経歴書の添削', '面接アドバイスフルパッケージ'].map((t) => (
                  <div key={t} className="border rounded-xl h-24 flex items-center justify-center bg-white text-gray-800">{t}</div>
                ))}
              </div>
              <div className="text-center mt-3 text-gray-800">
                110,000円（職務経歴書添削 + 面接アドバイスフルパッケージ含む）
              </div>
              <div className="text-center text-sm text-gray-600 mt-1">弊社経由で転職成功した場合、システム利用料を全額返金！</div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <button
                disabled={!!loadingPlan}
                onClick={handleHighlightCheckout}
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#FF733E] text-white hover:bg-[#e9632e] disabled:opacity-60"
              >
                {loadingPlan ? (
                  <span className="flex items-center gap-2">
                    <FaSpinner className="animate-spin" />
                    決済ページを準備中…
                  </span>
                ) : (
                  '有料プランに加入する'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
