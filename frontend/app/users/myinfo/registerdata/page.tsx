'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useAppSelector } from '@/app/redux/hooks';
import useAuthV2 from '@/hooks/useAuthV2';
import ResumeFileUpload from '@/components/resume/resume-file-upload';
import Leftpage from '@/components/user/page';

export default function RegisterDataPage() {
  const auth = useAppSelector((s) => s.auth);
  const { currentUser } = useAuthV2();

  const userId = currentUser?.id || auth?.user?.id as string | undefined;
  const hasUserContext = Boolean(userId);

  const infoSections = useMemo(
    () => [
      {
        id: 'profile',
        label: 'プロフィール',
        description: '基本情報や連絡先を管理します。',
        href: hasUserContext ? `/users/${userId}/profile` : undefined,
      },
      {
        id: 'history',
        label: '職務経歴書の記載',
        description: '職歴・学歴・スキルを登録してPRにつなげましょう。',
        href: hasUserContext ? `/users/${userId}/experience` : undefined,
      },
      {
        id: 'hope',
        label: '希望条件',
        description: '希望する職種・勤務地・年収などを設定できます。',
        href: hasUserContext ? `/users/${userId}/preference` : undefined,
      },
      {
        id: 'resume',
        label: '履歴書',
        description: '履歴書の作成・編集・ダウンロードが可能です。',
        href: hasUserContext ? `/users/${userId}/resumes` : undefined,
      },
    ],
    [hasUserContext, userId],
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">登録情報</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-3">
          <Leftpage />
        </aside>

        <div className="lg:col-span-9 myinfo-content">
      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-2">登録情報の管理</h2>
        <p className="text-gray-600 mb-6">
          各セクションの内容を整えると、スカウト企業からの評価が高まりやすくなります。
        </p>

        <div className="space-y-4">
          {infoSections.map((section) => (
            <div key={section.id} className="flex flex-col gap-2 rounded-xl border border-gray-200 px-4 py-3 transition hover:border-primary-200 hover:shadow-sm md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{section.label}</h3>
                <p className="text-sm text-gray-600">{section.description}</p>
              </div>
              {section.href ? (
                <Link
                  href={section.href}
                  className="inline-flex items-center justify-center rounded-full border border-primary-600 px-4 py-2 text-sm font-semibold text-primary-600 transition hover:bg-primary-50"
                >
                  編集する
                </Link>
              ) : (
                <span className="text-xs text-gray-400">ログイン後に編集できます</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 履歴書（ファイル）アップロード */}
      <div className="mt-8">
        <ResumeFileUpload />
      </div>
      </div>
    </div>
    {/* Hide any duplicated inline left menu if rendered inside content by other wrappers */}
    <style jsx>{`
      .myinfo-content :global(.bg-white.p-\[15px\].border.rounded-xl.shadow-sm) {
        display: none;
      }
    `}</style>
  </div>
  );
}
