'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/app/redux/hooks';
import useAuthV2 from '@/hooks/useAuthV2';
import ResumeFileUpload from '@/components/resume/resume-file-upload';
import Leftpage from '@/components/user/page';

export default function RegisterDataPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('profile');
  const auth = useAppSelector((s) => s.auth);
  const { currentUser } = useAuthV2();

  const userId = currentUser?.id || auth?.user?.id as string | undefined;

  const sections = useMemo(() => {
    const perUser = (subpath: string) =>
      userId ? `/users/${userId}/${subpath}` : null;

    return [
      { id: 'profile', label: 'プロフィール', href: perUser('profile') || `/users/${userId}/profile` },
      { id: 'history', label: '経歴', href: perUser('experience') || `/users/${userId}/experience` },
      { id: 'hope', label: '希望条件', href: perUser('preference') || `/users/${userId}/preference` },
      { id: 'resume', label: '履歴書', href: perUser('resumes') || `/users/${userId}/resumes` },
    ];
  }, [userId]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">登録情報</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-3">
          <Leftpage />
        </aside>

        <div className="lg:col-span-9">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => router.push(section.href)}
            className="flex flex-col items-center p-4 bg-white border rounded-lg hover:bg-orange-50 hover:border-[#FF733E] transition-colors"
          >
            <span className="text-sm font-medium">{section.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">登録情報の管理</h2>
        <p className="text-gray-600 mb-4">
          各セクションをクリックして、情報の確認・編集ができます。
        </p>
        
        <div className="space-y-3">
          <div className="border-l-4 border-[#FF733E] pl-4">
            <h3 className="font-semibold">プロフィール</h3>
            <p className="text-sm text-gray-600">基本情報や連絡先を管理</p>
          </div>
          
          <div className="border-l-4 border-[#FF733E] pl-4">
            <h3 className="font-semibold">経歴</h3>
            <p className="text-sm text-gray-600">職歴・学歴・スキルを登録</p>
          </div>
          
          <div className="border-l-4 border-[#FF733E] pl-4">
            <h3 className="font-semibold">希望条件</h3>
            <p className="text-sm text-gray-600">希望する職種・勤務地・年収を設定</p>
          </div>
          
          <div className="border-l-4 border-[#FF733E] pl-4">
            <h3 className="font-semibold">履歴書</h3>
            <p className="text-sm text-gray-600">履歴書の作成・管理・ダウンロード</p>
          </div>
        </div>
      </div>

      {/* 履歴書（ファイル）アップロード */}
      <div className="mt-8">
        <ResumeFileUpload />
      </div>
        </div>
      </div>
    </div>
  );
}
