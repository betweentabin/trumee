'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaUser, FaLock, FaCreditCard, FaCrown, FaFileAlt, FaBriefcase, FaEnvelope, FaChartLine } from 'react-icons/fa';
import useAuthV2 from '@/hooks/useAuthV2';
import { getAccessToken } from '@/utils/auth';

export default function AccountTopPage() {
  const router = useRouter();
  const { isAuthenticated, currentUser, initializeAuth } = useAuthV2();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isAuthenticated === false) {
      const hasStored = typeof window !== 'undefined' && !!getAccessToken();
      if (!hasStored) router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  const menuItems = [
    {
      title: '基本情報',
      icon: <FaUser className="text-3xl" />,
      description: '氏名、連絡先などの基本情報を確認・変更',
      href: '/account',
      color: 'bg-[#FF733E]'
    },
    {
      title: 'パスワード変更',
      icon: <FaLock className="text-3xl" />,
      description: 'アカウントのパスワードを変更',
      href: '/account/password',
      color: 'bg-green-500'
    },
    {
      title: '支払い情報',
      icon: <FaCreditCard className="text-3xl" />,
      description: 'クレジットカード情報の登録・変更',
      href: '/account/payment',
      color: 'bg-purple-500'
    },
    {
      title: '有料プラン',
      icon: <FaCrown className="text-3xl" />,
      description: 'プレミアムプランの確認・変更',
      href: '/account/paid-plan',
      color: 'bg-yellow-500'
    }
  ];

  const quickStats = [
    { label: '職務経歴書', value: '3', icon: <FaFileAlt />, color: 'text-[#FF733E]' },
    { label: '応募中', value: '5', icon: <FaBriefcase />, color: 'text-green-600' },
    { label: 'スカウト', value: '8', icon: <FaEnvelope />, color: 'text-purple-600' },
    { label: '閲覧数', value: '124', icon: <FaChartLine />, color: 'text-orange-600' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">マイページ</h1>
          <p className="text-gray-600 mt-2">ようこそ、{(currentUser as any)?.full_name || (currentUser as any)?.username || 'ユーザー'}さん</p>
        </div>

        {/* クイックステータス */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className={`${stat.color} mb-2 flex justify-center`}>
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* メニューグリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuItems.map((item, index) => (
            <Link key={index} href={item.href}>
              <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition cursor-pointer">
                <div className="p-6 flex items-start gap-4">
                  <div className={`${item.color} text-white p-4 rounded-lg`}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-600">
                      {item.description}
                    </p>
                  </div>
                  <div className="text-gray-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 最近のアクティビティ */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">最近のアクティビティ</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b">
              <div className="flex items-center gap-3">
                <FaFileAlt className="text-[#FF733E]" />
                <div>
                  <p className="font-medium">職務経歴書を更新しました</p>
                  <p className="text-sm text-gray-500">2日前</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <div className="flex items-center gap-3">
                <FaEnvelope className="text-purple-600" />
                <div>
                  <p className="font-medium">新しいスカウトを受信しました</p>
                  <p className="text-sm text-gray-500">3日前</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <FaBriefcase className="text-green-600" />
                <div>
                  <p className="font-medium">株式会社ABCに応募しました</p>
                  <p className="text-sm text-gray-500">5日前</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
