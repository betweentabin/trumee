'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import toast from 'react-hot-toast';
import { getAuthHeaders } from '@/utils/auth';
import { buildApiUrl } from '@/config/api';
import { 
  FaPlay, 
  FaPause, 
  FaStop, 
  FaRedo, 
  FaLightbulb, 
  FaClock, 
  FaMicrophone,
  FaEye,
  FaCheckCircle
} from 'react-icons/fa';

interface MockInterview {
  id: string;
  question: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number; // seconds
  tips: string[];
}

export default function InterviewPage3() {
  const router = useRouter();
  const pathname = usePathname();
  const userIdFromPath = (() => {
    if (!pathname) return null;
    const parts = pathname.split('/').filter(Boolean);
    if (parts[0] === 'users' && parts[1]) return parts[1];
    return null;
  })();
  const to = (path: string) => userIdFromPath ? `/users/${userIdFromPath}${path}` : path;
  const [currentQuestion, setCurrentQuestion] = useState<MockInterview | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [difficulty, setDifficulty] = useState<'all'|'easy'|'medium'|'hard'>('all');
  const [completedQuestions, setCompletedQuestions] = useState<string[]>([]);
  const [userAnswer, setUserAnswer] = useState('');

  const [extraQs, setExtraQs] = useState<MockInterview[]>([]);
  const [apiCategories, setApiCategories] = useState<string[]>([]);
  const [apiQuestions, setApiQuestions] = useState<MockInterview[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        // 1) 既存履歴書から簡易導出（後方互換）
        const res = await fetch(`${apiUrl}/api/v2/resumes/`, { headers: { ...getAuthHeaders() } });
        if (res.ok) {
          const data = await res.json();
          const list = data.results || data || [];
          const r = list.find((x: any) => x.is_active) || list[0];
          const extra = r?.extra_data || {};
          const experiences = Array.isArray(extra.workExperiences) ? extra.workExperiences : [];
          const derived: MockInterview[] = experiences.slice(0, 2).map((e: any, idx: number) => ({
            id: `r${idx}`,
            question: `${e.company || '前職'}での貢献を具体的に教えてください（役割・施策・成果）`,
            category: 'experience',
            difficulty: 'medium',
            timeLimit: 180,
            tips: ['STARで簡潔に', '数値・具体例', '学びと再現可能性']
          }));
          setExtraQs(derived);
        }

        // 2) API v2: 個別最適化質問（Gemini + ルール）
        try {
          const p = await fetch(buildApiUrl('/interview/personalize/'), {
            method: 'POST',
            headers: { ...getAuthHeaders() },
            body: JSON.stringify({ type: 'interview', limit: 3 })
          });
          if (p.ok) {
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
          }
        } catch { /* ignore personalize errors */ }
      } catch { /* ignore */ }
    })();
  }, []);

  // 既存の静的質問（APIが空の時のフォールバック）
  const mockQuestions: MockInterview[] = [
    {
      id: '1',
      question: '自己紹介をお願いします。',
      category: 'basic',
      difficulty: 'easy',
      timeLimit: 120,
      tips: [
        '名前、経歴、現在の状況を簡潔に',
        '志望動機につながる要素を含める',
        '1-2分程度で収める'
      ]
    },
    {
      id: '2',
      question: 'なぜ弊社を志望されたのですか？',
      category: 'motivation',
      difficulty: 'medium',
      timeLimit: 180,
      tips: [
        '企業研究の成果を示す',
        '自分の価値観との合致点を説明',
        '具体的な理由を3つ程度挙げる'
      ]
    },
    {
      id: '3',
      question: 'あなたの強みと弱みを教えてください。',
      category: 'personality',
      difficulty: 'medium',
      timeLimit: 240,
      tips: [
        '強みは具体例と共に説明',
        '弱みは改善努力も含めて説明',
        '職務に関連する内容を選ぶ'
      ]
    },
    {
      id: '4',
      question: 'チームで働く際に重視することは何ですか？',
      category: 'teamwork',
      difficulty: 'medium',
      timeLimit: 180,
      tips: [
        'コミュニケーションの重要性',
        '相互理解と協力',
        '具体的な経験談を交える'
      ]
    },
    {
      id: '5',
      question: '5年後のキャリアビジョンを教えてください。',
      category: 'future',
      difficulty: 'hard',
      timeLimit: 240,
      tips: [
        '現実的で具体的な目標',
        '企業での成長との関連性',
        'スキルアップ計画も含める'
      ]
    },
    {
      id: '6',
      question: 'プレッシャーの中でどのように作業を進めますか？',
      category: 'stress',
      difficulty: 'hard',
      timeLimit: 180,
      tips: [
        '具体的な対処法を説明',
        '過去の経験を例に挙げる',
        'ポジティブな解決策を提示'
      ]
    }
  ];

  const categories = [{ key: 'all', label: 'すべて' }, ...apiCategories.map(c => ({ key: c, label: c }))];

  useEffect(() => {
    loadCompletedQuestions();
  }, []);

  useEffect(() => {
    if (isRecording && timer) {
      return () => clearInterval(timer);
    }
  }, [isRecording, timer]);

  const loadCompletedQuestions = () => {
    try {
      const completed = localStorage.getItem('interview_completed_questions');
      if (completed) {
        setCompletedQuestions(JSON.parse(completed));
      }
    } catch (error) {
      console.error('Failed to load completed questions:', error);
    }
  };

  // カテゴリ一覧の読み込み（API）
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(buildApiUrl('/interview/categories/?type=interview'), { headers: { ...getAuthHeaders() } });
        if (!res.ok) return;
        const data = await res.json();
        const cats = Array.isArray(data.categories) ? data.categories : [];
        setApiCategories(cats);
        if (selectedCategory === 'all' && cats.length) setSelectedCategory(cats[0]);
      } catch { /* noop */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 質問一覧の読み込み（API）
  useEffect(() => {
    (async () => {
      if (selectedCategory === 'all') { setApiQuestions([]); return; }
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('type', 'interview');
        params.set('category', selectedCategory);
        params.set('limit', '30');
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
      } catch {
        setApiQuestions([]);
      } finally { setLoading(false); }
    })();
  }, [selectedCategory, difficulty]);

  const saveCompletedQuestion = (questionId: string) => {
    const updated = [...completedQuestions, questionId];
    setCompletedQuestions(updated);
    localStorage.setItem('interview_completed_questions', JSON.stringify(updated));
  };

  const startQuestion = (question: MockInterview) => {
    setCurrentQuestion(question);
    setTimeElapsed(0);
    setUserAnswer('');
    setIsRecording(false);
  };

  const startRecording = () => {
    setIsRecording(true);
    setTimeElapsed(0);
    
    const newTimer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    setTimer(newTimer);
  };

  const pauseRecording = () => {
    setIsRecording(false);
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
    
    if (currentQuestion) {
      saveCompletedQuestion(currentQuestion.id);
      toast.success('面接練習が完了しました！');
    }
  };

  const resetTimer = () => {
    setTimeElapsed(0);
    setIsRecording(false);
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '初級';
      case 'medium': return '中級';
      case 'hard': return '上級';
      default: return difficulty;
    }
  };

  const fallbackQuestions = [...mockQuestions];
  const combined = apiQuestions.length ? apiQuestions : fallbackQuestions;
  const allQuestions = [...combined, ...extraQs];
  const filteredQuestions = selectedCategory === 'all' 
    ? allQuestions 
    : allQuestions.filter(q => q.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">面接対策・模擬面接</h1>
          <p className="text-gray-600">実際の面接を想定した練習を行い、自信を身につけましょう。</p>
        </div>

        {!currentQuestion ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 質問選択 */}
            <div className="lg:col-span-3">
              {/* カテゴリフィルター */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">カテゴリを選択</h2>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.key}
                      onClick={() => setSelectedCategory(category.key)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        selectedCategory === category.key
                          ? 'bg-[#FF733E] text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm flex-wrap">
                  <span className="text-gray-600">難易度:</span>
                  {(['all','easy','medium','hard'] as const).map(d => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`px-3 py-1 rounded ${difficulty===d ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                    >{d === 'all' ? '全て' : d}</button>
                  ))}
                  {loading && <span className="ml-2 text-xs text-gray-500">読み込み中…</span>}
                </div>
              </div>

              {/* 質問一覧 */}
              <div className="space-y-4">
                {filteredQuestions.map((question) => (
                  <div key={question.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-800 flex-1">
                        {question.question}
                      </h3>
                      <div className="flex gap-2 ml-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                          {getDifficultyText(question.difficulty)}
                        </span>
                        {completedQuestions.includes(question.id) && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <FaCheckCircle className="inline mr-1" />
                            完了
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center text-gray-600 text-sm mb-4">
                      <FaClock className="mr-1" />
                      目安時間: {formatTime(question.timeLimit)}
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-2">回答のポイント:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {question.tips.map((tip, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => startQuestion(question)}
                      className="bg-[#FF733E] hover:bg-orange-70 active:bg-orange-60 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <FaPlay />
                      練習開始
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* サイドバー */}
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-blue-800 flex items-center gap-2">
                  <FaLightbulb />
                  面接のコツ
                </h3>
                <ul className="text-sm text-blue-700 space-y-2">
                  <li>• 明確で簡潔な回答を心がける</li>
                  <li>• 具体例を交えて説明する</li>
                  <li>• 相手の目を見て話す</li>
                  <li>• 落ち着いてゆっくり話す</li>
                  <li>• 質問の意図を理解してから回答</li>
                </ul>
              </div>

              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2 text-green-800">📊 進捗状況</h3>
                <div className="text-2xl font-bold text-green-600">
                  {completedQuestions.length} / {allQuestions.length}
                </div>
                <div className="text-sm text-green-700">質問完了</div>
                <div className="w-full bg-green-200 rounded-full h-2 mt-3">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${(completedQuestions.length / allQuestions.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 面接練習画面 */
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">模擬面接</h2>
                <div className="flex justify-center items-center gap-4 mb-6">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(currentQuestion.difficulty)}`}>
                    {getDifficultyText(currentQuestion.difficulty)}
                  </span>
                  <span className="text-gray-600">
                    目安時間: {formatTime(currentQuestion.timeLimit)}
                  </span>
                </div>
                
                {/* タイマー */}
                <div className="text-4xl font-bold text-blue-600 mb-4">
                  {formatTime(timeElapsed)}
                </div>
                
                {/* 質問 */}
                <div className="bg-blue-50 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-semibold text-blue-800 mb-4">質問</h3>
                  <p className="text-lg text-gray-800">{currentQuestion.question}</p>
                </div>

                {/* コントロールボタン */}
                <div className="flex justify-center gap-4 mb-6">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <FaPlay />
                      開始
                    </button>
                  ) : (
                    <button
                      onClick={pauseRecording}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <FaPause />
                      一時停止
                    </button>
                  )}
                  
                  <button
                    onClick={stopRecording}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <FaStop />
                    終了
                  </button>
                  
                  <button
                    onClick={resetTimer}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <FaRedo />
                    リセット
                  </button>
                </div>

                {/* 回答メモ */}
                <div className="text-left">
                  <h4 className="font-semibold text-gray-800 mb-2">回答メモ</h4>
                  <textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="練習中に気づいたポイントや改善点をメモしてください..."
                    className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* 戻るボタン */}
                <div className="mt-6">
                  <button
                    onClick={() => setCurrentQuestion(null)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    質問一覧に戻る
                  </button>
                </div>

                {/* 回答のポイント */}
                <div className="mt-8 bg-yellow-50 rounded-lg p-6 text-left">
                  <h4 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                    <FaLightbulb />
                    回答のポイント
                  </h4>
                  <ul className="text-sm text-yellow-700 space-y-2">
                    {currentQuestion.tips.map((tip, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-yellow-500 mr-2">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ナビゲーション */}
        {!currentQuestion && (
          <div className="flex justify-between mt-8">
            <button
              onClick={() => router.push(to('/interview/2'))}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              前へ：職務経歴書に関する質問
            </button>
            <button
              onClick={() => router.push(to('/interview/1'))}
              className="bg-[#FF733E] hover:bg-orange-70 active:bg-orange-60 text-white px-6 py-3 rounded-lg transition-colors"
            >
              最初に戻る
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
