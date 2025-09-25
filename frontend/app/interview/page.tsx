'use client';

import { useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import QuestionBrowser from '@/components/interview/QuestionBrowser';

export default function InterviewTopPage() {
  const router = useRouter();
  const pathname = usePathname();
  const userIdFromPath = useMemo(() => {
    if (!pathname) return null as string | null;
    const parts = pathname.split('/').filter(Boolean);
    if (parts[0] === 'users' && parts[1]) return parts[1];
    return null;
  }, [pathname]);
  const to = (path: string) => (userIdFromPath ? `/users/${userIdFromPath}${path}` : path);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">面接対策（カテゴリ選択）</h1>
          <div className="flex gap-2">
            <button onClick={() => router.push(to('/interview/1'))} className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">転職理由</button>
            <button onClick={() => router.push(to('/interview/2'))} className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">職務経歴書</button>
            <button onClick={() => router.push(to('/interview/3'))} className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">模擬面接</button>
          </div>
        </div>

        <QuestionBrowser type="interview" showPersonalize />
      </div>
    </div>
  );
}
