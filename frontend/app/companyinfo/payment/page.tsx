'use client';

import { useState, useEffect } from 'react';
import { FaShoppingCart } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { buildApiUrl } from '@/config/api';

interface PaymentMethod {
  id: string;
  type: 'card';
  last4: string;
  brand: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
}

export default function CompanyPaymentPage() {
  const gotoStripeCheckout = async (plan: 'basic' | 'premium' | 'enterprise' | 'credits100' = 'premium') => {
    try {
      const res = await fetch(buildApiUrl('/payments/checkout/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('drf_token_v2')}` },
        body: JSON.stringify({ plan_type: plan })
      });
      const data = await res.json();
      if (!res.ok || !data?.checkout_url) throw new Error(data?.error || 'チェックアウトの作成に失敗しました');
      window.location.href = data.checkout_url;
    } catch (e: any) {
      toast.error(e?.message || 'Stripeチェックアウトに遷移できませんでした');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">支払い・プランの管理設定</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-700 mb-4">クレジットカード情報は当サイトでは保存しません。Stripeの安全なチェックアウトで決済・管理します。</p>
        <div className="flex flex-col md:flex-row gap-3">
          <button onClick={() => gotoStripeCheckout('premium')} className="px-6 py-3 bg-[#FF733E] text-white rounded-lg hover:bg-orange-70 flex items-center gap-2">
            <FaShoppingCart /> プレミアムプランに加入
          </button>
          <button onClick={() => gotoStripeCheckout('credits100')} className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2">
            追加スカウト100通（¥10,000）
          </button>
        </div>
      </div>
    </div>
  );
}
