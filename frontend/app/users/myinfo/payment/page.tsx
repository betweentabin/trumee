'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Leftpage from '@/components/user/page';
import { FaCreditCard, FaCalendarAlt, FaLock, FaPlus, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import useAuthV2 from '@/hooks/useAuthV2';
import { getAccessToken } from '@/utils/auth';

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
  const { isAuthenticated, initializeAuth, currentUser } = useAuthV2();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  });

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

  const fetchPaymentMethods = async () => {
    try {
      // 支払い方法の取得シミュレーション
      const mockMethods: PaymentMethod[] = [
        {
          id: '1',
          type: 'card',
          last4: '4242',
          brand: 'Visa',
          expiryMonth: '12',
          expiryYear: '2025',
          isDefault: true
        }
      ];
      setPaymentMethods(mockMethods);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // カード追加のシミュレーション
      setTimeout(() => {
        const newCard: PaymentMethod = {
          id: Date.now().toString(),
          type: 'card',
          last4: cardForm.cardNumber.slice(-4),
          brand: 'Visa',
          expiryMonth: cardForm.expiryMonth,
          expiryYear: cardForm.expiryYear,
          isDefault: paymentMethods.length === 0
        };
        setPaymentMethods([...paymentMethods, newCard]);
        setShowAddCard(false);
        setCardForm({
          cardNumber: '',
          cardHolder: '',
          expiryMonth: '',
          expiryYear: '',
          cvv: ''
        });
        setLoading(false);
        toast.success('カードを追加しました');
      }, 1000);
    } catch (error) {
      setLoading(false);
      toast.error('カードの追加に失敗しました');
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (confirm('このカードを削除してもよろしいですか？')) {
      setPaymentMethods(paymentMethods.filter(card => card.id !== cardId));
      toast.success('カードを削除しました');
    }
  };

  const handleSetDefault = async (cardId: string) => {
    setPaymentMethods(paymentMethods.map(card => ({
      ...card,
      isDefault: card.id === cardId
    })));
    toast.success('デフォルトカードを変更しました');
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">登録済みカード</h2>
            <button
              onClick={() => setShowAddCard(true)}
              className="px-4 py-2 bg-[#FF733E] text-white rounded-lg hover:bg-orange-70 active:bg-orange-60 transition flex items-center gap-2"
            >
              <FaPlus />
              カードを追加
            </button>
          </div>

          {paymentMethods.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">カードが登録されていません</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((card) => (
                <div key={card.id} className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded flex items-center justify-center text-white text-xs">
                      {card.brand}
                    </div>
                    <div>
                      <p className="font-medium">•••• {card.last4}</p>
                      <p className="text-sm text-gray-600">
                        有効期限: {card.expiryMonth}/{card.expiryYear}
                      </p>
                    </div>
                    {card.isDefault && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                        デフォルト
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!card.isDefault && (
                      <button
                        onClick={() => handleSetDefault(card.id)}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition"
                      >
                        デフォルトに設定
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showAddCard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-semibold mb-4">新しいカードを追加</h3>
              
              <form onSubmit={handleAddCard}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      カード番号
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardForm.cardNumber}
                        onChange={(e) => setCardForm({
                          ...cardForm,
                          cardNumber: formatCardNumber(e.target.value)
                        })}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E]"
                        required
                      />
                      <FaCreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      カード名義
                    </label>
                    <input
                      type="text"
                      value={cardForm.cardHolder}
                      onChange={(e) => setCardForm({...cardForm, cardHolder: e.target.value})}
                      placeholder="TARO YAMADA"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        月
                      </label>
                      <select
                        value={cardForm.expiryMonth}
                        onChange={(e) => setCardForm({...cardForm, expiryMonth: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E]"
                        required
                      >
                        <option value="">MM</option>
                        {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                          <option key={month} value={month.toString().padStart(2, '0')}>
                            {month.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        年
                      </label>
                      <select
                        value={cardForm.expiryYear}
                        onChange={(e) => setCardForm({...cardForm, expiryYear: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E]"
                        required
                      >
                        <option value="">YY</option>
                        {Array.from({length: 10}, (_, i) => new Date().getFullYear() + i).map(year => (
                          <option key={year} value={year.toString().slice(-2)}>
                            {year.toString().slice(-2)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardForm.cvv}
                          onChange={(e) => setCardForm({...cardForm, cvv: e.target.value})}
                          placeholder="123"
                          maxLength={4}
                          className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF733E]"
                          required
                        />
                        <FaLock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddCard(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-[#FF733E] text-white rounded-lg hover:bg-orange-70 active:bg-orange-60 transition disabled:bg-gray-400"
                  >
                    {loading ? '追加中...' : 'カードを追加'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mt-8 bg-orange-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FaLock className="text-[#FF733E]" />
            セキュリティについて
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-[#FF733E]">✓</span>
              <span>カード情報は暗号化されて安全に保管されます</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#FF733E]">✓</span>
              <span>PCI DSS準拠のセキュアな決済システムを使用しています</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#FF733E]">✓</span>
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
