'use client';

import Layout from '@/components/auth/layout';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ResendVerificationPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error('有効なメールアドレスを入力してください');
      return;
    }
    setIsLoading(true);
    try {
      // TODO: Backend API to resend verification email
      toast.success('確認メールを送信しました');
    } catch (e) {
      toast.error('メール送信に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout headertitle="確認メール再送信">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">確認メールを再送信</h2>
          <p className="text-gray-600 text-center mb-8">登録済みのメールアドレスを入力してください。</p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
              <input
                type="email"
                className="w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF733E] border-gray-300"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-full text-white ${isLoading ? 'bg-gray-400' : 'bg-[#FF733E] hover:bg-[#e9632e]'}`}
            >
              {isLoading ? '送信中...' : '確認メールを送信'}
            </button>
            <div className="text-center">
              <Link href="/auth/login" className="text-[#FF733E]">ログイン画面に戻る</Link>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

