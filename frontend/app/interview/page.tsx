'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuthHeaders } from '@/utils/auth';

type QItem = {
  id?: string;
  text: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | string;
  source?: string;
  tips?: string[];
};

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

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<'all'|'easy'|'medium'|'hard'>('all');
  const [questions, setQuestions] = useState<QItem[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/api/v2/interview/categories/?type=interview`, { headers: { ...getAuthHeaders() } });
        if (!res.ok) return;
        const data = await res.json();
        const cats = Array.isArray(data.categories) ? data.categories : [];
        setCategories(cats);
        if (cats.length && !selected) {
          // Auto-select first category
          setSelected(cats[0]);
        }
      } catch { /* noop */ }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!selected) return;
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('type', 'interview');
        params.set('category', selected);
        params.set('limit', '30');
        if (difficulty !== 'all') params.set('difficulty', difficulty);
        const tagsCsv = tagInput
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
          .join(',');
        if (tagsCsv) params.set('tags', tagsCsv);
        const res = await fetch(`${apiUrl}/api/v2/interview/questions/?${params.toString()}`, { headers: { ...getAuthHeaders() } });
        if (!res.ok) { setQuestions([]); return; }
        const data = await res.json();
        const list = Array.isArray(data.results) ? data.results : [];
        const norm: QItem[] = list.map((x: any) => ({
          id: String(x.id || ''),
          text: String(x.text || ''),
          category: String(x.category || ''),
          difficulty: String(x.difficulty || 'medium'),
        }));
        setQuestions(norm);
      } catch {
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [selected, difficulty]);

  const addPersonalized = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/v2/interview/personalize/`, {
        method: 'POST',
        headers: { ...getAuthHeaders() },
        body: JSON.stringify({ type: 'interview', limit: 3 })
      });
      if (!res.ok) return;
      const data = await res.json();
      const items: QItem[] = (data?.items || []).map((it: any, i: number) => ({
        id: `gen-${Date.now()}-${i}`,
        text: String(it.text || ''),
        category: String(it.category || 'generated'),
        difficulty: (it.difficulty || 'medium') as any,
        source: String(it.source || 'gemini'),
        tips: Array.isArray(it.tips) ? it.tips : [],
      }));
      setQuestions(prev => [...items, ...prev]);
    } catch { /* noop */ } finally { setLoading(false); }
  };

  const badgeColor = (d?: string) => {
    switch (d) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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

        {/* Category filter */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelected(cat)}
                className={`px-4 py-2 rounded-lg border transition-colors ${selected === cat ? 'bg-[#FF733E] text-white border-[#FF733E]' : 'bg-white text-gray-800 hover:bg-gray-50'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Difficulty filter */}
          <div className="mt-4 flex items-center gap-2 text-sm flex-wrap">
            <span className="text-gray-600">難易度:</span>
            {(['all','easy','medium','hard'] as const).map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-3 py-1 rounded ${difficulty===d ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              >{d === 'all' ? '全て' : d}</button>
            ))}
            <span className="ml-4 text-gray-600">タグ（カンマ区切り）:</span>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="例: sales, leadership"
              className="border rounded px-2 py-1 text-sm"
            />
            <button
              onClick={() => {
                // re-trigger fetch by changing selected (same value) or difficulty
                setSelected(prev => (prev ? prev : (categories[0] || null)));
              }}
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
            >絞り込み</button>
            <div className="flex-1" />
            <button onClick={addPersonalized} className="px-4 py-2 rounded bg-[#FF733E] text-white hover:opacity-90 disabled:opacity-60" disabled={loading}>
              {loading ? '読み込み中…' : '質問を生成（Gemini）'}
            </button>
          </div>
        </div>

        {/* Questions list */}
        <div className="bg-white rounded-lg shadow p-4">
          {loading && <div className="text-gray-500 text-sm">読み込み中...</div>}
          {!loading && questions.length === 0 && (
            <div className="text-gray-400 text-sm">質問がありません。</div>
          )}
          <ul className="space-y-3">
            {questions.map((q, i) => (
              <li key={(q.id || '') + i} className="border rounded p-3 flex items-start justify-between gap-3">
                <div className="text-gray-900">{q.text}</div>
                <div className="shrink-0 flex items-center gap-2">
                  {q.source === 'gemini' && (
                    <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">AI</span>
                  )}
                  <span className={`px-2 py-1 text-xs rounded ${badgeColor(q.difficulty)}`}>{q.difficulty || 'medium'}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
