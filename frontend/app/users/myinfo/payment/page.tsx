'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Leftpage from '@/components/user/page';
import { FaLock } from 'react-icons/fa';
import toast from 'react-hot-toast';
import useAuthV2 from '@/hooks/useAuthV2';
import { getAccessToken } from '@/utils/auth';
import { buildApiUrl } from '@/config/api';
import { getAuthHeaders } from '@/utils/auth';

interface PaymentMethod {
  id: string;
  type: 'card';
  last4: string;
  brand: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
}

export default function UserPaymentPage() {
  const router = useRouter();
  const { isAuthenticated, initializeAuth } = useAuthV2();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Note: Stay on this page for logged-in users.
  // Previously this redirected to the profile page, which was incorrect.

  useEffect(() => {
    if (isAuthenticated === false) {
      const hasStored = typeof window !== 'undefined' && !!getAccessToken();
      if (!hasStored) {
        router.push('/auth/login');
        return;
      }
    }
    if (isAuthenticated) fetchPaymentMethods();
  }, [isAuthenticated, router]);

  const gotoStripeCheckout = async (plan: 'basic' | 'premium' | 'enterprise' = 'premium') => {
    try {
      setLoading(true);
      const res = await fetch(buildApiUrl('/payments/checkout/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ plan_type: plan })
      });
      const data = await res.json();
      if (!res.ok || !data?.checkout_url) throw new Error(data?.error || 'チェックアウトの作成に失敗しました');
      window.location.href = data.checkout_url;
    } catch (e: any) {
      toast.error(e?.message || 'Stripeチェックアウトに遷移できませんでした');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">支払い情報登録・変更</h1>
          <p className="text-gray-600 mt-2">クレジットカード情報を管理します</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-3">
            <Leftpage />
          </aside>

          <div className="lg:col-span-9">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">お支払いの管理</h2>
          <p className="text-gray-700 mb-6">クレジットカード情報は当サイトでは保存しません。Stripeの安全なチェックアウトで決済・管理します。</p>
          <div className="flex flex-col md:flex-row gap-3">
            <button onClick={() => gotoStripeCheckout('premium')} disabled={loading} className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:bg-secondary-300">Stripeでプラン購入</button>
            <button onClick={() => gotoStripeCheckout('basic')} disabled={loading} className="px-6 py-3 bg-secondary-900 hover:bg-secondary-800 text-white rounded-lg disabled:bg-secondary-300">単発決済（例）</button>
          </div>
        </div>

        {/* No in-app card form; managed on Stripe */}

        <div className="mt-8 bg-orange-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FaLock className="text-primary-600" />
            セキュリティについて
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-primary-600">✓</span>
              <span>カード情報は暗号化されて安全に保管されます</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600">✓</span>
              <span>PCI DSS準拠のセキュアな決済システムを使用しています</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600">✓</span>
              <span>不正利用防止のため、定期的にセキュリティチェックを実施しています</span>
            </li>
          </ul>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
