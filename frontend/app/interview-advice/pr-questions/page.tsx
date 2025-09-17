'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/app/redux/hooks';
import { FaUserTie, FaStar, FaMicrophone, FaLightbulb } from 'react-icons/fa';
import { getAuthHeaders } from '@/utils/auth';

export default function PRQuestionsPage() {
  const router = useRouter();
  const authState = useAppSelector(state => state.auth);
  const [selectedQuestion, setSelectedQuestion] = useState(0);
  const [resumeContext, setResumeContext] = useState<{ self_pr?: string; skills?: string } | null>(null);

  // Prevent premature redirect before persisted auth is ready
  useEffect(() => {
    const hasStoredToken = typeof window !== 'undefined' && !!localStorage.getItem('drf_token_v2');
    if (!authState.isAuthenticated && !hasStoredToken) {
      router.push('/auth/login');
    }
  }, [authState.isAuthenticated, router]);

  useEffect(() => {
    (async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/v2/resumes/`, { headers: { ...getAuthHeaders() } });
        if (!res.ok) return;
        const data = await res.json();
        const list = data.results || data || [];
        const r = list.find((x: any) => x.is_active) || list[0];
        if (r) {
          setResumeContext({ self_pr: r.self_pr, skills: r.skills });
        }
      } catch { /* ignore */ }
    })();
  }, []);

  const prQuestions = [
    {
      category: '自己紹介',
      questions: [
        {
          q: '自己紹介をお願いします',
          structure: '1. 名前と現在の状況\n2. 経歴の概要\n3. 強みとなるスキル\n4. 志望動機の要約',
          example: '〇〇と申します。現在は△△として××の業務に従事しています。これまで5年間、□□の分野で経験を積み、特に◇◇のスキルを強みとしています。貴社の▽▽という点に魅力を感じ、応募させていただきました。',
          tips: '1-2分程度で簡潔にまとめ、詳細は後の質問で答えられるようにしましょう'
        }
      ]
    },
    {
      category: '強み・長所',
      questions: [
        {
          q: 'あなたの強みを教えてください',
          structure: '1. 強みを一言で表現\n2. 具体的なエピソード\n3. その強みが生まれた背景\n4. 今後の活かし方',
          example: '私の強みは問題解決能力です。前職で〇〇という課題に直面した際、△△という方法で解決し、結果として××％の改善を実現しました。',
          tips: '企業が求める人物像に合わせた強みを選びましょう'
        },
        {
          q: '長所と短所を教えてください',
          structure: '【長所】具体例と成果\n【短所】改善への取り組み',
          example: '長所は粘り強さです。困難なプロジェクトでも最後までやり遂げます。短所は完璧主義な面がありますが、優先順位を付けることで改善しています。',
          tips: '短所は改善可能なものを選び、対策も併せて述べましょう'
        }
      ]
    },
    {
      category: 'キャリアビジョン',
      questions: [
        {
          q: '5年後のキャリアビジョンを教えてください',
          structure: '1. 具体的な目標\n2. そこに至る道筋\n3. 必要なスキル習得計画\n4. 会社への貢献',
          example: '5年後には〇〇のスペシャリストとして、チームをリードする立場になりたいです。そのために△△のスキルを磨き、貴社の××事業に貢献したいと考えています。',
          tips: '企業の成長戦略と自身のビジョンを関連付けましょう'
        },
        {
          q: 'なぜ転職を考えているのですか？',
          structure: '1. 現状の課題（ポジティブに）\n2. 実現したいこと\n3. なぜこの会社なのか',
          example: '現職では〇〇の経験を積みましたが、より△△な環境で挑戦したいと考えています。貴社の××という点が、私の目指すキャリアと合致しています。',
          tips: 'ネガティブな理由は避け、前向きな理由を中心に話しましょう'
        }
      ]
    },
    {
      category: '価値観・人間性',
      questions: [
        {
          q: '仕事で大切にしていることは何ですか？',
          structure: '1. 価値観を明確に\n2. なぜそれが大切か\n3. 実践例',
          example: 'チームワークを最も大切にしています。個人の成果より、チーム全体の成功が重要だと考え、情報共有や相互サポートを心がけています。',
          tips: '企業文化に合った価値観を示しつつ、自分らしさも表現しましょう'
        }
      ]
    }
  ];

  const allQuestions = prQuestions.flatMap(cat => 
    cat.questions.map(q => ({ ...q, category: cat.category }))
  );

  const currentQuestion = allQuestions[selectedQuestion];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaUserTie className="text-blue-600" />
            自己PRに関する質問
          </h1>
          <p className="text-gray-600 mt-2">面接で効果的な自己PRをするための質問対策</p>
          {resumeContext && (
            <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200 text-sm text-blue-800">
              <div className="font-semibold mb-1">履歴書の文脈</div>
              {resumeContext.self_pr && (<div className="mb-1"><span className="font-medium">自己PR:</span> {resumeContext.self_pr.slice(0, 120)}{resumeContext.self_pr.length > 120 ? '…' : ''}</div>)}
              {resumeContext.skills && (<div><span className="font-medium">スキル:</span> {resumeContext.skills.split('\n').filter(Boolean).slice(0,5).join(', ')}</div>)}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-4">質問一覧</h2>
              <div className="space-y-3">
                {prQuestions.map((category, catIndex) => (
                  <div key={catIndex}>
                    <h3 className="font-medium text-gray-700 mb-2 px-2">
                      {category.category}
                    </h3>
                    <div className="space-y-1">
                      {category.questions.map((question, qIndex) => {
                        const globalIndex = allQuestions.findIndex(q => q.q === question.q);
                        return (
                          <button
                            key={qIndex}
                            onClick={() => setSelectedQuestion(globalIndex)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                              selectedQuestion === globalIndex
                                ? 'bg-[#FF733E] text-white'
                                : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            {question.q}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm mb-2">
                  {currentQuestion.category}
                </span>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <FaMicrophone className="text-blue-600" />
                  {currentQuestion.q}
                </h2>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FaStar className="text-yellow-500" />
                    回答の構成
                  </h3>
                  <pre className="whitespace-pre-wrap text-sm text-gray-600 font-sans">
                    {currentQuestion.structure}
                  </pre>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <h3 className="font-semibold text-gray-700 mb-2">回答例</h3>
                  <p className="text-gray-600">{currentQuestion.example}</p>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                  <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FaLightbulb className="text-yellow-600" />
                    アドバイス
                  </h3>
                  <p className="text-gray-600">{currentQuestion.tips}</p>
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setSelectedQuestion(Math.max(0, selectedQuestion - 1))}
                  disabled={selectedQuestion === 0}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
                >
                  前の質問
                </button>
                <button
                  onClick={() => setSelectedQuestion(Math.min(allQuestions.length - 1, selectedQuestion + 1))}
                  disabled={selectedQuestion === allQuestions.length - 1}
                  className="px-4 py-2 bg-[#FF733E] text-white rounded-lg hover:bg-orange-70 active:bg-orange-60 transition disabled:opacity-50"
                >
                  次の質問
                </button>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">自己PRのコツ</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <div>
                    <p className="font-medium text-gray-700">具体性</p>
                    <p className="text-sm text-gray-600">数値や具体例を使って説得力を高める</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <div>
                    <p className="font-medium text-gray-700">簡潔性</p>
                    <p className="text-sm text-gray-600">要点を整理して分かりやすく伝える</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <div>
                    <p className="font-medium text-gray-700">一貫性</p>
                    <p className="text-sm text-gray-600">経歴書との整合性を保つ</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <div>
                    <p className="font-medium text-gray-700">熱意</p>
                    <p className="text-sm text-gray-600">企業への興味と意欲を示す</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
