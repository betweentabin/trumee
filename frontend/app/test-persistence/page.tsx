'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useFormPersist } from '@/hooks/useFormPersist';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/redux/store';
import Link from 'next/link';

export default function TestPersistencePage() {
  const router = useRouter();
  const { requireAuth, user } = useAuth();
  const formPersist = useFormPersist();
  const reduxState = useSelector((state: RootState) => state);
  const [testData, setTestData] = useState('');

  // Require authentication
  requireAuth();

  const handleSaveTest = () => {
    // Test saving to form state
    formPersist.updateProfile({
      firstName: 'テスト',
      lastName: '太郎',
      email: user?.email || 'test@example.com',
    });
    formPersist.updateSkills('React, TypeScript, Next.js');
    formPersist.updateSelfPR('これはテストの自己PRです。');
    setTestData('データを保存しました');
  };

  const handleClearTest = () => {
    formPersist.clearFormData();
    setTestData('データをクリアしました');
  };

  const handleNavigateTest = () => {
    router.push('/auth/step/step1-profile');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">データ永続化テストページ</h1>
        
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">認証状態</h2>
          <div className="space-y-2">
            <p>ログイン状態: {user ? 'ログイン済み' : '未ログイン'}</p>
            <p>メール: {user?.email || 'なし'}</p>
            <p>UID: {user?.uid || 'なし'}</p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">フォームデータ</h2>
          <div className="space-y-2 mb-4">
            <p>現在のステップ: {formPersist.currentStep}</p>
            <p>完了ステップ: {formPersist.completedSteps.join(', ') || 'なし'}</p>
            <p>変更あり: {formPersist.isDirty ? 'はい' : 'いいえ'}</p>
            <p>最終保存: {formPersist.lastSaved || 'なし'}</p>
          </div>
          
          <div className="mb-4">
            <h3 className="font-medium mb-2">プロフィール:</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(formPersist.stepData.profile, null, 2)}
            </pre>
          </div>
          
          <div className="mb-4">
            <h3 className="font-medium mb-2">スキル:</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {formPersist.stepData.skills || 'なし'}
            </pre>
          </div>
          
          <div className="mb-4">
            <h3 className="font-medium mb-2">自己PR:</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {formPersist.stepData.selfPR || 'なし'}
            </pre>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Redux状態（全体）</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-96">
            {JSON.stringify(reduxState, null, 2)}
          </pre>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">テスト操作</h2>
          {testData && (
            <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded">
              {testData}
            </div>
          )}
          <div className="space-x-3">
            <button
              onClick={handleSaveTest}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              テストデータを保存
            </button>
            <button
              onClick={handleClearTest}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              データをクリア
            </button>
            <button
              onClick={handleNavigateTest}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Step1へ遷移
            </button>
            <Link
              href="/users"
              className="inline-block px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              ユーザーページへ
            </Link>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            このページをリロードしても、データが保持されていることを確認してください。
          </p>
        </div>
      </div>
    </div>
  );
}