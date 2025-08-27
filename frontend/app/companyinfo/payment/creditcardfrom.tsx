'use client';

import { useState } from 'react';
import { FaCreditCard, FaLock } from 'react-icons/fa';

interface CreditCardFormProps {
  onClose: () => void;
  onSubmit: (card: any) => void;
}

export default function CreditCardForm({ onClose, onSubmit }: CreditCardFormProps) {
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCard = {
      id: Date.now().toString(),
      type: 'card',
      last4: cardForm.cardNumber.replace(/\s/g, '').slice(-4),
      brand: 'Visa',
      expiryMonth: cardForm.expiryMonth,
      expiryYear: cardForm.expiryYear,
      isDefault: false
    };
    onSubmit(newCard);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-semibold mb-4">°WD«üÉ’ý </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                «üÉj÷
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
                  className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <FaCreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                «üÉ©
              </label>
              <input
                type="text"
                value={cardForm.cardHolder}
                onChange={(e) => setCardForm({...cardForm, cardHolder: e.target.value})}
                placeholder="TARO YAMADA"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  
                </label>
                <select
                  value={cardForm.expiryMonth}
                  onChange={(e) => setCardForm({...cardForm, expiryMonth: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  t
                </label>
                <select
                  value={cardForm.expiryYear}
                  onChange={(e) => setCardForm({...cardForm, expiryYear: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              ­ãó»ë
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              «üÉ’ý 
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}