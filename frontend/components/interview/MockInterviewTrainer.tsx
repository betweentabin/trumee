"use client";

import { useEffect, useMemo, useState } from 'react';
import { getAuthHeaders } from '@/utils/auth';
import { buildApiUrl } from '@/config/api';
import { FaPlay, FaPause, FaStop, FaRedo } from 'react-icons/fa';

type Difficulty = 'all' | 'easy' | 'medium' | 'hard';

interface MockInterview {
  id: string;
  question: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number; // seconds
  tips: string[];
}

export default function MockInterviewTrainer() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [difficulty, setDifficulty] = useState<Difficulty>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [apiQuestions, setApiQuestions] = useState<MockInterview[]>([]);
  const [extraQs, setExtraQs] = useState<MockInterview[]>([]);
  const [loading, setLoading] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState<MockInterview | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timer, setTimer] = useState<ReturnType<typeof setInterval> | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [completedQuestions, setCompletedQuestions] = useState<string[]>([]);

  // Labels
  const difficultyLabel = (d: Difficulty | string) => ({
    all: '全て', easy: '初級', medium: '中級', hard: '上級',
  } as Record<string, string>)[d] || d;
  const categoryLabel = (c: string) => ({
    basic: '基本', motivation: '志望動機', resume: '履歴書', interview: '面接',
    teamwork: 'チームワーク', future: '将来像', stress: 'ストレス耐性', experience: '経験', generated: '生成',
  } as Record<string, string>)[c] || c;
  const difficultyColor = (d: string) => (
    d === 'easy' ? 'bg-green-100 text-green-800' : d === 'medium' ? 'bg-yellow-100 text-yellow-800' : d === 'hard' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
  );

  // Load categories
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(buildApiUrl('/interview/categories/?type=interview'), { headers: { ...getAuthHeaders() } });
        if (!res.ok) return;
        const data = await res.json();
        const cats = Array.isArray(data.categories) ? data.categories : [];
        setCategories(cats);
        if (selectedCategory === 'all' && cats.length) setSelectedCategory(cats[0]);
      } catch { /* noop */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load API questions by category/difficulty
  useEffect(() => {
    (async () => {
      if (selectedCategory === 'all') { setApiQuestions([]); return; }
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('type', 'interview');
        params.set('category', selectedCategory);
        params.set('limit', '20');
        if (difficulty !== 'all') params.set('difficulty', difficulty);
        const res = await fetch(buildApiUrl(`/interview/questions/?${params.toString()}`), { headers: { ...getAuthHeaders() } });
        if (!res.ok) { setApiQuestions([]); return; }
        const data = await res.json();
        const list = Array.isArray(data.results) ? data.results : [];
        const mapped: MockInterview[] = list.map((x: any, i: number) => ({
          id: String(x.id || `api-${i}`),
          question: String(x.text || ''),
          category: String(x.category || selectedCategory),
          difficulty: (x.difficulty || 'medium') as any,
          timeLimit: 180,
          tips: String(x.answer_guide || '')
            .split('\n')
            .map((t: string) => t.trim())
            .filter(Boolean),
        }));
        setApiQuestions(mapped);
      } catch { setApiQuestions([]); } finally { setLoading(false); }
    })();
  }, [selectedCategory, difficulty]);

  // Fallback questions
  const fallback: MockInterview[] = [
    { id: '1', question: '自己紹介をお願いします。', category: 'basic', difficulty: 'easy', timeLimit: 120, tips: ['名前、経歴、現在', '志望動機につなげる', '1-2分で簡潔に'] },
    { id: '2', question: 'なぜ弊社を志望されたのですか？', category: 'motivation', difficulty: 'medium', timeLimit: 180, tips: ['企業研究', '価値観の合致', '理由を3つ程度'] },
    { id: '3', question: 'あなたの強みと弱みを教えてください。', category: 'self', difficulty: 'medium', timeLimit: 180, tips: ['具体例', '改善努力', '職務関連'] },
  ];

  // Personalized (optional) – lightweight initial load
  useEffect(() => {
    (async () => {
      try {
        const p = await fetch(buildApiUrl('/interview/personalize/'), {
          method: 'POST', headers: { ...getAuthHeaders() }, body: JSON.stringify({ type: 'interview', limit: 2 })
        });
        if (!p.ok) return;
        const j = await p.json();
        const items = Array.isArray(j.items) ? j.items : [];
        const gen: MockInterview[] = items.map((it: any, i: number) => ({
          id: `g${i}`,
          question: String(it.text || ''),
          category: String(it.category || 'generated'),
          difficulty: (it.difficulty || 'medium') as any,
          timeLimit: 180,
          tips: Array.isArray(it.tips) ? it.tips : []
        }));
        setExtraQs(prev => [...prev, ...gen]);
      } catch { /* ignore */ }
    })();
  }, []);

  const combined = apiQuestions.length ? apiQuestions : fallback;
  const allQuestions = [...combined, ...extraQs];
  const filtered = selectedCategory === 'all' ? allQuestions : allQuestions.filter(q => q.category === selectedCategory);

  // Timer controls
  const startQuestion = (q: MockInterview) => {
    setCurrentQuestion(q);
    setTimeElapsed(0);
    setUserAnswer('');
    setIsRecording(false);
  };
  const startRecording = () => {
    setIsRecording(true);
    setTimeElapsed(0);
    const t = setInterval(() => setTimeElapsed(prev => prev + 1), 1000);
    setTimer(t);
  };
  const pauseRecording = () => {
    setIsRecording(false);
    if (timer) { clearInterval(timer); setTimer(null); }
  };
  const stopRecording = () => {
    setIsRecording(false);
    if (timer) { clearInterval(timer); setTimer(null); }
    if (currentQuestion) {
      const updated = [...new Set([...completedQuestions, currentQuestion.id])];
      setCompletedQuestions(updated);
      try { localStorage.setItem('interview_completed_questions', JSON.stringify(updated)); } catch {}
    }
  };
  const resetTimer = () => {
    setTimeElapsed(0);
    setIsRecording(false);
    if (timer) { clearInterval(timer); setTimer(null); }
  };
  const formatTime = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-4 py-3 border-b font-semibold">模擬面接</div>
      <div className="p-4 space-y-4">
        {!currentQuestion ? (
          <>
            {/* Filters */}
            <div className="mb-3">
              <div className="flex flex-wrap gap-2 mb-3">
                {[{ key: 'all', label: 'すべて' }, ...categories.map(c => ({ key: c, label: categoryLabel(c) }))].map(c => (
                  <button key={c.key} onClick={() => setSelectedCategory(c.key)} className={`px-3 py-1.5 rounded ${selectedCategory===c.key ? 'bg-[#FF733E] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{c.label}</button>
                ))}
              </div>
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <span className="text-gray-600">難易度:</span>
                {(['all','easy','medium','hard'] as const).map(d => (
                  <button key={d} onClick={() => setDifficulty(d)} className={`px-3 py-1 rounded ${difficulty===d ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}>{difficultyLabel(d)}</button>
                ))}
                {loading && <span className="ml-2 text-xs text-gray-500">読み込み中…</span>}
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-4">
              {filtered.map(q => (
                <div key={q.id} className="border rounded p-4 bg-white">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-800 mr-3">{q.question}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColor(q.difficulty)}`}>{difficultyLabel(q.difficulty)}</span>
                  </div>
                  <div className="mt-3 flex justify-between items-center">
                    <div className="text-sm text-gray-600">目安時間: {formatTime(q.timeLimit)}</div>
                    <button onClick={() => startQuestion(q)} className="px-3 py-1.5 rounded bg-[#FF733E] text-white hover:opacity-90">練習開始</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="max-w-3xl">
            <div className="bg-white rounded-lg border p-6">
              <div className="text-center mb-6">
                <h4 className="text-xl font-bold text-gray-800 mb-2">模擬面接</h4>
                <div className="flex justify-center items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${difficultyColor(currentQuestion.difficulty)}`}>{difficultyLabel(currentQuestion.difficulty)}</span>
                  <span className="text-gray-600">目安時間: {formatTime(currentQuestion.timeLimit)}</span>
                </div>
                <div className="text-4xl font-bold text-blue-600 mb-3">{formatTime(timeElapsed)}</div>
                <div className="bg-blue-50 rounded-lg p-4 text-left">
                  <div className="text-blue-800 font-semibold mb-2">質問</div>
                  <p className="text-gray-900">{currentQuestion.question}</p>
                </div>
              </div>

              <div className="flex justify-center gap-3 mb-6">
                {!isRecording ? (
                  <button onClick={startRecording} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded flex items-center gap-2"><FaPlay />開始</button>
                ) : (
                  <button onClick={pauseRecording} className="bg-yellow-600 hover:bg-yellow-700 text-white px-5 py-2 rounded flex items-center gap-2"><FaPause />一時停止</button>
                )}
                <button onClick={stopRecording} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded flex items-center gap-2"><FaStop />終了</button>
                <button onClick={resetTimer} className="bg-gray-600 hover:bg-gray-700 text-white px-5 py-2 rounded flex items-center gap-2"><FaRedo />リセット</button>
              </div>

              <div className="text-left">
                <div className="font-semibold text-gray-800 mb-2">回答メモ</div>
                <textarea value={userAnswer} onChange={(e)=>setUserAnswer(e.target.value)} placeholder="練習中の気づきや改善点をメモ..." className="w-full h-32 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="mt-6">
                <button onClick={() => setCurrentQuestion(null)} className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2 rounded">質問一覧に戻る</button>
              </div>
            </div>
          </div>
        )}

        {/* Progress */}
        {!currentQuestion && (
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-green-800 font-semibold mb-2">📊 進捗状況</div>
            <div className="text-2xl font-bold text-green-600">{completedQuestions.length} / {allQuestions.length}</div>
            <div className="w-full bg-green-200 rounded-full h-2 mt-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: `${(completedQuestions.length / Math.max(1, allQuestions.length)) * 100}%` }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

