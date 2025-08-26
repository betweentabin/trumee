'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FaSave, FaReset, FaLightbulb, FaFileAlt } from 'react-icons/fa';

export default function InterviewPage2() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    keyAchievements: '',
    challengesOvercome: '',
    skillsDeveloped: '',
    teamExperience: '',
    projectExamples: '',
    failureAndLearning: '',
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = () => {
    try {
      const savedData = localStorage.getItem('interview_step2_data');
      if (savedData) {
        setFormData(JSON.parse(savedData));
      }
    } catch (error) {
      console.error('Failed to load saved data:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    
    // Auto-save to localStorage
    localStorage.setItem('interview_step2_data', JSON.stringify(newData));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (confirm('入力内容をリセットしますか？')) {
      setFormData({
        keyAchievements: '',
        challengesOvercome: '',
        skillsDeveloped: '',
        teamExperience: '',
        projectExamples: '',
        failureAndLearning: '',
      });
      localStorage.removeItem('interview_step2_data');
      toast.success('リセットしました');
    }
  };

  const questions = [
    {
      id: 'keyAchievements',
      title: '最も誇れる成果・実績は何ですか？',
      placeholder: '例：新規システム導入により業務効率を30%向上させ、年間1000万円のコスト削減を実現しました。',
      tips: '具体的な数値や成果を交えて説明しましょう。STAR法（状況・課題・行動・結果）を使うと効果的です。'
    },
    {
      id: 'challengesOvercome',
      title: '困難な状況をどのように乗り越えましたか？',
      placeholder: '例：プロジェクトの納期が迫る中、メンバーの退職により人手不足が発生。私がリーダーシップを発揮し...',
      tips: '問題解決能力やリーダーシップを示すエピソードを選びましょう。'
    },
    {
      id: 'skillsDeveloped',
      title: 'これまでに身につけたスキルや知識について教えてください',
      placeholder: '例：Python、React、AWS、プロジェクト管理、チームリーダーシップなど...',
      tips: '技術的スキルだけでなく、ソフトスキルも含めて幅広く答えましょう。'
    },
    {
      id: 'teamExperience',
      title: 'チームでの働き方について教えてください',
      placeholder: '例：アジャイル開発チームでスクラムマスターとして、チーム内のコミュニケーションを促進し...',
      tips: 'チームワーク、コミュニケーション能力、協調性をアピールしましょう。'
    },
    {
      id: 'projectExamples',
      title: '印象に残っているプロジェクトについて説明してください',
      placeholder: '例：ECサイトのリニューアルプロジェクトでは、要件定義から運用まで一貫して携わり...',
      tips: 'プロジェクトの規模、あなたの役割、成果を明確に伝えましょう。'
    },
    {
      id: 'failureAndLearning',
      title: '失敗経験とそこから学んだことを教えてください',
      placeholder: '例：初回のシステム導入で要件調査が不十分だったため、予定より3ヶ月遅れました。この経験から...',
      tips: '失敗を認めつつ、そこから何を学び、どう改善したかを重視して答えましょう。'
    }
  ];

  const tips = [
    {
      title: 'STAR法を活用',
      content: 'Situation（状況）、Task（課題）、Action（行動）、Result（結果）の順で構成すると分かりやすくなります。'
    },
    {
      title: '具体的な数値を含める',
      content: '「売上が向上した」ではなく「売上を20%向上させた」など、具体的な数値で説明しましょう。'
    },
    {
      title: '自分の役割を明確に',
      content: 'チームでの成果を話す際は、その中での自分の具体的な役割と貢献を明確にしましょう。'
    },
    {
      title: '成長性をアピール',
      content: '過去の経験から何を学び、今後どう活かしていくかまで言及すると印象が良くなります。'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">職務経歴書に関する質問</h1>
          <p className="text-gray-600">あなたの経歴や経験について、面接で聞かれる質問への回答を準備しましょう。</p>
          {saved && (
            <div className="mt-2 text-green-600 text-sm">✓ 自動保存されました</div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* メインコンテンツ */}
          <div className="lg:col-span-3 space-y-6">
            {questions.map((question) => (
              <div key={question.id} className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-3 text-gray-800">{question.title}</h2>
                <p className="text-sm text-blue-600 mb-4 bg-blue-50 p-3 rounded-lg">
                  💡 {question.tips}
                </p>
                <textarea
                  value={formData[question.id as keyof typeof formData]}
                  onChange={(e) => handleInputChange(question.id, e.target.value)}
                  placeholder={question.placeholder}
                  className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            ))}

            {/* ナビゲーションボタン */}
            <div className="flex justify-between">
              <button
                onClick={() => router.push('/interview/1')}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
              >
                前へ：転職理由・志望動機
              </button>
              <div className="flex gap-4">
                <button
                  onClick={handleReset}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
                >
                  <FaReset />
                  リセット
                </button>
                <button
                  onClick={() => router.push('/interview/3')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  次へ：面接対策
                </button>
              </div>
            </div>
          </div>

          {/* サイドバー */}
          <div className="space-y-6">
            {/* 面接のコツ */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-blue-800 flex items-center gap-2">
                <FaLightbulb />
                面接のコツ
              </h3>
              <div className="space-y-4">
                {tips.map((tip, index) => (
                  <div key={index} className="border-l-4 border-blue-400 pl-4">
                    <h4 className="font-medium text-blue-700 mb-1">{tip.title}</h4>
                    <p className="text-sm text-blue-600">{tip.content}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 関連リンク */}
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-green-800 flex items-center gap-2">
                <FaFileAlt />
                関連機能
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/career/preview')}
                  className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-800">履歴書を確認</div>
                  <div className="text-sm text-gray-600">作成した履歴書を見直す</div>
                </button>
                <button
                  onClick={() => router.push('/career/create')}
                  className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-800">履歴書を作成</div>
                  <div className="text-sm text-gray-600">新しい履歴書を作成する</div>
                </button>
              </div>
            </div>

            {/* 注意事項 */}
            <div className="bg-yellow-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2 text-yellow-800">⚠️ 注意点</h3>
              <ul className="text-sm text-yellow-700 space-y-2">
                <li>• 回答は2-3分程度で話せる長さに調整</li>
                <li>• 嘘や誇張は避け、事実に基づいて回答</li>
                <li>• 企業の求める人物像を意識して回答</li>
                <li>• 面接前に声に出して練習しておく</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
