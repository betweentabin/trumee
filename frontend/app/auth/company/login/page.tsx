'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Layout from '@/components/auth/layout';
import Image from 'next/image';
import LogoBlack from '@/logo/logo_black.png';
import { useLogin } from '@/hooks/useApi';
import { useAppDispatch } from '@/app/redux/hooks';

import { setUser, setToken } from '@/app/redux/authSlice';
import { updateUser as setUserV2, setTokens as setTokensV2 } from '@/app/redux/authV2Slice';
import apiClient from '@/lib/api-v2-client';
import useAuthV2 from '@/hooks/useAuthV2';

export default function CompanyLoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const loginMutation = useLogin();
  const [isLoading, setIsLoading] = useState(false);
  const [useV2Api, setUseV2Api] = useState(true); // API v2をデフォルトに設定
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    general: '',
  });

  useEffect(() => {
    const savedApiVersion = localStorage.getItem('useV2Api');
    if (savedApiVersion === 'true') {
      setUseV2Api(true);
    }
  }, []);

  // 認証済みユーザーのリダイレクト処理（シンプル版）
  useEffect(() => {
    // SSRでは実行しない
    if (typeof window === 'undefined') return;
    
    console.log('🏢 Company login page: Checking for existing auth');
    
    // 単純なトークンチェックのみ
    const hasStoredToken = localStorage.getItem('auth_token_v2') && 
      localStorage.getItem('drf_token_v2');
    
    if (hasStoredToken) {
      console.log('🏢 Company login page: Found stored tokens, redirecting to company main page');
      router.push('/company');
    }
  }, []); // 一度だけ実行、認証状態は監視しない

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

  const handleToggleApiVersion = () => {
    const newValue = !useV2Api;
    setUseV2Api(newValue);
    localStorage.setItem('useV2Api', newValue.toString());
    toast.success(`API ${newValue ? 'v2' : 'v1'} に切り替えました`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({ email: '', password: '', general: '' });

    try {
      if (useV2Api) {
        // API v2を使用
        const response = await apiClient.loginV2(formData.email, formData.password);
        
        // 企業ユーザーかチェック
        if (response.user.role !== 'company') {
          setErrors(prev => ({
            ...prev,
            general: '企業アカウントでログインしてください',
          }));
          return;
        }
        
        // Reduxストアを更新（v2）
        dispatch(setUserV2(response.user));
        dispatch(setTokensV2(response.tokens));
        
        toast.success('ログインに成功しました（API v2）');
      } else {
        // API v1を使用（既存のロジック）
        const result = await loginMutation.mutateAsync({
          email: formData.email,
          password: formData.password,
        });

        // 企業ユーザーかチェック
        if (result.user.role !== 'company') {
          setErrors(prev => ({
            ...prev,
            general: '企業アカウントでログインしてください',
          }));
          return;
        }

        // Reduxストアを更新（v1）
        dispatch(setUser(result.user));
        dispatch(setToken({
          access: result.tokens.access,
          refresh: result.tokens.refresh,
        }));
        
        toast.success('ログインに成功しました（API v1）');
      }

      // 企業向けメインページにリダイレクト（API v2時はUserID付きURL）
      if (useV2Api && response?.user?.id) {
        router.push(`/company/${response.user.id}`);
      } else {
        router.push('/company');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
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
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="flex justify-center">
              <Image
                src={LogoBlack}
                alt="Logo"
                width={150}
                height={40}
                className="h-12 w-auto"
              />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              企業アカウントログイン
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              または{' '}
              <Link
                href="/auth/company/register"
                className="font-medium text-[#FF733E] hover:text-[#e9632e]"
              >
                新規登録はこちら
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
                  placeholder="example@company.com"
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
              <div className="text-sm">
                <Link
                  href="/auth/company/repassword"
                  className="font-medium text-[#FF733E] hover:text-[#e9632e]"
                >
                  パスワードをお忘れですか？
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#FF733E] hover:bg-[#e9632e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF733E] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'ログイン中...' : 'ログイン'}
              </button>
            </div>

            <div className="text-center">
              <Link
                href="/auth/login"
                className="font-medium text-[#FF733E] hover:text-[#e9632e] text-sm"
              >
                求職者ログインはこちら
              </Link>
            </div>
          </form>

          {/* API切り替えボタン */}
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={handleToggleApiVersion}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF733E]"
            >
              <svg
                className={`mr-2 h-4 w-4 ${useV2Api ? 'text-green-500' : 'text-gray-400'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              API {useV2Api ? 'v2' : 'v1'} 使用中
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
