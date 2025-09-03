"use client";

import Link from 'next/link';
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

  const isOwner = !!(userIdFromPath && currentUser?.id && currentUser.id === userIdFromPath);
  const perUser = (subpath: string) =>
    userIdFromPath ? `/users/${userIdFromPath}/${subpath}` : undefined;

  return (
    <div className="flex flex-col md:flex-row gap-6 mx-auto pt-4">
      {/* Left Card */}
      <div className="flex-1 bg-white border rounded-xl shadow-sm p-4">
        <h2 className="font-bold text-sm mb-4">各サービスを利用する</h2>
        <div className="space-y-3">
          {[
            { text: '職務経歴書に関するアドバイス', href: perUser('career') || '/career' },
            { text: '面接に関するアドバイス', href: perUser('interview') || '/interview' },
            { text: '企業からのスカウト確認', href: perUser('scouts') || '/scouts' },
          ].map(({ text, href }, idx) => (
            <Link 
              href={href} 
              key={idx}
              className="w-full flex items-center justify-between px-4 py-2 border rounded-md text-sm hover:bg-gray-50 cursor-pointer"
            >
              <span>{text}</span>
              <FaChevronRight className="text-gray-400 text-xs" />
            </Link>
          ))}
        </div>
      </div>

      {/* Right Card */}
      <div className="flex-1 bg-white border rounded-xl shadow-sm p-4">
        <h2 className="font-bold text-sm mb-4">登録情報について</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[{
            label: 'プロフィール',
            href: isOwner ? '/auth/step/step1-profile' : (perUser('profile') || '/auth/step/step1-profile'),
          }, {
            label: '経歴',
            href: isOwner ? '/auth/step/step3-experience' : (perUser('experience') || '/auth/step/step3-experience'),
          }, {
            label: '希望条件',
            href: isOwner ? '/auth/step/step4-preference' : (perUser('preference') || '/auth/step/step4-preference'),
          }, {
            label: '履歴書',
            href: isOwner ? '/resumes' : (perUser('resumes') || '/resumes'),
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
