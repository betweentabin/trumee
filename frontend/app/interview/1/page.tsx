'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function InterviewPage1() {
  const router = useRouter();
  const pathname = usePathname();
  const userIdFromPath = (() => {
    if (!pathname) return null;
    const parts = pathname.split('/').filter(Boolean);
    if (parts[0] === 'users' && parts[1]) return parts[1];
    return null;
  })();
  const to = (path: string) => userIdFromPath ? `/users/${userIdFromPath}${path}` : path;
  const [reason, setReason] = useState('');
  const [motivation, setMotivation] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">転職理由・志望動機対策</h1>
        
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">転職理由</h2>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="なぜ転職を考えているのか記入してください..."
              className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">志望動機</h2>
            <textarea
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              placeholder="なぜこの企業・職種を選んだのか記入してください..."
              className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => router.push(to('/interview'))}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg"
            >
              戻る
            </button>
            <button
              onClick={() => router.push(to('/interview/2'))}
              className="bg-[#FF733E] hover:bg-orange-70 active:bg-orange-60 text-white px-6 py-3 rounded-lg"
            >
              次へ：職務経歴書対策
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
