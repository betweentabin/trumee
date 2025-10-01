"use client";

import Link from 'next/link';
import GatedLink from '@/components/GatedLink';
import { usePathname } from 'next/navigation';
import { FaChevronRight } from 'react-icons/fa';
import useAuthV2 from '@/hooks/useAuthV2';

export default function ServiceCards() {
  const pathname = usePathname();
  const { currentUser } = useAuthV2();
  // If path is /users/[id] or deeper under it, extract the userId to build per-user routes
  const userIdFromPath = (() => {
    if (!pathname) return null;
    const parts = pathname.split('/').filter(Boolean);
    // Expect ['users', '{id}', ...]
    if (parts[0] === 'users' && parts[1]) return parts[1];
    return null;
  })();

  const isOwner = !!(userIdFromPath && currentUser?.id && String(currentUser.id) === String(userIdFromPath));
  const perUser = (subpath: string) => {
    // Use current user ID if available, otherwise use path ID
    const userId = currentUser?.id || userIdFromPath;
    return userId ? `/users/${userId}/${subpath}` : undefined;
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 mx-auto pt-4">
      {/* Left Card */}
      <div className="flex-1 bg-white border rounded-xl shadow-sm p-4">
        <h2 className="font-bold text-sm mb-4">各サービスを利用する</h2>
        <div className="grid grid-cols-1 gap-3">
          {/* Individual rows to allow gating per item */}
          <Link 
            href={perUser('resume-advice/review') || '/resume-advice/review'} 
            className="w-full flex items-center justify-between px-4 py-3 border rounded-md text-sm hover:bg-gray-50 cursor-pointer"
          >
            <span>職務経歴書に関するアドバイス</span>
            <FaChevronRight className="text-gray-400 text-xs" />
          </Link>
          <GatedLink
            href={perUser('interview') || '/interview'}
            feature="interview_chat"
          >
            <div className="w-full flex items-center justify-between px-4 py-3 border rounded-md text-sm hover:bg-gray-50 cursor-pointer">
              <span>面接対策・質問集</span>
              <FaChevronRight className="text-gray-400 text-xs" />
            </div>
          </GatedLink>
          <Link 
            href={perUser('scouts') || '/scouts'} 
            className="w-full flex items-center justify-between px-4 py-3 border rounded-md text-sm hover:bg-gray-50 cursor-pointer"
          >
            <span>企業からのスカウト確認</span>
            <FaChevronRight className="text-gray-400 text-xs" />
          </Link>
        </div>
      </div>

      {/* Right Card */}
      <div className="flex-1 bg-white border rounded-xl shadow-sm p-4">
        <h2 className="font-bold text-sm mb-4">登録情報について</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[{
            label: 'プロフィール',
            href: perUser('profile') || `/users/${currentUser?.id}/profile`,
          }, {
            label: '職務経歴書',
            href: perUser('resumes') || `/users/${currentUser?.id}/resumes`,
          }, {
            label: '希望条件',
            href: perUser('preference') || `/users/${currentUser?.id}/preference`,
          }, {
            label: '履歴書',
            href: perUser('resumes') || `/users/${currentUser?.id}/resumes`,
          }].map(({ label, href }, idx) => (
            <Link
              href={href}
              key={idx}
              className="flex items-center justify-between px-4 py-2 border rounded-md hover:bg-gray-50 w-full cursor-pointer"
            >
              <span>{label}</span>
              <FaChevronRight className="text-gray-400 text-xs" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
