"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/app/redux/hooks';
import { FaChevronRight } from 'react-icons/fa';

export default function Leftpage() {
  const pathname = usePathname();
  const auth = useAppSelector((s) => s.auth);

  const userIdFromPath = (() => {
    if (!pathname) return null;
    const parts = pathname.split('/').filter(Boolean);
    if (parts[0] === 'users' && parts[1] && parts[1] !== 'myinfo') return parts[1];
    return null;
  })();
  const userId = userIdFromPath || (auth?.user?.id as string | undefined);

  const menuItems = [
    { label: 'TOP', href: userId ? `/users/${userId}` : '/users' },
    // いつでも registerdata を優先表示（プロフィールページに飛ばない）
    { label: '登録情報の確認・変更', href: '/users/myinfo/registerdata' },
    { label: 'パスワードの変更', href: '/users/myinfo/password' },
    { label: '支払い情報登録・変更', href: '/users/myinfo/payment' },
    { label: '有料プラン', href: '/users/myinfo/paidplans' },
  ];

  return (
    <div className="bg-white p-[15px] border rounded-xl shadow-sm">
      {menuItems.map((item, index) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={index}
            href={item.href}
            className={`flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-100 ${
              isActive ? 'bg-orange-50 font-semibold border-l-4 border-[#FF733E]' : ''
            }`}
          >
            <span>{item.label}</span>
            <FaChevronRight className="text-gray-400 text-xs" />
          </Link>
        );
      })}
    </div>
  );
}
