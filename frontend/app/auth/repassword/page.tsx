'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// Firebase imports removed - using Django auth only
// import { sendPasswordResetEmail } from 'firebase/auth';
// import { auth } from '@/lib/firebase';
import toast from 'react-hot-toast';
import Layout from '@/components/auth/layout';
import Image from 'next/image';

export default function PasswordResetPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const validateEmail = (email: string): boolean => {
    if (!email) {
      setError('メールアドレスを入力してください');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('有効なメールアドレスを入力してください');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement Django password reset API
      // For now, show a success message
      setEmailSent(true);
      toast.success('パスワードリセット機能は現在準備中です。お問い合わせください。');
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError('パスワードリセット機能は現在準備中です。お問い合わせください。');
      
      toast.error('メール送信に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <Layout headertitle="メール送信完了">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-xl">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
            <div className="text-center">
              {/* Success Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                メールを送信しました
              </h2>
              
              <p className="text-gray-600 mb-2">
                <span className="font-semibold text-gray-900">{email}</span>
              </p>
              <p className="text-gray-600 mb-6">
                宛にパスワードリセット用のメールを送信しました。
              </p>
              
              {/* Warning Box */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800">
                      メールが届かない場合は、<span className="font-semibold">迷惑メールフォルダ</span>をご確認ください。
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 text-sm text-gray-500 mb-8">
                <p>メールに記載されたリンクをクリックして、新しいパスワードを設定してください。</p>
                <p>リンクの有効期限は送信から1時間です。</p>
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setEmailSent(false);
                    setEmail('');
                  }}
                  className="w-full py-3 px-4 border border-gray-300 rounded-full text-gray-700 bg-white hover:bg-gray-50 transition font-medium"
                >
                  別のメールアドレスで再送信
                </button>
                
                <Link
                  href="/auth/login"
                  className="block w-full py-3 px-4 border border-transparent rounded-full text-white bg-[#FF733E] hover:bg-[#e9632e] transition font-medium text-center"
                >
                  ログイン画面に戻る
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout headertitle="パスワードリセット">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <Image 
              src="/logo/logo_mix.png" 
              alt="Resume Truemee" 
              width={200} 
              height={60} 
              className="mx-auto mb-6"
              priority
            />
            <h2 className="text-2xl font-bold text-gray-900">
              パスワードをリセット
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              登録時のメールアドレスを入力してください
            </p>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent transition ${
                  error ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="example@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                disabled={isLoading}
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    パスワードリセット用のリンクを含むメールを送信します。メールが届かない場合は、迷惑メールフォルダもご確認ください。
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-full text-white font-medium shadow-md transition ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#FF733E] hover:bg-[#e9632e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF733E]'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    送信中...
                  </>
                ) : (
                  'リセットメールを送信'
                )}
              </button>
            </div>

            {/* Links */}
            <div className="flex items-center justify-between text-sm">
              <Link href="/auth/login" className="text-[#FF733E] hover:text-[#e9632e] transition">
                ログイン画面に戻る
              </Link>
              <Link href="/auth/register" className="text-[#FF733E] hover:text-[#e9632e] transition">
                新規登録はこちら
              </Link>
            </div>
          </form>
        </div>

        {/* Back to Top Link */}
        <div className="text-center mt-8">
          <Link 
            href="/" 
            className="text-sm text-gray-600 hover:text-gray-900 transition"
          >
            ← トップページに戻る
          </Link>
        </div>
      </div>
    </Layout>
  );
}