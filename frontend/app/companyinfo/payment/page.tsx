'use client';

import { useState, useEffect } from 'react';
import { FaCreditCard, FaPlus, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';

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
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">支払い情報管理</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">登録済みカード</h2>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <FaPlus />
            カードを追加
          </button>
        </div>

        {paymentMethods.length === 0 ? (
          <div className="text-center py-12">
            <FaCreditCard className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500">カードが登録されていません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paymentMethods.map((card) => (
              <div key={card.id} className="border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-blue-500 rounded flex items-center justify-center text-white text-xs">
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
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      デフォルトに設定
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}