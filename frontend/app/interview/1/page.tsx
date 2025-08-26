'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FaSave, FaReset, FaLightbulb } from 'react-icons/fa';

export default function InterviewPage1() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    currentReason: '',
    motivation: '',
    careerGoals: '',
    whyThisCompany: '',
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = () => {
    try {
      const savedData = localStorage.getItem('interview_step1_data');
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
    localStorage.setItem('interview_step1_data', JSON.stringify(newData));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (confirm('入力内容をリセットしますか？')) {
      setFormData({
        currentReason: '',
        motivation: '',
        careerGoals: '',
        whyThisCompany: '',
      });
      localStorage.removeItem('interview_step1_data');
      toast.success('リセットしました');
    }
  };

  const tips = [
    {
      title: '転職理由のポイント',
      content: 'ネガティブな理由ではなく、ポジティブな成長欲求や新しい挑戦への意欲を中心に伝えましょう。'
    },
    {
      title: '志望動機の書き方',
      content: '企業の特徴や事業内容を調べ、自分のスキルや経験がどう活かせるかを具体的に説明しましょう。'
    },
    {
      title: 'キャリア目標',
      content: '5年後、10年後のビジョンを明確にし、その実現に向けて企業がどう関わるかを示しましょう。'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">転職理由・志望動機</h1>
          <p className="text-gray-600">面接で聞かれる基本的な質問への回答を整理しましょう。</p>
          {saved && (
            <div className="mt-2 text-green-600 text-sm">✓ 自動保存されました</div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* メインコンテンツ */}
          <div className="lg:col-span-2 space-y-6">
            {/* 転職理由 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">転職理由</h2>
              <p className="text-sm text-gray-600 mb-4">
                なぜ転職を考えているのか、現在の状況と転職への動機を整理してください。
              </p>
              <textarea
                value={formData.currentReason}
                onChange={(e) => handleInputChange('currentReason', e.target.value)}
                placeholder="例：現在の職場では学べることが限られており、より多様な技術に触れながら成長したいと考えているため。"
                className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* 志望動機 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">志望動機</h2>
              <p className="text-sm text-gray-600 mb-4">
                なぜこの企業・職種を選んだのか、具体的な理由を記載してください。
              </p>
              <textarea
                value={formData.motivation}
                onChange={(e) => handleInputChange('motivation', e.target.value)}
                placeholder="例：御社の革新的な技術開発に魅力を感じ、自分のスキルを活かしながら新しい分野にチャレンジしたいと考えております。"
                className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* キャリア目標 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">キャリア目標</h2>
              <p className="text-sm text-gray-600 mb-4">
                将来的にどのような成長を目指しているか、中長期的な目標を記載してください。
              </p>
              <textarea
                value={formData.careerGoals}
                onChange={(e) => handleInputChange('careerGoals', e.target.value)}
                placeholder="例：5年後には技術リーダーとしてチームを牽引し、10年後には新規事業の立ち上げに携わりたいと考えています。"
                className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* この企業を選んだ理由 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">この企業を選んだ理由</h2>
              <p className="text-sm text-gray-600 mb-4">
                他社ではなく、なぜこの会社なのかを具体的に説明してください。
              </p>
              <textarea
                value={formData.whyThisCompany}
                onChange={(e) => handleInputChange('whyThisCompany', e.target.value)}
                placeholder="例：御社の企業理念である〇〇に強く共感し、〇〇の技術分野で業界をリードする姿勢に魅力を感じました。"
                className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* アクションボタン */}
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/interview/2')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                次へ：職務経歴書に関する質問
              </button>
              <button
                onClick={handleReset}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
              >
                <FaReset />
                リセット
              </button>
            </div>
          </div>

          {/* サイドバー - アドバイス */}
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-blue-800 flex items-center gap-2">
                <FaLightbulb />
                アドバイス
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

            <div className="bg-yellow-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2 text-yellow-800">💡 ワンポイント</h3>
              <p className="text-sm text-yellow-700">
                回答は具体例を交えて、相手に伝わりやすく構成しましょう。STAR法（状況・課題・行動・結果）を使うと効果的です。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
