"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaChevronRight } from 'react-icons/fa';

export default function Leftpage() {
  const pathname = usePathname();
  const userIdFromPath = (() => {
    if (!pathname) return null;
    const parts = pathname.split('/').filter(Boolean);
    if (parts[0] === 'users' && parts[1]) return parts[1];
    return null;
  })();

  const menuItems = [
    { label: '企業からのスカウト状況', href: userIdFromPath ? `/users/${userIdFromPath}/scouts/company` : '/scouts/company' },
    { label: 'スカウト企業への志望理由作成補助', href: userIdFromPath ? `/users/${userIdFromPath}/scouts/Faq` : '/scouts/Faq' },
  ];

  return (
    <div className="bg-white border rounded-xl shadow-sm">
      {menuItems.map((item, index) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={index}
            href={item.href}
            className={`flex items-center rounded-[13px] bg-white justify-between px-4 py-3 text-sm hover:bg-gray-100 ${
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
