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
    { label: '転職理由(志望理由)', href: userIdFromPath ? `/users/${userIdFromPath}/interview/1` : '/interview/1' },
    { label: '職務経歴書に関する質問', href: userIdFromPath ? `/users/${userIdFromPath}/interview/2` : '/interview/2' },
    { label: '面接対策', href: userIdFromPath ? `/users/${userIdFromPath}/interview/3` : '/interview/3' },
  ];

  return (
    <div className="bg-white border p-5 rounded-xl shadow-sm">
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
