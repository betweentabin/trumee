'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useAuthV2 from '@/hooks/useAuthV2';

// バリデーションスキーマ
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('有効なメールアドレスを入力してください'),
  password: z
    .string()
    .min(6, 'パスワードは6文字以上で入力してください'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginV2Page() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { 
    login, 
    isAuthenticated, 
    isLoginPending, 
    error: authError,
    initializeAuth 
  } = useAuthV2();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // 初期化
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // 既にログイン済みの場合はリダイレクト
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const onSubmit = (data: LoginFormData) => {
    login(data);
  };

  const handleTestLogin = () => {
    reset({
      email: 'test_new_329d5794@example.com',
      password: 'testpass123',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* ヘッダー */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Resume Truemee
          </h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            ログイン (API v2)
          </h2>
          <p className="text-sm text-gray-600">
            新しいAPIバージョンでのログインです
          </p>
        </div>

        {/* フォーム */}
        <form 
          className="bg-white shadow-lg rounded-lg px-8 py-6 space-y-6"
          onSubmit={handleSubmit(onSubmit)}
        >
          {/* エラーメッセージ */}
          {authError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {authError}
            </div>
          )}

          {/* メールアドレス */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="your-email@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* パスワード */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              パスワード
            </label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                id="password"
                className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="パスワードを入力"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <FaEyeSlash className="h-4 w-4 text-gray-400" />
                ) : (
                  <FaEye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* テストログインボタン */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleTestLogin}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              テストアカウントでログイン
            </button>
          </div>

          {/* ログインボタン */}
          <button
            type="submit"
            disabled={isLoginPending}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
              isLoginPending ? 'cursor-not-allowed' : ''
            }`}
          >
            {isLoginPending ? (
              <>
                <FaSpinner className="animate-spin h-4 w-4 mr-2" />
                ログイン中...
              </>
            ) : (
              'ログイン'
            )}
          </button>

          {/* リンク */}
          <div className="space-y-3 text-center text-sm">
            <div>
              <Link 
                href="/auth/register" 
                className="text-blue-600 hover:text-blue-800 underline"
              >
                新規ユーザー登録
              </Link>
            </div>
            <div>
              <Link 
                href="/auth/company/register" 
                className="text-green-600 hover:text-green-800 underline"
              >
                企業アカウント登録
              </Link>
            </div>
            <div>
              <Link 
                href="/auth/repassword" 
                className="text-gray-600 hover:text-gray-800 underline"
              >
                パスワードを忘れた場合
              </Link>
            </div>
          </div>

          {/* API情報 */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-xs text-blue-700">
            <p className="font-medium">🚀 API v2 機能</p>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>JWT + DRF Token 認証</li>
              <li>向上されたセキュリティ</li>
              <li>リアルタイム統計</li>
              <li>拡張された履歴書管理</li>
            </ul>
          </div>
        </form>

        {/* フッター */}
        <div className="text-center text-xs text-gray-500">
          <Link href="/" className="hover:text-gray-700 underline">
            ホームページに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
