'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/app/redux/hooks';
import { FaQuestionCircle, FaClipboardList, FaCheckDouble, FaExclamationCircle } from 'react-icons/fa';
import { getAuthHeaders } from '@/utils/auth';

export default function ResumeQuestionsPage() {
  const router = useRouter();
  const authState = useAppSelector(state => state.auth);
  const [selectedCategory, setSelectedCategory] = useState('experience');
  const [derived, setDerived] = useState<string[]>([]);
  const [summary, setSummary] = useState<{ topExperiences: Array<{ company?: string; position?: string }>; topSkills: string[]; selfPr?: string } | null>(null);

  useEffect(() => {
    const hasStoredToken = typeof window !== 'undefined' && !!localStorage.getItem('drf_token_v2');
    if (!authState.isAuthenticated && !hasStoredToken) {
      router.push('/auth/login');
    }
  }, [authState.isAuthenticated, router]);

  const categories = [
    { id: 'experience', name: '職務経歴', icon: '💼' },
    { id: 'skills', name: 'スキル', icon: '🛠️' },
    { id: 'achievements', name: '実績', icon: '🏆' },
    { id: 'challenges', name: '課題解決', icon: '💡' }
  ];

  const questions = {
    experience: [
      {
        question: '前職での主な業務内容を教えてください',
        sampleAnswer: '前職では〇〇部門で△△の業務を担当していました。具体的には...',
        tips: '業務内容を具体的に、かつ簡潔に説明しましょう'
      },
      {
        question: 'チームでの役割はどのようなものでしたか？',
        sampleAnswer: 'プロジェクトリーダーとして5名のチームをマネジメントし...',
        tips: 'リーダーシップやチームワークの経験をアピールしましょう'
      }
    ],
    skills: [
      {
        question: 'あなたの強みとなるスキルは何ですか？',
        sampleAnswer: '私の強みは〇〇のスキルです。これにより△△を実現しました...',
        tips: '具体例を交えてスキルの活用方法を説明しましょう'
      },
      {
        question: '技術的なスキルをどのように習得しましたか？',
        sampleAnswer: '独学と実践を通じて習得しました。具体的には...',
        tips: '学習意欲と成長への姿勢を示しましょう'
      }
    ],
    achievements: [
      {
        question: '最も誇れる実績は何ですか？',
        sampleAnswer: '〇〇プロジェクトで売上を△％向上させたことです...',
        tips: '数値を使って具体的な成果を示しましょう'
      },
      {
        question: '困難を乗り越えた経験を教えてください',
        sampleAnswer: '〇〇という課題に直面しましたが、△△により解決しました...',
        tips: '問題解決能力と粘り強さをアピールしましょう'
      }
    ],
    challenges: [
      {
        question: '失敗から学んだことはありますか？',
        sampleAnswer: '〇〇で失敗しましたが、そこから△△を学びました...',
        tips: '失敗を成長の機会として捉える姿勢を示しましょう'
      },
      {
        question: '業務改善の提案をした経験はありますか？',
        sampleAnswer: '〇〇の効率化を提案し、△△の成果を得ました...',
        tips: '主体性と改善への意識をアピールしましょう'
      }
    ]
  };

  // 履歴書の内容から想定質問を自動生成
  useEffect(() => {
    (async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/v2/resumes/`, { headers: { ...getAuthHeaders() } });
        if (!res.ok) return;
        const data = await res.json();
        const list = data.results || data || [];
        const r = list.find((x: any) => x.is_active) || list[0];
        if (!r) return;
        const extra = r?.extra_data || {};
        const experiences = Array.isArray(extra.workExperiences) ? extra.workExperiences : [];
        const qs: string[] = [];
        experiences.forEach((e: any) => {
          if (e?.company) qs.push(`${e.company}での役割と主な成果は？`);
          if (e?.position) qs.push(`${e.position}として直面した課題と解決方法は？`);
          if (Array.isArray(e?.achievements) && e.achievements.filter(Boolean).length) qs.push('実績のうち最も誇れるものは？数値で説明できますか？');
        });
        if (r?.skills) qs.push('履歴書のスキル欄で強調したいスキルと裏付けとなる事例は？');
        if (r?.self_pr) qs.push('自己PRで述べた強みの根拠となるエピソードは？');
        setDerived(qs.slice(0, 8));

        // サマリ: 上位経験とスキルを抽出
        const topExperiences = experiences.slice(0, 3).map((e: any) => ({ company: e?.company, position: e?.position }));
        const topSkills = String(r?.skills || '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 5);
        setSummary({ topExperiences, topSkills, selfPr: r?.self_pr });
      } catch { /* ignore */ }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaClipboardList className="text-blue-600" />
            職務経歴書に関する質問
          </h1>
          <p className="text-gray-600 mt-2">面接でよく聞かれる職務経歴書に関する質問と回答例</p>
        </div>

        {summary && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-3">履歴書の要点（自動抽出）</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
              <div>
                <div className="font-medium mb-1">経験（上位）</div>
                <ul className="list-disc pl-5 space-y-1">
                  {summary.topExperiences.map((e, i) => (
                    <li key={i}>{[e.company, e.position].filter(Boolean).join(' / ') || '—'}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="font-medium mb-1">スキル</div>
                <div className="flex flex-wrap gap-1">
                  {summary.topSkills.length === 0 ? (
                    <span className="text-gray-400">—</span>
                  ) : summary.topSkills.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{s}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-medium mb-1">自己PR</div>
                <p className="text-gray-600 line-clamp-3">{summary.selfPr || '未入力'}</p>
              </div>
            </div>
          </div>
        )}

        {derived.length > 0 && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-3">履歴書からの想定質問</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              {derived.map((q, i) => (<li key={i}>{q}</li>))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-4">カテゴリー</h2>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition ${
                      selectedCategory === category.id
                        ? 'bg-[#FF733E] text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="space-y-6">
              {questions[selectedCategory as keyof typeof questions].map((item, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <FaQuestionCircle className="text-blue-600 text-xl mt-1" />
                    <h3 className="text-lg font-semibold text-gray-800">
                      {item.question}
                    </h3>
                  </div>

                  <div className="ml-8 space-y-4">
                    <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <FaCheckDouble className="text-green-600" />
                        <span className="font-medium text-gray-700">回答例</span>
                      </div>
                      <p className="text-gray-600">{item.sampleAnswer}</p>
                    </div>

                    <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <FaExclamationCircle className="text-yellow-600" />
                        <span className="font-medium text-gray-700">ポイント</span>
                      </div>
                      <p className="text-gray-600">{item.tips}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">面接での心構え</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">✓</span>
                  <span>質問の意図を理解してから回答しましょう</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">✓</span>
                  <span>具体例を交えて説明することで説得力が増します</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">✓</span>
                  <span>簡潔に要点を伝えることを心がけましょう</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">✓</span>
                  <span>ネガティブな内容もポジティブに変換して伝えましょう</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
