'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/app/redux/hooks';
import { FaFileAlt, FaEdit, FaCheckCircle, FaLightbulb, FaPencilAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function ResumeAdvicePage() {
  const router = useRouter();
  const authState = useAppSelector(state => state.auth);
  const [resumeText, setResumeText] = useState('');
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authState.isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authState, router]);

  const handleSubmit = async () => {
    if (!resumeText.trim()) {
      toast.error('職務経歴書の内容を入力してください');
      return;
    }

    setLoading(true);
    try {
      // AIアドバイス生成のシミュレーション
      setTimeout(() => {
        setAdvice('あなたの職務経歴書を分析しました。以下の点を改善することをお勧めします：\n\n1. 実績を具体的な数値で表現しましょう\n2. アクションと結果を明確に記載しましょう\n3. 使用した技術やツールを具体的に記載しましょう');
        setLoading(false);
        toast.success('分析が完了しました');
      }, 2000);
    } catch (error) {
      setLoading(false);
      toast.error('エラーが発生しました');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaPencilAlt className="text-blue-600" />
            職務経歴書の添削
          </h1>
          <p className="text-gray-600 mt-2">AIがあなたの職務経歴書を分析し、改善点をアドバイスします</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FaFileAlt className="text-gray-600" />
              職務経歴書の内容
            </h2>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="ここに職務経歴書の内容を貼り付けてください..."
              className="w-full h-96 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="mt-4 w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {loading ? '分析中...' : 'AIで分析する'}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FaLightbulb className="text-yellow-500" />
              AIアドバイス
            </h2>
            {advice ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                  <p className="whitespace-pre-line text-gray-700">{advice}</p>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <FaCheckCircle />
                  <span className="text-sm">分析完了</span>
                </div>
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <FaEdit className="text-6xl mx-auto mb-4" />
                  <p>職務経歴書を入力して分析を開始してください</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">添削のポイント</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">具体性</h4>
              <p className="text-sm text-gray-600">数値や具体例を使って実績を表現しましょう</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">構成</h4>
              <p className="text-sm text-gray-600">読みやすい構成と適切な項目分けを心がけましょう</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">キーワード</h4>
              <p className="text-sm text-gray-600">求人に関連するキーワードを含めましょう</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}