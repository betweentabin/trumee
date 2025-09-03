"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaChevronRight } from 'react-icons/fa';
import useAuthV2 from '@/hooks/useAuthV2';

export default function Leftpage() {
  const pathname = usePathname();
  const { currentUser } = useAuthV2();

  const companyIdFromPath = (() => {
    if (!pathname) return null;
    const parts = pathname.split('/').filter(Boolean);
    if (parts[0] === 'company' && parts[1] && parts[1] !== 'seekers-scouted' && parts[1] !== 'seekers-applied') return parts[1];
    return null;
  })();
  const companyId = companyIdFromPath || (currentUser?.role === 'company' ? currentUser.id : undefined);

  const menuItems = [
    { label: '求職者の検索', href: companyId ? `/company/${companyId}` : '/company' },
    { label: 'スカウトした求職者一覧', href: companyId ? `/company/${companyId}/seekers-scouted` : '/company/seekers-scouted' },
    { label: '応募された求職者一覧', href: companyId ? `/company/${companyId}/seekers-applied` : '/company/seekers-applied' },
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
