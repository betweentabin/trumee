"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Leftpage from '@/components/user/page';
import useAuthV2 from '@/hooks/useAuthV2';
import { getAccessToken, getAuthHeaders } from '@/utils/auth';
import { plansByRole, PlanTier, PlanDef } from '@/config/plans';
import { buildApiUrl } from '@/config/api';
import toast from 'react-hot-toast';
import { FaSpinner, FaCheckCircle, FaTimesCircle, FaLock, FaStar } from 'react-icons/fa';

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

  type FeatureStatus = 'included' | 'excluded' | 'partial';

  const featureMatrix: Array<{
    key: string;
    label: string;
    availability: Record<PlanTier, FeatureStatus>;
    partialNote?: string;
  }> = [
    {
      key: 'resume-review',
      label: '職務経歴書の添削',
      availability: {
        starter: 'included',
        standard: 'included',
        premium: 'included',
      },
    },
    {
      key: 'interview-questions',
      label: '面接で聞かれそうなQの事前案内',
      partialNote: 'スターターは一部のみ閲覧可能（鍵付き）',
      availability: {
        starter: 'partial',
        standard: 'included',
        premium: 'included',
      },
    },
    {
      key: 'motivation-review',
      label: 'スカウト企業の志望理由添削',
      availability: {
        starter: 'excluded',
        standard: 'included',
        premium: 'included',
      },
    },
    {
      key: 'interview-prep',
      label: '面接対策セッション（模擬面接含む）',
      availability: {
        starter: 'excluded',
        standard: 'excluded',
        premium: 'included',
      },
    },
    {
      key: 'refund',
      label: '2社マッチング成立で全額返金保証',
      availability: {
        starter: 'included',
        standard: 'included',
        premium: 'included',
      },
    },
  ];

  const renderStatusIcon = (status: FeatureStatus) => {
    switch (status) {
      case 'included':
        return <FaCheckCircle className="text-primary-600" aria-hidden />;
      case 'partial':
        return <FaLock className="text-amber-500" aria-hidden />;
      default:
        return <FaTimesCircle className="text-gray-300" aria-hidden />;
    }
  };

  const renderStatusLabel = (status: FeatureStatus) => {
    switch (status) {
      case 'included':
        return '利用可能';
      case 'partial':
        return '一部公開';
      default:
        return '対象外';
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
              <p className="mt-2 text-gray-600">
                あなたの転職活動を段階的にサポートする3つのプランをご用意しています。
              </p>
            </div>

            <div className="mb-6 rounded-lg bg-orange-50 border border-orange-200 p-4 text-center">
              <p className="text-orange-700">
                現在のプラン: <span className="font-bold">{plans.find(p => p.id === currentPlan)?.name || '未契約'}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {plans.map((plan) => {
                const isCurrent = plan.id === currentPlan;
                const isLoading = loadingPlan === plan.id;
                const primaryBtnLabel = isCurrent ? 'ご利用中' : plan.highlight ? 'おすすめプランを申し込む' : 'アップグレード';
                const action = () => {
                  if (isCurrent || isLoading) return;
                  if (plan.stripePriceId) {
                    gotoStripeCheckout(plan);
                  } else {
                    changePlan(plan);
                  }
                };

                const cardClass = plan.highlight
                  ? 'relative bg-white border-2 border-primary-500 shadow-xl rounded-2xl p-6'
                  : 'bg-white border border-gray-200 shadow-sm rounded-2xl p-6';

                return (
                  <div key={plan.id} className={cardClass}>
                    {plan.highlight && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-primary-500 px-3 py-1 text-xs font-semibold text-white shadow">
                        <FaStar className="text-yellow-300" />
                        おすすめ
                      </div>
                    )}
                    <div className="mb-4">
                      <h2 className="text-xl font-bold text-gray-900">{plan.name}プラン</h2>
                      <p className="text-sm text-gray-500">{plan.description}</p>
                    </div>

                    <div className="mb-5">
                      <div className="text-sm text-gray-500">通常価格</div>
                      <div className="text-3xl font-extrabold text-gray-900">
                        ¥{plan.price.toLocaleString()}
                        <span className="text-base font-normal text-gray-500 ml-1">/ 件</span>
                      </div>
                      {plan.id === 'starter' && (
                        <div className="mt-1 text-xs font-semibold text-primary-600">期間限定：無料提供中（初回往復）</div>
                      )}
                      <div className="mt-2 text-xs text-gray-500">2社マッチング成立でシステム利用料を全額返金</div>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {featureMatrix.map((feature) => {
                        const status = feature.availability[plan.id];
                        const statusLabel = renderStatusLabel(status);
                        return (
                          <li key={feature.key} className="flex items-start gap-3 text-sm text-gray-800">
                            <span className="mt-0.5">{renderStatusIcon(status)}</span>
                            <div>
                              <p className={`font-medium ${status === 'excluded' ? 'text-gray-400' : ''}`}>
                                {feature.label}
                              </p>
                              <p className={`text-xs ${status === 'partial' ? 'text-amber-600' : 'text-gray-500'}`}>
                                {status === 'partial' && feature.partialNote ? feature.partialNote : statusLabel}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>

                    <button
                      onClick={action}
                      disabled={isCurrent || isLoading}
                      className={`w-full flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition ${
                        isCurrent
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <FaSpinner className="animate-spin" />
                          決済ページを準備中…
                        </>
                      ) : (
                        primaryBtnLabel
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-primary-700">
                  <FaCheckCircle className="text-primary-500" /> プレミアムプランの特典
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                  <li>・模擬面接とフィードバックで本番に備えられます。</li>
                  <li>・面接で聞かれやすい質問を事前に共有し、回答例づくりを伴走します。</li>
                  <li>・志望企業ごとのアピールポイントをプロが整理します。</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <FaStar className="text-amber-400" /> よくある質問
                </h3>
                <div className="mt-3 space-y-3 text-sm text-gray-700">
                  <div>
                    <p className="font-semibold">Q. プランは途中で変更できますか？</p>
                    <p>A. はい、マイページからいつでもアップグレードやダウングレードが可能です。</p>
                  </div>
                  <div>
                    <p className="font-semibold">Q. 返金保証の条件は？</p>
                    <p>A. 弊社経由で2社以上とマッチングした場合にシステム利用料を全額返金します。</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 text-center">
              <button
                disabled={!!loadingPlan}
                onClick={handleHighlightCheckout}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-8 py-3 text-base font-semibold text-white shadow hover:bg-primary-700 disabled:opacity-70"
              >
                {loadingPlan ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    おすすめプランを確認中…
                  </>
                ) : (
                  '一番人気のスタンダードプランを見る'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
