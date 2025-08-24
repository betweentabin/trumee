'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_CONFIG, buildApiUrl, handleApiError } from '@/config/api';
import toast from 'react-hot-toast';
import Layout from '@/components/auth/layout';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
// Firebase imports removed - using Django auth only
// import { createUserWithEmailAndPassword } from 'firebase/auth';
// import { auth } from '@/lib/firebase';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  kana: string;
  phone: string;
  gender: string;
  role: string;
  agreeToTerms: boolean;
  campaignCode?: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { requireGuest } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Redirect if already authenticated - moved to useEffect to prevent SSR issues
  useEffect(() => {
    requireGuest();
  }, []);
  const [showCampaignCode, setShowCampaignCode] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    kana: '',
    phone: '',
    gender: '',
    role: 'user',
    agreeToTerms: false,
    campaignCode: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'パスワードを入力してください';
    } else if (formData.password.length < 6) {
      newErrors.password = 'パスワードは6文字以上である必要があります';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'パスワード（確認）を入力してください';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'パスワードが一致しません';
    }

    // Name validation
    if (!formData.full_name) {
      newErrors.full_name = '氏名を入力してください';
    }

    // Kana validation
    if (!formData.kana) {
      newErrors.kana = 'カナを入力してください';
    } else if (!/^[ァ-ヶー　]+$/.test(formData.kana)) {
      newErrors.kana = 'カタカナで入力してください';
    }

    // Phone validation
    if (!formData.phone) {
      newErrors.phone = '電話番号を入力してください';
    } else if (!/^[0-9-]+$/.test(formData.phone)) {
      newErrors.phone = '有効な電話番号を入力してください';
    }

    // Gender validation
    if (!formData.gender) {
      newErrors.gender = '性別を選択してください';
    }

    // Terms agreement validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'プライバシーポリシーに同意してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Register user
      const apiUrl = buildApiUrl(API_CONFIG.endpoints.register);
      console.log('Registering user with API URL:', apiUrl); // デバッグ用ログ
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          username: formData.email, // usernameを追加（emailと同じ値）
          full_name: formData.full_name,
          kana: formData.kana,
          phone: formData.phone,
          gender: formData.gender === '男性' ? 'male' : formData.gender === '女性' ? 'female' : 'other', // 性別を英語に変換
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('登録が完了しました。確認メールをご確認ください。');
        
        // Store basic info
        if (data.uid) {
          localStorage.setItem('uid', data.uid);
        }
        localStorage.setItem('userEmail', formData.email);
        
        // Redirect to success page
        router.push('/auth/registersuccess');
      } else {
        if (data.detail?.includes('Email already in use')) {
          setErrors({ email: 'このメールアドレスは既に登録されています' });
        } else {
          throw new Error(data.detail || data.error || '登録に失敗しました');
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // ネットワークエラーの詳細な処理
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setErrors({ general: 'サーバーに接続できませんでした。しばらく時間をおいて再度お試しください。' });
        toast.error('サーバーに接続できませんでした');
      } else {
        setErrors({ general: handleApiError(error) });
        toast.error('登録に失敗しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout headertitle="新規会員登録">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
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
              新規会員登録
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              既にアカウントをお持ちの方は{' '}
              <Link href="/auth/login" className="font-medium text-[#FF733E] hover:text-[#e9632e] transition">
                ログイン
              </Link>
            </p>
          </div>

          {/* Error Message */}
          {errors.general && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{errors.general}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email - Full Width */}
              <div className="md:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent transition ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  パスワード <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className={`w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent transition ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="6文字以上"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  パスワード（確認） <span className="text-red-500">*</span>
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className={`w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent transition ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="パスワードを再入力"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                  氏名 <span className="text-red-500">*</span>
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  autoComplete="name"
                  required
                  className={`w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent transition ${
                    errors.full_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="山田 太郎"
                  value={formData.full_name}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.full_name && (
                  <p className="mt-2 text-sm text-red-600">{errors.full_name}</p>
                )}
              </div>

              {/* Kana */}
              <div>
                <label htmlFor="kana" className="block text-sm font-medium text-gray-700 mb-2">
                  カナ <span className="text-red-500">*</span>
                </label>
                <input
                  id="kana"
                  name="kana"
                  type="text"
                  required
                  className={`w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent transition ${
                    errors.kana ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="ヤマダ タロウ"
                  value={formData.kana}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.kana && (
                  <p className="mt-2 text-sm text-red-600">{errors.kana}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  電話番号 <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  className={`w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent transition ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="090-1234-5678"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.phone && (
                  <p className="mt-2 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                  性別 <span className="text-red-500">*</span>
                </label>
                <select
                  id="gender"
                  name="gender"
                  required
                  className={`w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent transition ${
                    errors.gender ? 'border-red-300' : 'border-gray-300'
                  }`}
                  value={formData.gender}
                  onChange={handleChange}
                  disabled={isLoading}
                >
                  <option value="">選択してください</option>
                  <option value="男性">男性</option>
                  <option value="女性">女性</option>
                  <option value="その他">その他</option>
                </select>
                {errors.gender && (
                  <p className="mt-2 text-sm text-red-600">{errors.gender}</p>
                )}
              </div>
            </div>

            {/* Campaign Code */}
            <div>
              <button
                type="button"
                onClick={() => setShowCampaignCode(!showCampaignCode)}
                className="text-sm text-[#FF733E] hover:text-[#e9632e] transition flex items-center"
              >
                <svg className={`w-4 h-4 mr-1 transition-transform ${showCampaignCode ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                キャンペーンコードをお持ちの方
              </button>
              {showCampaignCode && (
                <input
                  id="campaignCode"
                  name="campaignCode"
                  type="text"
                  className="mt-3 w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent transition"
                  placeholder="キャンペーンコードを入力"
                  value={formData.campaignCode}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              )}
            </div>

            {/* Terms Agreement */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="agreeToTerms"
                    name="agreeToTerms"
                    type="checkbox"
                    className="focus:ring-[#FF733E] h-4 w-4 text-[#FF733E] border-gray-300 rounded cursor-pointer"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="agreeToTerms" className="font-medium text-gray-700 cursor-pointer">
                    <Link href="/privacy-policy" target="_blank" className="text-[#FF733E] hover:text-[#e9632e] transition">
                      プライバシーポリシー
                    </Link>
                    に同意します <span className="text-red-500">*</span>
                  </label>
                  {errors.agreeToTerms && (
                    <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms}</p>
                  )}
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
                    登録中...
                  </>
                ) : (
                  '登録する'
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">または</span>
              </div>
            </div>

            {/* Company Registration Link */}
            <div className="text-center">
              <Link 
                href="/auth/company/register" 
                className="inline-flex items-center justify-center w-full py-3 px-4 border border-gray-300 rounded-full text-gray-700 bg-white hover:bg-gray-50 transition font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                企業の方はこちら
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