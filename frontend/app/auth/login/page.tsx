'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Layout from '@/components/auth/layout';
import Image from 'next/image';
import { useLogin } from '@/hooks/useApi';
import { useAppDispatch } from '@/app/redux/hooks';
import logoBlack from '@/assets/logo/logo_black.png';
import { setUser, setToken } from '@/app/redux/authSlice';
import useAuthV2 from '@/hooks/useAuthV2';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const loginMutation = useLogin();
  const { login: loginV2, isLoginPending: isV2Loading } = useAuthV2();
  const [isLoading, setIsLoading] = useState(false);
  const [useV2API, setUseV2API] = useState(true); // API v2をデフォルトに設定
  
  // localStorageにAPI v2設定を保存
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('useV2Api', 'true');
    }
  }, []);

  // 認証済みユーザーのリダイレクト処理（シンプル版）
  useEffect(() => {
    // SSRでは実行しない
    if (typeof window === 'undefined') return;
    
    console.log('🔐 Login page: Checking for existing auth');
    
    // 単純なトークンチェックのみ
    const hasStoredToken = localStorage.getItem('auth_token_v2') && 
      localStorage.getItem('drf_token_v2');
    
    if (hasStoredToken) {
      console.log('🔐 Login page: Found stored tokens, redirecting to users');
      // ロール判定なしで一律 /users にリダイレクト
      router.push('/users');
    }
  }, []); // 一度だけ実行、認証状態は監視しない
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    general: '',
  });

  const validateForm = () => {
    const newErrors = {
      email: '',
      password: '',
      general: '',
    };

    if (!formData.email) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    if (!formData.password) {
      newErrors.password = 'パスワードを入力してください';
    } else if (formData.password.length < 6) {
      newErrors.password = 'パスワードは6文字以上である必要があります';
    }

    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (useV2API) {
      // API v2を使用
      loginV2({
        email: formData.email,
        password: formData.password,
      });
    } else {
      // 従来のAPIを使用
      setIsLoading(true);
      setErrors({ email: '', password: '', general: '' });

      try {
        const result = await loginMutation.mutateAsync({
          email: formData.email,
          password: formData.password,
        });

        // Reduxストアを更新
        dispatch(setUser(result.user));
        dispatch(setToken({
          access: result.tokens.access,
          refresh: result.tokens.refresh,
        }));

        // ロール別のリダイレクト
        if (result.user.role === 'company') {
          router.push('/company');
        } else {
          router.push('/users');
        }
      } catch (error: any) {
        console.error('Login error:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          url: error.config?.url
        });
        
        if (error.response?.status === 401) {
          setErrors(prev => ({
            ...prev,
            general: 'メールアドレスまたはパスワードが正しくありません',
          }));
        } else {
          setErrors(prev => ({
            ...prev,
            general: 'ログインに失敗しました。しばらく時間をおいて再度お試しください',
          }));
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="flex justify-center">
              <Image
                src={logoBlack}
                alt="Logo"
                width={150}
                height={40}
                className="h-12 w-auto"
              />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              アカウントにログイン
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              または{' '}
              <Link
                href="/auth/register"
                className="font-medium text-[#FF733E] hover:text-[#e9632e]"
              >
                新規アカウントを作成
              </Link>
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {errors.general}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  メールアドレス
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#FF733E] focus:border-[#FF733E] focus:z-10 sm:text-sm`}
                  placeholder="example@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  パスワード
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[#FF733E] focus:border-[#FF733E] focus:z-10 sm:text-sm`}
                  placeholder="パスワードを入力"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[#FF733E] focus:ring-[#FF733E] border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  ログイン状態を保持
                </label>
              </div>
              <div className="text-sm">
                <Link
                  href="/auth/repassword"
                  className="font-medium text-[#FF733E] hover:text-[#e9632e]"
                >
                  パスワードを忘れた方
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={useV2API ? isV2Loading : isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#FF733E] hover:bg-[#e9632e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF733E] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(useV2API ? isV2Loading : isLoading) ? 'ログイン中...' : 'ログイン'}
              </button>
            </div>

            {/* API v2 テスト切り替え */}
            <div className="flex items-center justify-center space-x-2 py-2">
              <span className="text-sm text-gray-600">API v1</span>
              <button
                type="button"
                onClick={() => setUseV2API(!useV2API)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  useV2API ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    useV2API ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-600">API v2</span>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">または</p>
              <div className="space-y-2">
                <Link
                  href="/auth/register"
                  className="block w-full text-center py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  求職者として登録
                </Link>
                <Link
                  href="/auth/company/register"
                  className="block w-full text-center py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  企業として登録
                </Link>
              </div>
              
              {/* テストアカウント情報 */}
              {useV2API && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-left">
                  <p className="text-xs font-medium text-blue-800 mb-2">🧪 API v2 テストアカウント</p>
                  <div className="text-xs text-blue-700 space-y-1">
                    <p>Email: test_new_329d5794@example.com</p>
                    <p>Password: testpass123</p>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          email: 'test_new_329d5794@example.com',
                          password: 'testpass123'
                        });
                      }}
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      自動入力
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}