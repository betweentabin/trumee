"use client";

import { useEffect, useMemo, useState } from 'react';
import { getAuthHeaders } from '@/utils/auth';
import { buildApiUrl } from '@/config/api';

type Difficulty = 'all' | 'easy' | 'medium' | 'hard';

export interface QuestionItem {
  id?: string;
  text: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | string;
  source?: string;
}

interface Props {
  type?: 'interview' | 'resume' | 'self_pr';
  initialCategory?: string;
  showPersonalize?: boolean;
  className?: string;
  // Optional: when provided, renders a send button per item
  onPick?: (q: QuestionItem) => void;
  pickLabel?: string;
}

export default function QuestionBrowser({ type = 'interview', initialCategory, showPersonalize = true, className, onPick, pickLabel = '送信' }: Props) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(initialCategory || null);
  const [difficulty, setDifficulty] = useState<Difficulty>('all');
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [tagInput, setTagInput] = useState('');

  // 日本語ラベル
  const difficultyLabel = (d: Difficulty | string) => {
    switch (d) {
      case 'all': return '全て';
      case 'easy': return '初級';
      case 'medium': return '中級';
      case 'hard': return '上級';
      default: return String(d || '中級');
    }
  };
  const categoryLabel = (cat?: string) => {
    const map: Record<string, string> = {
      basic: '基本',
      motivation: '志望動機',
      resume: '履歴書',
      interview: '面接',
      teamwork: 'チームワーク',
      future: '将来像',
      stress: 'ストレス耐性',
      experience: '経験',
      // 以下はAPI側が英語キーで返すカテゴリの日本語化
      reverse: '逆質問',
      case: 'ケース',
      conditions: '条件',
      closing: 'クロージング',
      personality: '性格・資質',
      workstyle: '働き方',
      generated: '生成',
    };
    return map[String(cat || '')] || String(cat || '');
  };
  const badgeColor = (d?: string) => {
    switch (d) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // カテゴリ一覧取得
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(buildApiUrl(`/interview/categories/?type=${type}`), { headers: { ...getAuthHeaders() } });
        if (!res.ok) return;
        const data = await res.json();
        const cats = Array.isArray(data.categories) ? data.categories : [];
        setCategories(cats);
        if (!selected && cats.length) setSelected(cats[0]);
      } catch { /* noop */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  // 質問一覧取得
  useEffect(() => {
    (async () => {
      if (!selected) return;
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('type', type);
        params.set('category', selected);
        params.set('limit', '30');
        if (difficulty !== 'all') params.set('difficulty', difficulty);
        const tagsCsv = tagInput
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
          .join(',');
        if (tagsCsv) params.set('tags', tagsCsv);
        const res = await fetch(buildApiUrl(`/interview/questions/?${params.toString()}`), { headers: { ...getAuthHeaders() } });
        if (!res.ok) { setQuestions([]); return; }
        const data = await res.json();
        const list = Array.isArray(data.results) ? data.results : [];
        const norm: QuestionItem[] = list.map((x: any) => ({
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
  }, [selected, difficulty, tagInput, type]);

  const addPersonalized = async () => {
    try {
      setLoading(true);
      const res = await fetch(buildApiUrl('/interview/personalize/'), {
        method: 'POST',
        headers: { ...getAuthHeaders() },
        body: JSON.stringify({ type, limit: 3 })
      });
      if (!res.ok) return;
      const data = await res.json();
      const items: QuestionItem[] = (data?.items || []).map((it: any, i: number) => ({
        id: `gen-${Date.now()}-${i}`,
        text: String(it.text || ''),
        category: String(it.category || 'generated'),
        difficulty: (it.difficulty || 'medium') as any,
        source: String(it.source || 'gemini'),
      }));
      setQuestions(prev => [...items, ...prev]);
    } catch { /* noop */ } finally { setLoading(false); }
  };

  return (
    <section className={`bg-white rounded-lg shadow p-4 ${className || ''}`}>
      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelected(cat)}
            className={`px-4 py-2 rounded-lg border transition-colors ${selected === cat ? 'bg-[#FF733E] text-white border-[#FF733E]' : 'bg-white text-gray-800 hover:bg-gray-50'}`}
          >
            {categoryLabel(cat)}
          </button>
        ))}
      </div>

      {/* Difficulty + tags */}
      <div className="mt-4 flex items-center gap-2 text-sm flex-wrap">
        <span className="text-gray-600">難易度:</span>
        {(['all','easy','medium','hard'] as const).map(d => (
          <button
            key={d}
            onClick={() => setDifficulty(d)}
            className={`px-3 py-1 rounded ${difficulty===d ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
          >{difficultyLabel(d)}</button>
        ))}
        <span className="ml-4 text-gray-600">タグ（カンマ区切り）:</span>
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          placeholder="例: 営業, リーダーシップ"
          className="border rounded px-2 py-1 text-sm"
        />
        <button
          onClick={() => setTagInput(tagInput.trim())}
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
        >絞り込み</button>
        <div className="flex-1" />
        {showPersonalize && (
          <button onClick={addPersonalized} className="px-4 py-2 rounded bg-[#FF733E] text-white hover:opacity-90 disabled:opacity-60" disabled={loading}>
            {loading ? '読み込み中…' : '質問を生成（AI）'}
          </button>
        )}
      </div>

      {/* Questions */}
      <div className="mt-4">
        {loading && <div className="text-gray-500 text-sm">読み込み中...</div>}
        {!loading && questions.length === 0 && (
          <div className="text-gray-400 text-sm">質問がありません。</div>
        )}
        <ul className="space-y-3">
          {questions.map((q, i) => (
            <li key={(q.id || '') + i} className="border rounded p-3 flex items-start justify-between gap-3">
              <div className="text-gray-900 pr-2">{q.text}</div>
              <div className="shrink-0 flex items-center gap-2">
                {q.source === 'gemini' && (
                  <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">AI</span>
                )}
                <span className={`px-2 py-1 text-xs rounded ${badgeColor(q.difficulty)}`}>{difficultyLabel(q.difficulty || 'medium')}</span>
                {onPick && (
                  <button className="btn-outline btn-outline-sm" onClick={() => onPick(q)}>{pickLabel}</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
