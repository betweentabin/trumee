'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuthHeaders } from '@/utils/auth';

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
  const [derived, setDerived] = useState<string[]>([]);
  const [fromMaster, setFromMaster] = useState<string[]>([]);

  // 履歴書から想定質問を生成（既存ロジック + APIマスタ + パーソナライズ）
  useEffect(() => {
    (async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      // 1) 履歴書 extra_data からの簡易導出（後方互換）
      try {
        const res = await fetch(`${apiUrl}/api/v2/resumes/`, { headers: { ...getAuthHeaders() } });
        if (res.ok) {
          const data = await res.json();
          const list = data.results || data || [];
          const r = list.find((x: any) => x.is_active) || list[0];
          const extra = r?.extra_data || {};
          const experiences = Array.isArray(extra.workExperiences) ? extra.workExperiences : [];
          const qs: string[] = [];
          experiences.forEach((e: any) => {
            if (e?.company) qs.push(`${e.company}での役割と主な成果は？`);
            if (e?.position) qs.push(`${e.position}として最も難しかった課題と解決方法は？`);
            if (Array.isArray(e?.achievements) && e.achievements.filter(Boolean).length) qs.push(`実績のうち、最も誇れるものは？数値で説明できますか？`);
          });
          if (r?.skills) qs.push('履歴書のスキル欄で強調したいスキルと裏付けとなる事例は？');
          setDerived(qs.slice(0, 6));
        }
      } catch { /* ignore */ }

      // 2) マスタ質問から補充（type=resume）
      try {
        const qres = await fetch(`${apiUrl}/api/v2/interview/questions/?type=resume&limit=6`, { headers: { ...getAuthHeaders() } });
        if (qres.ok) {
          const qdata = await qres.json();
          const arr = Array.isArray(qdata.results) ? qdata.results : [];
          setFromMaster(arr.map((x: any) => String(x.text || '')).filter(Boolean).slice(0, 6));
        }
      } catch { /* ignore */ }

      // 3) パーソナライズ（Gemini + ルール）
      try {
        const pres = await fetch(`${apiUrl}/api/v2/interview/personalize/`, {
          method: 'POST',
          headers: { ...getAuthHeaders() },
          body: JSON.stringify({ type: 'resume', limit: 4 })
        });
        if (pres.ok) {
          const pdata = await pres.json();
          const items = Array.isArray(pdata.items) ? pdata.items : [];
          setDerived(prev => {
            const added = items.map((it: any) => String(it.text || '')).filter(Boolean);
            return [...prev, ...added].slice(0, 10);
          });
        }
      } catch { /* ignore */ }
    })();
  }, []);

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

          {(derived.length > 0 || fromMaster.length > 0) && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">履歴書からの想定質問</h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                {[...fromMaster, ...derived].map((q, i) => (<li key={i}>{q}</li>))}
              </ul>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => router.push(to('/interview/1'))}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg"
            >
              前へ：転職理由・志望動機
            </button>
            <button
              onClick={() => router.push(to('/interview/3'))}
              className="bg-[#FF733E] hover:bg-orange-70 active:bg-orange-60 text-white px-6 py-3 rounded-lg"
            >
              次へ：面接対策
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
