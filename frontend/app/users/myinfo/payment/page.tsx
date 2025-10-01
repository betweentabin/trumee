'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Left nav is provided by users/layout; do not render it here
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
  const [hasLoaded, setHasLoaded] = useState(false);

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
    if (isAuthenticated && !hasLoaded) fetchPaymentMethods();
  }, [isAuthenticated, router]);

  // Safe loader for existing payment methods (optional)
  const fetchPaymentMethods = async () => {
    try {
      setHasLoaded(true);
      const res = await fetch(buildApiUrl('/payments/'), { headers: { ...getAuthHeaders() } });
      // Silently ignore errors for now; UI only offers Stripe checkout
      if (!res.ok) return;
      await res.json();
    } catch {}
  };

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

        {/* Main content only; left nav is rendered by users/layout */}
        <div className="myinfo-content">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">お支払いの管理</h2>
          <p className="text-gray-700 mb-6">クレジットカード情報は当サイトでは保存しません。Stripeの安全なチェックアウトで決済・管理します。</p>
          {/* 決済ボタンは現在非表示にします */}
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
    {/* Hide any duplicated inline left menu if rendered inside content by other wrappers */}
    <style jsx>{`
      .myinfo-content :global(.bg-white.p-\[15px\].border.rounded-xl.shadow-sm) {
        display: none;
      }
    `}</style>
  </div>
  );
}
