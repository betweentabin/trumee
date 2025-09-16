'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_CONFIG, buildApiUrl, handleApiError } from '@/config/api';
import toast from 'react-hot-toast';
import Layout from '@/components/auth/layout';
import Image from 'next/image';
import LogoMix from '@/logo/logo_mix.png';
import { useAuth } from '@/hooks/useAuth';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  company_name: string;
  company_name_kana: string;
  representative_name: string;
  representative_kana: string;
  phone: string;
  address: string;
  website?: string;
  employee_count: string;
  industry: string;
  agreeToTerms: boolean;
}

interface FormErrors {
  [key: string]: string;
}

export default function CompanyRegisterPage() {
  const router = useRouter();
  const { requireGuest } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Redirect if already authenticated
  requireGuest();
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    company_name: '',
    company_name_kana: '',
    representative_name: '',
    representative_kana: '',
    phone: '',
    address: '',
    website: '',
    employee_count: '',
    industry: '',
    agreeToTerms: false,
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

    // Company name validation
    if (!formData.company_name) {
      newErrors.company_name = '会社名を入力してください';
    }

    // Company name kana validation
    if (!formData.company_name_kana) {
      newErrors.company_name_kana = '会社名（カナ）を入力してください';
    } else if (!/^[ァ-ヶー・\s]+$/.test(formData.company_name_kana)) {
      newErrors.company_name_kana = 'カタカナで入力してください';
    }

    // Representative name validation
    if (!formData.representative_name) {
      newErrors.representative_name = '代表者名を入力してください';
    }

    // Representative kana validation
    if (!formData.representative_kana) {
      newErrors.representative_kana = '代表者名（カナ）を入力してください';
    } else if (!/^[ァ-ヶー・\s]+$/.test(formData.representative_kana)) {
      newErrors.representative_kana = 'カタカナで入力してください';
    }

    // Phone validation
    if (!formData.phone) {
      newErrors.phone = '電話番号を入力してください';
    } else if (!/^[0-9-]+$/.test(formData.phone)) {
      newErrors.phone = '有効な電話番号を入力してください';
    }

    // Address validation
    if (!formData.address) {
      newErrors.address = '住所を入力してください';
    }

    // Employee count validation
    if (!formData.employee_count) {
      newErrors.employee_count = '従業員数を選択してください';
    }

    // Industry validation
    if (!formData.industry) {
      newErrors.industry = '業種を選択してください';
    }

    // Terms agreement validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = '利用規約に同意してください';
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
      // Register company
      const apiUrl = buildApiUrl(API_CONFIG.endpoints.registerCompany);
      console.log('Registering company with API URL:', apiUrl); // デバッグ用ログ
      const requestBody = {
        email: formData.email,
        password: formData.password,
        username: formData.email,
        company_name: formData.company_name,
        capital: parseInt(formData.employee_count) || 0,
        company_url: formData.website || '',
        phone: formData.phone,
        first_name: formData.representative_name.split(' ')[1] || formData.representative_name,
        last_name: formData.representative_name.split(' ')[0] || '',
        campaign_code: '',
      };
      console.log('Request body:', JSON.stringify(requestBody, null, 2)); // リクエストボディもログ出力
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('Company registration response:', { status: response.status, data }); // デバッグログ

      if (response.ok) {
        toast.success('企業登録が完了しました');
        
        // Store basic info
        if (data.user?.id) {
          localStorage.setItem('uid', data.user.id);
        }
        localStorage.setItem('userEmail', formData.email);
        localStorage.setItem('userRole', 'company');
        
        // Redirect to company dashboard
        router.push('/company');
      } else {
        console.error('Company registration failed:', { status: response.status, data }); // 詳細エラーログ
        
        if (data.detail?.includes('already') || data.email) {
          setErrors({ email: 'このメールアドレスは既に登録されています' });
        } else if (data.detail) {
          setErrors({ general: data.detail });
          throw new Error(data.detail);
        } else if (typeof data === 'object' && data !== null && !data.detail) {
          // DRFバリデーションエラーの場合（フィールド名をキーとするオブジェクト）
          const newErrors: Record<string, string> = {};
          Object.keys(data).forEach(field => {
            if (Array.isArray(data[field])) {
              newErrors[field] = data[field][0];
            } else {
              newErrors[field] = data[field];
            }
          });
          setErrors(newErrors);
          throw new Error('入力内容に問題があります');
        } else {
          throw new Error(JSON.stringify(data) || '登録に失敗しました');
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setErrors({ general: handleApiError(error) });
      toast.error('登録に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout headertitle="企業会員登録">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <Image 
              src={LogoMix}
              alt="Resume Truemee" 
              width={200} 
              height={60} 
              className="mx-auto mb-6"
              priority
            />
            <h2 className="text-2xl font-bold text-gray-900">
              企業会員登録
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              採用担当者様向けのアカウント作成
            </p>
            <p className="mt-2 text-sm text-gray-600">
              求職者の方は{' '}
              <Link href="/auth/register" className="font-medium text-[#FF733E] hover:text-[#e9632e] transition">
                こちら
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
            {/* Account Information Section */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">アカウント情報</h3>
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
                    placeholder="company@example.com"
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
              </div>
            </div>

            {/* Company Information Section */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">企業情報</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Name */}
                <div>
                  <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-2">
                    会社名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="company_name"
                    name="company_name"
                    type="text"
                    required
                    className={`w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent transition ${
                      errors.company_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="株式会社〇〇"
                    value={formData.company_name}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  {errors.company_name && (
                    <p className="mt-2 text-sm text-red-600">{errors.company_name}</p>
                  )}
                </div>

                {/* Company Name Kana */}
                <div>
                  <label htmlFor="company_name_kana" className="block text-sm font-medium text-gray-700 mb-2">
                    会社名（カナ） <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="company_name_kana"
                    name="company_name_kana"
                    type="text"
                    required
                    className={`w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent transition ${
                      errors.company_name_kana ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="カブシキガイシャ〇〇"
                    value={formData.company_name_kana}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  {errors.company_name_kana && (
                    <p className="mt-2 text-sm text-red-600">{errors.company_name_kana}</p>
                  )}
                </div>

                {/* Industry */}
                <div>
                  <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                    業種 <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="industry"
                    name="industry"
                    required
                    className={`w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent transition ${
                      errors.industry ? 'border-red-300' : 'border-gray-300'
                    }`}
                    value={formData.industry}
                    onChange={handleChange}
                    disabled={isLoading}
                  >
                    <option value="">選択してください</option>
                    <option value="IT・通信">IT・通信</option>
                    <option value="メーカー">メーカー</option>
                    <option value="商社">商社</option>
                    <option value="流通・小売">流通・小売</option>
                    <option value="金融">金融</option>
                    <option value="サービス">サービス</option>
                    <option value="マスコミ">マスコミ</option>
                    <option value="官公庁・公社・団体">官公庁・公社・団体</option>
                    <option value="その他">その他</option>
                  </select>
                  {errors.industry && (
                    <p className="mt-2 text-sm text-red-600">{errors.industry}</p>
                  )}
                </div>

                {/* Employee Count */}
                <div>
                  <label htmlFor="employee_count" className="block text-sm font-medium text-gray-700 mb-2">
                    従業員数 <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="employee_count"
                    name="employee_count"
                    required
                    className={`w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent transition ${
                      errors.employee_count ? 'border-red-300' : 'border-gray-300'
                    }`}
                    value={formData.employee_count}
                    onChange={handleChange}
                    disabled={isLoading}
                  >
                    <option value="">選択してください</option>
                    <option value="1-10">1-10名</option>
                    <option value="11-50">11-50名</option>
                    <option value="51-100">51-100名</option>
                    <option value="101-300">101-300名</option>
                    <option value="301-1000">301-1000名</option>
                    <option value="1001+">1001名以上</option>
                  </select>
                  {errors.employee_count && (
                    <p className="mt-2 text-sm text-red-600">{errors.employee_count}</p>
                  )}
                </div>

                {/* Address - Full Width */}
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    住所 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    required
                    className={`w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent transition ${
                      errors.address ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="東京都〇〇区〇〇1-2-3"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  {errors.address && (
                    <p className="mt-2 text-sm text-red-600">{errors.address}</p>
                  )}
                </div>

                {/* Website - Full Width */}
                <div className="md:col-span-2">
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                    ウェブサイト
                  </label>
                  <input
                    id="website"
                    name="website"
                    type="url"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent transition"
                    placeholder="https://example.com"
                    value={formData.website}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Representative Information Section */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">代表者情報</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Representative Name */}
                <div>
                  <label htmlFor="representative_name" className="block text-sm font-medium text-gray-700 mb-2">
                    代表者名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="representative_name"
                    name="representative_name"
                    type="text"
                    required
                    className={`w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent transition ${
                      errors.representative_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="山田 太郎"
                    value={formData.representative_name}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  {errors.representative_name && (
                    <p className="mt-2 text-sm text-red-600">{errors.representative_name}</p>
                  )}
                </div>

                {/* Representative Kana */}
                <div>
                  <label htmlFor="representative_kana" className="block text-sm font-medium text-gray-700 mb-2">
                    代表者名（カナ） <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="representative_kana"
                    name="representative_kana"
                    type="text"
                    required
                    className={`w-full px-4 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF733E] focus:border-transparent transition ${
                      errors.representative_kana ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="ヤマダ タロウ"
                    value={formData.representative_kana}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  {errors.representative_kana && (
                    <p className="mt-2 text-sm text-red-600">{errors.representative_kana}</p>
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
                    placeholder="03-1234-5678"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  {errors.phone && (
                    <p className="mt-2 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>
              </div>
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
                    <Link href="/terms" target="_blank" className="text-[#FF733E] hover:text-[#e9632e] transition">
                      利用規約
                    </Link>
                    および
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
                  '企業として登録'
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

            {/* Alternative Actions */}
            <div className="space-y-3">
              <Link 
                href="/auth/register" 
                className="inline-flex items-center justify-center w-full py-3 px-4 border border-gray-300 rounded-full text-gray-700 bg-white hover:bg-gray-50 transition font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                求職者として登録
              </Link>
              
              <Link 
                href="/auth/login" 
                className="inline-flex items-center justify-center w-full py-3 px-4 border border-gray-300 rounded-full text-gray-700 bg-white hover:bg-gray-50 transition font-medium"
              >
                既にアカウントをお持ちの方はログイン
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
