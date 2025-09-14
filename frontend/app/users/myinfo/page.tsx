'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector } from '@/app/redux/hooks';
import { FaUser, FaLock, FaCreditCard, FaCrown } from 'react-icons/fa';

export default function MyInfoPage() {
  const router = useRouter();
  const authState = useAppSelector(state => state.auth);

  useEffect(() => {
    if (!authState.isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authState, router]);

  const menuItems = [
    {
      title: '基本情報の確認・変更',
      icon: <FaUser className="text-2xl" />,
      href: '/users/myinfo/registerdata',
      color: 'bg-[#FF733E]'
    },
    {
      title: 'パスワードの変更',
      icon: <FaLock className="text-2xl" />,
      href: '/users/myinfo/password',
      color: 'bg-[#FF733E]'
    },
    {
      title: '支払い情報登録・変更',
      icon: <FaCreditCard className="text-2xl" />,
      href: '/users/myinfo/payment',
      color: 'bg-[#FF733E]'
    },
    {
      title: '有料プラン',
      icon: <FaCrown className="text-2xl" />,
      href: '/users/myinfo/paidplans',
      color: 'bg-[#FF733E]'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">マイページ設定</h1>
          <p className="text-gray-600 mt-2">アカウント情報の管理</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuItems.map((item, index) => (
            <Link key={index} href={item.href}>
              <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition cursor-pointer">
                <div className="p-6 flex items-center gap-4">
                  <div className={`${item.color} text-white p-4 rounded-lg`}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {item.title}
                    </h3>
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
      </div>
    </div>
  );
}
