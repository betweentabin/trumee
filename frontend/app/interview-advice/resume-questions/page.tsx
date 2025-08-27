'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/app/redux/hooks';
import { FaQuestionCircle, FaClipboardList, FaCheckDouble, FaExclamationCircle } from 'react-icons/fa';

export default function ResumeQuestionsPage() {
  const router = useRouter();
  const authState = useAppSelector(state => state.auth);
  const [selectedCategory, setSelectedCategory] = useState('experience');

  useEffect(() => {
    if (!authState.isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authState, router]);

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
                        ? 'bg-blue-600 text-white'
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