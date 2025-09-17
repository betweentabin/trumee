'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaChevronRight } from 'react-icons/fa';

interface MenuItem {
  label: string;
  href: string;
}

const menuItems: MenuItem[] = [
  { label: '登録情報の管理設定', href: '/companyinfo' },
  { label: '支払い・プランの管理設定', href: '/companyinfo/payment' },
  { label: '請求書の送付先', href: '/companyinfo/billing' },
  { label: 'パスワードの変更', href: '/companyinfo/repassword' },
];

export default function Left() {
  const pathname = usePathname();

  return (
    <div className="bg-white p-[15px] border rounded-xl shadow-sm">
      {menuItems.map((item, index) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={index}
            href={item.href}
            className={`flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-100 ${
              isActive ? 'bg-gray-200 font-semibold' : ''
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
