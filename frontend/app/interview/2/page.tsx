'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function InterviewPage2() {
  const router = useRouter();
  const pathname = usePathname();
  const userIdFromPath = (() => {
    if (!pathname) return null;
    const parts = pathname.split('/').filter(Boolean);
    if (parts[0] === 'users' && parts[1]) return parts[1];
    return null;
  })();
  const to = (path: string) => userIdFromPath ? `/users/${userIdFromPath}${path}` : path;
  const [achievements, setAchievements] = useState('');
  const [challenges, setChallenges] = useState('');
  const [skills, setSkills] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">職務経歴書に関する質問対策</h1>
        
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">最も誇れる成果・実績</h2>
            <textarea
              value={achievements}
              onChange={(e) => setAchievements(e.target.value)}
              placeholder="具体的な成果や実績を記入してください..."
              className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">困難な状況の乗り越え方</h2>
            <textarea
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              placeholder="困難をどのように解決したか記入してください..."
              className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">身につけたスキル・知識</h2>
            <textarea
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="技術的スキルやソフトスキルを記入してください..."
              className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => router.push(to('/interview/1'))}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg"
            >
              前へ：転職理由・志望動機
            </button>
            <button
              onClick={() => router.push(to('/interview/3'))}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
            >
              次へ：面接対策
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
